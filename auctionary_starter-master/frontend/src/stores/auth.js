import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userId: localStorage.getItem('user_id'),
    token: localStorage.getItem('token'),
  }),

  actions: {
    login(userId, token) {
      this.userId = userId
      this.token = token
      localStorage.setItem('user_id', userId)
      localStorage.setItem('token', token)
    },

    logout() {
      this.userId = null
      this.token = null
      localStorage.removeItem('user_id')
      localStorage.removeItem('token')
    },
  },
})
