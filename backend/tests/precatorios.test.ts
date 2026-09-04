import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '../src/lib/prisma';
import { buildApp, cleanupDatabase, createTestUser, loginAndGetCookie } from './helpers';

const app = buildApp();

async function setupUserWithCookie() {
  const user = await createTestUser();
  const cookie = await loginAndGetCookie(app, user.email, user.password);
  return { user, cookie };
}

describe('Precatórios', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  it('cria um precatório com sucesso e calcula % pago, % vendido e lucro', async () => {
    const { cookie } = await setupUserWithCookie();

    const response = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'João da Silva',
      valorAtualizado: '1000.00',
      valorPago: '300.00',
      valorVendido: '500.00',
      comissoes: ['20.00', '30.00'],
      tipoDocumento: 'ESCRITURA',
      numeroDocumento: '12345',
      livro: '42A',
      folha: '15-17',
      origem: 'GDF',
      comprador: 'DF Precatórios Ltda',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      cedente: 'João da Silva',
      valorAtualizado: '1000.00',
      valorPago: '300.00',
      valorVendido: '500.00',
      comissoes: ['20.00', '30.00'],
      percentualPago: '35.00',
      percentualVendido: '50.00',
      lucro: '150.00',
      tipoDocumento: 'ESCRITURA',
      numeroDocumento: '12345',
      livro: '42A',
      folha: '15-17',
      origem: 'GDF',
      origemOutro: null,
      comprador: 'DF Precatórios Ltda',
    });
    expect(response.body.id).toBeDefined();

    // Como tem comprador e lucro > 0, deve gerar automaticamente uma receita dividida entre os 3 sócios.
    const precatorioId = response.body.id;
    const autoTx = await prisma.transaction.findUnique({ where: { precatorioId } });
    expect(autoTx).not.toBeNull();
    expect(autoTx?.type).toBe('RECEITA');
    expect(autoTx?.amount.toFixed(2)).toBe('150.00');
    expect(autoTx?.socios.sort()).toEqual(['CHIQUINHO', 'FILIPI', 'LOMAR']);
    expect(autoTx?.clientName).toBe('DF Precatórios Ltda');

    // Atualiza o valor vendido: o lucro muda e a receita automática deve acompanhar.
    const updated = await request(app).put(`/precatorios/${precatorioId}`).set('Cookie', cookie).send({
      valorVendido: '800.00',
    });
    expect(updated.body.lucro).toBe('450.00');
    const autoTxAtualizada = await prisma.transaction.findUnique({ where: { precatorioId } });
    expect(autoTxAtualizada?.amount.toFixed(2)).toBe('450.00');

    // Remove o comprador: a receita automática deve sumir (soft delete).
    const semComprador = await request(app).put(`/precatorios/${precatorioId}`).set('Cookie', cookie).send({
      comprador: null,
    });
    expect(semComprador.body.comprador).toBeNull();
    const autoTxRemovida = await prisma.transaction.findUnique({ where: { precatorioId } });
    expect(autoTxRemovida?.deletedAt).not.toBeNull();
  });

  it('cria um precatório sem valorVendido nem comissões (ficam vazios/nulos, sem lucro calculado)', async () => {
    const { cookie } = await setupUserWithCookie();

    const response = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Maria Souza',
      valorAtualizado: '950.00',
      valorPago: '0.00',
      origem: 'FEDERAL',
    });

    expect(response.status).toBe(201);
    expect(response.body.valorVendido).toBeNull();
    expect(response.body.comissoes).toEqual([]);
    expect(response.body.lucro).toBeNull();
    expect(response.body.percentualVendido).toBeNull();
    expect(response.body.percentualPago).toBe('0.00');
  });

  it('cria um precatório com origem OUTRO, exigindo a descrição', async () => {
    const { cookie } = await setupUserWithCookie();

    const semDescricao = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Maria Souza',
      valorAtualizado: '950.00',
      valorPago: '100.00',
      origem: 'OUTRO',
      comprador: 'Comprador X',
    });
    expect(semDescricao.status).toBe(400);
    expect(semDescricao.body.error).toBeDefined();

    const comDescricao = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Maria Souza',
      valorAtualizado: '950.00',
      valorPago: '100.00',
      origem: 'OUTRO',
      origemOutro: 'Tribunal Estadual',
      comprador: 'Comprador X',
    });
    expect(comDescricao.status).toBe(201);
    expect(comDescricao.body.origem).toBe('OUTRO');
    expect(comDescricao.body.origemOutro).toBe('Tribunal Estadual');
  });

  it('rejeita criação sem cedente e sem origem, aceita sem comprador', async () => {
    const { cookie } = await setupUserWithCookie();

    const semCedente = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: '   ',
      valorAtualizado: '1500.00',
      valorPago: '100.00',
      origem: 'FEDERAL',
      comprador: 'Comprador Y',
    });
    expect(semCedente.status).toBe(400);
    expect(semCedente.body.error).toBeDefined();

    const semComprador = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Cedente Teste',
      valorAtualizado: '1500.00',
      valorPago: '100.00',
      origem: 'FEDERAL',
    });
    expect(semComprador.status).toBe(201);
    expect(semComprador.body.comprador).toBeNull();

    const semOrigem = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Cedente Teste',
      valorAtualizado: '1500.00',
      valorPago: '100.00',
      comprador: 'Comprador Y',
    });
    expect(semOrigem.status).toBe(400);
    expect(semOrigem.body.error).toBeDefined();

    const livroSemFolha = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Cedente Teste',
      valorAtualizado: '1500.00',
      valorPago: '100.00',
      livro: '42',
      origem: 'FEDERAL',
      comprador: 'Comprador Y',
    });
    expect(livroSemFolha.status).toBe(400);
    expect(livroSemFolha.body.error).toBeDefined();

    const folhaFormatoInvalido = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Cedente Teste',
      valorAtualizado: '1500.00',
      valorPago: '100.00',
      livro: '42',
      folha: 'abc',
      origem: 'FEDERAL',
      comprador: 'Comprador Y',
    });
    expect(folhaFormatoInvalido.status).toBe(400);
    expect(folhaFormatoInvalido.body.error).toBeDefined();
  });

  it('rejeita valorAtualizado zero ou negativo', async () => {
    const { cookie } = await setupUserWithCookie();

    const zeroResponse = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Cedente Teste',
      valorAtualizado: '0.00',
      valorPago: '0.00',
      origem: 'GDF',
      comprador: 'Comprador Z',
    });
    expect(zeroResponse.status).toBe(400);

    const negativeResponse = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Cedente Teste',
      valorAtualizado: '-5.00',
      valorPago: '0.00',
      origem: 'GDF',
      comprador: 'Comprador Z',
    });
    expect(negativeResponse.status).toBe(400);
  });

  it('rejeita valorPago negativo', async () => {
    const { cookie } = await setupUserWithCookie();

    const response = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Cedente Teste',
      valorAtualizado: '1500.00',
      valorPago: '-1.00',
      origem: 'GDF',
      comprador: 'Comprador Z',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('atualiza um precatório e recalcula % e lucro', async () => {
    const { cookie } = await setupUserWithCookie();

    const created = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Carlos Pereira',
      valorAtualizado: '1200.00',
      valorPago: '200.00',
      origem: 'GDF',
      comprador: 'Comprador W',
    });

    const id = created.body.id;

    const updated = await request(app).put(`/precatorios/${id}`).set('Cookie', cookie).send({
      valorVendido: '600.00',
    });

    expect(updated.status).toBe(200);
    expect(updated.body.valorAtualizado).toBe('1200.00');
    expect(updated.body.valorPago).toBe('200.00');
    expect(updated.body.valorVendido).toBe('600.00');
    expect(updated.body.lucro).toBe('400.00');
  });

  it('busca por cedente (contains, case-insensitive) e calcula totais gerais / por sócio', async () => {
    const { cookie } = await setupUserWithCookie();

    await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Empresa Alfa Ltda',
      valorAtualizado: '1000.00',
      valorPago: '200.00',
      valorVendido: '500.00',
      origem: 'GDF',
      comprador: 'Comprador Alfa',
    });

    await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Empresa Beta Ltda',
      valorAtualizado: '2000.00',
      valorPago: '400.00',
      valorVendido: '1000.00',
      origem: 'FEDERAL',
      comprador: 'Comprador Beta',
    });

    const searchResponse = await request(app).get('/precatorios?search=alfa').set('Cookie', cookie);

    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.total).toBe(1);
    expect(searchResponse.body.items[0].cedente).toBe('Empresa Alfa Ltda');

    const fullResponse = await request(app).get('/precatorios').set('Cookie', cookie);

    expect(fullResponse.status).toBe(200);
    // valorAtualizado: 1000+2000=3000; valorPago: 200+400=600; valorVendido: 500+1000=1500; lucro: 300+600=900
    expect(fullResponse.body.totals).toMatchObject({
      valorAtualizado: '3000.00',
      valorPago: '600.00',
      valorVendido: '1500.00',
      lucro: '900.00',
    });
    expect(fullResponse.body.porSocio).toMatchObject({
      valorAtualizado: '1000.00',
      valorPago: '200.00',
      valorVendido: '500.00',
      lucro: '300.00',
    });

    const byOrigem = await request(app).get('/precatorios?origem=GDF').set('Cookie', cookie);
    expect(byOrigem.status).toBe(200);
    expect(byOrigem.body.total).toBe(1);
    expect(byOrigem.body.items[0].cedente).toBe('Empresa Alfa Ltda');
  });

  it('exclusão lógica: some da listagem mas continua existindo no banco com deletedAt preenchido', async () => {
    const { cookie } = await setupUserWithCookie();

    const created = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Precatório a ser excluído',
      valorAtualizado: '400.00',
      valorPago: '50.00',
      origem: 'GDF',
      comprador: 'Comprador Delete',
    });

    const id = created.body.id;

    const deleteResponse = await request(app).delete(`/precatorios/${id}`).set('Cookie', cookie);
    expect(deleteResponse.status).toBe(204);

    const listResponse = await request(app).get('/precatorios').set('Cookie', cookie);
    expect(listResponse.body.items.find((item: { id: string }) => item.id === id)).toBeUndefined();

    const getResponse = await request(app).get(`/precatorios/${id}`).set('Cookie', cookie);
    expect(getResponse.status).toBe(404);

    const rawRow = await prisma.precatorio.findUnique({ where: { id } });
    expect(rawRow).not.toBeNull();
    expect(rawRow?.deletedAt).not.toBeNull();

    const deletedCount = await prisma.precatorio.count({ where: { id, deletedAt: { not: null } } });
    expect(deletedCount).toBe(1);
  });

  it('rotas de precatórios retornam 401 sem autenticação', async () => {
    const responses = await Promise.all([
      request(app).get('/precatorios'),
      request(app).post('/precatorios').send({}),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(401);
    }
  });
});
