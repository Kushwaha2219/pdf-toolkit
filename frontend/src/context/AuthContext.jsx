import { createContext, useContext, useEffect, useState } from 'react'
import { getJson, postJson } from '../utils/api.js'

const TOKEN_KEY = 'pdfvish_token'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(true)

  // On load (or token change), validate the token and fetch the current user.
  useEffect(() => {
    let active = true
    async function loadUser() {
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const { user: me } = await getJson('/auth/me', token)
        if (active) setUser(me)
      } catch {
        // Token invalid/expired — clear it.
        if (active) {
          localStorage.removeItem(TOKEN_KEY)
          setToken(null)
          setUser(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    loadUser()
    return () => {
      active = false
    }
  }, [token])

  const persist = (newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    setUser(newUser)
  }

  const login = async (email, password) => {
    const { token: t, user: u } = await postJson('/auth/login', { email, password })
    persist(t, u)
    return u
  }

  // Signup no longer logs the user in — it triggers a verification email and
  // returns the server response (e.g. { needs_verification, email, dev_code }).
  const signup = (name, email, password) =>
    postJson('/auth/signup', { name, email, password })

  // Confirm the emailed 6-digit code; on success the user is logged in.
  const verifyEmail = async (email, code) => {
    const { token: t, user: u } = await postJson('/auth/verify', { email, code })
    persist(t, u)
    return u
  }

  const resendCode = (email) => postJson('/auth/resend', { email })

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  // Returns the server response (includes dev_reset_link while in dev mode).
  const forgotPassword = (email) => postJson('/auth/forgot', { email })

  const resetPassword = (resetToken, password) =>
    postJson('/auth/reset', { token: resetToken, password })

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    verifyEmail,
    resendCode,
    logout,
    forgotPassword,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
