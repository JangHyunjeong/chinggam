# 칭찬감옥 (Praise Prison) 개발 기록 및 계획

친구의 치명적인 매력을 제보(신고)하여 칭찬 감옥에 가두는 웹 서비스입니다.

## 0. 프로젝트 규칙 및 컨셉
- **언어**: 한국어 (컨셉: 법정/수사/감옥 메타포)
- **디자인**: 네오 브루탈리즘 (오렌지/블랙, 굵은 테두리, 하드 쉐도우)
- **기술 스택**: Next.js 14+ (App Router), Tailwind CSS v4, Supabase (Auth, DB)
- **핵심 용어**:
    - **칭찬** → **제보 (신고)**
    - **장점/매력** → **죄목 / 증거**
    - **가입/로그인** → **입소 / 신원 확인**

## 1. 개발 진행 현황 (완료)

### ✅ 1단계: 프로젝트 환경 설정
- [x] Next.js 14 초기화
- [x] Tailwind CSS v4 + Pretendard 폰트 설정
- [x] 기본 UI (네오 브루탈리즘 카드, 버튼, 애니메이션)

### ✅ 2단계: 데이터베이스 및 인증
- [x] Supabase Kakao OAuth 연동
- [x] DB 스키마 설계 (`users` 테이블, `praises` 테이블)
- [x] 트리거(Trigger)를 이용한 사용자 정보 자동 저장

### ✅ 3단계: 핵심 UI 및 기능 구현
- [x] **랜딩 (`/`)**: "치명적인 매력을 가두는 곳" 컨셉 소개 및 입소(로그인)
- [x] **대시보드 (`/dashboard`)**:
    - 나의 죄명 (매력 키워드) 클라우드 뷰
    - 수집된 증거 (받은 칭찬) 및 내가 신고한 기록 탭 기능
    - 무한 스크롤 및 디테일 모달
- [x] **신고하기 (`/praise/[userId]`)**:
    - 단계별(Step-by-step) 제보 시스템
    - 키워드(죄목) 입력 → 증거(사유) 작성 → 접수 완료
    - 카카오톡 공유에 최적화된 UX

## 2. 현재 파일 구조
```
/
├── app/
│   ├── page.tsx (랜딩: 입소 안내)
│   ├── layout.tsx (Pretendard 폰트, 공통 레이아웃)
│   ├── globals.css (Tailwind 테마 설정)
│   ├── dashboard/page.tsx (내 칭찬 감옥 관리)
│   └── praise/[userId]/page.tsx (매력 신고 프로세스)
├── components/ui/
│   ├── button.tsx
│   ├── card.tsx
│   └── emoji.tsx
├── lib/supabase/
│   ├── client.ts (Browser Client)
│   └── server.ts (Server Client)
└── supabase/
    └── triggers.sql (DB 트리거 백업)
```

## 3. 배포 (Deployment)
- **플랫폼**: Vercel
- **설정**:
    - Build Command: `next build`
    - Env Vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - Supabase Redirect URL: `https://[project-url]/auth/callback` 추가
