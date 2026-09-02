import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildApp, cleanupDatabase, createTestCategory, createTestUser, loginAndGetCookie } from './helpers';

const app = buildApp();

describe('Relatórios', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  it('agrupa receitas e despesas por mês e calcula os totais e top categorias', async () => {
    const user = await createTestUser();
    const cookie = await loginAndGetCookie(app, user.email, user.password);

    const honorarios = await createTestCategory(user.id, 'Honorários', 'RECEITA');
    const comissao = await createTestCategory(user.id, 'Comissão', 'RECEITA');
    const aluguel = await createTestCategory(user.id, 'Aluguel', 'DESPESA');
    const energia = await createTestCategory(user.id, 'Energia', 'DESPESA');

    const tx = (data: {
      type: 'RECEITA' | 'DESPESA';
      amount: string;
      categoryId: string;
      transactionDate: string;
    }) =>
      request(app)
        .post('/transactions')
        .set('Cookie', cookie)
        .send({
          ...data,
          description: 'Movimentação de relatório',
          clientName: 'Cliente Relatório',
        });

    // Julho/2026
    await tx({ type: 'RECEITA', amount: '1000.00', categoryId: honorarios.id, transactionDate: '2026-07-05' });
    await tx({ type: 'DESPESA', amount: '400.00', categoryId: aluguel.id, transactionDate: '2026-07-10' });

    // Agosto/2026
    await tx({ type: 'RECEITA', amount: '2000.00', categoryId: honorarios.id, transactionDate: '2026-08-01' });
    await tx({ type: 'RECEITA', amount: '500.00', categoryId: comissao.id, transactionDate: '2026-08-15' });
    await tx({ type: 'DESPESA', amount: '300.00', categoryId: aluguel.id, transactionDate: '2026-08-20' });
    await tx({ type: 'DESPESA', amount: '150.00', categoryId: energia.id, transactionDate: '2026-08-25' });

    const response = await request(app)
      .get('/reports?startDate=2026-07-01&endDate=2026-08-31')
      .set('Cookie', cookie);

    expect(response.status).toBe(200);

    // Totais do período inteiro (jul + ago)
    expect(response.body.receitas).toBe('3500.00'); // 1000 + 2000 + 500
    expect(response.body.despesas).toBe('850.00'); // 400 + 300 + 150
    expect(response.body.saldo).toBe('2650.00');

    // Agrupamento mensal
    expect(response.body.monthly).toEqual([
      { month: '2026-07', receitas: '1000.00', despesas: '400.00' },
      { month: '2026-08', receitas: '2500.00', despesas: '450.00' },
    ]);

    // Top categorias de despesa (desc)
    expect(response.body.topDespesaCategorias[0]).toEqual({ categoryName: 'Aluguel', total: '700.00' });
    expect(response.body.topDespesaCategorias[1]).toEqual({ categoryName: 'Energia', total: '150.00' });

    // Top categorias de receita (desc)
    expect(response.body.topReceitaCategorias[0]).toEqual({ categoryName: 'Honorários', total: '3000.00' });
    expect(response.body.topReceitaCategorias[1]).toEqual({ categoryName: 'Comissão', total: '500.00' });
  });

  it('inclui meses sem lançamentos no agrupamento mensal (com totais zerados)', async () => {
    const user = await createTestUser();
    const cookie = await loginAndGetCookie(app, user.email, user.password);
    const category = await createTestCategory(user.id, 'Honorários', 'RECEITA');

    await request(app)
      .post('/transactions')
      .set('Cookie', cookie)
      .send({
        type: 'RECEITA',
        amount: '100.00',
        description: 'Único lançamento',
        clientName: 'Cliente Único',
        categoryId: category.id,
        transactionDate: '2026-06-01',
      });

    const response = await request(app)
      .get('/reports?startDate=2026-06-01&endDate=2026-08-31')
      .set('Cookie', cookie);

    expect(response.body.monthly).toEqual([
      { month: '2026-06', receitas: '100.00', despesas: '0.00' },
      { month: '2026-07', receitas: '0.00', despesas: '0.00' },
      { month: '2026-08', receitas: '0.00', despesas: '0.00' },
    ]);
  });
});
