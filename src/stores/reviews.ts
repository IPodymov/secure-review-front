import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CodeReview, CreateReviewInput } from '@/types'
import { reviewsApi } from '@/api'

export const useReviewStore = defineStore('review', () => {
  const reviews = ref<CodeReview[]>([])
  const currentReview = ref<CodeReview | null>(null)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
  const hasMore = computed(() => currentPage.value < totalPages.value)

  // Get review stats
  const stats = computed(() => {
    const criticalCount = reviews.value.reduce((acc, r) => 
      acc + (r.security_issues?.filter(i => i.severity === 'critical').length || 0), 0)
    const highCount = reviews.value.reduce((acc, r) => 
      acc + (r.security_issues?.filter(i => i.severity === 'high').length || 0), 0)
    const completedCount = reviews.value.filter(r => r.status === 'completed').length
    const pendingCount = reviews.value.filter(r => r.status === 'pending' || r.status === 'processing').length
    
    return { criticalCount, highCount, completedCount, pendingCount }
  })

  // Actions
  async function fetchReviews(page: number = 1) {
    isLoading.value = true
    error.value = null
    try {
      const response = await reviewsApi.getList(page, pageSize.value)
      reviews.value = response.reviews || []
      total.value = response.total
      currentPage.value = response.page
      return true
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Ошибка загрузки reviews'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function fetchReview(id: string) {
    isLoading.value = true
    error.value = null
    try {
      currentReview.value = await reviewsApi.getById(id)
      return true
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Review не найден'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function createReview(input: CreateReviewInput) {
    isLoading.value = true
    error.value = null
    try {
      const review = await reviewsApi.create(input)
      reviews.value.unshift(review)
      currentReview.value = review
      return review
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Ошибка создания review'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function deleteReview(id: string) {
    isLoading.value = true
    error.value = null
    try {
      await reviewsApi.delete(id)
      reviews.value = reviews.value.filter(r => r.id !== id)
      if (currentReview.value?.id === id) {
        currentReview.value = null
      }
      return true
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Ошибка удаления review'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function reanalyzeReview(id: string) {
    isLoading.value = true
    error.value = null
    try {
      const review = await reviewsApi.reanalyze(id)
      // Update in list
      const index = reviews.value.findIndex(r => r.id === id)
      if (index !== -1) {
        reviews.value[index] = review
      }
      if (currentReview.value?.id === id) {
        currentReview.value = review
      }
      return review
    } catch (e: any) {
      error.value = e.response?.data?.error || 'Ошибка повторного анализа'
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Poll for review status updates
  async function pollReviewStatus(id: string, maxAttempts: number = 30) {
    let attempts = 0
    const poll = async () => {
      if (attempts >= maxAttempts) return
      attempts++
      
      const review = await reviewsApi.getById(id)
      
      // Update in list
      const index = reviews.value.findIndex(r => r.id === id)
      if (index !== -1) {
        reviews.value[index] = review
      }
      if (currentReview.value?.id === id) {
        currentReview.value = review
      }
      
      // Continue polling if still processing
      if (review.status === 'pending' || review.status === 'processing') {
        setTimeout(poll, 2000) // Poll every 2 seconds
      }
    }
    
    await poll()
  }

  function clearCurrentReview() {
    currentReview.value = null
  }

  return {
    // State
    reviews,
    currentReview,
    total,
    currentPage,
    pageSize,
    isLoading,
    error,
    
    // Getters
    totalPages,
    hasMore,
    stats,
    
    // Actions
    fetchReviews,
    fetchReview,
    createReview,
    deleteReview,
    reanalyzeReview,
    pollReviewStatus,
    clearCurrentReview,
  }
})
