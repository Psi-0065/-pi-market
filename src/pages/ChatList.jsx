import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext.jsx'

export default function ChatList() {
  const { profile, login } = useAuth()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) loadChats()
    else setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function loadChats() {
    setLoading(true)
    const { data } = await supabase
      .from('chats')
      .select('*, products(title, price_pi, images, status)')
      .or(`buyer_id.eq.${profile.id},seller_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })
    setChats(data || [])
    setLoading(false)
  }

  if (!profile) {
    return (
      <div className="page empty-state">
        <p>Pi 계정으로 로그인하면 채팅 목록을 볼 수 있어요.</p>
        <button className="btn btn-primary" onClick={login}>
          Pi 계정으로 로그인
        </button>
      </div>
    )
  }

  return (
    <div className="page">
      <span className="eyebrow">CHAT</span>
      <h1 className="h1">채팅</h1>
      {loading && <p className="empty-state">불러오는 중...</p>}
      {!loading && chats.length === 0 && <p className="empty-state">아직 채팅이 없어요.</p>}
      <div className="product-list">
        {chats.map((chat) => (
          <Link key={chat.id} to={`/chat/${chat.id}`} className="product-card">
            {chat.products?.images?.[0] ? (
              <img className="product-thumb" src={chat.products.images[0]} alt="" />
            ) : (
              <div className="product-thumb" />
            )}
            <div className="product-info">
              <span className="product-title">{chat.products?.title}</span>
              <span className="product-meta">π {Number(chat.products?.price_pi).toLocaleString()}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
