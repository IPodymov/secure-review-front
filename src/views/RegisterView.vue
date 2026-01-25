<template>
  <AuthLayout>
    <BaseCard>
      <form @submit.prevent="handleSubmit" class="register-form">
        <h2 class="register-form__title">Создать аккаунт</h2>
        
        <BaseAlert 
          v-if="errorMessage" 
          variant="error" 
          :show="true"
          dismissible
          @close="errorMessage = ''"
        >
          {{ errorMessage }}
        </BaseAlert>

        <div class="register-form__fields">
          <BaseInput
            v-model="username"
            type="text"
            label="Имя пользователя"
            placeholder="johndoe"
            required
            autocomplete="username"
            :error="usernameError"
          />
          
          <BaseInput
            v-model="email"
            type="email"
            label="Email"
            placeholder="your@email.com"
            required
            autocomplete="email"
            :error="emailError"
          />
          
          <BaseInput
            v-model="password"
            type="password"
            label="Пароль"
            placeholder="Минимум 8 символов"
            required
            autocomplete="new-password"
            :error="passwordError"
          />
          
          <BaseInput
            v-model="confirmPassword"
            type="password"
            label="Подтверждение пароля"
            placeholder="Повторите пароль"
            required
            autocomplete="new-password"
            :error="confirmPasswordError"
          />
        </div>

        <div class="register-form__actions">
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            block
            :loading="authStore.isLoading"
          >
            Зарегистрироваться
          </BaseButton>

          <div class="register-form__divider">
            <span>или</span>
          </div>

          <BaseButton
            type="button"
            variant="github"
            size="lg"
            block
            :loading="authStore.isLoading"
            @click="handleGitHubRegister"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Продолжить с GitHub
          </BaseButton>
        </div>

        <p class="register-form__footer">
          Уже есть аккаунт?
          <router-link to="/login">Войти</router-link>
        </p>
      </form>
    </BaseCard>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { AuthLayout } from '@/components/layout'
import { BaseCard, BaseInput, BaseButton, BaseAlert } from '@/components/ui'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')

// Validation
const usernameError = computed(() => {
  if (username.value && username.value.length < 3) {
    return 'Минимум 3 символа'
  }
  return ''
})

const emailError = computed(() => {
  if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    return 'Некорректный email'
  }
  return ''
})

const passwordError = computed(() => {
  if (password.value && password.value.length < 8) {
    return 'Минимум 8 символов'
  }
  return ''
})

const confirmPasswordError = computed(() => {
  if (confirmPassword.value && confirmPassword.value !== password.value) {
    return 'Пароли не совпадают'
  }
  return ''
})

async function handleSubmit() {
  errorMessage.value = ''
  
  // Validate all fields
  if (!username.value || !email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'Заполните все поля'
    return
  }
  
  if (usernameError.value || emailError.value || passwordError.value || confirmPasswordError.value) {
    errorMessage.value = 'Исправьте ошибки в форме'
    return
  }

  const success = await authStore.register(username.value, email.value, password.value)
  
  if (success) {
    router.push('/reviews')
  } else {
    errorMessage.value = authStore.error || 'Ошибка регистрации'
  }
}

function handleGitHubRegister() {
  authStore.loginWithGitHub()
}
</script>

<style scoped>
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.register-form__title {
  margin: 0;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.register-form__fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.register-form__actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.register-form__divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.register-form__divider::before,
.register-form__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: var(--color-border);
}

.register-form__footer {
  text-align: center;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.register-form__footer a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.register-form__footer a:hover {
  text-decoration: underline;
}
</style>
