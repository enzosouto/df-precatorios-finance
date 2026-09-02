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

  it('cria um precatório com sucesso e calcula a diferença corretamente', async () => {
    const { cookie } = await setupUserWithCookie();

    const response = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'João da Silva',
      valorOriginal: '1000.00',
      valorAtualizado: '1500.00',
      valorPago: '200.00',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      cedente: 'João da Silva',
      valorOriginal: '1000.00',
      valorAtualizado: '1500.00',
      diferenca: '500.00',
      valorPago: '200.00',
    });
    expect(response.body.id).toBeDefined();
  });

  it('cria um precatório sem valorPago (fica nulo)', async () => {
    const { cookie } = await setupUserWithCookie();

    const response = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Maria Souza',
      valorOriginal: '800.00',
      valorAtualizado: '950.00',
    });

    expect(response.status).toBe(201);
    expect(response.body.valorPago).toBeNull();
    expect(response.body.diferenca).toBe('150.00');
  });

  it('rejeita criação sem cedente', async () => {
    const { cookie } = await setupUserWithCookie();

    const response = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: '   ',
      valorOriginal: '1000.00',
      valorAtualizado: '1500.00',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('rejeita valorOriginal zero ou negativo', async () => {
    const { cookie } = await setupUserWithCookie();

    const zeroResponse = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Cedente Teste',
      valorOriginal: '0.00',
      valorAtualizado: '1500.00',
    });
    expect(zeroResponse.status).toBe(400);

    const negativeResponse = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Cedente Teste',
      valorOriginal: '-10.00',
      valorAtualizado: '1500.00',
    });
    expect(negativeResponse.status).toBe(400);
  });

  it('rejeita valorAtualizado zero ou negativo', async () => {
    const { cookie } = await setupUserWithCookie();

    const zeroResponse = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Cedente Teste',
      valorOriginal: '1000.00',
      valorAtualizado: '0.00',
    });
    expect(zeroResponse.status).toBe(400);

    const negativeResponse = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Cedente Teste',
      valorOriginal: '1000.00',
      valorAtualizado: '-5.00',
    });
    expect(negativeResponse.status).toBe(400);
  });

  it('rejeita valorPago negativo', async () => {
    const { cookie } = await setupUserWithCookie();

    const response = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Cedente Teste',
      valorOriginal: '1000.00',
      valorAtualizado: '1500.00',
      valorPago: '-1.00',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('atualiza um precatório e recalcula a diferença', async () => {
    const { cookie } = await setupUserWithCookie();

    const created = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Carlos Pereira',
      valorOriginal: '1000.00',
      valorAtualizado: '1200.00',
    });

    const id = created.body.id;

    const updated = await request(app).put(`/precatorios/${id}`).set('Cookie', cookie).send({
      valorAtualizado: '1800.00',
    });

    expect(updated.status).toBe(200);
    expect(updated.body.valorOriginal).toBe('1000.00');
    expect(updated.body.valorAtualizado).toBe('1800.00');
    expect(updated.body.diferenca).toBe('800.00');
  });

  it('busca por cedente (contains, case-insensitive)', async () => {
    const { cookie } = await setupUserWithCookie();

    await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Empresa Alfa Ltda',
      valorOriginal: '100.00',
      valorAtualizado: '150.00',
    });

    await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Empresa Beta Ltda',
      valorOriginal: '200.00',
      valorAtualizado: '250.00',
    });

    const response = await request(app).get('/precatorios?search=alfa').set('Cookie', cookie);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items[0].cedente).toBe('Empresa Alfa Ltda');
  });

  it('exclusão lógica: some da listagem mas continua existindo no banco com deletedAt preenchido', async () => {
    const { cookie } = await setupUserWithCookie();

    const created = await request(app).post('/precatorios').set('Cookie', cookie).send({
      cedente: 'Precatório a ser excluído',
      valorOriginal: '300.00',
      valorAtualizado: '400.00',
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
