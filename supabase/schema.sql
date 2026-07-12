-- ============================================================
-- 동네파이(Pi Market) Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 전체 붙여넣고 실행하세요.
-- ============================================================

-- 1. 프로필 (Pi 계정과 연결)
-- 주의: Pi Browser의 Pi.authenticate()는 Supabase Auth 세션을 만들지 않습니다.
-- 그래서 auth.uid() 기반 RLS 대신 pi_username을 앱단에서 식별자로 사용하는
-- 단순화된 구조입니다. (아래 README의 "보안 한계" 섹션 참고)
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  pi_username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "프로필은 누구나 조회 가능"
  on profiles for select using (true);

create policy "누구나 프로필 생성 가능 (Pi 로그인 시 자동 생성)"
  on profiles for insert with check (true);

create policy "누구나 프로필 수정 가능 (앱단에서 본인만 수정하도록 제어)"
  on profiles for update using (true);

-- 2. 상품 (당근마켓 스타일 중고거래 글)
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  price_pi numeric(12, 4) not null default 0,
  category text default '기타',
  images jsonb default '[]'::jsonb,
  status text not null default 'selling' check (status in ('selling', 'reserved', 'sold')),
  latitude double precision not null,
  longitude double precision not null,
  region_label text,
  view_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table products enable row level security;

create policy "상품은 누구나 조회 가능"
  on products for select using (true);

create policy "누구나 상품 등록 가능 (앱단에서 seller_id를 본인으로 강제)"
  on products for insert with check (true);

create policy "누구나 상품 수정 가능 (앱단에서 본인 글만 수정 노출)"
  on products for update using (true);

create policy "누구나 상품 삭제 가능 (앱단에서 본인 글만 삭제 노출)"
  on products for delete using (true);

create index if not exists idx_products_status on products(status);
create index if not exists idx_products_created on products(created_at desc);

-- 3. 찜/즐겨찾기
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

alter table favorites enable row level security;

create policy "누구나 찜 목록 조회 가능 (앱단에서 본인 것만 필터링)"
  on favorites for select using (true);

create policy "누구나 찜 추가 가능"
  on favorites for insert with check (true);

create policy "누구나 찜 삭제 가능 (앱단에서 본인 것만 노출)"
  on favorites for delete using (true);

-- 4. 채팅방
create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  buyer_id uuid not null references profiles(id) on delete cascade,
  seller_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(product_id, buyer_id)
);

alter table chats enable row level security;

create policy "누구나 채팅방 조회 가능 (앱단에서 당사자만 노출)"
  on chats for select using (true);

create policy "누구나 채팅방 생성 가능"
  on chats for insert with check (true);

-- 5. 메시지
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

alter table messages enable row level security;

create policy "누구나 메시지 조회 가능 (앱단에서 당사자만 노출)"
  on messages for select using (true);

create policy "누구나 메시지 전송 가능"
  on messages for insert with check (true);

-- 6. 거래(파이 결제) 내역
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  buyer_id uuid not null references profiles(id) on delete cascade,
  seller_id uuid not null references profiles(id) on delete cascade,
  pi_payment_id text unique,
  amount numeric(12, 4) not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

alter table transactions enable row level security;

create policy "누구나 거래 조회 가능 (앱단에서 당사자만 노출)"
  on transactions for select using (true);

create policy "누구나 거래 생성 가능"
  on transactions for insert with check (true);

-- ============================================================
-- 7. GPS 반경 검색 RPC 함수 (Haversine 공식, 확장 불필요)
-- 사용 예: select * from nearby_products(37.5665, 126.9780, 5);
-- ============================================================
create or replace function nearby_products(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision default 5
)
returns table (
  id uuid,
  seller_id uuid,
  title text,
  description text,
  price_pi numeric,
  category text,
  images jsonb,
  status text,
  latitude double precision,
  longitude double precision,
  region_label text,
  created_at timestamptz,
  distance_km double precision
)
language sql stable
as $$
  with candidates as (
    select
      p.id, p.seller_id, p.title, p.description, p.price_pi, p.category,
      p.images, p.status, p.latitude, p.longitude, p.region_label, p.created_at,
      (
        6371 * acos(
          least(1.0, greatest(-1.0,
            cos(radians(user_lat)) * cos(radians(p.latitude)) *
            cos(radians(p.longitude) - radians(user_lng)) +
            sin(radians(user_lat)) * sin(radians(p.latitude))
          ))
        )
      ) as distance_km
    from products p
    where p.status = 'selling'
  )
  select *
  from candidates
  where distance_km <= radius_km
  order by distance_km asc;
$$;

-- ============================================================
-- 8. Storage: 상품 이미지 버킷
-- 대시보드 > Storage 에서 'product-images' 버킷을 만들고
-- Public bucket 으로 설정하거나 아래 정책을 사용하세요.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "상품 이미지 누구나 조회"
  on storage.objects for select using (bucket_id = 'product-images');

create policy "누구나 상품 이미지 업로드 가능"
  on storage.objects for insert with check (bucket_id = 'product-images');
