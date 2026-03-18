import { ref, watch, onMounted } from 'vue'

/**
 * Shared composable to easily bind a ref to localStorage
 * @param key LocalStorage Key
 * @param defaultValue Default value if not found
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const data = ref<T>(defaultValue)

  const read = () => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        data.value = JSON.parse(item)
      }
    } catch (e) {
      console.error(`Error reading localStorage key "${key}":`, e)
    }
  }

  const write = () => {
    try {
      window.localStorage.setItem(key, JSON.stringify(data.value))
    } catch (e) {
      console.error(`Error writing localStorage key "${key}":`, e)
    }
  }

  onMounted(() => {
    read()
  })

  watch(data, () => {
    write()
  }, { deep: true })

  return {
    data,
    read,
    write
  }
}
