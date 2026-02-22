import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useChatStore = defineStore('chat', () => {
  const chats = ref([])
  
  return {
    // State
    chats
  }
})