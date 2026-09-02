import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildApp, cleanupDatabase, createTestUser } from './helpers';

const app = buildApp();

describe('Autenticação', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  it('faz login com credenciais válidas e define o cookie httpOnly', async () => {
    const user = await createTestUser({ email: 'valido@dfprecatorios.com.br', password: 'SenhaForte123!' });

    const response = await request(app)
      .post('/auth/login')
      .send({ email: user.email, password: user.password });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ email: user.email });
    expect(response.body.user.passwordHash).toBeUndefined();

    const setCookie = response.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie[0]).toMatch(/token=/);
    expect(setCookie[0]).toMatch(/HttpOnly/i);
  });

  it('rejeita login com senha incorreta', async () => {
    const user = await createTestUser({ email: 'errado@dfprecatorios.com.br', password: 'SenhaForte123!' });

    const response = await request(app)
      .post('/auth/login')
      .send({ email: user.email, password: 'senha-errada' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Email ou senha inválidos.' });
  });

  it('rejeita login com email inexistente', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'naoexiste@dfprecatorios.com.br', password: 'qualquercoisa' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Email ou senha inválidos.' });
  });

  it('GET /auth/me retorna 401 sem cookie', async () => {
    const response = await request(app).get('/auth/me');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Não autenticado.' });
  });

  it('GET /auth/me retorna 401 com cookie inválido', async () => {
    const response = await request(app).get('/auth/me').set('Cookie', 'token=token-invalido');
    expect(response.status).toBe(401);
  });

  it('rotas protegidas retornam 401 sem autenticação', async () => {
    const responses = await Promise.all([
      request(app).get('/categories'),
      request(app).get('/transactions'),
      request(app).get('/precatorios'),
      request(app).get('/dashboard/summary'),
      request(app).get('/reports'),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(401);
    }
  });
});
