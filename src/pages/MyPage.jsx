import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext.jsx'
import ProductCard from '../components/ProductCard.jsx'

export default function MyPage() {
  const { profile, login, logout } = useAuth()
  const [myProducts, setMyProducts] = useState([])
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    if (profile) loadMyProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function loadMyProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false })
    setMyProducts(data || [])
  }

  async function handleLogin() {
    setLoginError('')
    try {
      await login()
    } catch (err) {
      setLoginError('Pi 로그인에 실패했어요. Pi Browser 앱에서 열어주세요.')
    }
  }

  if (!profile) {
    return (
      <div className="page empty-state">
        <p style={{ fontSize: 32, marginBottom: 8 }}>π</p>
        <p>Pi 계정으로 로그인하고</p>
        <p>우리 동네 거래를 시작해보세요.</p>
        <button className="btn btn-primary" onClick={handleLogin} style={{ marginTop: 16 }}>
          Pi 계정으로 로그인
        </button>
        {loginError && (
          <p style={{ color: 'var(--color-stamp)', fontSize: 13, marginTop: 10 }}>{loginError}</p>
        )}
      </div>
    )
  }

  return (
    <div className="page">
      <span className="eyebrow">MY</span>
      <h1 className="h1">마이페이지</h1>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 16,
          background: 'var(--color-surface)',
          borderRadius: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--color-primary-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            color: 'var(--color-primary-dark)',
          }}
        >
          {(profile.display_name || profile.pi_username || 'P')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>{profile.display_name || profile.pi_username}</div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>@{profile.pi_username}</div>
        </div>
        <button className="btn btn-ghost" onClick={logout} style={{ padding: '8px 12px', fontSize: 13 }}>
          로그아웃
        </button>
      </div>

      <Link
        to="/favorites"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'var(--color-surface)',
          borderRadius: 14,
          marginBottom: 20,
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        <span>❤️ 찜한 상품</span>
        <span style={{ color: 'var(--color-muted)' }}>›</span>
      </Link>

      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>내가 올린 판매글</h2>
      {myProducts.length === 0 && (
        <p className="empty-state" style={{ padding: '30px 0' }}>
          아직 등록한 상품이 없어요.
        </p>
      )}
      <div className="product-list">
        {myProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}
