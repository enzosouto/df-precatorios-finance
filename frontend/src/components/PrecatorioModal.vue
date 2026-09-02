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
  valorOriginal: '',
  valorAtualizado: '',
  valorPago: '',
})

const errors = ref<PrecatorioFormErrors>({})
const submitting = ref(false)

function resetForm(): void {
  if (props.precatorio) {
    form.cedente = props.precatorio.cedente
    form.valorOriginal = formatAmountForInput(props.precatorio.valorOriginal)
    form.valorAtualizado = formatAmountForInput(props.precatorio.valorAtualizado)
    form.valorPago = formatAmountForInput(props.precatorio.valorPago)
  } else {
    form.cedente = ''
    form.valorOriginal = ''
    form.valorAtualizado = ''
    form.valorPago = ''
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

function onAmountBlur(field: 'valorOriginal' | 'valorAtualizado' | 'valorPago'): void {
  const normalized = normalizeAmountInput(form[field])
  if (normalized !== '') {
    form[field] = formatAmountForInput(normalized)
  }
}

async function handleSubmit(): Promise<void> {
  const validationErrors = validatePrecatorioForm(form)
  errors.value = validationErrors
  if (hasErrors(validationErrors)) return

  submitting.value = true
  try {
    const normalizedPago = normalizeAmountInput(form.valorPago)
    const payload = {
      cedente: form.cedente.trim(),
      valorOriginal: normalizeAmountInput(form.valorOriginal),
      valorAtualizado: normalizeAmountInput(form.valorAtualizado),
      valorPago: normalizedPago === '' ? null : normalizedPago,
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
            <span class="text-sm font-medium text-slate-600">Valor Original</span>
            <input
              v-model="form.valorOriginal"
              type="text"
              inputmode="decimal"
              placeholder="0,00"
              class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
              :class="errors.valorOriginal ? 'border-despesa-500' : 'border-slate-300'"
              @blur="onAmountBlur('valorOriginal')"
            />
            <span v-if="errors.valorOriginal" class="text-sm font-medium text-despesa-600">{{ errors.valorOriginal }}</span>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-slate-600">Valor Atualizado</span>
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
            <span class="text-sm font-medium text-slate-600">Valor Pago</span>
            <input
              v-model="form.valorPago"
              type="text"
              inputmode="decimal"
              placeholder="Deixe em branco se ainda não foi pago"
              class="min-h-[44px] rounded-lg border px-3 py-2 text-base"
              :class="errors.valorPago ? 'border-despesa-500' : 'border-slate-300'"
              @blur="onAmountBlur('valorPago')"
            />
            <span v-if="errors.valorPago" class="text-sm font-medium text-despesa-600">{{ errors.valorPago }}</span>
          </label>

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
