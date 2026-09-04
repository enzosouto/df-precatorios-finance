import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildApp, cleanupDatabase, createTestCategory, createTestUser, loginAndGetCookie } from './helpers';

const app = buildApp();

async function createTransaction(
  cookie: string,
  overrides: {
    type: 'RECEITA' | 'DESPESA';
    amount: string;
    categoryId: string;
    transactionDate: string;
    description?: string;
    clientName?: string;
    socios?: Array<'CHIQUINHO' | 'FILIPI' | 'LOMAR'>;
  }
) {
  return request(app)
    .post('/transactions')
    .set('Cookie', cookie)
    .send({
      description: overrides.description ?? 'Movimentação de teste',
      clientName: overrides.clientName ?? 'Cliente Teste',
      socios: overrides.socios ?? ['CHIQUINHO'],
      ...overrides,
    });
}

describe('Dashboard', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  it('calcula caixaTotal considerando todo o histórico, independente do período filtrado', async () => {
    const user = await createTestUser();
    const cookie = await loginAndGetCookie(app, user.email, user.password);
    const receitaCategory = await createTestCategory(user.id, 'Honorários', 'RECEITA');
    const despesaCategory = await createTestCategory(user.id, 'Aluguel', 'DESPESA');

    // Fora do período que será filtrado (mês anterior)
    await createTransaction(cookie, {
      type: 'RECEITA',
      amount: '1000.00',
      categoryId: receitaCategory.id,
      transactionDate: '2026-06-10',
    });
    await createTransaction(cookie, {
      type: 'DESPESA',
      amount: '300.00',
      categoryId: despesaCategory.id,
      transactionDate: '2026-06-15',
    });

    // Dentro do período filtrado
    await createTransaction(cookie, {
      type: 'RECEITA',
      amount: '2000.00',
      categoryId: receitaCategory.id,
      transactionDate: '2026-08-05',
      socios: ['CHIQUINHO'],
    });
    await createTransaction(cookie, {
      type: 'DESPESA',
      amount: '500.00',
      categoryId: despesaCategory.id,
      transactionDate: '2026-08-10',
      socios: ['FILIPI', 'LOMAR'],
    });

    const response = await request(app)
      .get('/dashboard/summary?startDate=2026-08-01&endDate=2026-08-31')
      .set('Cookie', cookie);

    expect(response.status).toBe(200);
    // caixaTotal = (1000 + 2000) - (300 + 500) = 2200.00, sobre TODO o histórico
    expect(response.body.caixaTotal).toBe('2200.00');
    // receitasPeriodo / despesasPeriodo / saldoPeriodo restritos a agosto/2026
    expect(response.body.receitasPeriodo).toBe('2000.00');
    expect(response.body.despesasPeriodo).toBe('500.00');
    expect(response.body.saldoPeriodo).toBe('1500.00');
    expect(response.body.hasAnyTransactions).toBe(true);

    // porSocio: só considera o período filtrado (agosto/2026).
    // A despesa de 500 foi atribuída a FILIPI + LOMAR, então cada um recebe metade (250).
    expect(response.body.porSocio).toEqual(
      expect.arrayContaining([
        { socio: 'CHIQUINHO', receitas: '2000.00', despesas: '0.00', saldo: '2000.00' },
        { socio: 'FILIPI', receitas: '0.00', despesas: '250.00', saldo: '-250.00' },
        { socio: 'LOMAR', receitas: '0.00', despesas: '250.00', saldo: '-250.00' },
      ])
    );
    // cotaIgualPeriodo = totais do período (2000 receita, 500 despesa, 1500 saldo) ÷ 3
    expect(response.body.cotaIgualPeriodo).toEqual({
      receitas: '666.67',
      despesas: '166.67',
      saldo: '500.00',
    });

    // Mudar o período não deve afetar o caixaTotal
    const otherPeriod = await request(app)
      .get('/dashboard/summary?startDate=2026-06-01&endDate=2026-06-30')
      .set('Cookie', cookie);
    expect(otherPeriod.body.caixaTotal).toBe('2200.00');
    expect(otherPeriod.body.receitasPeriodo).toBe('1000.00');
    expect(otherPeriod.body.despesasPeriodo).toBe('300.00');
    expect(otherPeriod.body.saldoPeriodo).toBe('700.00');
  });

  it('hasAnyTransactions é false quando o usuário nunca lançou nada', async () => {
    const user = await createTestUser();
    const cookie = await loginAndGetCookie(app, user.email, user.password);

    const response = await request(app).get('/dashboard/summary').set('Cookie', cookie);

    expect(response.status).toBe(200);
    expect(response.body.hasAnyTransactions).toBe(false);
    expect(response.body.caixaTotal).toBe('0.00');
  });

  it('exclui movimentações com soft delete das somas do dashboard', async () => {
    const user = await createTestUser();
    const cookie = await loginAndGetCookie(app, user.email, user.password);
    const receitaCategory = await createTestCategory(user.id, 'Honorários', 'RECEITA');

    const created = await createTransaction(cookie, {
      type: 'RECEITA',
      amount: '5000.00',
      categoryId: receitaCategory.id,
      transactionDate: '2026-08-01',
    });

    const before = await request(app).get('/dashboard/summary').set('Cookie', cookie);
    expect(before.body.caixaTotal).toBe('5000.00');

    await request(app).delete(`/transactions/${created.body.id}`).set('Cookie', cookie);

    const after = await request(app).get('/dashboard/summary').set('Cookie', cookie);
    expect(after.body.caixaTotal).toBe('0.00');
    expect(after.body.hasAnyTransactions).toBe(false);
  });
});
