<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Plus, Landmark, Scale, TrendingUp, TrendingDown } from 'lucide-vue-next'
import { fetchDashboardSummary } from '@/api/dashboard'
import { extractErrorMessage } from '@/api/client'
import { usePeriod } from '@/composables/usePeriod'
import { useToast } from '@/composables/useToast'
import { formatCurrency, parseIsoDate } from '@/utils/format'
import PeriodSelector from '@/components/PeriodSelector.vue'
import SummaryCard from '@/components/SummaryCard.vue'
import TransactionModal from '@/components/TransactionModal.vue'
import type { DashboardSummary, Socio } from '@/types'

const SOCIO_LABELS: Record<Socio, string> = {
  CHIQUINHO: 'Chiquinho',
  FILIPI: 'Filipi',
  LOMAR: 'Lomar',
}

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

    <div v-if="loading" class="rounded-xl bg-white p-6 text-center text-slate-500 shadow-sm">Carregando…</div>

    <template v-else-if="summary">
      <div v-if="!summary.hasAnyTransactions" class="rounded-xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
        <p class="text-lg font-semibold text-slate-700">Nenhuma movimentação registrada ainda.</p>
        <p class="mt-1 text-base text-slate-500">Comece cadastrando sua primeira receita ou despesa.</p>
        <button
          type="button"
          class="mt-4 flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-base font-semibold text-white hover:bg-brand-700"
          @click="modalOpen = true"
        >
          <Plus class="h-5 w-5" aria-hidden="true" /> Nova movimentação
        </button>
      </div>
      <div v-else class="flex flex-col gap-6">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SummaryCard label="Caixa total" :value="summary.caixaTotal" tone="neutral" :icon="Landmark" />
          <SummaryCard label="Saldo do período" :value="summary.saldoPeriodo" tone="neutral" :icon="Scale" />
          <SummaryCard label="Receitas do período" :value="summary.receitasPeriodo" tone="receita" :icon="TrendingUp" />
          <SummaryCard label="Despesas do período" :value="summary.despesasPeriodo" tone="despesa" :icon="TrendingDown" />
        </div>

        <div class="overflow-x-auto rounded-xl bg-white shadow-sm">
          <h2 class="p-4 pb-0 text-lg font-bold text-slate-800">Divisão por sócio (período)</h2>
          <table class="w-full min-w-[500px] table-auto border-collapse text-sm">
            <thead>
              <tr class="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th class="px-4 py-3">Sócio</th>
                <th class="px-4 py-3 text-right">Receitas</th>
                <th class="px-4 py-3 text-right">Despesas</th>
                <th class="px-4 py-3 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in summary.porSocio" :key="item.socio" class="border-b border-slate-100">
                <td class="px-4 py-3 font-semibold text-slate-900">{{ SOCIO_LABELS[item.socio] }}</td>
                <td class="px-4 py-3 text-right text-receita-700">{{ formatCurrency(item.receitas) }}</td>
                <td class="px-4 py-3 text-right text-despesa-700">{{ formatCurrency(item.despesas) }}</td>
                <td class="px-4 py-3 text-right font-semibold text-slate-900">{{ formatCurrency(item.saldo) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-slate-50 font-semibold text-slate-700">
                <td class="px-4 py-3">Cota igual (total ÷ 3)</td>
                <td class="px-4 py-3 text-right">{{ formatCurrency(summary.cotaIgualPeriodo.receitas) }}</td>
                <td class="px-4 py-3 text-right">{{ formatCurrency(summary.cotaIgualPeriodo.despesas) }}</td>
                <td class="px-4 py-3 text-right">{{ formatCurrency(summary.cotaIgualPeriodo.saldo) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>

    <!-- Mobile floating action button -->
    <button
      type="button"
      class="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg sm:hidden"
      aria-label="Nova movimentação"
      @click="modalOpen = true"
    >
      <Plus class="h-7 w-7" aria-hidden="true" />
    </button>

    <TransactionModal :open="modalOpen" @close="modalOpen = false" @saved="handleSaved" />
  </div>
</template>
