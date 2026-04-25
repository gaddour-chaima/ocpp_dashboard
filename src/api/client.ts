import axios from 'axios'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => {
    // Automatically unwrap backend payload envelopes: { success: true, data: ..., meta?: ... }
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      // If there is pagination metadata, preserve { data, meta } together
      // so infinite-scroll hooks can read both the list and page info.
      if (response.data.meta) {
        response.data = { data: response.data.data, meta: response.data.meta }
      } else {
        response.data = response.data.data
      }
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
