<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/AppLayout.vue'
import ToastContainer from '@/components/ToastContainer.vue'

const route = useRoute()
const auth = useAuthStore()

const showLayout = computed(() => !route.meta.public && auth.isAuthenticated)
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <template v-if="auth.status !== 'ready'">
      <div class="flex min-h-screen items-center justify-center">
        <p class="text-lg text-slate-500">Carregando…</p>
      </div>
    </template>
    <template v-else-if="showLayout">
      <AppLayout>
        <RouterView />
      </AppLayout>
    </template>
    <template v-else>
      <RouterView />
    </template>
    <ToastContainer />
  </div>
</template>
