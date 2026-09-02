<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { changePassword } from '@/api/auth'
import { fetchCategories, createCategory, updateCategory } from '@/api/categories'
import { extractErrorMessage } from '@/api/client'
import { useToast } from '@/composables/useToast'
import type { Category, TransactionType } from '@/types'

const auth = useAuthStore()
const toast = useToast()

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordErrors = reactive<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({})
const savingPassword = ref(false)

function validatePasswordForm(): boolean {
  passwordErrors.currentPassword = undefined
  passwordErrors.newPassword = undefined
  passwordErrors.confirmPassword = undefined

  if (!passwordForm.currentPassword) {
    passwordErrors.currentPassword = 'Informe a senha atual.'
  }
  if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
    passwordErrors.newPassword = 'A nova senha deve ter ao menos 8 caracteres.'
  }
  if (passwordForm.confirmPassword !== passwordForm.newPassword) {
    passwordErrors.confirmPassword = 'As senhas não coincidem.'
  }

  return !passwordErrors.currentPassword && !passwordErrors.newPassword && !passwordErrors.confirmPassword
}

async function handleChangePassword(): Promise<void> {
  if (!validatePasswordForm()) return
  savingPassword.value = true
  try {
    await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
    toast.success('Senha alterada com sucesso.')
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error) {
    toast.error(extractErrorMessage(error, 'Não foi possível alterar a senha.'))
  } finally {
    savingPassword.value = false
  }
}

const categoriesReceita = ref<Category[]>([])
const categoriasDespesa = ref<Category[]>([])
const loadingCategories = ref(false)

const newCategoryName = ref('')
const newCategoryType = ref<TransactionType>('DESPESA')
const creatingCategory = ref(false)

const editingId = ref<string | null>(null)
const editingName = ref('')
const savingEdit = ref(false)

async function loadCategories(): Promise<void> {
  loadingCategories.value = true
  try {
    const [receitas, despesas] = await Promise.all([fetchCategories('RECEITA'), fetchCategories('DESPESA')])
    categoriesReceita.value = receitas
    categoriasDespesa.value = despesas
  } catch (error) {
    toast.error(extractErrorMessage(error, 'Não foi possível carregar as categorias.'))
  } finally {
    loadingCategories.value = false
  }
}

onMounted(() => void loadCategories())

async function handleCreateCategory(): Promise<void> {
  const name = newCategoryName.value.trim()
  if (!name) return
  creatingCategory.value = true
  try {
    const created = await createCategory(name, newCategoryType.value)
    if (created.type === 'RECEITA') {
      categoriesReceita.value = [...categoriesReceita.value, created]
    } else {
      categoriasDespesa.value = [...categoriasDespesa.value, created]
    }
    newCategoryName.value = ''
    toast.success('Categoria criada.')
  } catch (error) {
    toast.error(extractErrorMessage(error, 'Não foi possível criar a categoria.'))
  } finally {
    creatingCategory.value = false
  }
}

function startEdit(category: Category): void {
  editingId.value = category.id
  editingName.value = category.name
}

function cancelEdit(): void {
  editingId.value = null
  editingName.value = ''
}

