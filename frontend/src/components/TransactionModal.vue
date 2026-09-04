<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Plus } from 'lucide-vue-next'
import { fetchCategories, createCategory } from '@/api/categories'
import { extractErrorMessage } from '@/api/client'
import { useToast } from '@/composables/useToast'
import { formatAmountForInput, normalizeAmountInput, todayIso } from '@/utils/format'
import { validateTransactionForm, hasErrors, type TransactionFormErrors } from '@/utils/validation'
import type { Category, Socio, Transaction, TransactionType } from '@/types'

const SOCIOS: Socio[] = ['CHIQUINHO', 'FILIPI', 'LOMAR']

const props = defineProps<{
  open: boolean
  transaction?: Transaction | null
  defaultType?: TransactionType
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', payload: { mode: 'create' | 'edit' }): void
}>()

const toast = useToast()

const isEdit = computed(() => !!props.transaction)

const form = reactive({
  tipo: '' as TransactionType | '',
  valor: '',
  descricao: '',
  clienteNome: '',
  categoriaId: '',
  data: todayIso(),
  socios: [] as Socio[],
})

const errors = ref<TransactionFormErrors>({})
const submitting = ref(false)
const categories = ref<Category[]>([])
const loadingCategories = ref(false)

const showNewCategory = ref(false)
const newCategoryName = ref('')
const creatingCategory = ref(false)

function resetForm(): void {
  if (props.transaction) {
    form.tipo = props.transaction.type
    form.valor = formatAmountForInput(props.transaction.amount)
    form.descricao = props.transaction.description
    form.clienteNome = props.transaction.clientName ?? ''
    form.categoriaId = props.transaction.category.id
    form.data = props.transaction.transactionDate
    form.socios = [...props.transaction.socios]
  } else {
    form.tipo = props.defaultType ?? 'DESPESA'
    form.valor = ''
    form.descricao = ''
    form.clienteNome = ''
    form.categoriaId = ''
    form.data = todayIso()
    form.socios = []
  }
  errors.value = {}
  showNewCategory.value = false
  newCategoryName.value = ''
}

async function loadCategories(): Promise<void> {
  if (!form.tipo) {
    categories.value = []
    return
  }
  loadingCategories.value = true
  try {
    categories.value = await fetchCategories(form.tipo)
  } catch (error) {
    toast.error(extractErrorMessage(error, 'Não foi possível carregar as categorias.'))
  } finally {
    loadingCategories.value = false
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetForm()
      void loadCategories()
    }
  },
  { immediate: true },
)

watch(
  () => form.tipo,
  (_newType, oldType) => {
    if (oldType !== undefined) {
      form.categoriaId = ''
    }
    void loadCategories()
  },
)

function selectType(type: TransactionType): void {
  form.tipo = type
}

async function handleCreateCategory(): Promise<void> {
  const name = newCategoryName.value.trim()
  if (!name || !form.tipo) return
  creatingCategory.value = true
  try {
    const created = await createCategory(name, form.tipo)
    categories.value = [...categories.value, created]
    form.categoriaId = created.id
    showNewCategory.value = false
    newCategoryName.value = ''
    toast.success('Categoria criada.')
  } catch (error) {
    toast.error(extractErrorMessage(error, 'Não foi possível criar a categoria.'))
  } finally {
    creatingCategory.value = false
  }
}

function onAmountBlur(): void {
  const normalized = normalizeAmountInput(form.valor)
  if (normalized !== '') {
    form.valor = formatAmountForInput(normalized)
  }
}

function toggleSocio(socio: Socio, checked: boolean): void {
  if (checked) {
    if (!form.socios.includes(socio)) form.socios.push(socio)
  } else {
    form.socios = form.socios.filter((s) => s !== socio)
  }
}

async function handleSubmit(): Promise<void> {
  const validationErrors = validateTransactionForm(form)
  errors.value = validationErrors
  if (hasErrors(validationErrors)) return

  submitting.value = true
  try {
    const payload = {
      type: form.tipo as TransactionType,
      amount: normalizeAmountInput(form.valor),
      description: form.descricao.trim(),
      clientName: form.clienteNome.trim(),
      categoryId: form.categoriaId,
      transactionDate: form.data,
      socios: form.socios,
    }

    const { createTransaction, updateTransaction } = await import('@/api/transactions')

    if (isEdit.value && props.transaction) {
      await updateTransaction(props.transaction.id, payload)
      toast.success('Movimentação atualizada.')
      emit('saved', { mode: 'edit' })
    } else {
      await createTransaction(payload)
      toast.success('Movimentação registrada.')
      emit('saved', { mode: 'create' })
    }
  } catch (error) {
    toast.error(extractErrorMessage(error, 'Não foi possível salvar a movimentação.'))
  } finally {
    submitting.value = false
  }
}

const SOCIO_LABELS: Record<Socio, string> = {
  CHIQUINHO: 'Chiquinho',
  FILIPI: 'Filipi',
  LOMAR: 'Lomar',
}

