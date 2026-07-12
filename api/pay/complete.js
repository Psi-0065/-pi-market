// POST /api/pay/complete
// body: { paymentId, txid, productId }
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { paymentId, txid, productId } = req.body || {}
  if (!paymentId || !txid) {
    return res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' })
  }

  try {
    // 1. Pi 서버에 결제 완료 요청
    const piRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${process.env.PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid }),
    })

    if (!piRes.ok) {
      const errText = await piRes.text()
      return res.status(502).json({ error: 'Pi 결제 완료 처리 실패', detail: errText })
    }

    // 2. Supabase 거래 상태 업데이트 + 상품 상태를 '판매완료'로 변경
    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL_SERVER || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    await supabaseAdmin
      .from('transactions')
      .update({ status: 'completed' })
      .eq('pi_payment_id', paymentId)

    if (productId) {
      await supabaseAdmin.from('products').update({ status: 'sold' }).eq('id', productId)
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: '서버 오류', detail: err.message })
  }
}
