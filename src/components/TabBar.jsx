import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: '홈', icon: '🏠' },
  { to: '/new', label: '판매하기', icon: '📷' },
  { to: '/chats', label: '채팅', icon: '💬' },
  { to: '/my', label: '마이', icon: '👤' },
]

export default function TabBar() {
  return (
    <nav className="tabbar">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}
        >
          <span style={{ fontSize: 18 }}>{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
