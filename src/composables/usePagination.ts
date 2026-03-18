import { ref, computed } from 'vue'

/**
 * Shared composable to handle pagination logic across modules
 */
export function usePagination(defaultPerPage = 20) {
  const currentPage = ref(1)
  const perPage = ref(defaultPerPage)
  const totalItems = ref(0)

  const totalPages = computed(() => {
    return Math.ceil(totalItems.value / perPage.value)
  })

  const next = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }

  const prev = () => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  const setPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  return {
    currentPage,
    perPage,
    totalItems,
    totalPages,
    next,
    prev,
    setPage
  }
}
