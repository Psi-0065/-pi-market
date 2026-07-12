import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext.jsx'
import { useLocation } from '../lib/LocationContext.jsx'

const CATEGORIES = ['디지털기기', '가구/인테리어', '유아동', '의류', '생활용품', '기타']

export default function NewProduct() {
  const { profile, login } = useAuth()
  const { location } = useLocation()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  function handleFileChange(e) {
    const selected = Array.from(e.target.files).slice(0, 5)
    setFiles(selected)
    setPreviews(selected.map((f) => URL.createObjectURL(f)))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')

    if (!profile) {
      try {
        await login()
      } catch (err) {
        setErrorMsg('Pi 로그인이 필요해요. Pi Browser에서 열어주세요.')
        return
      }
    }
    if (!location) {
      setErrorMsg('위치 정보가 필요해요. 홈 화면에서 위치 권한을 허용해주세요.')
      return
    }
    if (!title.trim() || !price) {
      setErrorMsg('제목과 가격은 필수예요.')
      return
    }

    setSubmitting(true)
    try {
      const imageUrls = []
      for (const file of files) {
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, file)
        if (uploadError) throw uploadError
        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(path)
        imageUrls.push(publicUrl.publicUrl)
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          seller_id: profile.id,
          title: title.trim(),
          description: description.trim(),
          price_pi: Number(price),
          category,
          images: imageUrls,
          latitude: location.latitude,
          longitude: location.longitude,
          region_label: location.label,
        })
        .select()
        .single()

      if (error) throw error
      navigate(`/product/${data.id}`)
    } catch (err) {
      setErrorMsg(err.message || '등록 중 오류가 발생했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <span className="eyebrow">SELL</span>
      <h1 className="h1">우리 동네에 판매하기</h1>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>사진 (최대 5장)</label>
          <input type="file" accept="image/*" multiple onChange={handleFileChange} />
          {previews.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {previews.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover' }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="field">
          <label>제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 거의 새 것 아이패드 팝니다"
          />
        </div>

        <div className="field">
          <label>카테고리</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>가격 (π Pi)</label>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="field">
          <label>설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="상품 상태, 거래 방식 등을 자세히 적어주세요."
          />
        </div>

        <div className="field">
          <label>거래 위치</label>
          <div className="location-pill" style={{ width: 'fit-content' }}>
            <span className="radar-dot" />
            {location?.label || '위치 확인 필요'}
          </div>
        </div>

        {errorMsg && (
          <p style={{ color: 'var(--color-stamp)', fontSize: 13, marginBottom: 12 }}>{errorMsg}</p>
        )}

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? '등록 중...' : '올리기'}
        </button>
      </form>
    </div>
  )
}
