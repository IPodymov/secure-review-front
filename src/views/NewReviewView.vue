<template>
  <div class="new-review-page">
    <div class="new-review-page__header">
      <router-link to="/reviews" class="new-review-page__back">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Назад к списку
      </router-link>
      <h1 class="new-review-page__title">Новый анализ кода</h1>
      <p class="new-review-page__subtitle">
        Отправьте код для проверки безопасности и оптимизации с помощью AI
      </p>
    </div>

    <BaseCard>
      <form @submit.prevent="handleSubmit" class="review-form">
        <BaseAlert
          v-if="reviewStore.error"
          variant="error"
          :show="true"
          dismissible
          @close="reviewStore.error = null">
          {{ reviewStore.error }}
        </BaseAlert>

        <div class="review-form__row">
          <div class="review-form__tabs">
            <button
              type="button"
              class="review-form__tab"
              :class="{ 'review-form__tab--active': mode === 'manual' }"
              @click="mode = 'manual'">
              Код вручную
            </button>
            <button
              type="button"
              class="review-form__tab"
              :class="{ 'review-form__tab--active': mode === 'github' }"
              @click="mode = 'github'">
              GitHub Репозиторий
            </button>
          </div>
        </div>

        <BaseInput
          v-model="title"
          label="Название"
          placeholder="Например: Проверка функции авторизации"
          required />

        <!-- Manual Mode -->
        <template v-if="mode === 'manual'">
          <div class="review-form__row">
            <div class="review-form__select-wrapper">
              <label class="review-form__label">Язык программирования</label>
              <BaseSelect
                v-model="language"
                :options="languageOptions"
                placeholder="Выберите язык" />
            </div>
          </div>

          <BaseTextarea
            v-model="code"
            label="Код для анализа"
            placeholder="Вставьте ваш код здесь..."
            :rows="16"
            monospace
            required />
        </template>

        <!-- GitHub Mode -->
        <template v-else>
          <div v-if="!isGitHubConnected" class="review-form__connect-github">
            <p>Для анализа репозиториев необходимо подключить GitHub аккаунт.</p>
            <router-link to="/profile">
              <BaseButton variant="primary" size="sm">Перейти в профиль</BaseButton>
            </router-link>
          </div>
          <div v-else>
            <div class="review-form__row">
              <div class="review-form__select-wrapper">
                <label class="review-form__label">Репозиторий</label>
                <div v-if="isLoadingRepos" class="review-form__loading-text">
                  Загрузка репозиториев...
                </div>
                <BaseSelect
                  v-else
                  v-model="selectedRepo"
                  :options="repoOptions"
                  placeholder="Выберите репозиторий" />
              </div>
            </div>

            <div class="review-form__row" v-if="selectedRepo">
              <div class="review-form__select-wrapper">
                <label class="review-form__label">Ветка</label>
                <div v-if="isLoadingBranches" class="review-form__loading-text">
                  Загрузка веток...
                </div>
                <BaseSelect
                  v-else
                  v-model="selectedBranch"
                  :options="branchOptions"
                  placeholder="Выберите ветку" />
              </div>
            </div>

            <BaseTextarea
              v-model="customPrompt"
              label="Запрос пользователя / Инструкции"
              placeholder="Опишите, на что обратить внимание при анализе..."
              :rows="5" />
          </div>
        </template>

        <div class="review-form__hints">
          <h4>Что проверяет AI:</h4>
          <ul>
            <li>🔒 Уязвимости безопасности (SQL Injection, XSS, и др.)</li>
            <li>📝 Качество и читаемость кода</li>
            <li>⚡ Производительность и оптимизация</li>
            <li>🐛 Потенциальные баги и ошибки</li>
          </ul>
        </div>

        <div class="review-form__actions">
          <router-link to="/reviews">
            <BaseButton variant="secondary" type="button"> Отмена </BaseButton>
          </router-link>
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            :loading="reviewStore.isCreating"
            :disabled="!isValid">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            Начать анализ
          </BaseButton>
        </div>
      </form>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useReviewStore, useAuthStore } from '@/stores';
import {
  BaseCard,
  BaseInput,
  BaseTextarea,
  BaseSelect,
  BaseButton,
  BaseAlert,
} from '@/components/ui';
import { githubApi } from '@/api';
import type { GitHubRepository } from '@/types/models/github';

const router = useRouter();
const reviewStore = useReviewStore();
const authStore = useAuthStore();

const mode = ref<'manual' | 'github'>('manual');
const title = ref('');
const code = ref('');
const language = ref('');
const customPrompt = ref('');

