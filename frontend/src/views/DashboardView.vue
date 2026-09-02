<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { fetchDashboardSummary } from '@/api/dashboard'
import { extractErrorMessage } from '@/api/client'
import { usePeriod } from '@/composables/usePeriod'
import { useToast } from '@/composables/useToast'
import PeriodSelector from '@/components/PeriodSelector.vue'
import SummaryCard from '@/components/SummaryCard.vue'
import TransactionModal from '@/components/TransactionModal.vue'
import type { DashboardSummary } from '@/types'

const period = usePeriod('mes')
const toast = useToast()

const summary = ref<DashboardSummary | null>(null)
const loading = ref(false)
const modalOpen = ref(false)

async function loadSummary(): Promise<void> {
  loading.value = true
  try {
    summary.value = await fetchDashboardSummary(period.range.value)
  } catch (error) {
    toast.error(extractErrorMessage(error, 'Não foi possível carregar o resumo.'))
  } finally {
    loading.value = false
  }
}

watch(period.range, () => {
  void loadSummary()
})

onMounted(() => {
  void loadSummary()
})

function handleSaved(): void {
  modalOpen.value = false
  void loadSummary()
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">Dashboard</h1>
      <button
        type="button"
        class="hidden min-h-[44px] items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-base font-semibold text-white hover:bg-brand-700 sm:flex"
        @click="modalOpen = true"
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

    <div v-if="loading" class="rounded-xl bg-white p-6 text-center text-slate-500 shadow-sm">Carregando…</div>

    <template v-else-if="summary">
      <div v-if="!summary.hasAnyTransactions" class="rounded-xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
        <p class="text-lg font-semibold text-slate-700">Nenhuma movimentação registrada ainda.</p>
        <p class="mt-1 text-base text-slate-500">Comece cadastrando sua primeira receita ou despesa.</p>
        <button
          type="button"
          class="mt-4 min-h-[44px] rounded-lg bg-brand-600 px-4 py-2 text-base font-semibold text-white hover:bg-brand-700"
          @click="modalOpen = true"
        >
          + Nova movimentação
        </button>
      </div>
      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard label="Caixa total" :value="summary.caixaTotal" tone="neutral" icon="🏦" />
        <SummaryCard label="Saldo do período" :value="summary.saldoPeriodo" tone="neutral" icon="⚖️" />
        <SummaryCard label="Receitas do período" :value="summary.receitasPeriodo" tone="receita" icon="⬆️" />
        <SummaryCard label="Despesas do período" :value="summary.despesasPeriodo" tone="despesa" icon="⬇️" />
      </div>
    </template>

    <!-- Mobile floating action button -->
    <button
      type="button"
      class="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-3xl text-white shadow-lg sm:hidden"
      aria-label="Nova movimentação"
      @click="modalOpen = true"
    >
      +
    </button>

    <TransactionModal :open="modalOpen" @close="modalOpen = false" @saved="handleSaved" />
  </div>
</template>
