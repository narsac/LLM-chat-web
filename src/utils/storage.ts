import { ref, watch } from 'vue';

export function useStorage<T>(key: string, defaultValue: T) {
  const storedValue = localStorage.getItem(key);
  let initialValue: T;

  try {
    initialValue = storedValue ? JSON.parse(storedValue) : defaultValue;
  } catch {
    initialValue = defaultValue;
  }

  const value = ref<T>(initialValue);

  watch(value, (newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue));
  }, { deep: true });

  return value;
}