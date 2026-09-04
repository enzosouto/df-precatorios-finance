<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { extractErrorMessage } from '@/api/client'
import { useToast } from '@/composables/useToast'
import { formatAmountForInput, normalizeAmountInput } from '@/utils/format'
import { validatePrecatorioForm, hasErrors, type PrecatorioFormErrors } from '@/utils/validation'
import type { Precatorio } from '@/types'

const props = defineProps<{
  open: boolean
  precatorio?: Precatorio | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', payload: { mode: 'create' | 'edit' }): void
}>()

const toast = useToast()

const isEdit = computed(() => !!props.precatorio)

const form = reactive({
  cedente: '',
  valorAtualizado: '',
  valorVendido: '',
  valorPago: '',
  comissoes: [] as string[],
  tipoDocumento: '' as 'PROCURACAO' | 'ESCRITURA' | '',
  numeroDocumento: '',
  livro: '',
  folha: '',
  origem: '' as 'GDF' | 'FEDERAL' | 'OUTRO' | '',
  origemOutro: '',
  comprador: '',
})

const errors = ref<PrecatorioFormErrors>({})
const submitting = ref(false)

function resetForm(): void {
  if (props.precatorio) {
    form.cedente = props.precatorio.cedente
    form.valorAtualizado = formatAmountForInput(props.precatorio.valorAtualizado)
    form.valorVendido = formatAmountForInput(props.precatorio.valorVendido)
    form.valorPago = formatAmountForInput(props.precatorio.valorPago)
    form.comissoes = props.precatorio.comissoes.map((c) => formatAmountForInput(c))
    form.tipoDocumento = props.precatorio.tipoDocumento ?? ''
    form.numeroDocumento = props.precatorio.numeroDocumento ?? ''
    form.livro = props.precatorio.livro ?? ''
    form.folha = props.precatorio.folha ?? ''
    form.origem = props.precatorio.origem
    form.origemOutro = props.precatorio.origemOutro ?? ''
    form.comprador = props.precatorio.comprador ?? ''
  } else {
    form.cedente = ''
    form.valorAtualizado = ''
    form.valorVendido = ''
    form.valorPago = ''
    form.comissoes = []
    form.tipoDocumento = ''
    form.numeroDocumento = ''
    form.livro = ''
    form.folha = ''
    form.origem = ''
    form.origemOutro = ''
    form.comprador = ''
  }
  errors.value = {}
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) resetForm()
  },
  { immediate: true },
)

function onAmountBlur(field: 'valorAtualizado' | 'valorVendido' | 'valorPago'): void {
  const normalized = normalizeAmountInput(form[field])
  if (normalized !== '') {
    form[field] = formatAmountForInput(normalized)
  }
}

function onComissaoBlur(index: number): void {
  const normalized = normalizeAmountInput(form.comissoes[index])
  if (normalized !== '') {
    form.comissoes[index] = formatAmountForInput(normalized)
  }
}

function addComissao(): void {
  form.comissoes.push('')
}

function removeComissao(index: number): void {
  form.comissoes.splice(index, 1)
}

