<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { TrendingUp, TrendingDown, Scale } from 'lucide-vue-next'
import { fetchReports } from '@/api/reports'
import { extractErrorMessage } from '@/api/client'
import { usePeriod } from '@/composables/usePeriod'
import { useToast } from '@/composables/useToast'
import PeriodSelector from '@/components/PeriodSelector.vue'
import SummaryCard from '@/components/SummaryCard.vue'
import { formatCurrency, monthKeyToShortLabel, parseAmount, parseIsoDate } from '@/utils/format'
import type { ReportsResponse, Socio } from '@/types'

const SOCIO_LABELS: Record<Socio, string> = {
  CHIQUINHO: 'Chiquinho',
  FILIPI: 'Filipi',
  LOMAR: 'Lomar',
}

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const period = usePeriod('ano')
const toast = useToast()

const report = ref<ReportsResponse | null>(null)
const loading = ref(false)

async function loadReport(): Promise<void> {
  loading.value = true
  try {
    report.value = await fetchReports(period.range.value)
  } catch (error) {
    toast.error(extractErrorMessage(error, 'Não foi possível carregar os relatórios.'))
  } finally {
    loading.value = false
  }
}

watch(period.range, () => void loadReport())

onMounted(() => void loadReport())

const chartData = computed(() => {
  const monthly = report.value?.monthly ?? []
  return {
    labels: monthly.map((entry) => monthKeyToShortLabel(entry.month)),
    datasets: [
      {
        label: 'Receitas',
        backgroundColor: '#16a34a',
        data: monthly.map((entry) => parseAmount(entry.receitas)),
      },
      {
        label: 'Despesas',
        backgroundColor: '#b3413f',
        data: monthly.map((entry) => parseAmount(entry.despesas)),
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const },
    title: { display: false },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: string | number) => formatCurrency(Number(value)),
      },
    },
  },
}

const hasMonthlyData = computed(() => (report.value?.monthly?.length ?? 0) > 0)
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold text-slate-900">Relatórios</h1>

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

    <template v-else-if="report">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Receitas" :value="report.receitas" tone="receita" :icon="TrendingUp" />
        <SummaryCard label="Despesas" :value="report.despesas" tone="despesa" :icon="TrendingDown" />
        <SummaryCard label="Saldo" :value="report.saldo" tone="neutral" :icon="Scale" />
      </div>

      <div class="rounded-xl bg-white p-4 shadow-sm">
        <h2 class="mb-4 text-lg font-bold text-slate-800">Receitas x Despesas por mês</h2>
        <div v-if="hasMonthlyData" class="h-80">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
        <p v-else class="py-8 text-center text-base text-slate-500">Sem dados suficientes para exibir o gráfico.</p>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="rounded-xl bg-white p-4 shadow-sm">
          <h2 class="mb-3 text-lg font-bold text-slate-800">Top categorias de despesa</h2>
          <ul v-if="report.topDespesaCategorias.length" class="flex flex-col gap-2">
            <li
              v-for="cat in report.topDespesaCategorias"
              :key="cat.categoryName"
              class="flex items-center justify-between rounded-lg bg-despesa-50 px-3 py-2"
            >
              <span class="text-base font-medium text-slate-700">{{ cat.categoryName }}</span>
              <span class="text-base font-bold text-despesa-700">{{ formatCurrency(cat.total) }}</span>
            </li>
          </ul>
          <p v-else class="text-base text-slate-500">Nenhuma despesa no período.</p>
        </div>

        <div class="rounded-xl bg-white p-4 shadow-sm">
          <h2 class="mb-3 text-lg font-bold text-slate-800">Top categorias de receita</h2>
          <ul v-if="report.topReceitaCategorias.length" class="flex flex-col gap-2">
            <li
              v-for="cat in report.topReceitaCategorias"
              :key="cat.categoryName"
              class="flex items-center justify-between rounded-lg bg-receita-50 px-3 py-2"
            >
              <span class="text-base font-medium text-slate-700">{{ cat.categoryName }}</span>
              <span class="text-base font-bold text-receita-700">{{ formatCurrency(cat.total) }}</span>
            </li>
          </ul>
          <p v-else class="text-base text-slate-500">Nenhuma receita no período.</p>
        </div>
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
            <tr v-for="item in report.porSocio" :key="item.socio" class="border-b border-slate-100">
              <td class="px-4 py-3 font-semibold text-slate-900">{{ SOCIO_LABELS[item.socio] }}</td>
              <td class="px-4 py-3 text-right text-receita-700">{{ formatCurrency(item.receitas) }}</td>
              <td class="px-4 py-3 text-right text-despesa-700">{{ formatCurrency(item.despesas) }}</td>
              <td class="px-4 py-3 text-right font-semibold text-slate-900">{{ formatCurrency(item.saldo) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-slate-50 font-semibold text-slate-700">
              <td class="px-4 py-3">Cota igual (total ÷ 3)</td>
              <td class="px-4 py-3 text-right">{{ formatCurrency(report.cotaIgual.receitas) }}</td>
              <td class="px-4 py-3 text-right">{{ formatCurrency(report.cotaIgual.despesas) }}</td>
              <td class="px-4 py-3 text-right">{{ formatCurrency(report.cotaIgual.saldo) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>
  </div>
</template>
