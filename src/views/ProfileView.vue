<template>
  <div class="profile-page">
    <div class="profile-page__container">
      <h1 class="profile-page__title">Профиль</h1>
      
      <BaseAlert 
        v-if="successMessage" 
        variant="success" 
        :show="true"
        dismissible
        @close="successMessage = ''"
      >
        {{ successMessage }}
      </BaseAlert>

      <BaseAlert 
        v-if="authStore.error" 
        variant="error" 
        :show="true"
        dismissible
        @close="authStore.error = null"
      >
        {{ authStore.error }}
      </BaseAlert>

      <!-- Profile Info Card -->
      <BaseCard title="Информация профиля" class="profile-card">
        <form @submit.prevent="handleUpdateProfile" class="profile-form">
          <div class="profile-form__avatar">
            <img 
              v-if="authStore.user?.avatar_url" 
              :src="authStore.user.avatar_url" 
              :alt="authStore.user.username"
              class="profile-form__avatar-img"
            />
            <div v-else class="profile-form__avatar-placeholder">
              {{ authStore.user?.username?.charAt(0).toUpperCase() }}
            </div>
          </div>

          <div class="profile-form__fields">
            <BaseInput
              v-model="username"
              label="Имя пользователя"
              placeholder="Ваше имя"
              :disabled="authStore.isProfileLoading"
            />

            <BaseInput
              :model-value="authStore.user?.email || ''"
              label="Email"
              type="email"
              disabled
              hint="Email нельзя изменить"
            />

            <BaseInput
              v-model="avatarUrl"
              label="URL аватара"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              :disabled="authStore.isProfileLoading"
            />
          </div>

          <div class="profile-form__actions">
            <BaseButton
              type="submit"
              variant="primary"
              :loading="authStore.isProfileLoading"
            >
              Сохранить изменения
            </BaseButton>
          </div>
        </form>
      </BaseCard>

      <!-- GitHub Connection Card -->
      <BaseCard title="Подключение GitHub" class="profile-card">
        <div class="github-section">
          <div v-if="authStore.hasGitHub" class="github-section__connected">
            <div class="github-section__info">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="github-section__icon">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <div>
                <p class="github-section__login">@{{ authStore.user?.github_login }}</p>
                <p class="github-section__status">GitHub аккаунт подключен</p>
              </div>
            </div>
            <BaseButton
              variant="danger"
              @click="handleUnlinkGitHub"
              :loading="authStore.isGitHubLoading"
            >
              Отключить
            </BaseButton>
          </div>
          <div v-else class="github-section__disconnected">
            <p class="github-section__description">
              Подключите GitHub для быстрого входа и доступа к вашим репозиториям
            </p>
            <BaseButton
              variant="github"
              @click="handleLinkGitHub"
              :loading="authStore.isGitHubLoading"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Подключить GitHub
            </BaseButton>
          </div>
        </div>
      </BaseCard>

      <!-- Change Password Card -->
      <BaseCard title="Изменить пароль" class="profile-card">
        <form @submit.prevent="handleChangePassword" class="password-form">
          <div class="password-form__fields">
            <BaseInput
              v-model="oldPassword"
              type="password"
              label="Текущий пароль"
              placeholder="Введите текущий пароль"
              autocomplete="current-password"
            />
            <BaseInput
              v-model="newPassword"
              type="password"
              label="Новый пароль"
              placeholder="Минимум 8 символов"
              autocomplete="new-password"
              :error="newPasswordError"
            />
            <BaseInput
              v-model="confirmNewPassword"
              type="password"
              label="Подтвердите пароль"
              placeholder="Повторите новый пароль"
              autocomplete="new-password"
              :error="confirmNewPasswordError"
            />
          </div>
          <div class="password-form__actions">
            <BaseButton
              type="submit"
              variant="secondary"
              :loading="authStore.isPasswordLoading"
              :disabled="!canChangePassword"
            >
              Изменить пароль
            </BaseButton>
          </div>
        </form>
      </BaseCard>

      <!-- Danger Zone Card -->
      <BaseCard title="Опасная зона" class="profile-card profile-card--danger">
        <div class="danger-zone">
          <p class="danger-zone__description">
            После удаления аккаунта все данные будут безвозвратно утеряны.
          </p>
          <BaseButton
            variant="danger"
            @click="handleDeleteAccount"
            :loading="authStore.isLoading"
          >
            Удалить аккаунт
          </BaseButton>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { BaseCard, BaseInput, BaseButton, BaseAlert } from '@/components/ui'

