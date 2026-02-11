import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { io } from 'socket.io-client'


export const useServerStore = defineStore('server', () => {
    const token = ref('')
    const username = ref('')
    const hostname = ref('')
    const connected = ref(false)   
    const socket = ref('')
    const chats = ref([{
      self: false,
      loading: false,
      user: 'Server',
      chat: 'Welcome to the chat room! Please be civil and have fun!'
    }])
  
    const name = computed(() => `${username.value}:${socket.value.id}@${hostname.value}`)

    function init(pUsername, pToken) {
      token.value = pToken
      username.value = pUsername

      socket.value = io({ 
        path: '/api/ws/', 
        transports: ["websocket"],
        upgrade: false,
        autoConnect: false,
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
        hostname.value = host
      })

      // Always listen for incoming messages and add to store
      socket.value.on('chat', (chat) => {
        chat.self = false
        chat.loading = false
        chats.value.push(chat)
      })
    }

    // For handling re-connect scenarios
    function connectionHandler(fn) {
      socket.value.on("connect", fn)
    }

    async function login() {
      socket.value.connect()
    }

    function logout() {
      socket.value.disconnect()
    }

    function sendMessage(message, ack) {
      socket.value.emit('chat', message, ack)
    }

    function addChat(chat) {
      chats.value.push(chat)
    }

    return { 
      username, name, connected, chats,
      init, login, logout, sendMessage, connectionHandler, addChat
    }
})