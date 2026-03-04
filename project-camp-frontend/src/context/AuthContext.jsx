import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { authApi } from '../api/auth.api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // Guard against StrictMode double-invocation in development
  const didFetch = useRef(false)

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await authApi.getCurrentUser()
      setUser(res.data?.data || res.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Only run the initial session check once, even in React StrictMode
    if (!didFetch.current) {
      didFetch.current = true
      fetchCurrentUser()
    }

    const handleLogout = () => setUser(null)
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [fetchCurrentUser])

  const login = async (credentials) => {
    const res = await authApi.login(credentials)
    const userData = res.data?.data?.user || res.data?.data || res.data
    setUser(userData)
    return res
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
    }
  }

  const register = async (data) => {
    const res = await authApi.register(data)
    return res
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, refetchUser: fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}