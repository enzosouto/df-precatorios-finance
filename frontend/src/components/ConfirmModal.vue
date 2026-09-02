<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
    loading?: boolean
  }>(),
  {
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    danger: false,
    loading: false,
  },
)

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="props.open" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-black/50" @click="!props.loading && emit('cancel')"></div>
      <div class="relative w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <h2 class="text-lg font-bold text-slate-900">{{ props.title }}</h2>
        <p class="mt-2 text-base text-slate-600">{{ props.message }}</p>
        <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50"
            :disabled="props.loading"
            @click="emit('cancel')"
          >
            {{ props.cancelLabel }}
          </button>
          <button
            type="button"
            class="min-h-[44px] rounded-lg px-4 py-2 text-base font-semibold text-white disabled:opacity-60"
            :class="props.danger ? 'bg-despesa-600 hover:bg-despesa-700' : 'bg-brand-600 hover:bg-brand-700'"
            :disabled="props.loading"
            @click="emit('confirm')"
          >
            {{ props.loading ? 'Aguarde…' : props.confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
