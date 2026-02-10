import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { ref, computed } from 'vue'

const userManager = new UserManager({
  authority: import.meta.env.VITE_AUTH_URL,
  client_id: import.meta.env.VITE_AUTH_CLIENT_ID,
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: `${window.location.origin}/`,
  response_type: 'code',
  scope: 'openid profile email groups',
  userStore: new WebStorageStateStore({ store: window.localStorage }),
})

const user = ref(null)
const isAuthenticated = computed(() => !!user.value)

export function useAuth() {
  const login = async () => {
    try {
      await userManager.signinRedirect()
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  const logout = async () => {
    try {
      await userManager.signoutRedirect()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleCallback = async () => {
    try {
      const signinResponse = await userManager.signinRedirectCallback()
      user.value = signinResponse
      return signinResponse
    } catch (error) {
      console.error('Signin callback error:', error)
      throw error
    }
  }

  const getUser = async () => {
    try {
      const currentUser = await userManager.getUser()
      if (currentUser) {
        user.value = currentUser
      }
      return currentUser
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  }

  const getToken = () => {
    return user.value?.id_token || null
  }

  const getUserName = () => {
    return user.value?.profile?.name || user.value?.profile?.preferred_username || 'Unknown'
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
    handleCallback,
    getUser,
    getToken,
    getUserName,
  }
}
