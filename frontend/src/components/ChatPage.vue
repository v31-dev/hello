<script setup>
import { useServerStore } from '@/stores/server';
import { ref, useTemplateRef, nextTick, watch } from 'vue';

const chatListBottom = useTemplateRef('chatListBottom')
const message = ref('')
const server = useServerStore()

async function scrollTochatListBottom() {
  await nextTick()
  chatListBottom.value.$el.scrollIntoView({ behavior: 'smooth' })
}

// Auto-scroll when new messages arrive
watch(() => server.chats.length, () => {
  scrollTochatListBottom()
})

function sendMessage(pmessage) {
  const chat = ref({
    self: true,
    user: server.username,
    chat: pmessage,
    loading: true
  })

  server.sendMessage(pmessage, () => {
    chat.value.loading = false
  })
  
  server.addChat(chat.value)
  message.value = ''
}

// For re-connection scenarios
server.connectionHandler(() => {
  if (server.username) {
    server.login()
  }
})
</script>

<template>
  <v-main>
    <v-container>
      <v-col>
        <v-card v-for="(chat, index) in server.chats" :key="index"
          prepend-icon="mdi-account" :color="chat.self ? 'blue' : null"
          :title="chat.user"
          class="mb-4">
          <v-card-text>{{chat.chat}}</v-card-text>
          <v-card-actions v-if="chat.loading">
            <v-btn :prepend-icon="'mdi-check'" slim size="x-small" :loading="chat.loading" disabled class="ps-0 pe-0 ms-0"/>
          </v-card-actions>
        </v-card>
        <v-spacer ref="chatListBottom" />
      </v-col>
      <v-footer app>
        <v-text-field
            v-model="message"
            clear-icon="mdi-close-circle"
            label="Message"
            type="text"
            clearable
            @keypress.enter="message.trim() == '' ? null : sendMessage(message)"
            @click:clear="message = ''"
            class="align-center justify-center"
          >
            <template #append>
              <v-btn
                icon="mdi-send"
                variant="text"
                :disabled="message.trim() === ''"
                @click="sendMessage(message)"
              />
            </template>
          </v-text-field>
      </v-footer>
    </v-container>
  </v-main>
</template>