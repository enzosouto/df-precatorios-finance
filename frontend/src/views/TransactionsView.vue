<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Plus, Pencil, Trash2, Search, SlidersHorizontal } from 'lucide-vue-next'
import { fetchTransactions, deleteTransaction } from '@/api/transactions'
import { fetchCategories } from '@/api/categories'
import { extractErrorMessage } from '@/api/client'
import { usePeriod } from '@/composables/usePeriod'
import { useToast } from '@/composables/useToast'
import PeriodSelector from '@/components/PeriodSelector.vue'
import TransactionModal from '@/components/TransactionModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { formatCurrency, formatDate, formatSignedCurrency, parseAmount, parseIsoDate } from '@/utils/format'
import type { Category, Socio, Transaction, TransactionTotals, TransactionType } from '@/types'

const SOCIOS: Socio[] = ['CHIQUINHO', 'FILIPI', 'LOMAR']
const SOCIO_LABELS: Record<Socio, string> = {
  CHIQUINHO: 'Chiquinho',
  FILIPI: 'Filipi',
  LOMAR: 'Lomar',
}

const period = usePeriod('mes')
const toast = useToast()

const items = ref<Transaction[]>([])
const total = ref(0)
const totals = ref<TransactionTotals>({ receitas: '0.00', despesas: '0.00', saldo: '0.00' })
const loading = ref(false)
const page = ref(1)
const pageSize = 20

const typeFilter = ref<'' | TransactionType>('')
const categoryFilter = ref('')
const socioFilter = ref<'' | Socio>('')
const searchTerm = ref('')
const filtersOpen = ref(false)

const activeFilterCount = computed(
  () => (typeFilter.value ? 1 : 0) + (categoryFilter.value ? 1 : 0) + (socioFilter.value ? 1 : 0)
)

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
      socio: socioFilter.value || undefined,
      search: searchTerm.value.trim() || undefined,
      page: page.value,
      pageSize,
    })
    items.value = response.items
    total.value = response.total
    totals.value = response.totals
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

watch(socioFilter, () => {
  page.value = 1
  void loadTransactions()
})

watch(searchTerm, debouncedReload)
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

/** Quando filtrado por sócio, mostra só a parte dele (valor ÷ nº de sócios da movimentação). */
function displayAmount(transaction: Transaction): number {
  if (!socioFilter.value) return parseAmount(transaction.amount)
  return parseAmount(transaction.amount) / transaction.socios.length
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
        <Plus class="h-5 w-5" aria-hidden="true" /> Nova movimentação
      </button>
    </div>

    <PeriodSelector
      :mode="period.mode.value"
      :label="period.label.value"
      :can-navigate="period.canNavigate.value"
      :anchor="period.anchor.value"
      :custom-start="period.customStart.value"
      :custom-end="period.customEnd.value"
      @update:mode="period.mode.value = $event"
      @prev="period.step(-1)"
      @next="period.step(1)"
      @jump="period.setAnchor(parseIsoDate($event))"
      @update:custom-start="period.customStart.value = $event"
      @update:custom-end="period.customEnd.value = $event"
    />

    <div class="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
      <div class="flex gap-2">
        <div class="relative flex-1">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Buscar por descrição, cliente ou empresa"
            class="min-h-[44px] w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-base"
          />
        </div>
        <button
          type="button"
          class="flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border px-4 text-base font-semibold"
          :class="filtersOpen || activeFilterCount ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600'"
          @click="filtersOpen = !filtersOpen"
        >
          <SlidersHorizontal class="h-5 w-5" aria-hidden="true" />
          <span class="hidden sm:inline">Filtros</span>
          <span v-if="activeFilterCount" class="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">{{ activeFilterCount }}</span>
        </button>
      </div>

      <div v-if="filtersOpen" class="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
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
          <span class="text-sm font-medium text-slate-600">Sócio</span>
          <select v-model="socioFilter" class="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-base">
            <option value="">Todos</option>
            <option v-for="socio in SOCIOS" :key="socio" :value="socio">{{ SOCIO_LABELS[socio] }}</option>
          </select>
        </label>
      </div>
    </div>

    <div v-if="!loading" class="grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-3">
      <div class="flex flex-col gap-0.5">
        <span class="text-xs font-medium uppercase tracking-wide text-slate-500">Receitas</span>
        <span class="text-lg font-bold text-receita-700">{{ formatCurrency(totals.receitas) }}</span>
      </div>
      <div class="flex flex-col gap-0.5">
        <span class="text-xs font-medium uppercase tracking-wide text-slate-500">Despesas</span>
        <span class="text-lg font-bold text-despesa-700">{{ formatCurrency(totals.despesas) }}</span>
      </div>
      <div class="flex flex-col gap-0.5">
        <span class="text-xs font-medium uppercase tracking-wide text-slate-500">Saldo</span>
        <span class="text-lg font-bold text-slate-900">{{ formatCurrency(totals.saldo) }}</span>
      </div>
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
          <div class="flex flex-col items-end">
            <span
              class="text-lg font-bold"
              :class="transaction.type === 'RECEITA' ? 'text-receita-700' : 'text-despesa-700'"
            >
              {{ formatSignedCurrency(displayAmount(transaction), transaction.type) }}
            </span>
            <span v-if="socioFilter" class="text-xs text-slate-500">
              parte de {{ SOCIO_LABELS[socioFilter] }} (÷{{ transaction.socios.length }} de {{ formatCurrency(transaction.amount) }})
            </span>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Editar movimentação"
              @click="openEdit(transaction)"
            >
              <Pencil class="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-lg text-despesa-600 hover:bg-despesa-50"
              aria-label="Excluir movimentação"
              @click="askDelete(transaction)"
            >
              <Trash2 class="h-5 w-5" aria-hidden="true" />
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
      class="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg sm:hidden"
      aria-label="Nova movimentação"
      @click="openCreate"
    >
      <Plus class="h-7 w-7" aria-hidden="true" />
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
