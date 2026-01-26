import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import logger from '@/utils/logger'

const app = createApp(App)

// Global Error Handler
app.config.errorHandler = (err, instance, info) => {
  logger.error('Global Vue Error', err, { info, component: instance?.$options.__name })
}

// Global Promise Rejection Handler
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled Promise Rejection', event.reason)
})

// Install Pinia
app.use(createPinia())

// Install Router
app.use(router)

// Mount app
app.mount('#app')
