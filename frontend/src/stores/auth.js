import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { io } from 'socket.io-client'


export const useAuthStore = defineStore('auth', () => {
  const connected = ref(false)
  const username = ref(null)
  const token = ref(null)
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
    automaticSilentRenew: true,
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
        token: token.value
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

    // Only perform logout for authentication-related errors sent from the server.
    socket.value.on('connect_error', (err) => {
      console.error('Connection error:', err)

      // Server sets `error.data = { code: <code>, message: <msg> }` in auth middleware.
      const code = err?.data?.code || err?.code || err?.message

      // Codes/messages emitted by backend auth middleware
      const authCodes = ['TokenExpiredError', 'AUTH_MISSING', 'INVALID_AUDIENCE']
      const authMessages = ['Token expired', 'Authorization token missing', 'Token not issued for this client.']

      if (authCodes.includes(code) || authMessages.includes(code)) {
        logout()
      } else {
        // Non-auth connect errors: handle or ignore (don't force logout)
      }
    })
  }

  const init = async () => {
    // Handle OIDC callback route first
    if (window.location.pathname === '/callback') {
      let callbackUser = null
      try {
        await userManager.signinRedirectCallback()
        callbackUser = await userManager.getUser()
      } catch (cbError) {
        console.error('Callback processing error:', cbError)
      } finally {
        // Always clean up callback URL
        window.history.replaceState({}, document.title, '/')
      }
      if (callbackUser) {
        username.value = callbackUser.profile.preferred_username
        token.value = callbackUser.id_token
      }
      
      await initializeSocket()
      return
    }

    // Check for existing user
    let user = await userManager.getUser()
    if (user) {
      if (user.expired) {
        try {
          user = await userManager.signinSilent()
        } catch (silentError) {
          console.error('Silent signin error:', silentError)
          await userManager.signinRedirect()
          // Clean up URL in case redirect returns to callback
          window.history.replaceState({}, document.title, '/')
          return
        }
      }
      if (user) {
        username.value = user.profile.preferred_username
        token.value = user.id_token
      }

      await initializeSocket()
      return
    }

    // No user found, start signin flow
    await userManager.signinRedirect()
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
    if (!socket.value) return () => { }
    socket.value.on('chat', fn)
    return () => {
      try { socket.value.off('chat', fn) } catch (e) { /* ignore */ }
    }
  }

  function receiveServerMessageHandler(fn) {
    if (!socket.value) return () => { }
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
