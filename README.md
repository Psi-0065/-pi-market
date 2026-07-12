# 동네파이 (Pi Market) 🏘️π

GPS 기반 우리 동네 파이(Pi) 중고거래 마켓플레이스. 당근마켓 UX를 참고해
Pi Network 결제로 거래하는 미니앱입니다.

## 주요 기능

- 📍 **GPS 반경 검색**: 내 위치 기준 1~20km 반경 안의 매물만 보기
- 🔍 **검색 & 카테고리 필터**: 제목/설명 키워드 검색, 카테고리별 필터링
- 🏷️ **상품 등록/조회**: 사진, 가격(π), 카테고리, 설명
- ❤️ **찜하기**: 관심 상품 저장, 마이페이지에서 모아보기
- 💬 **실시간 채팅**: Supabase Realtime 기반 1:1 채팅
- 💰 **Pi 결제**: Pi SDK `createPayment` → 서버 approve/complete 연동
- 👤 **Pi 계정 로그인**: `Pi.authenticate()`로 사용자 식별

## 기술 스택

- Frontend: React + Vite + React Router
- Backend: Supabase (Postgres + Realtime + Storage)
- 결제: Pi Network SDK + Vercel 서버리스 함수(`/api/pay`)
- 배포: Vercel

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 프로젝트 설정

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 전체 내용을 붙여넣고 실행
3. Project Settings > API 에서 URL과 anon key 확인

### 3. 환경변수 설정

`.env.example`을 복사해 `.env` 파일을 만들고 값을 채우세요.

```bash
cp .env.example .env
```

**절대 `.env` 파일을 GitHub에 커밋하거나 채팅에 붙여넣지 마세요.**
`.gitignore`에 이미 포함되어 있습니다.

### 4. 로컬 실행

```bash
npm run dev
```

> ⚠️ Pi SDK(`window.Pi`)는 **Pi Browser 앱** 안에서만 정상 동작합니다.
> 일반 브라우저에서는 로그인/결제 버튼이 에러를 띄우는 게 정상입니다.
> Pi Developer Portal에서 앱을 등록하고 sandbox 모드로 테스트하세요.

### 5. Vercel 배포

1. GitHub 리포지토리에 push
2. Vercel에서 Import → 이 리포지토리 선택
3. Vercel 프로젝트 설정 > Environment Variables 에 아래 값 등록:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `PI_API_KEY` (Pi Developer Portal에서 발급, 서버 전용)
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase Project Settings > API, 서버 전용)
   - `VITE_SUPABASE_URL_SERVER` (VITE_SUPABASE_URL과 동일한 값)
4. Deploy

`api/pay/approve.js`, `api/pay/complete.js`는 Vercel이 자동으로 서버리스
함수로 인식합니다.

## ⚠️ 보안 한계 (꼭 읽어주세요)

이 프로젝트는 **Supabase Auth를 사용하지 않고** Pi 로그인 결과(`pi_username`)를
앱 안에서만 신뢰하는 단순화된 구조입니다. 그래서 데이터베이스 RLS 정책이
"누구나 조회/수정 가능"으로 열려 있고, 실제 권한 검사는 프론트엔드 코드가
담당합니다. 이는:

- 개발 속도를 위한 **의도적인 트레이드오프**입니다 (MVP/사이드 프로젝트용)
- 악의적인 사용자가 API를 직접 호출하면 타인의 글을 수정/삭제할 수 있는
  **이론적 위험**이 있습니다
- 실사용자가 늘어나면 **Supabase Edge Function으로 Pi accessToken을 검증하고
  커스텀 JWT를 발급**해서 `auth.uid()` 기반 RLS로 전환하는 것을 권장합니다

지금 단계(테스트/소규모 운영)에서는 문제 없지만, 나중에 사용자가 늘면 꼭
이 부분을 강화해주세요. 필요하면 다음에 이 부분만 따로 업그레이드해드릴게요.

## 프로젝트 구조

```
pi-market/
├── api/pay/           # Vercel 서버리스 함수 (Pi 결제 approve/complete)
├── supabase/
│   └── schema.sql     # DB 스키마 + RLS + GPS 검색 RPC
├── src/
│   ├── lib/           # supabase 클라이언트, GPS, Pi SDK, Auth/Location Context
│   ├── components/    # ProductCard, TabBar
│   └── pages/         # Home, ProductDetail, NewProduct, ChatList, ChatRoom, MyPage
```

## 다음에 추가하면 좋을 기능

- 판매자 매너온도 / 후기 시스템
- 이미지 여러 장 업로드 시 순서 변경
- 예약중 상태로 변경하는 버튼 (거래 진행 중 표시)
- 채팅 목록에 안 읽은 메시지 표시
