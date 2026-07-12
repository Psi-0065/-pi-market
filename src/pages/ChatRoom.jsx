import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext.jsx'

export default function ChatRoom() {
  const { chatId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    loadMessages()
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!text.trim() || !profile) return
    const content = text.trim()
    setText('')
    await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: profile.id,
      content,
    })
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh' }}>
      <div className="topbar" style={{ padding: '0 0 12px' }}>
        <button className="btn-ghost btn" onClick={() => navigate('/chats')} style={{ padding: '8px 12px' }}>
          ← 채팅 목록
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 12 }}>
        {messages.map((m) => (
          <div key={m.id} className={`bubble-row${m.sender_id === profile?.id ? ' mine' : ''}`}>
            <div className="bubble">{m.content}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지를 입력하세요"
          style={{
            flex: 1,
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '12px 14px',
          }}
        />
        <button className="btn btn-primary" type="submit">
          전송
        </button>
      </form>
    </div>
  )
}