// GitHub State
const repos = ref<GitHubRepository[]>([]);
const branches = ref<string[]>([]);
const selectedRepo = ref(''); // "owner/name"
const selectedBranch = ref('');
const isLoadingRepos = ref(false);
const isLoadingBranches = ref(false);

const isGitHubConnected = computed(() => !!authStore.user?.github_login);

const languageOptions = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'shell', label: 'Shell/Bash' },
  { value: 'yaml', label: 'YAML' },
  { value: 'json', label: 'JSON' },
  { value: 'other', label: 'Другой' },
];

const repoOptions = computed(() => {
  return repos.value.map((repo) => ({
    value: repo.full_name,
    label: repo.full_name,
  }));
});

const branchOptions = computed(() => {
  return branches.value.map((branch) => ({
    value: branch,
    label: branch,
  }));
});

const isValid = computed(() => {
  if (!title.value.trim()) return false;

  if (mode.value === 'manual') {
    return !!code.value.trim();
  } else {
    return !!selectedRepo.value && !!selectedBranch.value;
  }
});

// Fetch Repos
const fetchRepos = async () => {
  if (!isGitHubConnected.value) return;
  isLoadingRepos.value = true;
  try {
    repos.value = await githubApi.listRepositories();
  } catch (e) {
    console.error('Failed to fetch repos', e);
    reviewStore.error = 'Failed to load repositories';
  } finally {
    isLoadingRepos.value = false;
  }
};

// Watch mode to fetch repos
watch(mode, (newMode) => {
  if (newMode === 'github' && repos.value.length === 0) {
    fetchRepos();
  }
});

// Watch selectedRepo to fetch branches
watch(selectedRepo, async (newRepo) => {
  selectedBranch.value = '';
  branches.value = [];
  if (!newRepo) return;

  const [owner, name] = newRepo.split('/');
  if (!owner || !name) return;

  isLoadingBranches.value = true;
  try {
    branches.value = await githubApi.listBranches(owner, name);
    // Auto-select 'main' or 'master' if available
    if (branches.value.includes('main')) selectedBranch.value = 'main';
    else if (branches.value.includes('master')) selectedBranch.value = 'master';
    else if (branches.value.length > 0) selectedBranch.value = branches.value[0];
  } catch (e) {
    console.error('Failed to fetch branches', e);
    reviewStore.error = 'Failed to load branches';
  } finally {
    isLoadingBranches.value = false;
  }
});

const handleSubmit = async () => {
  if (!isValid.value) return;

  try {
    let review;
    if (mode.value === 'manual') {
      review = await reviewStore.createReview({
        title: title.value.trim(),
        code: code.value,
        language: language.value || 'Mixed',
      });
    } else {
      const parts = selectedRepo.value.split('/');
      if (parts.length < 2) return;

      const owner = parts[0];
      const name = parts[1];

      review = await reviewStore.createReview({
        title: title.value.trim(),
        repo_owner: owner,
        repo_name: name,
        repo_branch: selectedBranch.value,
        custom_prompt: customPrompt.value,
        language: 'Mixed (Repository)',
      });
    }

    if (review) {
      if (reviewStore.pollReviewStatus) {
        reviewStore.pollReviewStatus(review.id);
      }
      router.push(`/reviews/${review.id}`);
    }
  } catch (e) {
    // Error handled in store
  }
};

onMounted(() => {
  // Clear error on mount
  reviewStore.error = null;
});
</script>

<style scoped>
.new-review-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.new-review-page__header {
  margin-bottom: 2rem;
}

.new-review-page__back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  transition: color 0.2s;
}

.new-review-page__back:hover {
  color: var(--color-primary);
}

.new-review-page__title {
  margin: 0 0 0.5rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
}

.new-review-page__subtitle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 1.125rem;
}

.review-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.review-form__row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.review-form__select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.review-form__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.review-form__hints {
  background-color: var(--color-bg-tertiary);
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.review-form__hints h4 {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.review-form__hints ul {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  padding-left: 0;
}

.review-form__hints li {
  color: var(--color-text-secondary);
}

.review-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
}

.review-form__tabs {
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid var(--color-border);
  width: 100%;
  margin-bottom: 0.5rem;
}

.review-form__tab {
  background: none;
  border: none;
  padding: 0.75rem 0;
  font-size: 1rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.review-form__tab:hover {
  color: var(--color-text);
}

.review-form__tab--active {
  color: var(--color-primary);
  font-weight: 600;
}

.review-form__tab--active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--color-primary);
}

.review-form__loading-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.review-form__connect-github {
  text-align: center;
  padding: 3rem 2rem;
  background-color: var(--color-bg-tertiary);
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  color: var(--color-text-secondary);
}
</style>
