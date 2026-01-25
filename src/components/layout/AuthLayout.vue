<template>
  <div class="auth-layout">
    <div class="auth-layout__container">
      <div class="auth-layout__header">
        <div class="auth-layout__logo">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <h1 class="auth-layout__title">Secure Review</h1>
        <p class="auth-layout__subtitle">Анализ безопасности кода с помощью AI</p>
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, var(--color-bg) 0%, var(--color-bg-secondary) 100%);
}

.auth-layout__container {
  width: 100%;
  max-width: 420px;
}

.auth-layout__header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-layout__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  background-color: var(--color-primary);
  color: white;
  border-radius: 1rem;
  margin-bottom: 1rem;
}

.auth-layout__title {
  margin: 0 0 0.5rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
}

.auth-layout__subtitle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}
</style>
