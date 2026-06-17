import { ref } from "vue";

const toasts = ref([]);
let idCounter = 0;

export function useToast() {
  function show(message, type = "info", duration = 4000) {
    const id = ++idCounter;
    toasts.value.push({ id, message, type });
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }

  function dismiss(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return {
    toasts,
    success: (msg) => show(msg, "success"),
    error: (msg) => show(msg, "error", 6000),
    warn: (msg) => show(msg, "warn", 5000),
    dismiss,
  };
}
