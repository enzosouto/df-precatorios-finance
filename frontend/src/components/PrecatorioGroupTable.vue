<script setup lang="ts">
import { computed } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { formatCurrency, formatSignedAmount, parseAmount } from '@/utils/format'
import type { Precatorio } from '@/types'

const props = defineProps<{
  title: string
  items: Precatorio[]
  showDescricaoOutro?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', precatorio: Precatorio): void
  (e: 'delete', precatorio: Precatorio): void
}>()

function formatPercent(value: string | null): string {
  if (value === null) return '—'
  return `${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

function sumComissoes(precatorio: Precatorio): number {
  return precatorio.comissoes.reduce((sum, c) => sum + parseAmount(c), 0)
}

const DOCUMENTO_LABELS: Record<string, string> = { PROCURACAO: 'Procuração', ESCRITURA: 'Escritura' }

function formatDocumento(precatorio: Precatorio): string {
  if (!precatorio.tipoDocumento || !precatorio.numeroDocumento) return '—'
  return `${DOCUMENTO_LABELS[precatorio.tipoDocumento]} nº ${precatorio.numeroDocumento}`
}

function formatAto(precatorio: Precatorio): string {
  if (!precatorio.livro || !precatorio.folha) return '—'
  return `Livro ${precatorio.livro}, Folha ${precatorio.folha}`
}

const totals = computed(() =>
  props.items.reduce(
    (sum, item) => ({
      valorAtualizado: sum.valorAtualizado + parseAmount(item.valorAtualizado),
      valorPago: sum.valorPago + parseAmount(item.valorPago),
      valorVendido: sum.valorVendido + parseAmount(item.valorVendido),
      comissoes: sum.comissoes + sumComissoes(item),
      lucro: sum.lucro + parseAmount(item.lucro),
    }),
    { valorAtualizado: 0, valorPago: 0, valorVendido: 0, comissoes: 0, lucro: 0 }
  )
)

const lucroPorSocio = computed(() => totals.value.lucro / 3)
</script>

<template>
  <div class="flex flex-col gap-2">
    <h3 class="text-base font-bold text-slate-800">{{ title }} <span class="font-normal text-slate-500">({{ items.length }})</span></h3>
    <div class="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table class="w-full min-w-[1300px] table-auto border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th class="px-3 py-3">Titular do Precatório</th>
            <th class="px-3 py-3 text-right">Valor do Precatório</th>
            <th class="px-3 py-3 text-right">Pago</th>
            <th class="px-3 py-3 text-right">% Pago</th>
            <th class="px-3 py-3 text-right">Vendido</th>
            <th class="px-3 py-3 text-right">% Vendido</th>
            <th class="px-3 py-3 text-right">Comissão</th>
            <th class="px-3 py-3 text-right">Lucro</th>
            <th class="px-3 py-3">Documento</th>
            <th class="px-3 py-3">Ato</th>
            <th v-if="showDescricaoOutro" class="px-3 py-3">Descrição</th>
            <th class="px-3 py-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="precatorio in items" :key="precatorio.id" class="border-b border-slate-100">
            <td class="px-3 py-3 font-semibold text-slate-900">{{ precatorio.cedente }}</td>
            <td class="px-3 py-3 text-right text-slate-900">{{ formatCurrency(precatorio.valorAtualizado) }}</td>
            <td class="px-3 py-3 text-right text-slate-900">{{ formatCurrency(precatorio.valorPago) }}</td>
            <td class="px-3 py-3 text-right text-slate-600">{{ formatPercent(precatorio.percentualPago) }}</td>
            <td class="px-3 py-3 text-right text-slate-900">{{ precatorio.valorVendido ? formatCurrency(precatorio.valorVendido) : '—' }}</td>
            <td class="px-3 py-3 text-right text-slate-600">{{ formatPercent(precatorio.percentualVendido) }}</td>
            <td class="px-3 py-3 text-right text-slate-600">
              {{ precatorio.comissoes.length ? formatCurrency(sumComissoes(precatorio)) : '—' }}
            </td>
            <td class="px-3 py-3 text-right font-semibold text-slate-900">
              {{ precatorio.lucro !== null ? formatSignedAmount(precatorio.lucro) : '—' }}
            </td>
            <td class="px-3 py-3 text-slate-600">{{ formatDocumento(precatorio) }}</td>
            <td class="px-3 py-3 text-slate-600">{{ formatAto(precatorio) }}</td>
            <td v-if="showDescricaoOutro" class="px-3 py-3 text-slate-600">{{ precatorio.origemOutro || '—' }}</td>
            <td class="px-3 py-3">
              <div class="flex justify-center gap-1">
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                  aria-label="Editar precatório"
                  @click="emit('edit', precatorio)"
                >
                  <Pencil class="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-lg text-despesa-600 hover:bg-despesa-50"
                  aria-label="Excluir precatório"
                  @click="emit('delete', precatorio)"
                >
                  <Trash2 class="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-900">
            <td class="px-3 py-3">Total</td>
            <td class="px-3 py-3 text-right">{{ formatCurrency(totals.valorAtualizado) }}</td>
            <td class="px-3 py-3 text-right">{{ formatCurrency(totals.valorPago) }}</td>
            <td class="px-3 py-3"></td>
            <td class="px-3 py-3 text-right">{{ formatCurrency(totals.valorVendido) }}</td>
            <td class="px-3 py-3"></td>
            <td class="px-3 py-3 text-right">{{ formatCurrency(totals.comissoes) }}</td>
            <td class="px-3 py-3 text-right">{{ formatSignedAmount(totals.lucro) }}</td>
            <td class="px-3 py-3"></td>
            <td class="px-3 py-3"></td>
            <td v-if="showDescricaoOutro" class="px-3 py-3"></td>
            <td class="px-3 py-3"></td>
          </tr>
          <tr class="bg-brand-50/60 font-semibold text-slate-700">
            <td class="px-3 py-2" colspan="7">Lucro por sócio (÷3)</td>
            <td class="px-3 py-2 text-right">{{ formatSignedAmount(lucroPorSocio) }}</td>
            <td class="px-3 py-2"></td>
            <td class="px-3 py-2"></td>
            <td v-if="showDescricaoOutro" class="px-3 py-2"></td>
            <td class="px-3 py-2"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>
