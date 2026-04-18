// src/hooks/useAuth.jsx
import { useState, useEffect, createContext, useContext } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check local storage for fake session
    const session = localStorage.getItem('clothix_admin_session')
    if (session === 'active') {
      setUser({ username: 'clothix', role: 'admin' })
    }
    setLoading(false)
  }, [])

  const signIn = async (username, password) => {
    // Purely frontend check
    if (username === 'clothix' && password === 'clothix@123') {
      localStorage.setItem('clothix_admin_session', 'active')
      setUser({ username: 'clothix', role: 'admin' })
    } else {
      throw new Error('Invalid credentials')
    }
  }

  const signOut = async () => {
    localStorage.removeItem('clothix_admin_session')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}