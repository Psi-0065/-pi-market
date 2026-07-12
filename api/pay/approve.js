// POST /api/pay/approve
// body: { paymentId, productId, buyerId, sellerId, amount }
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { paymentId, productId, buyerId, sellerId, amount } = req.body || {}
  if (!paymentId || !productId || !buyerId || !sellerId || !amount) {
    return res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' })
  }

  try {
    // 1. Pi 서버에 결제 승인 요청
    const piRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${process.env.PI_API_KEY}`,
      },
    })

    if (!piRes.ok) {
      const errText = await piRes.text()
      return res.status(502).json({ error: 'Pi 결제 승인 실패', detail: errText })
    }

    // 2. Supabase에 거래 레코드 기록 (service role 키 사용, 서버 전용)
    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL_SERVER || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { error } = await supabaseAdmin.from('transactions').upsert(
      {
        pi_payment_id: paymentId,
        product_id: productId,
        buyer_id: buyerId,
        seller_id: sellerId,
        amount,
        status: 'approved',
      },
      { onConflict: 'pi_payment_id' }
    )

    if (error) {
      return res.status(500).json({ error: 'DB 기록 실패', detail: error.message })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: '서버 오류', detail: err.message })
  }
}
