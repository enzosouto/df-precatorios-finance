<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const drawerOpen = ref(false)

const navItems = [
  { to: '/', icon: '🏠', label: 'Dashboard' },
  { to: '/movimentacoes', icon: '💰', label: 'Movimentações' },
  { to: '/precatorios', icon: '📄', label: 'Precatórios' },
  { to: '/relatorios', icon: '📊', label: 'Relatórios' },
  { to: '/configuracoes', icon: '⚙️', label: 'Configurações' },
]

async function handleLogout(): Promise<void> {
  await auth.logout()
  toast.info('Sessão encerrada.')
  router.push({ name: 'login' })
}

function closeDrawer(): void {
  drawerOpen.value = false
}
</script>

<template>
  <div class="flex min-h-screen flex-col md:flex-row">
    <!-- Desktop sidebar -->
    <aside class="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div class="flex items-center gap-3 px-6 py-6">
        <img src="/logo.png" alt="DF Precatórios Finance" class="h-10 w-10 max-w-full shrink-0 object-contain" />
        <div>
          <p class="text-lg font-bold leading-tight text-brand-700">DF PRECATORIOS</p>
          <p class="text-sm text-slate-500">FINANCE</p>
        </div>
      </div>
      <nav class="flex flex-1 flex-col gap-1 px-3">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex min-h-[44px] items-center gap-3 rounded-lg px-4 py-3 text-lg font-medium text-slate-700 hover:bg-brand-50"
          active-class="bg-brand-100 text-brand-800"
        >
          <span class="text-xl" aria-hidden="true">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
      <div class="border-t border-slate-200 p-3">
        <button
          type="button"
          class="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-4 py-3 text-lg font-medium text-slate-700 hover:bg-despesa-50"
          @click="handleLogout"
        >
          <span class="text-xl" aria-hidden="true">🚪</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>

    <!-- Mobile top bar -->
    <header class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
      <button
        type="button"
        class="flex h-11 w-11 items-center justify-center rounded-lg text-2xl text-slate-700 hover:bg-slate-100"
        aria-label="Abrir menu"
        @click="drawerOpen = true"
      >
        ☰
      </button>
      <div class="flex items-center gap-2">
        <img src="/logo.png" alt="DF Precatórios Finance" class="h-8 w-8 max-w-full object-contain" />
        <p class="text-base font-bold text-brand-700">DF PRECATORIOS FINANCE</p>
      </div>
      <span class="w-11"></span>
    </header>

    <!-- Mobile drawer -->
    <div v-if="drawerOpen" class="fixed inset-0 z-40 md:hidden">
      <div class="absolute inset-0 bg-black/40" @click="closeDrawer"></div>
      <div class="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
        <div class="flex items-center justify-between px-6 py-6">
          <div class="flex items-center gap-3">
            <img src="/logo.png" alt="DF Precatórios Finance" class="h-10 w-10 max-w-full shrink-0 object-contain" />
            <div>
              <p class="text-lg font-bold leading-tight text-brand-700">DF PRECATORIOS</p>
              <p class="text-sm text-slate-500">FINANCE</p>
            </div>
          </div>
          <button
            type="button"
            class="flex h-11 w-11 items-center justify-center rounded-lg text-2xl text-slate-500"
            aria-label="Fechar menu"
            @click="closeDrawer"
          >
            ×
          </button>
        </div>
        <nav class="flex flex-1 flex-col gap-1 px-3">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex min-h-[44px] items-center gap-3 rounded-lg px-4 py-3 text-lg font-medium text-slate-700 hover:bg-brand-50"
            active-class="bg-brand-100 text-brand-800"
            @click="closeDrawer"
          >
            <span class="text-xl" aria-hidden="true">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>
        <div class="border-t border-slate-200 p-3">
          <button
            type="button"
            class="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-4 py-3 text-lg font-medium text-slate-700 hover:bg-despesa-50"
            @click="handleLogout"
          >
            <span class="text-xl" aria-hidden="true">🚪</span>
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <main class="flex-1 pb-20 md:pb-0">
      <div class="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>

    <!-- Mobile bottom bar -->
    <nav class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white md:hidden">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-xs font-medium text-slate-600"
        active-class="text-brand-700"
      >
        <span class="text-xl" aria-hidden="true">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>