async function handleSubmit(): Promise<void> {
  const validationErrors = validatePrecatorioForm(form)
  errors.value = validationErrors
  if (hasErrors(validationErrors)) return

  submitting.value = true
  try {
    const normalizedVendido = normalizeAmountInput(form.valorVendido)
    const comissoes = form.comissoes
      .map((c) => normalizeAmountInput(c))
      .filter((c) => c !== '')
    const payload = {
      cedente: form.cedente.trim(),
      valorAtualizado: normalizeAmountInput(form.valorAtualizado),
      valorVendido: normalizedVendido === '' ? null : normalizedVendido,
      valorPago: normalizeAmountInput(form.valorPago),
      comissoes,
      tipoDocumento: form.tipoDocumento === '' ? null : form.tipoDocumento,
      numeroDocumento: form.numeroDocumento.trim() === '' ? null : form.numeroDocumento.trim(),
      livro: form.livro.trim() === '' ? null : form.livro.trim(),
      folha: form.folha.trim() === '' ? null : form.folha.trim(),
      origem: form.origem as 'GDF' | 'FEDERAL' | 'OUTRO',
      origemOutro: form.origem === 'OUTRO' ? form.origemOutro.trim() : null,
      comprador: form.comprador.trim() === '' ? null : form.comprador.trim(),
    }

    const { createPrecatorio, updatePrecatorio } = await import('@/api/precatorios')

    if (isEdit.value && props.precatorio) {
      await updatePrecatorio(props.precatorio.id, payload)
      toast.success('Precatório atualizado.')
      emit('saved', { mode: 'edit' })
    } else {
      await createPrecatorio(payload)
      toast.success('Precatório adicionado com sucesso.')
      emit('saved', { mode: 'create' })
    }
  } catch (error) {
    toast.error(extractErrorMessage(error, 'Não foi possível salvar o precatório.'))
  } finally {
    submitting.value = false
  }
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
            {{ isEdit ? 'Editar precatório' : 'Novo precatório' }}
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
          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-slate-600">Cedente</span>
            <input
              v-model="form.cedente"
              type="text"
              placeholder="Ex: João da Silva / Empresa XYZ Ltda"
              class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
              :class="errors.cedente ? 'border-despesa-500' : 'border-slate-300'"
            />
            <span v-if="errors.cedente" class="text-sm font-medium text-despesa-600">{{ errors.cedente }}</span>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-slate-600">Valor do Precatório</span>
            <input
              v-model="form.valorAtualizado"
              type="text"
              inputmode="decimal"
              placeholder="0,00"
              class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
              :class="errors.valorAtualizado ? 'border-despesa-500' : 'border-slate-300'"
              @blur="onAmountBlur('valorAtualizado')"
            />
            <span v-if="errors.valorAtualizado" class="text-sm font-medium text-despesa-600">{{ errors.valorAtualizado }}</span>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-slate-600">Quanto você pagou</span>
            <input
              v-model="form.valorPago"
              type="text"
              inputmode="decimal"
              placeholder="0,00"
              class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
              :class="errors.valorPago ? 'border-despesa-500' : 'border-slate-300'"
              @blur="onAmountBlur('valorPago')"
            />
            <span v-if="errors.valorPago" class="text-sm font-medium text-despesa-600">{{ errors.valorPago }}</span>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-slate-600">Por quanto vendeu (opcional)</span>
            <input
              v-model="form.valorVendido"
              type="text"
              inputmode="decimal"
              placeholder="Deixe em branco se ainda não vendeu"
              class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
              :class="errors.valorVendido ? 'border-despesa-500' : 'border-slate-300'"
              @blur="onAmountBlur('valorVendido')"
            />
            <span v-if="errors.valorVendido" class="text-sm font-medium text-despesa-600">{{ errors.valorVendido }}</span>
          </label>

          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium text-slate-600">Comissões (opcional)</span>
            <div v-for="(_, index) in form.comissoes" :key="index" class="flex items-center gap-2">
              <input
                v-model="form.comissoes[index]"
                type="text"
                inputmode="decimal"
                placeholder="0,00"
                class="min-h-[44px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-base"
                @blur="onComissaoBlur(index)"
              />
              <button
                type="button"
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-despesa-600 hover:bg-despesa-50"
                aria-label="Remover comissão"
                @click="removeComissao(index)"
              >
                ×
              </button>
            </div>
            <button
              type="button"
              class="min-h-[40px] self-start rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              @click="addComissao"
            >
              + Adicionar comissão
            </button>
            <span v-if="errors.comissoes" class="text-sm font-medium text-despesa-600">{{ errors.comissoes }}</span>
          </div>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-slate-600">Comprador (opcional)</span>
            <input
              v-model="form.comprador"
              type="text"
              placeholder="Ex: DF Precatórios Ltda"
              class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
              :class="errors.comprador ? 'border-despesa-500' : 'border-slate-300'"
            />
            <span v-if="errors.comprador" class="text-sm font-medium text-despesa-600">{{ errors.comprador }}</span>
          </label>

          <div class="flex flex-col gap-1">
            <span class="text-sm font-medium text-slate-600">Origem</span>
            <select
              v-model="form.origem"
              class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
              :class="errors.origem ? 'border-despesa-500' : 'border-slate-300'"
            >
              <option value="" disabled>Selecione</option>
              <option value="GDF">GDF</option>
              <option value="FEDERAL">Federal</option>
              <option value="OUTRO">Outro</option>
            </select>
            <span v-if="errors.origem" class="text-sm font-medium text-despesa-600">{{ errors.origem }}</span>
            <input
              v-if="form.origem === 'OUTRO'"
              v-model="form.origemOutro"
              type="text"
              placeholder="Descreva a origem"
              class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
              :class="errors.origemOutro ? 'border-despesa-500' : 'border-slate-300'"
            />
            <span v-if="errors.origemOutro" class="text-sm font-medium text-despesa-600">{{ errors.origemOutro }}</span>
          </div>

          <div class="flex flex-col gap-3 rounded-lg border border-slate-200 p-3">
            <p class="text-sm font-semibold text-slate-700">Documento (opcional)</p>
            <div class="grid grid-cols-2 gap-4">
              <label class="flex flex-col gap-1">
                <span class="text-sm font-medium text-slate-600">Tipo</span>
                <select
                  v-model="form.tipoDocumento"
                  class="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-base"
                >
                  <option value="">Nenhum</option>
                  <option value="PROCURACAO">Procuração</option>
                  <option value="ESCRITURA">Escritura</option>
                </select>
              </label>

              <label class="flex flex-col gap-1">
                <span class="text-sm font-medium text-slate-600">Número</span>
                <input
                  v-model="form.numeroDocumento"
                  type="text"
                  placeholder="Ex: 12345"
                  class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
                  :class="errors.numeroDocumento ? 'border-despesa-500' : 'border-slate-300'"
                />
              </label>
            </div>
            <span v-if="errors.numeroDocumento" class="text-sm font-medium text-despesa-600">{{ errors.numeroDocumento }}</span>
          </div>

          <div class="flex flex-col gap-3 rounded-lg border border-slate-200 p-3">
            <p class="text-sm font-semibold text-slate-700">Ato (opcional)</p>
            <div class="grid grid-cols-2 gap-4">
              <label class="flex flex-col gap-1">
                <span class="text-sm font-medium text-slate-600">Livro</span>
                <input
                  v-model="form.livro"
                  type="text"
                  placeholder="Ex: 42 ou 42A"
                  class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
                  :class="errors.folha ? 'border-despesa-500' : 'border-slate-300'"
                />
              </label>

              <label class="flex flex-col gap-1">
                <span class="text-sm font-medium text-slate-600">Folha</span>
                <input
                  v-model="form.folha"
                  type="text"
                  placeholder="Ex: 15 ou 15-17"
                  class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
                  :class="errors.folha ? 'border-despesa-500' : 'border-slate-300'"
                />
              </label>
            </div>
            <span v-if="errors.folha" class="text-sm font-medium text-despesa-600">{{ errors.folha }}</span>
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
