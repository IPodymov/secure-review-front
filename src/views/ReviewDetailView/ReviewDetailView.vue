<template>
  <div class="review-detail-page">
    <!-- Loading State -->
    <div v-if="reviewStore.isLoading && !review" class="review-detail-loading">
      <BaseLoader text="Загрузка review..." />
    </div>

    <!-- Error State -->
    <div v-else-if="reviewStore.error && !review" class="review-detail-error">
      <BaseAlert variant="error">
        {{ reviewStore.error }}
      </BaseAlert>
      <router-link to="/reviews">
        <BaseButton variant="secondary">Вернуться к списку</BaseButton>
      </router-link>
    </div>

    <!-- Review Content -->
    <template v-else-if="review">
      <div class="review-detail-header">
        <router-link to="/reviews" class="review-detail-header__back">
          <ArrowLeft :size="20" />
          Назад к списку
        </router-link>

        <div class="review-detail-header__main">
          <div>
            <h1 class="review-detail-header__title">{{ review.title }}</h1>
            <div class="review-detail-header__meta">
              <BaseBadge variant="default">{{ review.language }}</BaseBadge>
              <BaseBadge :variant="getStatusVariant(review.status)">
                {{ getStatusLabel(review.status) }}
              </BaseBadge>
              <span class="review-detail-header__date">
                {{ formatDate(review.created_at) }}
              </span>
            </div>
          </div>
          <div class="review-detail-header__actions">
            <BaseButton
              v-if="review.status === 'completed' || review.status === 'failed'"
              variant="secondary"
              :loading="reviewStore.isReanalyzing"
              @click="handleReanalyze"
            >
              <RefreshCw :size="16" />
              Перезапустить
            </BaseButton>
            <BaseButton
              variant="danger"
              @click="handleDelete"
              :loading="reviewStore.isDeleting"
            >
              <Trash2 :size="16" />
            </BaseButton>
        </div>
      </div>

      <!-- Processing Status -->
      <BaseCard v-if="review.status === 'pending' || review.status === 'processing'" class="review-processing">
        <div class="review-processing__content">
          <BaseLoader size="lg" />
          <div>
            <h3>Анализ кода в процессе...</h3>
            <p>AI анализирует ваш код на безопасность и качество. Это может занять несколько секунд.</p>
          </div>
        </div>
      </BaseCard>

      <!-- Security Issues -->
      <BaseCard v-if="review.security_issues?.length" class="review-issues">
        <template #header>
          <div class="review-issues__header">
            <h2>Найденные про��лемы ({{ review.security_issues.length }})</h2>
            <div class="review-issues__summary">
              <span
                v-for="summary in issuesSummary"
                :key="summary.type"
                :class="['review-issues__count', `review-issues__count--${summary.type}`]"
              >
                {{ summary.count }} {{ summary.label }}
              </span>
            </div>
          </div>
        </template>

        <div class="review-issues__list">
          <div
            v-for="issue in review.security_issues"
            :key="issue.id"
            :class="['security-issue', `security-issue--${issue.severity}`]"
          >
            <div class="security-issue__header">
              <BaseBadge :variant="issue.severity" size="sm">
                {{ issue.severity.toUpperCase() }}
              </BaseBadge>
              <h3 class="security-issue__title">{{ issue.title }}</h3>
              <span v-if="issue.cwe" class="security-issue__cwe">{{ issue.cwe }}</span>
            </div>

            <p class="security-issue__description">{{ issue.description }}</p>

            <div v-if="issue.line_start" class="security-issue__location">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Строки {{ issue.line_start }}<span v-if="issue.line_end !== issue.line_start"> - {{ issue.line_end }}</span>
            </div>

            <div class="security-issue__suggestion">
              <h4>Рекомендация:</h4>
              <p>{{ issue.suggestion }}</p>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- No Issues Found -->
      <BaseCard v-else-if="review.status === 'completed'" class="review-success">
        <div class="review-success__content">
          <CheckCircle :size="64" :stroke-width="1.5" />
          <h2>Отлично! Проблем не найдено</h2>
          <p>AI не обнаружил серьезных проблем безопасности в вашем коде.</p>
        </div>
      </BaseCard>

      <!-- Source Code -->
      <BaseCard title="Исходный код">
        <pre class="review-code">{{ review.code }}</pre>
      </BaseCard>
      </div> <!-- Close review-detail-header -->
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReviewStore } from '@/stores'
import type { ReviewStatus, SecuritySeverity } from '@/types'
import { BaseCard, BaseBadge, BaseButton, BaseLoader, BaseAlert } from '@/components/ui'
import { ArrowLeft, RefreshCw, Trash2, CheckCircle } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const reviewStore = useReviewStore()

const review = computed(() => reviewStore.currentReview)

const issuesSummary = computed(() => {
  if (!review.value?.security_issues) return []

  const counts: Record<SecuritySeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  }

  review.value.security_issues.forEach(issue => {
    counts[issue.severity]++
  })

  const labels: Record<SecuritySeverity, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    info: 'Info',
  }

  return Object.entries(counts)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({
      type: type as SecuritySeverity,
      count,
      label: labels[type as SecuritySeverity],
    }))
})

onMounted(() => {
  const id = route.params.id as string
  reviewStore.fetchReview(id)
})

// Watch for status changes to poll
watch(() => review.value?.status, (status) => {
  if (status === 'pending' || status === 'processing') {
    reviewStore.pollReviewStatus(route.params.id as string)
  }
})

onUnmounted(() => {
  reviewStore.clearCurrentReview()
})

function getStatusVariant(status: ReviewStatus): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  const variants: Record<ReviewStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
    pending: 'default',
    processing: 'primary',
    completed: 'success',
    failed: 'danger',
  }
  return variants[status]
}

function getStatusLabel(status: ReviewStatus): string {
  const labels: Record<ReviewStatus, string> = {
    pending: 'Ожидает',
    processing: 'Анализ...',
    completed: 'Завершен',
    failed: 'Ошибка',
  }
  return labels[status]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}


async function handleReanalyze() {
  const id = route.params.id as string
  await reviewStore.reanalyzeReview(id)
  if (review.value?.status === 'pending' || review.value?.status === 'processing') {
    reviewStore.pollReviewStatus(id)
  }
}

async function handleDelete() {
  if (confirm('Вы уверены, что хотите удалить этот review?')) {
    const id = route.params.id as string
    const success = await reviewStore.deleteReview(id)
    if (success) {
      router.push('/reviews')
    }
  }
}
</script>

<style scoped src="./ReviewDetailView.styles.css"></style>
