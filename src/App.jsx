import { Routes, Route } from 'react-router-dom'
import TabBar from './components/TabBar.jsx'
import Home from './pages/Home.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import NewProduct from './pages/NewProduct.jsx'
import ChatList from './pages/ChatList.jsx'
import ChatRoom from './pages/ChatRoom.jsx'
import MyPage from './pages/MyPage.jsx'
import Favorites from './pages/Favorites.jsx'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/new" element={<NewProduct />} />
        <Route path="/chats" element={<ChatList />} />
        <Route path="/chat/:chatId" element={<ChatRoom />} />
        <Route path="/my" element={<MyPage />} />
        <Route path="/favorites" element={<Favorites />} />
      </Routes>
      <TabBar />
    </>
  )
}
