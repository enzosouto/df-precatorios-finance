<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { fetchPrecatorios, deletePrecatorio } from '@/api/precatorios'
import { extractErrorMessage } from '@/api/client'
import { useToast } from '@/composables/useToast'
import PrecatorioModal from '@/components/PrecatorioModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { formatCurrency, formatSignedAmount } from '@/utils/format'
import type { Precatorio } from '@/types'

const toast = useToast()

const items = ref<Precatorio[]>([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = 20

const searchTerm = ref('')

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

const modalOpen = ref(false)
const editingPrecatorio = ref<Precatorio | null>(null)

const confirmOpen = ref(false)
const deletingPrecatorio = ref<Precatorio | null>(null)
const deleting = ref(false)

async function loadPrecatorios(): Promise<void> {
  loading.value = true
  try {
    const response = await fetchPrecatorios({
      search: searchTerm.value.trim() || undefined,
      page: page.value,
      pageSize,
    })
    items.value = response.items
    total.value = response.total
  } catch (error) {
    toast.error(extractErrorMessage(error, 'Não foi possível carregar os precatórios.'))
  } finally {
    loading.value = false
  }
}

let searchDebounce: ReturnType<typeof setTimeout> | undefined

function debouncedReload(): void {
  page.value = 1
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => void loadPrecatorios(), 350)
}

watch(searchTerm, debouncedReload)
watch(page, () => void loadPrecatorios())

onMounted(() => {
  void loadPrecatorios()
})

function openCreate(): void {
  editingPrecatorio.value = null
  modalOpen.value = true
}

function openEdit(precatorio: Precatorio): void {
  editingPrecatorio.value = precatorio
  modalOpen.value = true
}

function handleSaved(): void {
  modalOpen.value = false
  void loadPrecatorios()
}

function askDelete(precatorio: Precatorio): void {
  deletingPrecatorio.value = precatorio
  confirmOpen.value = true
}

async function confirmDelete(): Promise<void> {
  if (!deletingPrecatorio.value) return
  deleting.value = true
  try {
    await deletePrecatorio(deletingPrecatorio.value.id)
    toast.success('Precatório removido.')
    confirmOpen.value = false
    deletingPrecatorio.value = null
    void loadPrecatorios()
  } catch (error) {
    toast.error(extractErrorMessage(error, 'Não foi possível remover o precatório.'))
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
      <h1 class="text-2xl font-bold text-slate-900">Precatórios</h1>
      <button
        type="button"
        class="hidden min-h-[44px] items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-base font-semibold text-white hover:bg-brand-700 sm:flex"
        @click="openCreate"
      >
        <span aria-hidden="true">+</span> Novo Precatório
      </button>
    </div>

    <div class="rounded-xl bg-white p-4 shadow-sm">
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium text-slate-600">Buscar</span>
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Buscar por cedente"
          class="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-base"
        />
      </label>
    </div>

    <div v-if="loading" class="rounded-xl bg-white p-6 text-center text-slate-500 shadow-sm">Carregando…</div>

    <div v-else-if="items.length === 0" class="rounded-xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
      <p class="text-lg font-semibold text-slate-700">Nenhum precatório encontrado.</p>
      <p class="mt-1 text-base text-slate-500">Ajuste a busca ou cadastre um novo precatório.</p>
    </div>

    <div v-else class="flex flex-col gap-3">
      <div v-for="precatorio in items" :key="precatorio.id" class="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <span class="text-base font-semibold text-slate-900">{{ precatorio.cedente }}</span>
          <div class="flex shrink-0 gap-2">
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-slate-500 hover:bg-slate-100"
              aria-label="Editar precatório"
              @click="openEdit(precatorio)"
            >
              ✏️
            </button>
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-despesa-600 hover:bg-despesa-50"
              aria-label="Excluir precatório"
              @click="askDelete(precatorio)"
            >
              🗑️
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="flex flex-col gap-0.5">
            <span class="text-xs font-medium uppercase tracking-wide text-slate-500">Valor Original</span>
            <span class="text-base font-semibold text-slate-900">{{ formatCurrency(precatorio.valorOriginal) }}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-xs font-medium uppercase tracking-wide text-slate-500">Valor Atualizado</span>
            <span class="text-base font-semibold text-slate-900">{{ formatCurrency(precatorio.valorAtualizado) }}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-xs font-medium uppercase tracking-wide text-slate-500">Diferença</span>
            <span class="text-base font-semibold text-slate-500">{{ formatSignedAmount(precatorio.diferenca) }}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-xs font-medium uppercase tracking-wide text-slate-500">Valor Pago</span>
            <span class="text-base font-semibold text-slate-900">
              {{ precatorio.valorPago ? formatCurrency(precatorio.valorPago) : '—' }}
            </span>
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
      aria-label="Novo Precatório"
      @click="openCreate"
    >
      +
    </button>

    <PrecatorioModal :open="modalOpen" :precatorio="editingPrecatorio" @close="modalOpen = false" @saved="handleSaved" />

    <ConfirmModal
      :open="confirmOpen"
      title="Excluir precatório"
      :message="`Tem certeza que deseja excluir o precatório de '${deletingPrecatorio?.cedente}'? Esta ação não pode ser desfeita.`"
      confirm-label="Excluir"
      danger
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="confirmOpen = false"
    />
  </div>
</template>
