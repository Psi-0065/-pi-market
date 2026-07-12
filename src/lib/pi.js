// Pi SDK는 index.html에서 <script src="https://sdk.minepi.com/pi-sdk.js"></script> 로 로드됩니다.
// window.Pi 로 접근합니다.

const scopes = ['username', 'payments']

export function initPi() {
  if (!window.Pi) {
    console.warn('[pi] Pi SDK가 로드되지 않았습니다. Pi Browser에서 열어야 정상 동작합니다.')
    return
  }
  window.Pi.init({ version: '2.0', sandbox: import.meta.env.DEV })
}

// Pi 계정으로 로그인 (username + accessToken 반환)
export function piAuthenticate(onIncompletePaymentFound) {
  if (!window.Pi) {
    return Promise.reject(new Error('Pi Browser에서 접속해주세요.'))
  }
  return window.Pi.authenticate(scopes, onIncompletePaymentFound || (() => {}))
}

// 상품 구매 결제 생성
// product: { id, title, price_pi }, callbacks: { onReadyForServerApproval, onReadyForServerCompletion, onCancel, onError }
export function createPiPayment(product, callbacks) {
  if (!window.Pi) {
    throw new Error('Pi Browser에서 접속해주세요.')
  }
  return window.Pi.createPayment(
    {
      amount: product.price_pi,
      memo: `동네파이 거래: ${product.title}`,
      metadata: { productId: product.id },
    },
    {
      onReadyForServerApproval: callbacks.onReadyForServerApproval,
      onReadyForServerCompletion: callbacks.onReadyForServerCompletion,
      onCancel: callbacks.onCancel,
      onError: callbacks.onError,
    }
  )
}
