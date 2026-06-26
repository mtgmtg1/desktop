# AGENTS.md — Onlook Desktop (Offline Local Edition)

> 오프라인 로컬 전용으로 개조된 Onlook Desktop 앱의 코드베이스 가이드.
> 클라우드 의존성(Stripe, Supabase, Analytics, OAuth, Hosting) 제거,
> PRO 플랜 기본 활성화, 로컬 LLM 연동, 로컬 이메일/비밀번호 인증 구현 완료.

---

## 1. 프로젝트 개요

| 항목 | 값 |
|---|---|
| **프로젝트명** | Onlook Desktop — Offline Local Edition |
| **저장소** | `https://github.com/mtgmtg1/desktop` (fork of `onlook-dev/desktop`) |
| **플랫폼** | Electron + React + MobX + Vite |
| **패키지 매니저** | Bun (workspace monorepo) |
| **언어** | TypeScript |
| **UI 프레임워크** | Tailwind CSS + shadcn/ui (`@onlook/ui`) |
| **아키텍처** | Electron Main ↔ IPC ↔ Preload ↔ Renderer (React) |

### 핵심 변경사항 (원본 대비)

- **클라우드 결제 제거:** Stripe checkout, subscription management, pricing modal 삭제
- **클라우드 인증 제거:** Supabase OAuth → 로컬 이메일/비밀번호 인증 (SHA-256 해시)
- **클라우드 호스팅 제거:** Custom domain, Freestyle hosting, `sendHostingPostRequest` 스텁 처리
- **Analytics 제거:** Mixpanel, Trainloop SDK 스텁 처리 (no-op)
- **PRO 플랜 고정:** `SubscriptionManager.plan = UsagePlanType.PRO` 하드코딩
- **Rate limit 제거:** `rateLimited` 상태, `clearRateLimited()`, `handleRateLimited()` 삭제
- **로컬 LLM 연동:** OpenAI-compatible API (`@ai-sdk/openai`), 사용자 설정 가능 endpoint/model/apiKey
- **Settings 탭 정리:** Domain, SiteTab 삭제, Preferences에 AI Provider 및 계정 관리 섹션 추가

---

## 2. 모노레포 구조

```
onlook-desktop/
├── apps/
│   └── studio/                    # Electron 데스크톱 앱 (유일한 앱)
│       ├── electron/              # Electron Main 프로세스
│       │   ├── main/              # 백엔드 로직
│       │   │   ├── auth/          # 로컬 인증 (이메일/비밀번호)
│       │   │   ├── chat/          # LLM 스트리밍, llmProvider, trainloop(stub)
│       │   │   ├── code/          # 코드 분석/수정 (AST, diff, 파일 스캔)
│       │   │   ├── create/        # 프로젝트 생성 (blank, prompt)
│       │   │   ├── events/        # IPC 핸들러 등록 (14개 이벤트 모듈)
│       │   │   ├── hosting/       # 호스팅 (스텁 — 로컬 모드에서 비활성)
│       │   │   ├── payment/       # 결제 (스텁 — 로컬 모드에서 비활성)
│       │   │   ├── run/           # Dev 서버 실행, 터미널, cleanup
│       │   │   ├── storage/       # 로컬 영구 저장 (file/directory 기반)
│       │   │   ├── analytics/     # Analytics (스텁 — no-op)
│       │   │   ├── update/        # 자동 업데이트
│       │   │   ├── pages/         # Next.js 페이지 스캔
│       │   │   ├── assets/        # 폰트, 이미지 리소스
│       │   │   └── index.ts       # Electron 진입점
│       │   └── preload/           # Preload 스크립트 (browserview, webview)
│       ├── src/                   # Renderer (React 프론트엔드)
│       │   ├── routes/            # 라우팅 (signin, projects, editor)
│       │   ├── components/        # UI 컴포넌트 (Modals, AppBar, Context)
│       │   ├── lib/               # 상태 관리 및 비즈니스 로직
│       │   │   ├── auth/          # AuthManager (로컬 인증)
│       │   │   ├── editor/        # EditorEngine + 20개 하위 매니저
│       │   │   ├── projects/      # ProjectsManager
│       │   │   ├── user/          # UserManager, SubscriptionManager
│       │   │   ├── routes/        # RouteManager (MobX)
│       │   │   └── utils/         # 공용 유틸 (sendAnalytics 등)
│       │   ├── locales/           # i18n (en, ja, ko, zh)
│       │   └── App.tsx            # 루트 컴포넌트
│       ├── package.json           # 앱 의존성 및 스크립트
│       └── vite.config.ts         # Vite + vite-plugin-electron 설정
├── packages/
│   ├── ai/                        # @onlook/ai — AI 프롬프트, 툴셋, 코드 처리
│   ├── foundation/                # @onlook/foundation — Next.js 빌드 설정 (현재 미사용)
│   ├── git/                       # @onlook/git — Git 작업 래퍼
│   ├── growth/                    # @onlook/growth — 성장 관련 (현재 미사용)
│   ├── models/                    # @onlook/models — 공유 타입, IPC 채널, LLM, 설정
│   ├── supabase/                  # @onlook/supabase — Supabase 쿼리 (현재 미사용)
│   ├── types/                     # @onlook/types — 디자인 토큰 타입
│   ├── ui/                        # @onlook/ui — shadcn/ui 컴포넌트 라이브러리
│   └── utility/                   # @onlook/utility — 공용 유틸 함수
├── tooling/                       # 빌드 툴링
└── package.json                   # 워크스페이스 루트
```

