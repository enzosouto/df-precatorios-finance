<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Plus } from 'lucide-vue-next'
import { fetchPrecatorios, deletePrecatorio } from '@/api/precatorios'
import { extractErrorMessage } from '@/api/client'
import { useToast } from '@/composables/useToast'
import PrecatorioModal from '@/components/PrecatorioModal.vue'
import PrecatorioGroupTable from '@/components/PrecatorioGroupTable.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import type { OrigemPrecatorio, Precatorio } from '@/types'

const ORIGEM_LABELS: Record<OrigemPrecatorio, string> = { GDF: 'GDF', FEDERAL: 'Federal', OUTRO: 'Outros' }
const FETCH_ALL_PAGE_SIZE = 1000

const toast = useToast()

const items = ref<Precatorio[]>([])
const loading = ref(false)
const searchTerm = ref('')

const modalOpen = ref(false)
const editingPrecatorio = ref<Precatorio | null>(null)

const confirmOpen = ref(false)
const deletingPrecatorio = ref<Precatorio | null>(null)
const deleting = ref(false)

interface CompradorGroup {
  comprador: string
  porOrigem: Partial<Record<OrigemPrecatorio, Precatorio[]>>
}

const SEM_COMPRADOR = 'Sem comprador'

const groups = computed<CompradorGroup[]>(() => {
  const byComprador = new Map<string, Precatorio[]>()
  for (const item of items.value) {
    const key = item.comprador?.trim() || SEM_COMPRADOR
    const list = byComprador.get(key) ?? []
    list.push(item)
    byComprador.set(key, list)
  }

  return Array.from(byComprador.entries())
    .sort(([a], [b]) => {
      if (a === SEM_COMPRADOR) return 1
      if (b === SEM_COMPRADOR) return -1
      return a.localeCompare(b, 'pt-BR')
    })
    .map(([comprador, compradorItems]) => {
      const porOrigem: Partial<Record<OrigemPrecatorio, Precatorio[]>> = {}
      for (const item of compradorItems) {
        const list = porOrigem[item.origem] ?? []
        list.push(item)
        porOrigem[item.origem] = list
      }
      return { comprador, porOrigem }
    })
})

async function loadPrecatorios(): Promise<void> {
  loading.value = true
  try {
    const response = await fetchPrecatorios({
      search: searchTerm.value.trim() || undefined,
      page: 1,
      pageSize: FETCH_ALL_PAGE_SIZE,
    })
    items.value = response.items
  } catch (error) {
    toast.error(extractErrorMessage(error, 'Não foi possível carregar os precatórios.'))
  } finally {
    loading.value = false
  }
}

let searchDebounce: ReturnType<typeof setTimeout> | undefined

function debouncedReload(): void {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => void loadPrecatorios(), 350)
}

watch(searchTerm, debouncedReload)

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
        <Plus class="h-5 w-5" aria-hidden="true" /> Novo Precatório
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

    <div v-else class="flex flex-col gap-8">
      <div v-for="group in groups" :key="group.comprador" class="flex flex-col gap-4 rounded-xl border border-slate-200 p-4">
        <h2 class="text-xl font-bold text-slate-900">{{ group.comprador }}</h2>

        <PrecatorioGroupTable
          v-for="origem in (['GDF', 'FEDERAL', 'OUTRO'] as OrigemPrecatorio[])"
          v-show="group.porOrigem[origem]?.length"
          :key="origem"
          :title="ORIGEM_LABELS[origem]"
          :items="group.porOrigem[origem] ?? []"
          :show-descricao-outro="origem === 'OUTRO'"
          @edit="openEdit"
          @delete="askDelete"
        />
      </div>
    </div>

    <!-- Mobile floating action button -->
    <button
      type="button"
      class="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg sm:hidden"
      aria-label="Novo Precatório"
      @click="openCreate"
    >
      <Plus class="h-7 w-7" aria-hidden="true" />
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
