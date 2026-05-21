import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, type User } from '../services/api'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 1. Initialise Auth: check for token in localStorage and retrieve profile
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('remembery_token')
      if (storedToken) {
        setToken(storedToken)
        try {
          const res = await authAPI.me()
          setUser(res.data)
        } catch (error) {
          console.error('[AuthContext] Failed to load user profile on mount:', error)
          // Invalid or expired token: clear it
          localStorage.removeItem('remembery_token')
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }

    initializeAuth()
  }, [])

  // 2. Login function
  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const res = await authAPI.login({ email, password })
      const accessToken = res.data.access_token
      localStorage.setItem('remembery_token', accessToken)
      setToken(accessToken)

      // Fetch user profile after setting token
      const profileRes = await authAPI.me()
      setUser(profileRes.data)
    } catch (error: any) {
      console.error('[AuthContext] Login failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // 3. Signup function
  const signup = async (email: string, password: string, name: string) => {
    setLoading(true)
    try {
      // 1. Signup the user
      await authAPI.signup({ email, password, name })
      
      // 2. Automatically log them in after signup
      const res = await authAPI.login({ email, password })
      const accessToken = res.data.access_token
      localStorage.setItem('remembery_token', accessToken)
      setToken(accessToken)

      // 3. Fetch user profile
      const profileRes = await authAPI.me()
      setUser(profileRes.data)
    } catch (error: any) {
      console.error('[AuthContext] Signup failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // 4. Logout function
  const logout = () => {
    localStorage.removeItem('remembery_token')
    setToken(null)
    setUser(null)
  }

  // 5. Refresh User function (useful after onboarding or profile updates)
  const refreshUser = async () => {
    if (!token) return
    try {
      const profileRes = await authAPI.me()
      setUser(profileRes.data)
    } catch (error) {
      console.error('[AuthContext] Failed to refresh user profile:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