---

## 3. 아키텍처 및 데이터 흐름

```
┌─────────────────────────────────────────────────────────┐
│  Renderer (React + MobX)                                │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Routes   │  │ Modals       │  │ EditorEngine      │  │
│  │ (signin, │  │ (Settings,   │  │  ├ ChatManager    │  │
│  │ projects,│  │  Quit,       │  │  ├ CodeManager    │  │
│  │ editor)  │  │  Announcement)│  │  ├ WebviewManager │  │
│  └────┬─────┘  └──────┬───────┘  │  ├ OverlayManager  │  │
│       │               │          │  ├ HistoryManager  │  │
│       │    invokeMainChannel()   │  ├ ... (20개)      │  │
│       │               │          └────────┬──────────┘  │
└───────┼───────────────┼───────────────────┼─────────────┘
        │               │                   │
        ▼               ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│  Preload (Context Bridge)                                │
│  window.api.invoke() / window.api.on()                   │
└─────────────────────────┬───────────────────────────────┘
                          │ IPC (ipcMain.handle / .on)
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Electron Main                                           │
│  ┌──────────┐ ┌────────┐ ┌──────┐ ┌──────┐ ┌─────────┐  │
│  │ Auth     │ │ Chat   │ │ Code │ │ Run  │ │ Storage │  │
│  │ (local)  │ │ (LLM)  │ │ (AST)│ │ (dev)│ │ (file)  │  │
│  └──────────┘ └────────┘ └──────┘ └──────┘ └─────────┘  │
│  ┌──────────┐ ┌────────┐ ┌──────┐                         │
│  │ Hosting  │ │ Payment│ │ Analy│  ← 모두 스텁 (no-op)    │
│  │ (stub)   │ │ (stub) │ │ (stub)│                        │
│  └──────────┘ └────────┘ └──────┘                         │
└─────────────────────────────────────────────────────────┘
```

### IPC 통신

- **채널 정의:** `packages/models/src/constants/ipc.ts` — `MainChannels` enum
- **이벤트 등록:** `apps/studio/electron/main/events/index.ts` — `listenForIpcMessages()`
- **프론트엔드 호출:** `invokeMainChannel(channel, args)` — `apps/studio/src/lib/utils/index.ts`
- **이벤트 수신:** `window.api.on(channel, callback)` — preload context bridge

### 로컬 인증 흐름

```
[Flow: 앱 시작 → initLocalAuth() → ensureAdminAccount() → 관리자 계정 자동 생성]
[Flow: SignIn 페이지 → authManager.signIn(email, password) → IPC LOCAL_SIGN_IN → 비밀번호 검증 → USER_SIGNED_IN 이벤트 → 라우팅 전환]
```

- 관리자 계정: `mtgmtg@naver.com` / 비밀번호: SHA-256 해시로 저장
- 계정 데이터: `PersistentStorage.LOCAL_ACCOUNTS` (로컬 파일 JSON)
- 세션: `PersistentStorage.LOCAL_SESSION` (이메일 기반)

### 로컬 LLM 흐름

```
[Flow: 사용자 채팅 입력 → ChatManager → IPC SEND_CHAT_MESSAGES_STREAM → LlmManager → initModel() → OpenAI-compatible API 스트리밍 → CHAT_STREAM_PARTIAL 이벤트 → StreamResolver 업데이트]
```

- LLM Provider: `@ai-sdk/openai`의 `createOpenAI()` — `llmProvider.ts`
- 설정: `UserSettings.aiProvider` — endpoint, modelId, apiKey
- 설정 UI: Settings → Preferences → AI Provider 섹션

---

## 4. 주요 매니저 클래스

### Renderer (MobX)

| 클래스 | 파일 | 역할 |
|---|---|---|
| `AuthManager` | `src/lib/auth/index.ts` | 로컬 인증 상태, signIn/signOut, 사용자 메타데이터 |
| `RouteManager` | `src/lib/routes/index.ts` | 라우팅 (signin, projects, editor) |
| `ProjectsManager` | `src/lib/projects/index.ts` | 프로젝트 목록, 생성, 실행 관리 |
| `UserManager` | `src/lib/user/index.ts` | 사용자 설정, 구독(PRO 고정) |
| `SubscriptionManager` | `src/lib/user/subscription.ts` | PRO 플랜 하드코딩, 서버 체크 no-op |
| `EditorEngine` | `src/lib/editor/engine/index.ts` | 에디터 통합 매니저 (20개 하위 매니저 포함) |
| `ChatManager` | `src/lib/editor/engine/chat/index.ts` | 채팅, 대화, 스트리밍, 제안 |
| `StreamResolver` | `src/lib/editor/engine/chat/stream.ts` | 스트리밍 응답 상태 (rate limit 제거됨) |

