import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLocation } from '../lib/LocationContext.jsx'
import ProductCard from '../components/ProductCard.jsx'

const CATEGORIES = ['전체', '디지털기기', '가구/인테리어', '유아동', '의류', '생활용품', '기타']

const RADIUS_OPTIONS = [1, 3, 5, 10, 20]

export default function Home() {
  const { location, radiusKm, setRadiusKm, status, error, refreshLocation } = useLocation()
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState('전체')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'ready' && location) {
      loadProducts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, location, radiusKm])

  async function loadProducts() {
    setLoading(true)
    const { data, error: rpcError } = await supabase.rpc('nearby_products', {
      user_lat: location.latitude,
      user_lng: location.longitude,
      radius_km: radiusKm,
    })
    if (!rpcError && data) {
      setProducts(data)
    }
    setLoading(false)
  }

  const filtered = products
    .filter((p) => category === '전체' || p.category === category)
    .filter((p) => {
      if (!search.trim()) return true
      const q = search.trim().toLowerCase()
      return (
        p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      )
    })

  return (
    <div>
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark">π</span>
          동네파이
        </div>
      </div>

      <div className="page" style={{ paddingTop: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <button className="location-pill" onClick={refreshLocation}>
            <span className="radar-dot" />
            {status === 'loading' && '위치 확인 중...'}
            {status === 'ready' && (location?.label || '내 동네')}
            {status === 'error' && '위치 다시 확인'}
          </button>

          <select
            className="radius-select"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                반경 {r}km
              </option>
            ))}
          </select>
        </div>

        {status === 'error' && (
          <div className="empty-state">
            <p>{error}</p>
            <p style={{ fontSize: 13 }}>
              위치 권한을 허용하면 우리 동네 매물을 볼 수 있어요.
            </p>
            <button className="btn btn-primary" onClick={refreshLocation}>
              위치 권한 허용하기
            </button>
          </div>
        )}

        {status === 'ready' && (
          <>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="동네에서 검색해보세요"
              style={{
                width: '100%',
                border: '1px solid var(--color-border)',
                borderRadius: 12,
                padding: '11px 14px',
                fontSize: 14,
                marginBottom: 12,
                background: 'var(--color-surface)',
              }}
            />

            <div className="chip-row">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={`chip${category === c ? ' active' : ''}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>

            {loading && <p className="empty-state">동네 매물을 불러오는 중...</p>}

            {!loading && filtered.length === 0 && (
              <div className="empty-state">
                <p>
                  {search.trim()
                    ? `'${search}'에 대한 검색 결과가 없어요.`
                    : `반경 ${radiusKm}km 안에 등록된 상품이 없어요.`}
                </p>
                <p style={{ fontSize: 13 }}>반경을 넓혀보거나 첫 판매글을 올려보세요!</p>
              </div>
            )}

            <div className="product-list">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
