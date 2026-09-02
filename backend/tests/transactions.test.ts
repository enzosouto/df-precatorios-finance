import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '../src/lib/prisma';
import {
  buildApp,
  cleanupDatabase,
  createTestCategory,
  createTestUser,
  loginAndGetCookie,
} from './helpers';

const app = buildApp();

async function setupUserWithCookie() {
  const user = await createTestUser();
  const cookie = await loginAndGetCookie(app, user.email, user.password);
  return { user, cookie };
}

describe('Transações', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  it('cria uma movimentação do tipo RECEITA com sucesso', async () => {
    const { user, cookie } = await setupUserWithCookie();
    const category = await createTestCategory(user.id, 'Honorários', 'RECEITA');

    const response = await request(app).post('/transactions').set('Cookie', cookie).send({
      type: 'RECEITA',
      amount: '1500.00',
      description: 'Honorários processo 123',
      clientName: 'Cliente A',
      categoryId: category.id,
      transactionDate: '2026-08-15',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      type: 'RECEITA',
      amount: '1500.00',
      description: 'Honorários processo 123',
      clientName: 'Cliente A',
      transactionDate: '2026-08-15',
      category: { id: category.id, name: 'Honorários' },
    });
  });

  it('cria uma movimentação do tipo DESPESA com sucesso', async () => {
    const { user, cookie } = await setupUserWithCookie();
    const category = await createTestCategory(user.id, 'Aluguel', 'DESPESA');

    const response = await request(app).post('/transactions').set('Cookie', cookie).send({
      type: 'DESPESA',
      amount: '2000.50',
      description: 'Aluguel do escritório',
      clientName: 'Fornecedor X',
      categoryId: category.id,
      transactionDate: '2026-08-05',
    });

    expect(response.status).toBe(201);
    expect(response.body.amount).toBe('2000.50');
    expect(response.body.type).toBe('DESPESA');
  });

  it('rejeita RECEITA sem clientName', async () => {
    const { user, cookie } = await setupUserWithCookie();
    const category = await createTestCategory(user.id, 'Honorários', 'RECEITA');

    const response = await request(app).post('/transactions').set('Cookie', cookie).send({
      type: 'RECEITA',
      amount: '1500.00',
      description: 'Honorários sem cliente',
      categoryId: category.id,
      transactionDate: '2026-08-15',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('rejeita DESPESA sem clientName', async () => {
    const { user, cookie } = await setupUserWithCookie();
    const category = await createTestCategory(user.id, 'Aluguel', 'DESPESA');

    const response = await request(app).post('/transactions').set('Cookie', cookie).send({
      type: 'DESPESA',
      amount: '900.00',
      description: 'Aluguel sem cliente',
      categoryId: category.id,
      transactionDate: '2026-08-05',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('rejeita categoria incompatível com o tipo da movimentação', async () => {
    const { user, cookie } = await setupUserWithCookie();
    const despesaCategory = await createTestCategory(user.id, 'Aluguel', 'DESPESA');

    const response = await request(app).post('/transactions').set('Cookie', cookie).send({
      type: 'RECEITA',
      amount: '500.00',
      description: 'Tentativa inválida',
      clientName: 'Cliente Y',
      categoryId: despesaCategory.id,
      transactionDate: '2026-08-10',
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Categoria não compatível com o tipo de movimentação.' });
  });

  it('rejeita valor zero ou negativo', async () => {
    const { user, cookie } = await setupUserWithCookie();
    const category = await createTestCategory(user.id, 'Honorários', 'RECEITA');

    const zeroResponse = await request(app).post('/transactions').set('Cookie', cookie).send({
      type: 'RECEITA',
      amount: '0.00',
      description: 'Valor zero',
      clientName: 'Cliente Z',
      categoryId: category.id,
      transactionDate: '2026-08-10',
    });
    expect(zeroResponse.status).toBe(400);

    const negativeResponse = await request(app).post('/transactions').set('Cookie', cookie).send({
      type: 'RECEITA',
      amount: '-10.00',
      description: 'Valor negativo',
      clientName: 'Cliente Z',
      categoryId: category.id,
      transactionDate: '2026-08-10',
    });
    expect(negativeResponse.status).toBe(400);
  });

  it('filtra e busca por clientName (case-insensitive) e pelo termo de busca geral', async () => {
    const { user, cookie } = await setupUserWithCookie();
    const category = await createTestCategory(user.id, 'Honorários', 'RECEITA');

    await request(app).post('/transactions').set('Cookie', cookie).send({
      type: 'RECEITA',
      amount: '100.00',
      description: 'Pagamento inicial',
      clientName: 'Empresa Alfa Ltda',
      categoryId: category.id,
      transactionDate: '2026-08-01',
    });

    await request(app).post('/transactions').set('Cookie', cookie).send({
      type: 'RECEITA',
      amount: '200.00',
      description: 'Segundo pagamento',
      clientName: 'Empresa Beta Ltda',
      categoryId: category.id,
      transactionDate: '2026-08-02',
    });

    const byClientName = await request(app)
      .get('/transactions?clientName=alfa')
      .set('Cookie', cookie);
    expect(byClientName.status).toBe(200);
    expect(byClientName.body.total).toBe(1);
    expect(byClientName.body.items[0].clientName).toBe('Empresa Alfa Ltda');

    const bySearchOnDescription = await request(app)
      .get('/transactions?search=segundo')
      .set('Cookie', cookie);
    expect(bySearchOnDescription.status).toBe(200);
    expect(bySearchOnDescription.body.total).toBe(1);
    expect(bySearchOnDescription.body.items[0].description).toBe('Segundo pagamento');

    const bySearchOnClientName = await request(app)
      .get('/transactions?search=beta')
      .set('Cookie', cookie);
    expect(bySearchOnClientName.status).toBe(200);
    expect(bySearchOnClientName.body.total).toBe(1);
    expect(bySearchOnClientName.body.items[0].clientName).toBe('Empresa Beta Ltda');
  });

  it('exclusão lógica: some da listagem mas continua existindo no banco com deletedAt preenchido', async () => {
    const { user, cookie } = await setupUserWithCookie();
    const category = await createTestCategory(user.id, 'Honorários', 'RECEITA');

    const created = await request(app).post('/transactions').set('Cookie', cookie).send({
      type: 'RECEITA',
      amount: '300.00',
      description: 'Movimentação a ser excluída',
      clientName: 'Cliente Delete',
      categoryId: category.id,
      transactionDate: '2026-08-20',
    });

    const id = created.body.id;

    const deleteResponse = await request(app).delete(`/transactions/${id}`).set('Cookie', cookie);
    expect(deleteResponse.status).toBe(204);

    const listResponse = await request(app).get('/transactions').set('Cookie', cookie);
    expect(listResponse.body.items.find((item: { id: string }) => item.id === id)).toBeUndefined();

    const getResponse = await request(app).get(`/transactions/${id}`).set('Cookie', cookie);
    expect(getResponse.status).toBe(404);

    const rawRow = await prisma.transaction.findUnique({ where: { id } });
    expect(rawRow).not.toBeNull();
    expect(rawRow?.deletedAt).not.toBeNull();

    const deletedCount = await prisma.transaction.count({ where: { id, deletedAt: { not: null } } });
    expect(deletedCount).toBe(1);
  });
});
