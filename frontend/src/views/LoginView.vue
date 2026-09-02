<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { extractErrorMessage } from '@/api/client'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const errors = reactive<{ email?: string; password?: string }>({})
const submitting = ref(false)
const formError = ref('')

function validate(): boolean {
  errors.email = undefined
  errors.password = undefined

  if (!form.email.trim()) {
    errors.email = 'Informe o usuário.'
  }

  if (!form.password) {
    errors.password = 'Informe a senha.'
  }

  return !errors.email && !errors.password
}

async function handleSubmit(): Promise<void> {
  formError.value = ''
  if (!validate()) return

  submitting.value = true
  try {
    await auth.login(form.email.trim(), form.password)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.push(redirect)
  } catch (error) {
    formError.value = extractErrorMessage(error, 'E-mail ou senha inválidos.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div class="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
      <div class="mb-8 flex flex-col items-center text-center">
        <img src="/logo.png" alt="DF Precatórios Finance" class="mb-4 h-32 w-32 max-w-full object-contain" />
        <p class="text-2xl font-bold text-brand-700">DF PRECATORIOS</p>
        <p class="text-base font-semibold text-slate-500">FINANCE</p>
      </div>

      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium text-slate-600">Usuário</span>
          <input
            v-model="form.email"
            type="text"
            autocomplete="username"
            class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
            :class="errors.email ? 'border-despesa-500' : 'border-slate-300'"
          />
          <span v-if="errors.email" class="text-sm font-medium text-despesa-600">{{ errors.email }}</span>
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium text-slate-600">Senha</span>
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
            :class="errors.password ? 'border-despesa-500' : 'border-slate-300'"
          />
          <span v-if="errors.password" class="text-sm font-medium text-despesa-600">{{ errors.password }}</span>
        </label>

        <p v-if="formError" class="rounded-lg bg-despesa-50 px-3 py-2 text-sm font-medium text-despesa-700">
          {{ formError }}
        </p>

        <button
          type="submit"
          class="mt-2 min-h-[44px] rounded-lg bg-brand-600 px-4 py-2 text-base font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          :disabled="submitting"
        >
          {{ submitting ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>
    </div>
  </div>
</template>
