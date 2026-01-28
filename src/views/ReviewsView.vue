<template>
  <div class="reviews-page">
    <div class="reviews-page__header">
      <div>
        <h1 class="reviews-page__title">Code Reviews</h1>
        <p class="reviews-page__subtitle">Анализ безопасности вашего кода</p>
      </div>
      <router-link to="/reviews/new">
        <BaseButton variant="primary" size="lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Новый анализ
        </BaseButton>
      </router-link>
    </div>

    <!-- Stats -->
    <div class="reviews-stats">
      <div class="reviews-stats__item">
        <span class="reviews-stats__value">{{ reviewStore.total }}</span>
        <span class="reviews-stats__label">Всего reviews</span>
      </div>
      <div class="reviews-stats__item reviews-stats__item--success">
        <span class="reviews-stats__value">{{ reviewStore.stats.completedCount }}</span>
        <span class="reviews-stats__label">Завершено</span>
      </div>
      <div class="reviews-stats__item reviews-stats__item--warning">
        <span class="reviews-stats__value">{{ reviewStore.stats.highCount }}</span>
        <span class="reviews-stats__label">High issues</span>
      </div>
      <div class="reviews-stats__item reviews-stats__item--danger">
        <span class="reviews-stats__value">{{ reviewStore.stats.criticalCount }}</span>
        <span class="reviews-stats__label">Critical issues</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="reviewStore.isFetching && !reviewStore.reviews.length" class="reviews-loading">
      <BaseLoader text="Загрузка reviews..." />
    </div>

    <!-- Empty State -->
    <div v-else-if="!reviewStore.reviews.length" class="reviews-empty">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
      <h2>Нет code reviews</h2>
      <p>Создайте первый анализ для проверки безопасности вашего кода</p>
      <router-link to="/reviews/new">
        <BaseButton variant="primary">Создать первый анализ</BaseButton>
      </router-link>
    </div>

    <!-- Reviews List -->
    <div v-else class="reviews-list">
      <router-link 
        v-for="review in reviewStore.reviews" 
        :key="review.id"
        :to="`/reviews/${review.id}`"
        class="review-item"
      >
        <div class="review-item__header">
          <h3 class="review-item__title">{{ review.title }}</h3>
          <BaseBadge :variant="getStatusVariant(review.status)">
            {{ getStatusLabel(review.status) }}
          </BaseBadge>
        </div>
        
        <div class="review-item__meta">
          <BaseBadge variant="default">{{ review.language }}</BaseBadge>
          <span class="review-item__date">
            {{ formatDate(review.created_at) }}
          </span>
        </div>

        <div v-if="review.security_issues?.length" class="review-item__issues">
          <span 
            v-for="severity in getIssuesSummary(review.security_issues)" 
            :key="severity.type"
            :class="['review-item__issue-count', `review-item__issue-count--${severity.type}`]"
          >
            {{ severity.count }} {{ severity.label }}
          </span>
        </div>
        
        <pre class="review-item__code">{{ truncateCode(review.code) }}</pre>
      </router-link>

      <!-- Pagination -->
      <div v-if="reviewStore.totalPages > 1" class="reviews-pagination">
        <BaseButton
          variant="secondary"
          :disabled="reviewStore.currentPage <= 1"
          @click="loadPage(reviewStore.currentPage - 1)"
        >
          Назад
        </BaseButton>
        <span class="reviews-pagination__info">
          Страница {{ reviewStore.currentPage }} из {{ reviewStore.totalPages }}
        </span>
        <BaseButton
          variant="secondary"
          :disabled="!reviewStore.hasMore"
          @click="loadPage(reviewStore.currentPage + 1)"
        >
          Вперед
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useReviewStore } from '@/stores'
import type { ReviewStatus, SecurityIssue, SecuritySeverity } from '@/types'
import { BaseButton, BaseBadge, BaseLoader } from '@/components/ui'

const reviewStore = useReviewStore()

onMounted(() => {
  reviewStore.fetchReviews()
})

function loadPage(page: number) {
  reviewStore.fetchReviews(page)
}

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
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncateCode(code: string, maxLength: number = 150): string {
  if (code.length <= maxLength) return code
  return code.slice(0, maxLength) + '...'
}

function getIssuesSummary(issues: SecurityIssue[]) {
  const counts: Record<SecuritySeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  }
  
  issues.forEach(issue => {
    counts[issue.severity]++
  })
  
  const labels: Record<SecuritySeverity, string> = {
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
    info: 'info',
  }
  
  return Object.entries(counts)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({
      type: type as SecuritySeverity,
      count,
      label: labels[type as SecuritySeverity],
    }))
}
</script>

<style scoped>
.reviews-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.reviews-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.reviews-page__title {
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
}

.reviews-page__subtitle {
  margin: 0;
  color: var(--color-text-muted);
}

/* Stats */
.reviews-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.reviews-stats__item {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1.25rem;
  text-align: center;
}

.reviews-stats__value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text);
}

.reviews-stats__label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.reviews-stats__item--success .reviews-stats__value {
  color: #16a34a;
}

.reviews-stats__item--warning .reviews-stats__value {
  color: #ca8a04;
}

.reviews-stats__item--danger .reviews-stats__value {
  color: #dc2626;
}

/* Loading & Empty States */
.reviews-loading,
.reviews-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--color-text-muted);
}

.reviews-empty svg {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.reviews-empty h2 {
  margin: 0 0 0.5rem;
  color: var(--color-text);
}

.reviews-empty p {
  margin: 0 0 1.5rem;
}

/* Reviews List */
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-item {
  display: block;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1.25rem;
  text-decoration: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.review-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px var(--color-shadow);
}

.review-item__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.review-item__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
}

.review-item__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.review-item__date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.review-item__issues {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.review-item__issue-count {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.review-item__issue-count--critical {
  background-color: rgba(139, 0, 0, 0.2);
  color: #dc2626;
}

.review-item__issue-count--high {
  background-color: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}

.review-item__issue-count--medium {
  background-color: rgba(234, 179, 8, 0.15);
  color: #ca8a04;
}

.review-item__issue-count--low {
  background-color: rgba(34, 197, 94, 0.15);
  color: #16a34a;
}

.review-item__issue-count--info {
  background-color: rgba(59, 130, 246, 0.15);
  color: #2563eb;
}

.review-item__code {
  margin: 0;
  padding: 0.75rem;
  background-color: var(--color-bg-tertiary);
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: var(--color-text-muted);
  overflow: hidden;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Pagination */
.reviews-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.reviews-pagination__info {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

@media (max-width: 600px) {
  .reviews-page__header {
    flex-direction: column;
  }
  
  .reviews-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
