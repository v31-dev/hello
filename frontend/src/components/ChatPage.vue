<script setup>
import { ref, useTemplateRef, nextTick, watch, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const chatListBottom = useTemplateRef('chatListBottom')
const message = ref('')
const chats = ref([])

async function scrollTochatListBottom() {
  await nextTick()
  chatListBottom.value.$el.scrollIntoView({ behavior: 'smooth' })
}

// Auto-scroll when new messages arrive
watch(() => chats.value.length, () => {
  scrollTochatListBottom()
})

function onClickSend(pMessage) {
  const chat = ref({
    self: true,
    user: authStore.username,
    chat: pMessage,
    loading: true
  })

  authStore.sendMessage(pMessage, () => {
    chat.value.loading = false
  })

  chats.value.push(chat.value)
  message.value = ''
}

// Scroll to bottom when component mounts (e.g., on reconnect)
onMounted(() => {
  scrollTochatListBottom()

  const _messageHandler = (message) => {
    const chat = ref({
      self: false,
      user: message.user,
      chat: message.chat,
      loading: false
    })
    chats.value.push(chat.value)
  }

  authStore.receiveServerMessageHandler(_messageHandler)
  authStore.receiveMessageHandler(_messageHandler)
})
</script>

<template>
  <v-main>
    <v-container>
      <v-col>
        <div v-for="(chat, index) in chats" :key="index" class="mb-4">
          <div v-if="chat.user === 'System'" class="d-flex justify-center">
            <v-chip color="grey lighten-2" text-color="black">
              {{ chat.chat }}
            </v-chip>
          </div>
          <div v-else>
            <div v-if="chat.self" class="d-flex justify-end">
              <v-card class="self-card" color="blue" prepend-icon="mdi-account" :title="chat.user">
                <v-card-text>{{ chat.chat }}</v-card-text>
                <v-card-actions v-if="chat.loading">
                  <v-btn :prepend-icon="'mdi-check'" slim size="x-small" :loading="chat.loading" disabled
                    class="ps-0 pe-0 ms-0" />
                </v-card-actions>
              </v-card>
            </div>
            <div v-else class="d-flex justify-start">
              <v-card prepend-icon="mdi-account" :title="chat.user">
                <v-card-text>{{ chat.chat }}</v-card-text>
                <v-card-actions v-if="chat.loading">
                  <v-btn :prepend-icon="'mdi-check'" slim size="x-small" :loading="chat.loading" disabled
                    class="ps-0 pe-0 ms-0" />
                </v-card-actions>
              </v-card>
            </div>
          </div>
        </div>
        <v-spacer ref="chatListBottom" />
      </v-col>
      <v-footer app>
        <v-text-field v-model="message" clear-icon="mdi-close-circle" label="Message" type="text" clearable
          @keypress.enter="message.trim() == '' ? null : onClickSend(message)" @click:clear="message = ''"
          class="align-center justify-center">
          <template #append>
            <v-btn icon="mdi-send" variant="text" :disabled="message.trim() === ''" @click="onClickSend(message)" />
          </template>
        </v-text-field>
      </v-footer>
    </v-container>
  </v-main>
</template>

<style scoped>
.self-card .v-card-text {
  text-align: right;
}
</style>