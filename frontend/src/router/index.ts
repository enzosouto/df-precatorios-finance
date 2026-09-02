import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
    },
    {
      path: '/movimentacoes',
      name: 'movimentacoes',
      component: () => import('@/views/TransactionsView.vue'),
    },
    {
      path: '/precatorios',
      name: 'precatorios',
      component: () => import('@/views/PrecatoriosView.vue'),
    },
    {
      path: '/relatorios',
      name: 'relatorios',
      component: () => import('@/views/ReportsView.vue'),
    },
    {
      path: '/configuracoes',
      name: 'configuracoes',
      component: () => import('@/views/SettingsView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (auth.status === 'idle') {
    await auth.checkSession()
  }

  if (to.meta.public) {
    if (auth.isAuthenticated && to.name === 'login') {
      return { name: 'dashboard' }
    }
    return true
  }

  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  return true
})

export default router
