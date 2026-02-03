# 칭찬감옥 (Praise Prison) ⛓️🏢⛓️

> **"당신은 칭찬 감옥에 갇혔습니다! 이제 친구들의 칭찬 세례를 견뎌내세요."**

**칭찬감옥**은 칭찬 공격으로 친구를 감옥에 가두는 컨셉의 웹 서비스입니다.
친구들은 칭찬을 통해 본인의 강점과 장점들을 파악할수 있도로 많은 칭찬을 유도했습니다.

---

## 🚔 서비스 소개 (Features)

### 1. 🗝️ 입소 (Login & Dashboard)

- 카카오 계정으로 3초 만에 로그인하여 나의 **'칭찬 감옥'**을 개설합니다.
- 내 감옥(대시보드)에서 **키워드**과 **상세 메시지**를 확인할 수 있습니다.

### 2. 🚔 밀고하기 (Share)

- **"혼쭐내기 링크 복사"** 버튼을 통해 친구들에게 내 감옥 주소를 공유합니다.
- 친구들은 로그인 없이도 링크만 있으면 즉시 **칭찬 공격**이 가능합니다.

### 3. 🚨 칭찬 제보 (Send Praise)

- **익명성 보장**: 받는 사람(수감자)은 누가 보냈는지 **절대 알 수 없습니다.**
  - _단, 보낸 사람(제보자)은 본인이 누구를 혼냈는지 '보낸 메시지함'에서 확인 가능합니다._
- **엄격한 제보 규칙**:
  - **단일 키워드**: 복잡한 미사여구 대신, 핵심 단어 하나로 정의해야 합니다. (예: `센스쟁이`, `정리왕`)
  - **확실한 증거**: 칭찬하는 이유나 구체적인 사례를 10자 이상 작성해야 합니다.
- **도배 방지 시스템**:
  - 30초 쿨타임 (연속 전송 방지)
  - 중복 클릭 및 매크로 방지 로직 적용

### 4. 🤫 시크릿 보장

- 대시보드의 '받은 메시지' 탭에서는 보낸 이의 정보가 **완벽히 숨겨집니다.** (오직 날짜만 표시)
- 오직 훈훈한 칭찬 메시지에만 집중할 수 있는 환경을 만듭니다.

---

## �🛠️ 기술 스택 (Tech Stack)

| 구분              | 기술                | 설명                                           |
| :---------------- | :------------------ | :--------------------------------------------- |
| **Framework**     | **Next.js 14+**     | App Router 사용                                |
| **Language**      | **TypeScript**      | -                                              |
| **Styling**       | **Tailwind CSS v4** | -                                              |
| **Database**      | **Supabase**        | PostgreSQL 기반의 실시간 DB 및 인증(Auth) 처리 |
| **UI Components** | **Shadcn/UI**       | -                                              |

---

## 🚀 프로젝트 실행 방법 (Getting Started)

### 1. 설치 (Install)

```bash
# 패키지 매니저로 의존성 설치 (pnpm 권장)
npm install
# or
pnpm install
```

### 2. 환경 변수 설정 (.env.local)

Supabase 프로젝트 설정이 필요합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 데이터베이스 셋업

Supabase SQL Editor에서 테이블 및 트리거를 생성합니다.

- `public.users`: 사용자 정보 (Kakao 로그인 동기화)
- `public.praises`: 칭찬 메시지 데이터

### 4. 서버 실행

```bash
npm run dev
# or
pnpm dev
```

브라우저에서 `http://localhost:3000` 접속

---

## 🎨 디자인 컨셉 (Design System)

- **Primary Color**: `#f97316` (Orange) & `#FEE500` (Kakao Yellow)
- **Typography**: Pretendard / Monospace (타자기 느낌)
- **Key Visual**:
  - 굵은 검정 테두리 (2px~4px)
  - 뚜렷한 그림자 (Hard Shadow)
  - 감옥, 경찰, 수갑 등의 이모지 활용 👮🚔⛓️

---

> **"지금 바로 친구를 칭찬 감옥에 가둬보세요!"**