### Electron Main

| 클래스 | 파일 | 역할 |
|---|---|---|
| `LlmManager` | `electron/main/chat/index.ts` | LLM 스트리밍, 툴 호출, 응답 처리 |
| `initModel()` | `electron/main/chat/llmProvider.ts` | OpenAI-compatible 모델 초기화 |
| `initLocalAuth()` | `electron/main/auth/index.ts` | 로컬 인증 초기화, 계정 관리 |
| `PersistentStorage` | `electron/main/storage/index.ts` | 파일 기반 영구 저장 (7개 스토리지) |
| `RunManager` | `electron/main/run/index.ts` | Dev 서버 실행, 포트 관리, 터미널 |
| `CodeManager` | `electron/main/code/index.ts` | AST 분석, 코드 diff, 파일 스캔 |

---

## 5. 개발 명령어

```bash
# 의존성 설치
bun install

# 개발 모드 (Vite + Electron 동시 실행)
bun run --filter @onlook/studio dev

# 타입 체크
bun run --filter @onlook/studio typecheck

# 빌드 (Vite → dist-electron + dist)
bun run --filter @onlook/studio build

# 패키징 (electron-builder → macOS ARM64)
bun run --filter @onlook/studio package

# 테스트
bun run --filter @onlook/studio test

# 린트
bun run --filter @onlook/studio lint

# 포맷
bun run --filter @onlook/studio format
```

---

## 6. 스텁 처리된 모듈 (클라우드 의존성)

| 모듈 | 파일 | 상태 |
|---|---|---|
| Analytics | `electron/main/analytics/index.ts` | no-op (빈 함수) |
| Trainloop | `electron/main/chat/trainloop.ts` | no-op (`saveApplyResult` 빈 함수) |
| Hosting | `electron/main/hosting/index.ts` | `sendHostingPostRequest` throw Error |
| Domains | `electron/main/hosting/domains.ts` | 모든 함수 빈 배열/에러 반환 |
| Payment | `electron/main/payment/index.ts` | Stripe checkout/check/manage 모두 스텁 |
| `@onlook/foundation` | `electron/main/hosting/helpers.ts` | import 제거, `addNextBuildConfig` 스텁 |
| `@onlook/supabase` | — | 코드에서 참조하나 실제 통신 없음 |
| `@trainloop/sdk` | — | import 제거, 문자열 리터럴로 대체 |

---

## 7. 라우팅 구조

```
Route.PROJECTS  →  Projects 페이지 (프로젝트 목록, 생성)
     ↓ (프로젝트 선택)
Route.EDITOR    →  ProjectEditor (캔버스, 편집 패널, 레이어 패널)
     ↓ (signOut)
Route.SIGN_IN   →  SignIn 페이지 (이메일/비밀번호 폼)
```

- **인증 게이트:** `!authManager.authenticated && authManager.isAuthEnabled` → SignIn 강제
- **라우팅 로직:** `src/routes/index.tsx` — MobX observer로 자동 반응

---

## 8. Settings 모달 구조

```
SettingsModal
├── Project Settings (프로젝트 열려 있을 때만)
│   ├── Project
│   └── Versions
├── Page Settings (프로젝트 열려 있을 때만)
│   └── [스캔된 페이지 목록]
└── Global Settings
    ├── Preferences  ← AI Provider, 계정 관리, 언어, 테마, 에디터, Analytics
    └── Advanced
```

**삭제된 탭:** Domain, SiteTab (클라우드 의존)

---

## 9. 코딩 규칙

- **Flow 주석:** 모든 주요 함수는 `// [Flow: Step1 -> Step2 -> Result]` 형식의 헤더 주석
- **Early Return:** guard clause 우선, else 블록 지양
- **DRY:** 기존 함수 재사용, 중복 로직 금지
- **단일 책임:** 함수명은 동사 기반 (`checkInventoryStock`, `notifySubscriber`)
- **함수형 패턴:** `.filter()`, `.map()`, `.reduce()` 체이닝 우선
- **MobX:** `makeAutoObservable` + `observer` HOC 패턴
- **IPC:** 새 채널은 `MainChannels` enum에 추가, events 모듈에서 핸들러 등록
- **한국어:** 최종 응답, 문서, 주석은 한국어 (코드 및 로직은 영어)

---

## 10. 알려진 제한사항 및 향후 작업

- **sendAnalytics 잔류:** 20+ 파일에서 `sendAnalytics()` 호출이 남아있으나 스텁 처리되어 no-op
- **`@onlook/supabase` 패키지:** 코드베이스에 잔류하나 실제 통신 없음
- **`@onlook/foundation` 패키지:** hosting helpers에서 import 제거, 패키지 자체는 잔류
- **`getPlanFromServer()` 메서드명:** 기능은 PRO 반환으로 정상이나 이름이 레거시
- **AuthTokens 타입:** `PersistentStorage.AUTH_TOKENS`로 잔류 (로컬 인증에서 미사용)
- **electron-builder:** macOS ARM64 빌드만 확인됨
