import { apiClient } from './client'
import type { User } from '@/types'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload extends LoginPayload {
  name: string
  role?: 'admin' | 'operator' | 'viewer'
}

export interface AuthResponse {
  user: User
  token: string
}

export const authApi = {
  login: (data: LoginPayload) =>
    apiClient.post('/api/auth/login', data).then((r) => r.data),

  register: (data: RegisterPayload) =>
    apiClient.post('/api/auth/register', data).then((r) => r.data),

  getProfile: () =>
    apiClient.get('/api/auth/profile').then((r) => r.data),
}
