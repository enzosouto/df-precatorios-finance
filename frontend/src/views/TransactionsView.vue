<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { fetchTransactions, deleteTransaction } from '@/api/transactions'
import { fetchCategories } from '@/api/categories'
import { extractErrorMessage } from '@/api/client'
import { usePeriod } from '@/composables/usePeriod'
import { useToast } from '@/composables/useToast'
import PeriodSelector from '@/components/PeriodSelector.vue'
import TransactionModal from '@/components/TransactionModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { formatDate, formatSignedCurrency } from '@/utils/format'
import type { Category, Transaction, TransactionType } from '@/types'

const period = usePeriod('mes')
const toast = useToast()

const items = ref<Transaction[]>([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = 20

const typeFilter = ref<'' | TransactionType>('')
const categoryFilter = ref('')
const searchTerm = ref('')
const clientNameFilter = ref('')

const categoriesReceita = ref<Category[]>([])
const categoriasDespesa = ref<Category[]>([])

const availableCategories = computed<Category[]>(() => {
  if (typeFilter.value === 'RECEITA') return categoriesReceita.value
  if (typeFilter.value === 'DESPESA') return categoriasDespesa.value
  return [...categoriesReceita.value, ...categoriasDespesa.value]
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

const modalOpen = ref(false)
const editingTransaction = ref<Transaction | null>(null)

const confirmOpen = ref(false)
const deletingTransaction = ref<Transaction | null>(null)
const deleting = ref(false)

async function loadCategories(): Promise<void> {
  try {
    const [receitas, despesas] = await Promise.all([fetchCategories('RECEITA'), fetchCategories('DESPESA')])
    categoriesReceita.value = receitas
    categoriasDespesa.value = despesas
  } catch (error) {
    toast.error(extractErrorMessage(error, 'Não foi possível carregar as categorias.'))
  }
}

async function loadTransactions(): Promise<void> {
  loading.value = true
  try {
    const response = await fetchTransactions({
      startDate: period.range.value.startDate,
      endDate: period.range.value.endDate,
      type: typeFilter.value || undefined,
      categoryId: categoryFilter.value || undefined,
      search: searchTerm.value.trim() || undefined,
      clientName: clientNameFilter.value.trim() || undefined,
      page: page.value,
      pageSize,
    })
    items.value = response.items
    total.value = response.total
  } catch (error) {
    toast.error(extractErrorMessage(error, 'Não foi possível carregar as movimentações.'))
  } finally {
    loading.value = false
  }
}

let searchDebounce: ReturnType<typeof setTimeout> | undefined

function debouncedReload(): void {
  page.value = 1
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => void loadTransactions(), 350)
}

watch(period.range, () => {
  page.value = 1
  void loadTransactions()
})

watch(typeFilter, () => {
  categoryFilter.value = ''
  page.value = 1
  void loadTransactions()
})

watch(categoryFilter, () => {
  page.value = 1
  void loadTransactions()
})

watch(searchTerm, debouncedReload)
watch(clientNameFilter, debouncedReload)
watch(page, () => void loadTransactions())

onMounted(() => {
  void loadCategories()
  void loadTransactions()
})

function openCreate(): void {
  editingTransaction.value = null
  modalOpen.value = true
}

function openEdit(transaction: Transaction): void {
  editingTransaction.value = transaction
  modalOpen.value = true
}

function handleSaved(): void {
  modalOpen.value = false
  void loadTransactions()
}

function askDelete(transaction: Transaction): void {
  deletingTransaction.value = transaction
  confirmOpen.value = true
}

async function confirmDelete(): Promise<void> {
  if (!deletingTransaction.value) return
  deleting.value = true
  try {
    await deleteTransaction(deletingTransaction.value.id)
    toast.success('Movimentação excluída.')
    confirmOpen.value = false
    deletingTransaction.value = null
    void loadTransactions()
  } catch (error) {
    toast.error(extractErrorMessage(error, 'Não foi possível excluir a movimentação.'))
  } finally {
    deleting.value = false
  }
}

function goToPage(target: number): void {
  if (target < 1 || target > totalPages.value) return
  page.value = target
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">Movimentações</h1>
      <button
        type="button"
        class="hidden min-h-[44px] items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-base font-semibold text-white hover:bg-brand-700 sm:flex"
        @click="openCreate"
      >
        <span aria-hidden="true">+</span> Nova movimentação
      </button>
    </div>

    <PeriodSelector
      :mode="period.mode.value"
      :label="period.label.value"
      :can-navigate="period.canNavigate.value"
      :custom-start="period.customStart.value"
      :custom-end="period.customEnd.value"
      @update:mode="period.mode.value = $event"
      @prev="period.step(-1)"
      @next="period.step(1)"
      @update:custom-start="period.customStart.value = $event"
      @update:custom-end="period.customEnd.value = $event"
    />

    <div class="grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium text-slate-600">Tipo</span>
        <select v-model="typeFilter" class="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-base">
          <option value="">Todos</option>
          <option value="RECEITA">Receita</option>
          <option value="DESPESA">Despesa</option>
        </select>
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium text-slate-600">Categoria</span>
        <select v-model="categoryFilter" class="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-base">
          <option value="">Todas</option>
          <option v-for="category in availableCategories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium text-slate-600">Buscar</span>
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Descrição ou cliente"
          class="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-base"
        />
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium text-slate-600">Cliente / Empresa</span>
        <input
          v-model="clientNameFilter"
          type="text"
          placeholder="Filtrar por cliente"
          class="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-base"
        />
      </label>
    </div>

    <div v-if="loading" class="rounded-xl bg-white p-6 text-center text-slate-500 shadow-sm">Carregando…</div>

    <div v-else-if="items.length === 0" class="rounded-xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
      <p class="text-lg font-semibold text-slate-700">Nenhuma movimentação encontrada.</p>
      <p class="mt-1 text-base text-slate-500">Ajuste os filtros ou cadastre uma nova movimentação.</p>
    </div>

    <div v-else class="flex flex-col gap-3">
      <div
        v-for="transaction in items"
        :key="transaction.id"
        class="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex flex-col gap-1">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-bold uppercase"
              :class="transaction.type === 'RECEITA' ? 'bg-receita-100 text-receita-700' : 'bg-despesa-100 text-despesa-700'"
            >
              {{ transaction.type === 'RECEITA' ? 'Receita' : 'Despesa' }}
            </span>
            <span class="text-base font-semibold text-slate-900">{{ transaction.description }}</span>
          </div>
          <p class="text-sm text-slate-500">
            {{ transaction.clientName || '—' }} · {{ transaction.category.name }} · {{ formatDate(transaction.transactionDate) }}
          </p>
        </div>
        <div class="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
          <span
            class="text-lg font-bold"
            :class="transaction.type === 'RECEITA' ? 'text-receita-700' : 'text-despesa-700'"
          >
            {{ formatSignedCurrency(transaction.amount, transaction.type) }}
          </span>
          <div class="flex gap-2">
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-slate-500 hover:bg-slate-100"
              aria-label="Editar movimentação"
              @click="openEdit(transaction)"
            >
              ✏️
            </button>
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-despesa-600 hover:bg-despesa-50"
              aria-label="Excluir movimentação"
              @click="askDelete(transaction)"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
        <p class="text-sm text-slate-500">Total: {{ total }} registro(s)</p>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-lg disabled:opacity-40"
            :disabled="page <= 1"
            aria-label="Página anterior"
            @click="goToPage(page - 1)"
          >
            ‹
          </button>
          <span class="text-sm font-medium text-slate-600">{{ page }} / {{ totalPages }}</span>
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-lg disabled:opacity-40"
            :disabled="page >= totalPages"
            aria-label="Próxima página"
            @click="goToPage(page + 1)"
          >
            ›
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile floating action button -->
    <button
      type="button"
      class="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-3xl text-white shadow-lg sm:hidden"
      aria-label="Nova movimentação"
      @click="openCreate"
    >
      +
    </button>

    <TransactionModal :open="modalOpen" :transaction="editingTransaction" @close="modalOpen = false" @saved="handleSaved" />

    <ConfirmModal
      :open="confirmOpen"
      title="Excluir movimentação"
      :message="`Tem certeza que deseja excluir '${deletingTransaction?.description}'? Esta ação não pode ser desfeita.`"
      confirm-label="Excluir"
      danger
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="confirmOpen = false"
    />
  </div>
</template>
