<template>
  <header class="header">
    <div class="header__container">
      <router-link to="/reviews" class="header__logo">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        <span>Secure Review</span>
      </router-link>

      <nav v-if="isAuthenticated" class="header__nav">
        <router-link to="/reviews" class="header__link"> Reviews </router-link>
        <router-link to="/reviews/new" class="header__link header__link--primary">
          + Новый анализ
        </router-link>
      </nav>

      <div v-if="isAuthenticated" class="header__user">
        <router-link to="/profile" class="header__profile">
          <img
            v-if="user?.avatar_url"
            :src="user.avatar_url"
            :alt="user.username"
            class="header__avatar" />
          <div v-else class="header__avatar header__avatar--placeholder">
            {{ user?.username?.charAt(0).toUpperCase() }}
          </div>
          <span class="header__username">{{ user?.username }}</span>
        </router-link>
        <button class="header__logout" @click="handleLogout" title="Выйти">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores';

const router = useRouter();
const authStore = useAuthStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const user = computed(() => authStore.user);

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.header__container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.header__logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  text-decoration: none;
}

.header__logo svg {
  color: var(--color-primary);
}

.header__nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: center;
}

.header__link {
  padding: 0.5rem 1rem;
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: 500;
  border-radius: 0.5rem;
  transition:
    color 0.2s,
    background-color 0.2s;
}

.header__link:hover {
  color: var(--color-text);
  background-color: var(--color-bg-secondary);
}

.header__link.router-link-active {
  color: var(--color-primary);
}

.header__link--primary {
  background-color: var(--color-primary);
  color: white !important;
}

.header__link--primary:hover {
  background-color: var(--color-primary-dark);
}

.header__user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header__profile {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  color: var(--color-text);
  text-decoration: none;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
}

.header__profile:hover {
  background-color: var(--color-bg-secondary);
}

.header__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.header__avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.header__username {
  font-weight: 500;
  font-size: 0.9rem;
}

.header__logout {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: 0.5rem;
  transition:
    color 0.2s,
    background-color 0.2s;
}

.header__logout:hover {
  color: var(--color-danger);
  background-color: var(--color-bg-secondary);
}

@media (max-width: 768px) {
  .header__nav {
    display: none;
  }

  .header__username {
    display: none;
  }
}
</style>