function handleClose(): void {
  if (submitting.value) return
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="props.open" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-black/50" @click="handleClose"></div>
      <div class="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-slate-900">
            {{ isEdit ? 'Editar movimentação' : 'Nova movimentação' }}
          </h2>
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-lg text-2xl text-slate-500 hover:bg-slate-100"
            aria-label="Fechar"
            @click="handleClose"
          >
            ×
          </button>
        </div>

        <form class="mt-4 flex flex-col gap-4" @submit.prevent="handleSubmit">
          <div class="flex gap-2">
            <button
              type="button"
              class="min-h-[44px] flex-1 rounded-lg border-2 px-4 py-2 text-base font-semibold"
              :class="
                form.tipo === 'RECEITA'
                  ? 'border-receita-500 bg-receita-50 text-receita-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              "
              @click="selectType('RECEITA')"
            >
              Receita
            </button>
            <button
              type="button"
              class="min-h-[44px] flex-1 rounded-lg border-2 px-4 py-2 text-base font-semibold"
              :class="
                form.tipo === 'DESPESA'
                  ? 'border-despesa-500 bg-despesa-50 text-despesa-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              "
              @click="selectType('DESPESA')"
            >
              Despesa
            </button>
          </div>
          <p v-if="errors.tipo" class="-mt-2 text-sm font-medium text-despesa-600">{{ errors.tipo }}</p>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-slate-600">Valor</span>
            <input
              v-model="form.valor"
              type="text"
              inputmode="decimal"
              placeholder="0,00"
              class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
              :class="errors.valor ? 'border-despesa-500' : 'border-slate-300'"
              @blur="onAmountBlur"
            />
            <span v-if="errors.valor" class="text-sm font-medium text-despesa-600">{{ errors.valor }}</span>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-slate-600">Descrição</span>
            <input
              v-model="form.descricao"
              type="text"
              placeholder="Ex: Pagamento de honorários"
              class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
              :class="errors.descricao ? 'border-despesa-500' : 'border-slate-300'"
            />
            <span v-if="errors.descricao" class="text-sm font-medium text-despesa-600">{{ errors.descricao }}</span>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-slate-600">Cliente / Empresa (opcional)</span>
            <input
              v-model="form.clienteNome"
              type="text"
              placeholder="Ex: João da Silva / Empresa XYZ Ltda (opcional)"
              class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
              :class="errors.clienteNome ? 'border-despesa-500' : 'border-slate-300'"
            />
            <span v-if="errors.clienteNome" class="text-sm font-medium text-despesa-600">{{ errors.clienteNome }}</span>
          </label>

          <div class="flex flex-col gap-1">
            <span class="text-sm font-medium text-slate-600">Categoria</span>
            <div class="flex gap-2">
              <select
                v-model="form.categoriaId"
                class="min-h-[44px] flex-1 rounded-lg border px-3 py-2 text-base"
                :class="errors.categoriaId ? 'border-despesa-500' : 'border-slate-300'"
                :disabled="loadingCategories || !form.tipo"
              >
                <option value="" disabled>{{ loadingCategories ? 'Carregando…' : 'Selecione' }}</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
              <button
                type="button"
                class="flex min-h-[44px] shrink-0 items-center justify-center rounded-lg border border-slate-300 px-3 font-semibold text-slate-600 hover:bg-slate-50"
                :disabled="!form.tipo"
                aria-label="Nova categoria"
                @click="showNewCategory = !showNewCategory"
              >
                <Plus class="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <span v-if="errors.categoriaId" class="text-sm font-medium text-despesa-600">{{ errors.categoriaId }}</span>
          </div>

          <div v-if="showNewCategory" class="flex gap-2 rounded-lg bg-slate-50 p-3">
            <input
              v-model="newCategoryName"
              type="text"
              placeholder="Nome da nova categoria"
              class="min-h-[44px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-base"
              @keydown.enter.prevent="handleCreateCategory"
            />
            <button
              type="button"
              class="min-h-[44px] rounded-lg bg-brand-600 px-4 text-base font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              :disabled="creatingCategory || !newCategoryName.trim()"
              @click="handleCreateCategory"
            >
              Criar
            </button>
          </div>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-slate-600">Data</span>
            <input
              v-model="form.data"
              type="date"
              class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
              :class="errors.data ? 'border-despesa-500' : 'border-slate-300'"
            />
            <span v-if="errors.data" class="text-sm font-medium text-despesa-600">{{ errors.data }}</span>
          </label>

          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium text-slate-600">Sócio(s) responsável(is)</span>
            <p class="text-xs text-slate-500">Marque quem essa movimentação compete — o valor é dividido igualmente entre os marcados.</p>
            <div class="flex flex-wrap gap-4">
              <label v-for="socio in SOCIOS" :key="socio" class="flex min-h-[44px] items-center gap-2">
                <input
                  type="checkbox"
                  class="h-5 w-5 rounded border-slate-300"
                  :checked="form.socios.includes(socio)"
                  @change="toggleSocio(socio, ($event.target as HTMLInputElement).checked)"
                />
                <span class="text-base text-slate-700">{{ SOCIO_LABELS[socio] }}</span>
              </label>
            </div>
            <span v-if="errors.socios" class="text-sm font-medium text-despesa-600">{{ errors.socios }}</span>
          </div>

          <div class="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50"
              :disabled="submitting"
              @click="handleClose"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="min-h-[44px] rounded-lg bg-brand-600 px-4 py-2 text-base font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              :disabled="submitting"
            >
              {{ submitting ? 'Salvando…' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
