<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ChatPage from '@/components/ChatPage.vue'

const authStore = useAuthStore()
const theme = ref('dark')
const isLoggingOut = ref(false)
const statusSnackbar = ref(false)

function onClickTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

function onClickLogout() {
  isLoggingOut.value = true
  authStore.logout()
}

function onClickStatus() {
  statusSnackbar.value = true
}
</script>

<template>
  <v-app :theme="theme">
    <v-app-bar>
      <v-btn :prepend-icon="'mdi-circle'" slim size="small" flat :ripple="false" :disabled="!authStore.connected"
        :color="authStore.connected ? 'success' : 'error'" @click="onClickStatus" class="ps-0 pe-0 ms-0" />
      <v-snackbar v-model="statusSnackbar" :timeout="5000" multi-line>
        {{ authStore.connectionName }}
      </v-snackbar>
      <v-app-bar-title class="ms-0">Hello Chat</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn :prepend-icon="theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night'" slim @click="onClickTheme" />
      <v-btn v-if="authStore.username != ''" :prepend-icon="'mdi-logout'" :loading="isLoggingOut" slim
        @click="onClickLogout" />
    </v-app-bar>

    <template v-if="authStore.connected">
      <ChatPage/>
    </template>
    <template v-else-if="authStore.authenticated">
      <v-container class="fill-height">
        <v-col xs="12" sm="6" offset-sm="3" md="4" offset-md="4">
          <v-card>
            <v-card-text>
              <v-progress-linear indeterminate />
            </v-card-text>
          </v-card>
        </v-col>
      </v-container>
    </template>
  </v-app>
</template>