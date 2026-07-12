import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext.jsx'
import ProductCard from '../components/ProductCard.jsx'

export default function Favorites() {
  const { profile, login } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) loadFavorites()
    else setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function loadFavorites() {
    setLoading(true)
    const { data } = await supabase
      .from('favorites')
      .select('product_id, products(*)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    setProducts((data || []).map((f) => f.products).filter(Boolean))
    setLoading(false)
  }

  if (!profile) {
    return (
      <div className="page empty-state">
        <p>Pi 계정으로 로그인하면 찜한 상품을 볼 수 있어요.</p>
        <button className="btn btn-primary" onClick={login}>
          Pi 계정으로 로그인
        </button>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="topbar" style={{ padding: '0 0 8px' }}>
        <button className="btn-ghost btn" onClick={() => navigate('/my')} style={{ padding: '8px 12px' }}>
          ← 마이페이지
        </button>
      </div>
      <span className="eyebrow">FAVORITES</span>
      <h1 className="h1">찜한 상품</h1>
      {loading && <p className="empty-state">불러오는 중...</p>}
      {!loading && products.length === 0 && (
        <p className="empty-state">아직 찜한 상품이 없어요.</p>
      )}
      <div className="product-list">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}
