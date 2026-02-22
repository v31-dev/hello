import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useChatStore = defineStore('chat', () => {
  const chats = ref([])

  function addChat(chat) {
    chats.value.push(chat)
  }
  
  return {
    // State
    chats,
    // Actions
    addChat
  }
})