const route = useRoute()
const authStore = useAuthStore()

const username = ref('')
const avatarUrl = ref('')
const oldPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const successMessage = ref('')

// Initialize form values
onMounted(async () => {
  if (authStore.user) {
    username.value = authStore.user.username
    avatarUrl.value = authStore.user.avatar_url || ''
  }
  
  // Check for GitHub link success
  if (route.query.status === 'github_linked') {
    successMessage.value = 'GitHub аккаунт успешно привязан!'
    // Refresh profile to show linked account status immediately
    await authStore.fetchProfile()
    
    // Clean URL
    router.replace({ query: {} })
  }
})

watch(() => authStore.user, (user) => {
  if (user) {
    username.value = user.username
    avatarUrl.value = user.avatar_url || ''
  }
})

// Password validation
const newPasswordError = computed(() => {
  if (newPassword.value && newPassword.value.length < 8) {
    return 'Минимум 8 символов'
  }
  return ''
})

const confirmNewPasswordError = computed(() => {
  if (confirmNewPassword.value && confirmNewPassword.value !== newPassword.value) {
    return 'Пароли не совпадают'
  }
  return ''
})

const canChangePassword = computed(() => {
  return oldPassword.value && 
         newPassword.value && 
         confirmNewPassword.value && 
         !newPasswordError.value && 
         !confirmNewPasswordError.value
})

async function handleUpdateProfile() {
  const data: { username?: string; avatar_url?: string } = {}
  
  if (username.value !== authStore.user?.username) {
    data.username = username.value
  }
  if (avatarUrl.value !== authStore.user?.avatar_url) {
    data.avatar_url = avatarUrl.value || undefined
  }
  
  if (Object.keys(data).length === 0) {
    return
  }
  
  const success = await authStore.updateProfile(data)
  if (success) {
    successMessage.value = 'Профиль обновлен'
  }
}

function handleLinkGitHub() {
  authStore.linkGitHub()
}

async function handleUnlinkGitHub() {
  if (confirm('Вы уверены, что хотите отключить GitHub?')) {
    const success = await authStore.unlinkGitHub()
    if (success) {
      successMessage.value = 'GitHub аккаунт отключен'
    }
  }
}

async function handleChangePassword() {
  if (!canChangePassword.value) return
  
  const success = await authStore.changePassword(oldPassword.value, newPassword.value)
  if (success) {
    successMessage.value = 'Пароль изменен'
    oldPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
  }
}

async function handleDeleteAccount() {
  if (confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.')) {
    if (confirm('Последнее предупреждение! Все ваши данные будут удалены.')) {
      await authStore.deleteAccount()
    }
  }
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding: 2rem 1rem;
  background-color: var(--color-bg);
}

.profile-page__container {
  max-width: 720px;
  margin: 0 auto;
}

.profile-page__title {
  margin: 0 0 1.5rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
}

.profile-card {
  margin-bottom: 1.5rem;
}

.profile-card--danger :deep(.card__header) {
  background-color: rgba(239, 68, 68, 0.1);
  border-bottom-color: rgba(239, 68, 68, 0.2);
}

.profile-card--danger :deep(.card__title) {
  color: var(--color-danger);
}

/* Profile Form */
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-form__avatar {
  display: flex;
  justify-content: center;
}

.profile-form__avatar-img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-form__avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 600;
}

.profile-form__fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-form__actions {
  display: flex;
  justify-content: flex-end;
}

/* GitHub Section */
.github-section__connected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.github-section__info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.github-section__icon {
  color: var(--color-text);
}

.github-section__login {
  margin: 0;
  font-weight: 600;
  color: var(--color-text);
}

.github-section__status {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.github-section__disconnected {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

.github-section__description {
  margin: 0;
  color: var(--color-text-muted);
}

/* Password Form */
.password-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.password-form__fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.password-form__actions {
  display: flex;
  justify-content: flex-end;
}

/* Danger Zone */
.danger-zone {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.danger-zone__description {
  margin: 0;
  color: var(--color-text-muted);
}

@media (max-width: 600px) {
  .github-section__connected,
  .danger-zone {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
