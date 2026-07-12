import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext.jsx'
import { createPiPayment } from '../lib/pi'
import { formatDistance, haversineDistanceKm } from '../lib/geo'
import { useLocation } from '../lib/LocationContext.jsx'
import FavoriteButton from '../components/FavoriteButton.jsx'

export default function ProductDetail() {
  const { id } = useParams()
  const { profile, login } = useAuth()
  const { location } = useLocation()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadProduct()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadProduct() {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').eq('id', id).single()
    setProduct(data)
    if (data) {
      const { data: sellerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.seller_id)
        .single()
      setSeller(sellerData)
    }
    setLoading(false)
  }

  async function handleChat() {
    if (!profile) {
      try {
        await login()
      } catch {
        setMessage('Pi 로그인이 필요해요. Pi Browser에서 열어주세요.')
        return
      }
    }
    const { data: existing } = await supabase
      .from('chats')
      .select('*')
      .eq('product_id', product.id)
      .eq('buyer_id', profile.id)
      .maybeSingle()

    if (existing) {
      navigate(`/chat/${existing.id}`)
      return
    }

    const { data: chat, error } = await supabase
      .from('chats')
      .insert({
        product_id: product.id,
        buyer_id: profile.id,
        seller_id: product.seller_id,
      })
      .select()
      .single()

    if (!error) navigate(`/chat/${chat.id}`)
  }

  async function handleBuy() {
    setMessage('')
    if (!profile) {
      try {
        await login()
      } catch {
        setMessage('Pi 로그인이 필요해요. Pi Browser에서 열어주세요.')
        return
      }
    }
    setBuying(true)
    try {
      createPiPayment(product, {
        onReadyForServerApproval: async (paymentId) => {
          await fetch('/api/pay/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentId,
              productId: product.id,
              buyerId: profile.id,
              sellerId: product.seller_id,
              amount: product.price_pi,
            }),
          })
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          await fetch('/api/pay/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid, productId: product.id }),
          })
          setMessage('결제가 완료됐어요! 판매자와 채팅으로 거래를 마무리하세요.')
          loadProduct()
        },
        onCancel: () => setMessage('결제가 취소됐어요.'),
        onError: (err) => setMessage(`결제 오류: ${err?.message || err}`),
      })
    } catch (err) {
      setMessage(err.message || 'Pi Browser에서 열어야 결제할 수 있어요.')
    } finally {
      setBuying(false)
    }
  }

  if (loading) return <div className="page empty-state">불러오는 중...</div>
  if (!product) return <div className="page empty-state">상품을 찾을 수 없어요.</div>

  const isMine = profile && profile.id === product.seller_id
  const distance =
    location && haversineDistanceKm(location.latitude, location.longitude, product.latitude, product.longitude)

  return (
    <div>
      <div className="topbar">
        <button className="btn-ghost btn" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}>
          ← 뒤로
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 16px' }}>
        {(product.images?.length ? product.images : [null]).map((src, i) =>
          src ? (
            <img
              key={i}
              src={src}
              alt=""
              style={{ width: 260, height: 260, borderRadius: 16, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div
              key={i}
              style={{
                width: 260,
                height: 260,
                borderRadius: 16,
                background: 'var(--color-primary-soft)',
                flexShrink: 0,
              }}
            />
          )
        )}
      </div>

      <div className="page">
        <span className={`product-status${product.status === 'sold' ? ' sold' : ''}`}>
          {product.status === 'sold' ? '거래완료' : product.status === 'reserved' ? '예약중' : '판매중'}
        </span>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <h1 className="h1" style={{ marginBottom: 4 }}>
            {product.title}
          </h1>
          <FavoriteButton productId={product.id} size={26} />
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 12 }}>
          {seller?.display_name || seller?.pi_username} · {product.region_label}
          {distance !== null && distance !== false && ` · ${formatDistance(distance)}`}
        </p>

        <span className="price-tag" style={{ fontSize: 20, marginBottom: 16 }}>
          π {Number(product.price_pi).toLocaleString()}
        </span>

        <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginTop: 16 }}>
          {product.description || '상품 설명이 없습니다.'}
        </p>

        {message && (
          <p style={{ color: 'var(--color-primary)', fontSize: 13, margin: '12px 0' }}>{message}</p>
        )}

        {!isMine && product.status === 'selling' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={handleChat} style={{ flex: 1 }}>
              💬 채팅하기
            </button>
            <button className="btn btn-stamp" onClick={handleBuy} disabled={buying} style={{ flex: 1 }}>
              {buying ? '처리 중...' : 'π 로 구매하기'}
            </button>
          </div>
        )}

        {isMine && (
          <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 20 }}>
            내가 등록한 상품이에요.{' '}
            <Link to="/my" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
              마이페이지에서 관리하기
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
