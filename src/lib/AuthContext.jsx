import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { initPi, piAuthenticate } from './pi'

const AuthContext = createContext(null)

const STORAGE_KEY = 'pimarket_profile'

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initPi()
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setProfile(JSON.parse(saved))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  async function login() {
    const auth = await piAuthenticate()
    const piUsername = auth.user.username

    // 기존 프로필 조회, 없으면 생성
    let { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('pi_username', piUsername)
      .maybeSingle()

    if (!existing) {
      const { data: created, error } = await supabase
        .from('profiles')
        .insert({ pi_username: piUsername, display_name: piUsername })
        .select()
        .single()
      if (error) throw error
      existing = created
    }

    setProfile(existing)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    return existing
  }

  function logout() {
    setProfile(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
