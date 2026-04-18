import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, type LoginPayload, type RegisterPayload } from '@/api/auth'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (data: LoginPayload) => Promise<void>
  register: (data: RegisterPayload) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const profile = await authApi.getProfile()
          setUser(profile)
        } catch (err: any) {
          console.error('Failed to restore session:', err)
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [token])

  const login = async (data: LoginPayload) => {
    setError(null)
    setIsLoading(true)
    try {
      const res = await authApi.login(data)
      localStorage.setItem('token', res.token)
      setToken(res.token)
      setUser(res.user)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterPayload) => {
    setError(null)
    setIsLoading(true)
    try {
      const res = await authApi.register(data)
      localStorage.setItem('token', res.token)
      setToken(res.token)
      setUser(res.user)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token && !!user, isLoading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