async function saveEdit(category: Category): Promise<void> {
  const name = editingName.value.trim()
  if (!name) return
  savingEdit.value = true
  try {
    const updated = await updateCategory(category.id, name)
    const list = updated.type === 'RECEITA' ? categoriesReceita : categoriasDespesa
    const index = list.value.findIndex((c) => c.id === updated.id)
    if (index !== -1) list.value[index] = updated
    cancelEdit()
    toast.success('Categoria atualizada.')
  } catch (error) {
    toast.error(extractErrorMessage(error, 'Não foi possível atualizar a categoria.'))
  } finally {
    savingEdit.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold text-slate-900">Configurações</h1>

    <section class="rounded-xl bg-white p-5 shadow-sm">
      <h2 class="text-lg font-bold text-slate-800">Conta</h2>
      <p class="mt-1 text-base text-slate-600">{{ auth.user?.name }} · {{ auth.user?.email }}</p>
    </section>

    <section class="rounded-xl bg-white p-5 shadow-sm">
      <h2 class="text-lg font-bold text-slate-800">Alterar senha</h2>
      <form class="mt-4 flex flex-col gap-4 sm:max-w-sm" @submit.prevent="handleChangePassword">
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium text-slate-600">Senha atual</span>
          <input
            v-model="passwordForm.currentPassword"
            type="password"
            autocomplete="current-password"
            class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
            :class="passwordErrors.currentPassword ? 'border-despesa-500' : 'border-slate-300'"
          />
          <span v-if="passwordErrors.currentPassword" class="text-sm font-medium text-despesa-600">
            {{ passwordErrors.currentPassword }}
          </span>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium text-slate-600">Nova senha</span>
          <input
            v-model="passwordForm.newPassword"
            type="password"
            autocomplete="new-password"
            class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
            :class="passwordErrors.newPassword ? 'border-despesa-500' : 'border-slate-300'"
          />
          <span v-if="passwordErrors.newPassword" class="text-sm font-medium text-despesa-600">
            {{ passwordErrors.newPassword }}
          </span>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium text-slate-600">Confirmar nova senha</span>
          <input
            v-model="passwordForm.confirmPassword"
            type="password"
            autocomplete="new-password"
            class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
            :class="passwordErrors.confirmPassword ? 'border-despesa-500' : 'border-slate-300'"
          />
          <span v-if="passwordErrors.confirmPassword" class="text-sm font-medium text-despesa-600">
            {{ passwordErrors.confirmPassword }}
          </span>
        </label>
        <button
          type="submit"
          class="min-h-[44px] rounded-lg bg-brand-600 px-4 py-2 text-base font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          :disabled="savingPassword"
        >
          {{ savingPassword ? 'Salvando…' : 'Salvar nova senha' }}
        </button>
      </form>
    </section>

    <section class="rounded-xl bg-white p-5 shadow-sm">
      <h2 class="text-lg font-bold text-slate-800">Categorias</h2>

      <div class="mt-4 flex flex-wrap items-end gap-3">
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium text-slate-600">Tipo</span>
          <select v-model="newCategoryType" class="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-base">
            <option value="DESPESA">Despesa</option>
            <option value="RECEITA">Receita</option>
          </select>
        </label>
        <label class="flex flex-1 flex-col gap-1">
          <span class="text-sm font-medium text-slate-600">Nova categoria</span>
          <input
            v-model="newCategoryName"
            type="text"
            placeholder="Nome da categoria"
            class="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-base"
            @keydown.enter.prevent="handleCreateCategory"
          />
        </label>
        <button
          type="button"
          class="min-h-[44px] rounded-lg bg-brand-600 px-4 py-2 text-base font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          :disabled="creatingCategory || !newCategoryName.trim()"
          @click="handleCreateCategory"
        >
          Adicionar
        </button>
      </div>

      <div v-if="loadingCategories" class="mt-6 text-center text-slate-500">Carregando…</div>

      <div v-else class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <h3 class="mb-2 text-sm font-bold uppercase tracking-wide text-receita-700">Receitas</h3>
          <ul class="flex flex-col gap-2">
            <li
              v-for="category in categoriesReceita"
              :key="category.id"
              class="flex items-center gap-2 rounded-lg bg-receita-50 px-3 py-2"
            >
              <template v-if="editingId === category.id">
                <input
                  v-model="editingName"
                  type="text"
                  class="min-h-[36px] flex-1 rounded-lg border border-slate-300 px-2 py-1 text-base"
                  @keydown.enter.prevent="saveEdit(category)"
                />
                <button type="button" class="text-sm font-semibold text-brand-700" :disabled="savingEdit" @click="saveEdit(category)">
                  Salvar
                </button>
                <button type="button" class="text-sm font-semibold text-slate-500" @click="cancelEdit">Cancelar</button>
              </template>
              <template v-else>
                <span class="flex-1 text-base font-medium text-slate-700">{{ category.name }}</span>
                <button type="button" class="text-sm font-semibold text-brand-700" @click="startEdit(category)">Editar</button>
              </template>
            </li>
          </ul>
        </div>
        <div>
          <h3 class="mb-2 text-sm font-bold uppercase tracking-wide text-despesa-700">Despesas</h3>
          <ul class="flex flex-col gap-2">
            <li
              v-for="category in categoriasDespesa"
              :key="category.id"
              class="flex items-center gap-2 rounded-lg bg-despesa-50 px-3 py-2"
            >
              <template v-if="editingId === category.id">
                <input
                  v-model="editingName"
                  type="text"
                  class="min-h-[36px] flex-1 rounded-lg border border-slate-300 px-2 py-1 text-base"
                  @keydown.enter.prevent="saveEdit(category)"
                />
                <button type="button" class="text-sm font-semibold text-brand-700" :disabled="savingEdit" @click="saveEdit(category)">
                  Salvar
                </button>
                <button type="button" class="text-sm font-semibold text-slate-500" @click="cancelEdit">Cancelar</button>
              </template>
              <template v-else>
                <span class="flex-1 text-base font-medium text-slate-700">{{ category.name }}</span>
                <button type="button" class="text-sm font-semibold text-brand-700" @click="startEdit(category)">Editar</button>
              </template>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
