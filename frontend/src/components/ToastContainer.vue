<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

const kindClasses: Record<string, string> = {
  success: 'border-receita-500 bg-receita-50 text-receita-700',
  error: 'border-despesa-500 bg-despesa-50 text-despesa-700',
  info: 'border-brand-500 bg-brand-50 text-brand-700',
}
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-3 p-4 sm:items-end">
    <TransitionGroup name="toast" tag="div" class="flex w-full flex-col items-center gap-3 sm:items-end">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex w-full max-w-sm items-start justify-between gap-3 rounded-xl border-2 px-5 py-4 text-base font-medium shadow-lg"
        :class="kindClasses[toast.kind]"
        role="status"
      >
        <span>{{ toast.message }}</span>
        <button
          type="button"
          class="shrink-0 text-xl leading-none opacity-60 hover:opacity-100"
          aria-label="Fechar aviso"
          @click="dismiss(toast.id)"
        >
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
