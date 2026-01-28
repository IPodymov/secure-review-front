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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Перезапустить
            </BaseButton>
            <BaseButton
              variant="danger"
              @click="handleDelete"
              :loading="reviewStore.isDeleting"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Удалить
            </BaseButton>
          </div>
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
            <h2>Найденные проблемы ({{ review.security_issues.length }})</h2>
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
            
            <div v-if="issue.suggestion" class="security-issue__suggestion">
              <h4>💡 Рекомендация:</h4>
              <p>{{ issue.suggestion }}</p>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- No Issues Found -->
      <BaseCard v-else-if="review.status === 'completed'" class="review-success">
        <div class="review-success__content">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h2>Отлично! Проблем не найдено</h2>
          <p>AI не обнаружил серьезных проблем безопасности в вашем коде.</p>
        </div>
      </BaseCard>

      <!-- Analysis Result -->
      <BaseCard v-if="review.result && review.status === 'completed'" title="Результат анализа">
        <div class="review-result">
          <pre>{{ formatResult(review.result) }}</pre>
        </div>
      </BaseCard>

      <!-- Source Code -->
      <BaseCard title="Исходный код">
        <pre class="review-code">{{ review.code }}</pre>
      </BaseCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReviewStore } from '@/stores'
import type { ReviewStatus, SecuritySeverity } from '@/types'
import { BaseCard, BaseBadge, BaseButton, BaseLoader, BaseAlert } from '@/components/ui'

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

function formatResult(result: string): string {
  try {
    const parsed = JSON.parse(result)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return result
  }
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

<style scoped>
.review-detail-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* Loading & Error */
.review-detail-loading,
.review-detail-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1.5rem;
}

/* Header */
.review-detail-header {
  margin-bottom: 1.5rem;
}

.review-detail-header__back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  transition: color 0.2s;
}

.review-detail-header__back:hover {
  color: var(--color-primary);
}

.review-detail-header__main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.review-detail-header__title {
  margin: 0 0 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.review-detail-header__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.review-detail-header__date {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.review-detail-header__actions {
  display: flex;
  gap: 0.75rem;
}

/* Processing */
.review-processing {
  margin-bottom: 1.5rem;
}

.review-processing__content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.review-processing__content h3 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
  color: var(--color-text);
}

.review-processing__content p {
  margin: 0;
  color: var(--color-text-muted);
}

/* Issues */
.review-issues {
  margin-bottom: 1.5rem;
}

.review-issues__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.review-issues__header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.review-issues__summary {
  display: flex;
  gap: 0.5rem;
}

.review-issues__count {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.review-issues__count--critical {
  background-color: rgba(139, 0, 0, 0.2);
  color: #dc2626;
}

.review-issues__count--high {
  background-color: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}

.review-issues__count--medium {
  background-color: rgba(234, 179, 8, 0.15);
  color: #ca8a04;
}

.review-issues__count--low {
  background-color: rgba(34, 197, 94, 0.15);
  color: #16a34a;
}

.review-issues__count--info {
  background-color: rgba(59, 130, 246, 0.15);
  color: #2563eb;
}

.review-issues__list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Security Issue */
.security-issue {
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid;
}

.security-issue--critical {
  background-color: rgba(139, 0, 0, 0.08);
  border-left-color: #dc2626;
}

.security-issue--high {
  background-color: rgba(239, 68, 68, 0.08);
  border-left-color: #ef4444;
}

.security-issue--medium {
  background-color: rgba(234, 179, 8, 0.08);
  border-left-color: #eab308;
}

.security-issue--low {
  background-color: rgba(34, 197, 94, 0.08);
  border-left-color: #22c55e;
}

.security-issue--info {
  background-color: rgba(59, 130, 246, 0.08);
  border-left-color: #3b82f6;
}

.security-issue__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.security-issue__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.security-issue__cwe {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background-color: var(--color-bg-tertiary);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
}

.security-issue__description {
  margin: 0 0 0.75rem;
  color: var(--color-text);
  line-height: 1.5;
}

.security-issue__location {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 0.75rem;
}

.security-issue__suggestion {
  background-color: var(--color-bg);
  padding: 0.75rem;
  border-radius: 0.375rem;
}

.security-issue__suggestion h4 {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  color: var(--color-text);
}

.security-issue__suggestion p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

/* Success */
.review-success {
  margin-bottom: 1.5rem;
}

.review-success__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
}

.review-success__content svg {
  color: #22c55e;
  margin-bottom: 1rem;
}

.review-success__content h2 {
  margin: 0 0 0.5rem;
  color: var(--color-text);
}

.review-success__content p {
  margin: 0;
  color: var(--color-text-muted);
}

/* Result */
.review-result {
  background-color: var(--color-bg-tertiary);
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
}

.review-result pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-wrap;
  color: var(--color-text);
}

/* Code */
.review-code {
  margin: 0;
  padding: 1rem;
  background-color: var(--color-bg-tertiary);
  border-radius: 0.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  color: var(--color-text);
}

:deep(.card) {
  margin-bottom: 1.5rem;
}

@media (max-width: 640px) {
  .review-detail-header__main {
    flex-direction: column;
  }
  
  .review-detail-header__actions {
    width: 100%;
  }
  
  .review-detail-header__actions :deep(.btn) {
    flex: 1;
  }
}
</style>
