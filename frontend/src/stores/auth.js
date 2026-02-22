import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { io } from 'socket.io-client'


export const useAuthStore = defineStore('auth', () => {
  const connected = ref(false)
  const username = ref(null)
  const serverName = ref(null)
  const socket = ref(null)

  const connectionName = computed(() => `${username.value}:${socket.value.id}@${serverName.value}`)

  const userManager = new UserManager({
    authority: import.meta.env.VITE_AUTH_URL,
    client_id: import.meta.env.VITE_AUTH_CLIENT_ID,
    redirect_uri: `${window.location.origin}/callback`,
    post_logout_redirect_uri: `${window.location.origin}/`,
    response_type: 'code',
    scope: 'openid profile',
    userStore: new WebStorageStateStore({ store: window.localStorage }),
  })

  const authenticated = computed(() => username.value !== null)

  // Socket initialization is only after user auth
  const initializeSocket = async () => {
    // If a previous socket exists, disconnect it first to avoid duplicate listeners
    if (socket.value) {
      try { socket.value.disconnect() } catch (e) { /* ignore */ }
    }

    // Assign to the store-level `socket` ref (don't shadow the outer variable)
    socket.value = io({
      path: '/api/ws/',
      transports: ["websocket"],
      upgrade: false,
      autoConnect: true,
      withCredentials: true,
      auth: {
        token: await userManager.getUser().then(user => user?.id_token || '')
      }
    })

    socket.value.on("connect", () => {
      connected.value = true
    })

    socket.value.on("disconnect", () => {
      connected.value = false
    })

    socket.value.on("welcome", ({ host }) => {
      serverName.value = host
    })

    // Listen for system messages which will be auth related
    socket.value.on('message', (msg) => {
      console.error('Received message:', msg)
      logout()
    })
  }

  const init = async () => {
    try {
      // If a user is already stored, use it and initialize the socket
      const existingUser = await userManager.getUser()
      if (existingUser) {
        username.value = existingUser.profile.preferred_username
        await initializeSocket()
        return
      }

      // If we're on the OIDC callback route, process the redirect response
      if (window.location.pathname === '/callback') {
        try {
          await userManager.signinRedirectCallback()
          // Remove the callback query params from the URL
          window.history.replaceState({}, document.title, '/')
          // after callback, user should be available
          const user = await userManager.getUser()
          if (user) {
            username.value = user.profile.preferred_username
            await initializeSocket()
          }
          return
        } catch (cbError) {
          console.error('Callback processing error:', cbError)
        }
      }

      // No user and not on callback -> start signin flow
      await userManager.signinRedirect()
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  const logout = async () => {
    try {
      socket.value.disconnect()
      await userManager.signoutRedirect()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  function sendMessage(message, ack) {
    socket.value.emit('chat', message, ack)
  }

  function receiveMessageHandler(fn) {
    if (!socket.value) return () => {}
    socket.value.on('chat', fn)
    return () => {
      try { socket.value.off('chat', fn) } catch (e) { /* ignore */ }
    }
  }

  function receiveServerMessageHandler(fn) {
    if (!socket.value) return () => {}
    socket.value.on('welcome', fn)
    return () => {
      try { socket.value.off('welcome', fn) } catch (e) { /* ignore */ }
    }
  }

  return {
    // State
    authenticated, connected, serverName, connectionName, username,

    // Actions
    init, logout, sendMessage, receiveMessageHandler, receiveServerMessageHandler
  }
})