import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext.jsx'

export default function FavoriteButton({ productId, size = 22 }) {
  const { profile, login } = useAuth()
  const [favoriteId, setFavoriteId] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (profile) checkFavorite()
    else setFavoriteId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, productId])

  async function checkFavorite() {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', profile.id)
      .eq('product_id', productId)
      .maybeSingle()
    setFavoriteId(data?.id || null)
  }

  async function toggle(e) {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    try {
      if (!profile) {
        await login()
        setBusy(false)
        return
      }
      if (favoriteId) {
        await supabase.from('favorites').delete().eq('id', favoriteId)
        setFavoriteId(null)
      } else {
        const { data } = await supabase
          .from('favorites')
          .insert({ user_id: profile.id, product_id: productId })
          .select()
          .single()
        setFavoriteId(data?.id || null)
      }
    } catch {
      // 로그인 실패 등은 조용히 무시 (Pi Browser 아닐 수 있음)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={favoriteId ? '찜 취소' : '찜하기'}
      style={{
        border: 'none',
        background: 'transparent',
        padding: 4,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 0,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 20.5s-7.5-4.6-10-9.3C.4 8 1.7 4.5 5 3.6c2.1-.6 4.2.3 5.3 2 .3.4.9.4 1.2 0 1.1-1.7 3.2-2.6 5.3-2 3.3.9 4.6 4.4 3 7.6-2.5 4.7-10 9.3-10 9.3z"
          fill={favoriteId ? 'var(--color-stamp)' : 'none'}
          stroke={favoriteId ? 'var(--color-stamp)' : 'var(--color-muted)'}
          strokeWidth="1.8"
        />
      </svg>
    </button>
  )
}
