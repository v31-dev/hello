<script setup>
  import { useAuth } from '@/composables/useAuth'
  import { useServerStore } from '@/stores/server'
  import loginImage from '@/assets/login.svg'
  import { onMounted, ref } from 'vue'

  const { isAuthenticated, handleCallback, login } = useAuth()
  const server = useServerStore()
  const isProcessing = ref(false)
  const error = ref('')

  onMounted(async () => {
    // Check if we're in callback redirect from Auth URL
    if (window.location.search.includes('code=')) {
      isProcessing.value = true
      try {
        await handleCallback()
        // Callback successful, redirect to home
        window.history.replaceState({}, document.title, '/')
      } catch (err) {
        error.value = 'Login failed. Please try again.'
        console.error('Callback error:', err)
        isProcessing.value = false
      }
    } else if (isAuthenticated.value) {
      // Already logged in, connect to server
      server.login()
    } else {
      // Not logged in, redirect to Auth URL
      login()
    }
  })
</script>

<template>
  <v-main>
    <v-container class="fill-height">
      <v-col xs="12" sm="6" offset-sm="3" md="4" offset-md="4">
        <v-img aspect-ratio="16/9" cover :src="loginImage" class="mb-8" />
        <v-card v-if="isProcessing">
          <template v-slot:title>
            <span class="font-weight-black">Logging in...</span>
          </template>
          <v-card-text>
            <v-progress-linear indeterminate />
          </v-card-text>
        </v-card>
        <v-card v-else-if="error">
          <template v-slot:title>
            <span class="font-weight-black">Login Failed</span>
          </template>
          <v-card-text>{{ error }}</v-card-text>
          <v-card-actions>
            <v-btn color="primary" block @click="login">Try Again</v-btn>
          </v-card-actions>
        </v-card>
        <v-card v-else>
          <template v-slot:title>
            <span class="font-weight-black">Redirecting to login...</span>
          </template>
          <v-card-text>
            <v-progress-linear indeterminate />
          </v-card-text>
        </v-card>
      </v-col>
    </v-container>
  </v-main>
</template>