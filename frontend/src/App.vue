<script setup>
  import { useAuth } from '@/composables/useAuth'
  import { computed, ref } from 'vue'
  import { useServerStore } from '@/stores/server'

  import LoginPage from './components/LoginPage.vue'
  import ChatPage from './components/ChatPage.vue'

  const { isAuthenticated, getUserName, getToken, logout } = useAuth()
  const theme = ref('dark')
  const server = useServerStore()
  const isLoggingOut = ref(false)
  const page = computed(() => (isAuthenticated.value && server.connected) ? ChatPage : LoginPage)
  const statusSnackbar = ref(false)

  function onClickTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function onClickLogout() {
    isLoggingOut.value = true
    server.logout()
    logout()
  }

  function onClickStatus() {
    statusSnackbar.value = true
  }

  // Initialize server store with auth data
  if (isAuthenticated.value) {
    server.init(getUserName(), getToken())
  }
</script>

<template>
  <v-app :theme="theme">
    <v-app-bar>
      <v-btn :prepend-icon="'mdi-circle'" slim size="small" flat :ripple="false" :disabled="!server.connected"
        :color="server.connected ? 'success' : 'error'" @click="onClickStatus" class="ps-0 pe-0 ms-0"/>
        <v-snackbar v-model="statusSnackbar" :timeout="5000" multi-line>
          {{ server.name }}
        </v-snackbar>
      <v-app-bar-title class="ms-0">Hello Chat</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn :prepend-icon="theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night'"  
        slim @click="onClickTheme"/>
      <v-btn v-if="server.username != ''" :prepend-icon="'mdi-logout'" :loading="isLoggingOut" slim @click="onClickLogout"/>
    </v-app-bar>

    <component :is="page" />
  </v-app>
</template>