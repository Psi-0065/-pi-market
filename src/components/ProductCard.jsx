import { Link } from 'react-router-dom'
import { formatDistance } from '../lib/geo'
import FavoriteButton from './FavoriteButton.jsx'

export default function ProductCard({ product }) {
  const thumb = product.images?.[0]
  const timeAgo = getTimeAgo(product.created_at)

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      {thumb ? (
        <img className="product-thumb" src={thumb} alt={product.title} />
      ) : (
        <div className="product-thumb" />
      )}
      <div className="product-info">
        <span className="product-title">{product.title}</span>
        <span className="product-meta">
          {product.region_label || '동네 정보 없음'}
          {typeof product.distance_km === 'number' && ` · ${formatDistance(product.distance_km)}`}
          {' · '}
          {timeAgo}
        </span>
        <span className={`product-status${product.status === 'sold' ? ' sold' : ''}`}>
          {statusLabel(product.status)}
        </span>
        <span className="price-tag">π {Number(product.price_pi).toLocaleString()}</span>
      </div>
      <div style={{ position: 'absolute', top: 10, right: 4 }}>
        <FavoriteButton productId={product.id} size={20} />
      </div>
    </Link>
  )
}

function statusLabel(status) {
  if (status === 'sold') return '거래완료'
  if (status === 'reserved') return '예약중'
  return '판매중'
}

function getTimeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR')
}
