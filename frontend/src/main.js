import { createApp } from 'vue'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import { useAuth } from './composables/useAuth'

// Initialize auth
const { getUser } = useAuth()

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const vuetify = createVuetify({
  components,
  directives,
})

const app = createApp(App)

// Load existing session before mounting
getUser().then(() => {
  app.use(pinia)
  app.use(vuetify)
  app.mount('#app')
})