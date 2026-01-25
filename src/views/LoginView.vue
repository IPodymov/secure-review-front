<template>
  <AuthLayout>
    <BaseCard>
      <form @submit.prevent="handleSubmit" class="login-form">
        <h2 class="login-form__title">Вход в аккаунт</h2>

        <BaseAlert
          v-if="errorMessage"
          variant="error"
          :show="true"
          dismissible
          @close="errorMessage = ''">
          {{ errorMessage }}
        </BaseAlert>

        <BaseAlert
          v-if="oauthError"
          variant="error"
          :show="true"
          dismissible
          @close="oauthError = ''">
          {{ oauthErrorMessage }}
        </BaseAlert>

        <div class="login-form__fields">
          <BaseInput
            v-model="email"
            type="email"
            label="Email"
            placeholder="your@email.com"
            required
            autocomplete="email" />

          <BaseInput
            v-model="password"
            type="password"
            label="Пароль"
            placeholder="Введите пароль"
            required
            autocomplete="current-password" />
        </div>

        <div class="login-form__actions">
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            block
            :loading="authStore.isLoading">
            Войти
          </BaseButton>

          <div class="login-form__divider">
            <span>или</span>
          </div>

          <BaseButton
            type="button"
            variant="github"
            size="lg"
            block
            :loading="authStore.isLoading"
            @click="handleGitHubLogin">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Войти через GitHub
          </BaseButton>
        </div>

        <p class="login-form__footer">
          Нет аккаунта?
          <router-link to="/register">Зарегистрироваться</router-link>
        </p>
      </form>
    </BaseCard>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { AuthLayout } from '@/components/layout';
import { BaseCard, BaseInput, BaseButton, BaseAlert } from '@/components/ui';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const oauthError = ref('');

const oauthErrorMessage = computed(() => {
  const errors: Record<string, string> = {
    auth_failed: 'Ошибка авторизации через GitHub',
    link_failed: 'Ошибка привязки GitHub аккаунта',
    token_generation_failed: 'Ошибка генерации токена',
    invalid_link_state: 'Недействительное состояние привязки',
  };
  return errors[oauthError.value] || 'Произошла ошибка';
});

onMounted(() => {
  // Check for OAuth error in URL
  if (route.query.error) {
    oauthError.value = route.query.error as string;
    // Clean URL
    router.replace({ query: {} });
  }
});

async function handleSubmit() {
  errorMessage.value = '';

  if (!email.value || !password.value) {
    errorMessage.value = 'Заполните все поля';
    return;
  }

  const success = await authStore.login(email.value, password.value);

  if (success) {
    const redirect = route.query.redirect as string;
    router.push(redirect || '/reviews');
  } else {
    errorMessage.value = authStore.error || 'Ошибка входа';
  }
}

function handleGitHubLogin() {
  authStore.loginWithGitHub();
}
</script>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.login-form__title {
  margin: 0;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.login-form__fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-form__actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-form__divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.login-form__divider::before,
.login-form__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: var(--color-border);
}

.login-form__footer {
  text-align: center;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.login-form__footer a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.login-form__footer a:hover {
  text-decoration: underline;
}
</style>
