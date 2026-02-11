import axios from 'axios'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { io } from 'socket.io-client'


export const useServerStore = defineStore('server', () => {
    const token = ref('')
    const username = ref('')
    const hostname = ref('')
    const connected = ref(false)   
    const socket = ref('')
  
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
    }

    // For handling re-connect scenarios
    function connectionHandler(fn) {
      socket.value.on("connect", fn)
    }

    async function login() {
      await axios.get('/api/user', {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })
      socket.value.connect()
    }

    function logout() {
      socket.value.disconnect()
    }

    function sendMessage(message, ack) {
      socket.value.emit('chat', message, ack)
    }

    function receiveMessageHandler(fn) {
      socket.value.on('chat', fn)
    }

    return { 
      username, name, connected,
      init, login, logout, sendMessage, receiveMessageHandler, connectionHandler 
    }
})