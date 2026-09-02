import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildApp, cleanupDatabase, createTestUser, loginAndGetCookie } from './helpers';

const app = buildApp();

describe('Categorias', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  it('cria categoria e rejeita duplicata do mesmo tipo', async () => {
    const user = await createTestUser();
    const cookie = await loginAndGetCookie(app, user.email, user.password);

    const created = await request(app)
      .post('/categories')
      .set('Cookie', cookie)
      .send({ name: 'Consultoria', type: 'RECEITA' });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: 'Consultoria', type: 'RECEITA' });

    const duplicate = await request(app)
      .post('/categories')
      .set('Cookie', cookie)
      .send({ name: 'Consultoria', type: 'RECEITA' });

    expect(duplicate.status).toBe(409);
  });

  it('lista categorias filtradas por tipo', async () => {
    const user = await createTestUser();
    const cookie = await loginAndGetCookie(app, user.email, user.password);

    await request(app).post('/categories').set('Cookie', cookie).send({ name: 'Aluguel', type: 'DESPESA' });
    await request(app).post('/categories').set('Cookie', cookie).send({ name: 'Comissão', type: 'RECEITA' });

    const response = await request(app).get('/categories?type=DESPESA').set('Cookie', cookie);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ name: 'Aluguel', type: 'DESPESA' });
  });
});
