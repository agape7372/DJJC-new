# 두바이 쫀득 쿠키 타이쿤 - 개발 진행도

## Phase 1: 프로젝트 초기 설정 ✅
**완료일: 2026-01-11**

- [x] Vite + vanilla JavaScript 프로젝트 생성
- [x] 기본 폴더 구조 설정 (src/core, src/states, src/utils, src/styles)
- [x] index.html, main.css 설정
- [x] CLAUDE.md 작성

### 생성된 파일
- `vite.config.js`
- `package.json`
- `index.html`
- `src/main.js`
- `src/styles/main.css`
- `CLAUDE.md`

---

## Phase 2: 게임 엔진 코어 ✅
**완료일: 2026-01-11**

- [x] Game.js - 메인 게임 클래스 (게임 루프, 렌더링)
- [x] StateManager.js - 상태 머신 패턴
- [x] InputManager.js - 터치/마우스 입력 처리
- [x] AssetManager.js - 에셋 로딩 관리
- [x] AudioManager.js - BGM/SFX 관리

### 생성된 파일
- `src/core/Game.js`
- `src/core/StateManager.js`
- `src/core/InputManager.js`
- `src/core/AssetManager.js`
- `src/core/AudioManager.js`

---

## Phase 3: 기본 게임 상태 구현 ✅
**완료일: 2026-01-11**

- [x] BaseState.js - 상태 기본 클래스
- [x] TitleState.js - 타이틀 화면
- [x] IntroState.js - 인트로 컷신
- [x] TutorialState.js - 튜토리얼 시스템
- [x] PrepState.js - 재료 준비 미니게임 3종
- [x] BakingState.js - 베이킹 (반죽 성형)
- [x] DecoState.js - 데코레이션
- [x] TastingState.js - 품평회
- [x] SellState.js - 판매 시스템

### 생성된 파일
- `src/states/BaseState.js`
- `src/states/TitleState.js`
- `src/states/IntroState.js`
- `src/states/TutorialState.js`
- `src/states/PrepState.js`
- `src/states/BakingState.js`
- `src/states/DecoState.js`
- `src/states/TastingState.js`
- `src/states/SellState.js`

---

## Phase 4: 개발자 모드 ✅
**완료일: 2026-01-11**

- [x] 스토리/튜토리얼 스킵 기능
- [x] URL 파라미터 기반 (`?dev=1`)
- [x] 콘솔 명령어 지원

---

## Phase 5: 사운드 & 파티클 시스템 ✅
**완료일: 2026-01-11**

- [x] SoundManager.js - Web Audio API 기반 프로시저럴 사운드
- [x] ParticleSystem.js - 다중 파티클 이펙트 프리셋
- [x] Game.js에 사운드/파티클 시스템 통합
- [x] InputManager.js에 브라우저 자동재생 정책 대응

### 생성된 파일
- `src/core/SoundManager.js`
- `src/core/ParticleSystem.js`

### 사운드 종류
- `playSlice()` - 카다이프 썰기
- `playCrunch()` - 바삭한 소리
- `playCrush()` - 피스타치오 분쇄
- `playSpin()` - 회전 소리
- `playSpecial()` - 특수 효과음
- `playFever()` - 피버 모드
- `playSuccess()` - 성공
- `playFail()` - 실패
- `playUIClick()` - UI 클릭
- `playCoin()` - 코인 획득
- `playNews()` - 뉴스 알림
- `playDrumroll()` - 드럼롤
- `playFanfare()` - 팡파레

### 파티클 종류
- `emitSlice()` - 슬라이스 이펙트
- `emitComboExplosion()` - 콤보 폭발
- `emitCrush()` - 분쇄 이펙트
- `emitSpin()` - 회전 이펙트
- `emitSparkle()` - 반짝임
- `emitFeverFlame()` - 피버 불꽃
- `emitCoin()` - 코인 획득
- `emitCelebration()` - 축하 이펙트
- `emitScreenFlash()` - 화면 플래시

---

## Phase 6: 각 상태 사운드/파티클 통합 ✅
**완료일: 2026-01-11**

### PrepState.js (재료 준비)
- [x] 카다이프 썰기 미니게임 - 슬라이스 이펙트, 콤보 시스템
- [x] 피스타치오 분쇄 미니게임 - 크러쉬 이펙트, 피버 모드
- [x] 마시멜로우 반죽 미니게임 - 스핀 이펙트, RPM 시스템
- [x] 페이즈 인트로 애니메이션
- [x] 화면 흔들림 효과

### BakingState.js (베이킹)
- [x] 원형 드래그 반죽 성형
- [x] 밀가루 파티클 효과
- [x] 반죽 상태 전환 애니메이션
- [x] 완성 효과 (축하 이펙트)

### DecoState.js (데코레이션)
- [x] 코코아 파우더 스프레이
- [x] 토핑 배치 (카다이프, 피스타치오)
- [x] 골드 플레이크 뿌리기
- [x] 도구 팔레트 글로우 효과
- [x] 점수 팝업 시스템

### TastingState.js (품평회)
- [x] 드럼롤 페이즈 애니메이션
- [x] NPC 반응 시스템 (가족/친구)
- [x] 점수 바 애니메이션
- [x] 등급 시스템 (S/A/B/C)
- [x] 팡파레 & 축하 이펙트

### SellState.js (판매)
- [x] 주식시장 스타일 가격 차트
- [x] 그라디언트 채우기 & 글로우 라인
- [x] 손님 시스템 (학생, 힙스터, 두바이 관광객, 할머니)
- [x] 코인 파티클 & 수익 애니메이션
- [x] 뉴스 티커 시스템
- [x] 신선도 시스템
- [x] 하루 종료 정산 애니메이션

---

## Phase 7: 레시피 시스템 ✅
**완료일: 2026-01-11**

- [x] RecipeManager.js - 레시피 관리 시스템
- [x] RecipeBookState.js - 레시피북 UI
- [x] 10종 레시피 정의 (일반 ~ 전설 등급)
- [x] 레시피 해금 조건 시스템
- [x] 레시피 보너스 적용 (점수, 가격, 손님 유치)
- [x] TitleState에 레시피북 버튼 추가
- [x] TastingState에 레시피 보너스 통합
- [x] SellState에 가격 배율 & 손님 유치 보너스 적용
- [x] 해금 팝업 애니메이션

### 생성된 파일
- `src/core/RecipeManager.js`
- `src/states/RecipeBookState.js`

### 레시피 목록
| 이름 | 등급 | 해금 조건 | 보너스 |
|------|------|-----------|--------|
| 클래식 두쫀쿠 | 일반 | 기본 해금 | 기본 |
| 골든 럭셔리 | 희귀 | 비주얼 90점+ | 비주얼+20, 가격x1.5 |
| 크런치 마스터 | 고급 | 식감 85점+ | 식감+15, 가격x1.2 |
| 피스타치오 폭탄 | 고급 | 피스타치오 퍼펙트 3회 | 풍미+15, 가격x1.3 |
| 쫀득 드림 | 고급 | 마시멜로우 퍼펙트 3회 | 식감+10, 비주얼+10 |
| 풍미의 달인 | 희귀 | 풍미 95점+ | 풍미+20, 가격x1.4 |
| 스피드 데몬 | 고급 | 제작 60초 이내 | 속도x1.5, 가격x0.9 |
| 퍼펙트 밸런스 | 영웅 | 모든 스탯 80점+ | 전체+10, 가격x1.6 |
| 두바이 로열 | 전설 | 총점 280점+ | 전체+15, 가격x2.0 |
| 바이럴 센세이션 | 영웅 | 하루 판매 30개+ | 비주얼+25, 손님유치x1.5 |

---

## Phase 7.5: 레시피 시스템 버그 수정 ✅
**완료일: 2026-01-11**

### 수정된 버그
- [x] **BUG#1**: TastingState에서 visual 점수 조건 체크 시 계산된 값 사용하도록 수정
  - 문제: raw `stats.visual` 대신 `(completion+visual)/2` 계산값 사용해야 함
  - 수정: `scoreBreakdown.visual` 값을 레시피 해금 체크에 전달

- [x] **BUG#2**: RecipeManager의 daily_sales 누적 방식 수정
  - 문제: `Math.max`로 인해 최대 3개까지만 기록되어 50개 조건 달성 불가
  - 수정: `+=` 누적 방식으로 변경, 조건을 30개로 하향 조정

- [x] **BUG#3**: RecipeBookState 해금 팝업 후 자동 이동 추가
  - 문제: 해금 팝업 종료 후 수동으로 뒤로가기 필요
  - 수정: 팝업 exit 페이즈 후 자동으로 `returnTo` 상태로 이동

- [x] **BUG#4**: PrepState에 퍼펙트 기록 로직 추가
  - 문제: 미니게임 퍼펙트 달성해도 `recordPerfect` 미호출
  - 수정: 80점 이상 달성 시 해당 미니게임 퍼펙트 기록

### 수정된 파일
- `src/states/TastingState.js` - visual 점수 계산 수정
- `src/core/RecipeManager.js` - daily_sales 누적 방식 수정
- `src/states/RecipeBookState.js` - 자동 이동 로직 추가
- `src/states/PrepState.js` - 퍼펙트 기록 로직 추가

---

## Phase 7.6: 미니게임 드래그 버그 수정 ✅
**완료일: 2026-01-12**

### 근본 원인
- `InputManager.handleMouseMove`에서 `dragAngle` 계산 누락
- 마우스 드래그 시 angle이 항상 0 → 마시멜로우/베이킹 작동 안 함

### 수정된 버그
- [x] **Phase 1**: InputManager - 마우스 핸들러에 각도 계산 추가
  - `handleMouseMove`에 각도 계산 로직 추가
  - 각도 래핑 처리 (±π 범위)

- [x] **Phase 2**: PrepState 마시멜로우 - delta angle 계산 수정
  - `lastDragAngle` 변수 추가
  - 누적 angle 대신 delta angle 사용
  - RPM 계산 정확도 개선

- [x] **Phase 3**: BakingState - 검증 완료
  - 이미 올바르게 구현됨

- [x] **Phase 4**: 카다이프 가시성 개선
  - 3가지 스폰 패턴 추가 (대각선/중앙/포물선)
  - 수평 속도 증가 (vx * 0.025~0.03)
  - 카다이프 크기 증가 (50+15px)
  - 수평 이동(vx) 업데이트 로직 추가

### 수정된 파일
- `src/core/InputManager.js` - 마우스 각도 계산 추가
- `src/states/PrepState.js` - 마시멜로우 delta angle, 카다이프 스폰 개선

---

## Phase 7.7: 카다이프 물리 개선 (Fruit Ninja 스타일) ✅
**완료일: 2026-01-12**

### 개선 사항
- [x] **Fruit Ninja 물리 시스템 도입**
  - 중력 강화: 380 → 850 (더 역동적인 포물선)
  - 물리 공식 기반 수직 속도 계산: `v = sqrt(2 * g * h)`
  - 목표 정점 높이 기반 발사 (화면 상단 25%~45%)

- [x] **스폰 위치 다양화**
  - 화면 하단 전체 영역에서 스폰 (15%~85%)
  - 가장자리 스폰 시 중앙 방향으로 이동

- [x] **수평 속도 개선**
  - 스폰 위치 기반 자동 계산 (가장자리 → 중앙)
  - 추가 랜덤성으로 다양한 궤적 생성
  - 최대 수평 속도: ±180 px/s

- [x] **회전 개선**
  - 속도에 비례한 동적 회전
  - 수평 속도에 따른 회전 방향 조정

### 물리 상수 (KADAIF_PHYSICS)
| 상수 | 값 | 설명 |
|------|-----|------|
| GRAVITY | 850 | 중력 가속도 |
| MAX_VX | 180 | 최대 수평 속도 |
| APEX_MIN | 0.25 | 최소 정점 높이 (상단 25%) |
| APEX_MAX | 0.45 | 최대 정점 높이 (상단 45%) |
| SPAWN_MARGIN | 0.15 | 스폰 영역 여백 (15%) |

### 수정된 파일
- `src/states/PrepState.js` - spawnKadaif, updateKadaif 완전 재설계

---

## Phase 7.8: 데코 시스템 입력 버그 수정 🔧
**완료일: 2026-01-12**

### 수정된 버그
- [x] **탭 감지 임계값 완화**
  - 거리 임계값: 10px → 20px
  - 터치 지속시간: 200ms → 400ms

- [x] **UX 개선**
  - 코코아/금가루 도구 사용 시 "드래그로 뿌리세요!" 힌트 표시
  - 디버그 모드에서 탭 위치 시각화 (노란 원)
  - 상태 변수 실시간 표시

### 수정된 파일
- `src/core/InputManager.js` - 탭 감지 임계값 조정
- `src/states/DecoState.js` - 힌트 시스템, 디버그 표시 추가

---

## Phase 7.9: 개발자 모드 강화 ✅
**완료일: 2026-01-13**

### 개선 사항
- [x] **URL 파라미터 기반 모드 전환**
  - `?dev` 또는 `?dev=1`: 개발자 모드 활성화 (스킵 버튼 표시)
  - `?skip` 또는 `?skip=1`: 자동 스킵 모드 (인트로+튜토리얼 완전 건너뜀)
  - 두 파라미터 조합 가능: `?dev&skip`

- [x] **IntroState 스킵 기능 추가**
  - devMode: 빨간색 SKIP 버튼 표시 (우측 상단)
  - autoSkip: 인트로 진입 시 즉시 PREP으로 이동

- [x] **TutorialState autoSkip 지원**
  - autoSkip 모드면 튜토리얼도 자동 건너뜀

- [x] **콘솔 로그 개선**
  - 개발 모드 활성화 시 안내 메시지 출력
  - 자동 스킵 활성화 시 안내 메시지 출력

### 수정된 파일
- `src/core/Game.js` - URL 파라미터 파싱, config 초기화
- `src/states/IntroState.js` - SKIP 버튼, autoSkip 로직
- `src/states/TutorialState.js` - autoSkip 로직

### 사용법
| URL | 설명 |
|-----|------|
| `http://localhost:3000` | 일반 모드 |
| `http://localhost:3000?dev` | 개발 모드 (스킵 버튼 표시) |
| `http://localhost:3000?skip` | 자동 스킵 (바로 게임 플레이) |
| `http://localhost:3000?dev&skip` | 개발 모드 + 자동 스킵 |

---

## Phase 7.10: DEV 모드 UI 개선 및 코드 최적화 ✅
**완료일: 2026-01-13**

### 개선 사항
- [x] **타이틀 화면 DEV 버튼 추가**
  - URL 파라미터 없이 화면에서 직접 DEV 모드 토글 가능
  - 우측 상단 DEV 버튼 클릭으로 ON/OFF
  - 활성화 시 버튼이 빨간색으로 변경

- [x] **모든 단계에 SKIP 버튼 추가**
  - 재료준비 (PrepState): 우측 상단 SKIP → 베이킹으로
  - 베이킹 (BakingState): 우측 상단 SKIP → 데코로
  - 데코 (DecoState): 좌측 상단 SKIP → 품평회로
  - 품평회 (TastingState): 우측 상단 SKIP → 판매로
  - 판매 (SellState): 우측 상단 SKIP → 다음 날(재료준비)로

- [x] **코드 최적화**
  - InputManager.js: 디버그 console.log 8개 제거
  - DecoState.js: 디버그 console.log 15개 제거
  - RecipeManager.js: 미사용 `total_sales` 변수 제거

### 수정된 파일
- `src/core/Game.js` - URL 파라미터 파싱 유지
- `src/core/InputManager.js` - 디버그 로그 제거
- `src/core/RecipeManager.js` - 미사용 변수 제거
- `src/states/TitleState.js` - DEV 토글 버튼 추가
- `src/states/PrepState.js` - SKIP 버튼 추가
- `src/states/BakingState.js` - SKIP 버튼 추가
- `src/states/DecoState.js` - SKIP 버튼 추가, 디버그 로그 제거
- `src/states/TastingState.js` - SKIP 버튼 추가
- `src/states/SellState.js` - SKIP 버튼 추가

### DEV 모드 게임 흐름
```
타이틀 [DEV 버튼] → 재료준비 [SKIP] → 베이킹 [SKIP] → 데코 [SKIP] → 품평회 [SKIP] → 판매 [SKIP] → 다음 날
```

---

## Phase 7.11: 마시멜로우 녹이기 미니게임 리뉴얼 ✅
**완료일: 2026-01-18**

### 변경 사항
기존 "마시멜로우 반죽" 미니게임을 "마시멜로우 녹이기"로 전면 리뉴얼

### 핵심 메커니즘 (타이쿤 스타일)
- **불 조절 시스템**: 3단계 버튼 (약불/중불/강불)
  - 약불: 느리지만 안전 (녹음 0.8%/s, 들러붙음 0.3%/s)
  - 중불: 적당한 속도 (녹음 1.5%/s, 들러붙음 0.8%/s)
  - 강불: 빠르지만 위험 (녹음 2.5%/s, 들러붙음 2.0%/s)

- **들러붙음 시스템**:
  - 게이지가 100%가 되면 들러붙음 발생
  - 연타로 해소 (1회당 12% 감소)
  - 냄비 드래그/터치로 예방 가능
  - 70% 이상 경고 표시 + 찌직 소리

- **코코아 투입 시스템**:
  - 녹음 진행도 40%~70%에 투입 시 보너스 +25점
  - 너무 빨리 투입 시 -10점 페널티
  - 너무 늦게 투입 시 -15점 페널티
  - 미투입 시 최종 -20점 페널티

### 새로운 사운드 (SoundManager)
- `playSizzle(intensity)` - 지글지글 불 소리
- `playStick()` - 들러붙음 찌직 경고음
- `playBubble()` - 보글보글 버블 소리
- `playCocoaPour()` - 코코아 투입 소리
- `playTap()` - 연타 성공 팝 사운드

### 새로운 파티클 (ParticleSystem)
- `emitFlame(x, y, intensity)` - 불꽃 이펙트
- `emitMeltBubble(x, y, withCocoa)` - 녹는 기포 이펙트
- `emitStickWarning(x, y)` - 들러붙음 연기/스파크
- `emitCocoaPour(x, y)` - 코코아 파우더 투입
- `emitTapSuccess(x, y)` - 연타 성공 파장
- `emitPerfectTiming(x, y)` - 코코아 퍼펙트 타이밍

### 수정된 파일
- `src/core/SoundManager.js` - 5개 사운드 추가
- `src/core/ParticleSystem.js` - 6개 이펙트 추가
- `src/states/PrepState.js` - 마시멜로우 게임 전면 리팩토링

### UI 구성
```
┌─────────────────────────────────────┐
│        🍫 마시멜로우 녹이기          │
├─────────────────────────────────────┤
│  녹음 진행도 [████████░░░░] 67%    │
│  ⚠️ 들러붙음 [████░░░░░░░]          │
├─────────────────────────────────────┤
│                                     │
│           [🍡 냄비 + 마시멜로우]      │
│              🔥 불꽃 🔥             │
│                                     │
├─────────────────────────────────────┤
│ [🔵약불] [🟡중불] [🔴강불]   [🍫코코아] │
│                                     │
│   🍡 마시멜로우가 녹고 있어요~       │
└─────────────────────────────────────┘
```

---

## Phase 8: 가게 허브 시스템 ✅
**완료일: 2026-01-18**

### 개요
스토리 완료 후 미니게임 강제 진입 대신 가게 허브 페이지에서 자유롭게 선택할 수 있도록 변경

### 구현 기능

#### 1. 가게 허브 (ShopState)
- **메인 탭**: 쿠키 만들기, 판매하기, 레시피북 버튼
- **재고 탭**: 인벤토리 그리드 뷰 (등급/신선도/가격 표시)
- **업그레이드 탭**: 장비/인테리어/재료 업그레이드 구매

#### 2. 재고 시스템 (InventoryManager)
- **Cookie 클래스**: 스탯, 총점, 등급, 신선도, 가격 계산
- **등급 시스템**: S(280+)/A(220+)/B(160+)/C 등급
- **신선도 시스템**: 시간 경과에 따른 가격 감소
- **용량 시스템**: 업그레이드로 확장 가능

#### 3. 업그레이드 시스템 (ShopUpgradeManager)
**장비 업그레이드**
| 이름 | 가격 | 효과 |
|------|------|------|
| 기본 오븐 | 0 | 굽기 속도 x1.0 |
| 표준 오븐 | 50,000 | 굽기 속도 x1.2, 완성도 +5 |
| 프로 컨벡션 오븐 | 150,000 | 굽기 속도 x1.5, 완성도 +15 |
| 손 거품기 | 0 | 믹싱 속도 x1.0 |
| 스탠드 믹서 | 80,000 | 믹싱 속도 x1.3, 식감 +5 |
| 기본 진열대 | 0 | 재고 20개 |
| 확장 진열대 | 30,000 | 재고 35개 |
| 대형 쇼케이스 | 100,000 | 재고 50개, 신선도 +0.5 |

**인테리어 업그레이드**
| 이름 | 가격 | 효과 |
|------|------|------|
| 기본 인테리어 | 0 | 손님 유치 x1.0 |
| 아늑한 카페풍 | 70,000 | 손님 유치 x1.2, 단골 +5 |
| 모던 베이커리 | 200,000 | 손님 유치 x1.5, 가격 +10% |
| 손글씨 간판 | 0 | 가시성 x1.0 |
| 네온 간판 | 50,000 | 가시성 x1.3, 야간 보너스 +20% |

**재료 업그레이드**
| 이름 | 가격 | 효과 |
|------|------|------|
| 일반 카다이프 | 0 | 식감 기본 |
| 프리미엄 카다이프 | 40,000 | 식감 +10 |
| 일반 피스타치오 | 0 | 풍미 기본 |
| 이란산 피스타치오 | 60,000 | 풍미 +15 |
| 일반 코코아 | 0 | 달콤함 기본 |
| 발로나 코코아 | 80,000 | 달콤함 +10, 비주얼 +5 |

### 게임 흐름 변경
```
[기존] 인트로 → 튜토리얼 → 미니게임 → 베이킹 → ... (강제 순서)
[변경] 인트로 → 가게 허브 → 자유 선택
         ↓
       ┌─────────────────────┐
       │ 🏠 가게 허브         │
       ├─────────────────────┤
       │ 🧑‍🍳 쿠키 만들기 → PREP│
       │ 📖 레시피북 → RECIPE │
       │ 💸 판매하기 → SELL   │
       │ 📦 재고 확인         │
       │ ⬆️ 업그레이드        │
       └─────────────────────┘
```

### 수정된 파일
- `src/core/StateManager.js` - SHOP 상태 추가
- `src/states/IntroState.js` - SHOP으로 이동
- `src/states/TastingState.js` - 재고에 쿠키 추가
- `src/states/SellState.js` - 재고에서 판매

### 생성된 파일
- `src/core/InventoryManager.js` - 재고 관리 시스템
- `src/core/ShopUpgradeManager.js` - 업그레이드 시스템
- `src/states/ShopState.js` - 가게 허브 UI

---

## Phase 9: 시간 시스템 (에너지 + 시간대 + 캘린더) ✅
**완료일: 2026-01-18**

### 개요
에너지, 시간대, 7일 캘린더 시스템을 통합 구현. 전략적 플레이와 장기 목표를 제공.

### 1. 에너지 시스템
- **일일 에너지**: 100 (일요일은 50으로 제한)
- **활동별 소모량**:
  | 활동 | 에너지 소모 |
  |------|-----------|
  | 쿠키 제작 | 30 |
  | 판매 세션 | 20 |
  | 레시피 연구 | 15 |
  | 업그레이드 구매 | 10 |
- **에너지 0 또는 밤 시간대 종료 시 하루 종료**

### 2. 시간대 시스템 (4단계)
| 시간대 | 시간 | 특징 |
|--------|------|------|
| 🌅 아침 | 06:00-12:00 | 학생 손님 증가 |
| ☀️ 점심 | 12:00-18:00 | 직장인 러시 |
| 🌆 저녁 | 18:00-22:00 | 힙스터/SNS 바이럴 |
| 🌙 밤 | 22:00-06:00 | 두바이 관광객 프리미엄 |

- **에너지 25 소모당 1시간대 진행**
- **휴식 기능**: 에너지 소모 없이 시간대 스킵

### 3. 요일 시스템 (7일 캘린더)
| 요일 | 효과 |
|------|------|
| 💰 월요일 | 재료 20% 할인, 손님 -20% |
| 📅 화요일 | 평범한 하루 |
| 📈 수요일 | 시세 변동성 2배 |
| ❤️ 목요일 | 단골 등장 확률 2배 |
| 🎉 금요일 | 손님 +50%, 바이럴 확률 UP |
| ✨ 토요일 | 매출 10% 보너스 |
| 😴 일요일 | 에너지 50만, 연구 효율 +50% |

### 4. 특별 이벤트 시스템
- 랜덤 발생 확률 (3%~8%)
- 1~2일 지속

| 이벤트 | 효과 |
|--------|------|
| 🎪 두바이 푸드 페스티벌 | 손님 2.5배, 관광객 대거 방문 |
| 📸 인플루언서 방문 | 바이럴 확률 3배 |
| 🔍 위생 점검 | 손님 절반, 품질 요구↑ |
| 🌟 VIP 셀럽 주문 | 프리미엄 주문 확률↑ |
| 🌪️ 사막 폭풍 | 손님 급감 |
| 🔥 SNS 바이럴 | 손님 1.8배, 가격 +20% (2일) |

### 5. 하루 결산 시스템
- 에너지 소진 또는 수동 마감 시 결산 모달 표시
- 일일 통계: 제작/판매/손님/수익/최고 판매가
- "다음 날로" 버튼으로 진행

### 6. UI 변경사항

#### 헤더 (3행 구조)
```
┌─────────────────────────────────────┐
│ 📅 n일째  💰월  │  │     🌅 아침    │
│ ⚡ [████████░░░] 75/100 에너지      │
│ 🍪 두쫀쿠 베이커리   💰 12,500원    │
└─────────────────────────────────────┘
```

#### 탭 (5개)
- 🏠 메인: 활동 버튼 + 오늘 정보
- 📈 시세: 두쫀코스피 차트 + 분석
- 📆 캘린더: 주간 캘린더 + 요일 효과 설명
- 📦 재고: 쿠키 인벤토리
- ⬆️ 업그레이드: 업그레이드 구매

#### 시간대별 시각 효과
- 배경 그라데이션 변경
- 아침: 따뜻한 오렌지
- 점심: 밝은 노랑
- 저녁: 노을빛 핑크
- 밤: 별이 반짝이는 짙은 파랑

### 7. 시스템 통합

#### TastingState
- 쿠키 완성 시 `timeManager.recordCookieMade()` 호출

#### SellState
- 시간대별 손님 가중치 적용
- 요일별 가격 변동성/매출 보너스 적용
- 판매 시 `timeManager.recordCookieSold()`, `recordRevenue()` 호출

### 생성된 파일
- `src/core/TimeManager.js` - 시간 시스템 핵심 클래스 (800줄+)
- `tests/TimeManager.test.js` - 단위 테스트 (40+ 테스트 케이스)

### 수정된 파일
- `src/states/ShopState.js` - 시간 UI 통합, 캘린더 탭 추가
- `src/states/TastingState.js` - 쿠키 제작 기록
- `src/states/SellState.js` - 시간대/요일 효과 적용

---

## Phase 9.5: 모바일 성능 최적화 ✅
**완료일: 2026-01-18**

### 개요
모바일 환경에서의 GC 압력 감소, 라이프사이클 처리, 데이터 안정성 강화

### 1. Game.js 모바일 라이프사이클 최적화
- [x] `requestAnimationFrame` 바운드 함수 사용 (매 프레임 새 함수 생성 방지)
- [x] 바운드 이벤트 리스너 캐싱 (`_boundGameLoop`, `_boundResize`, `_boundVisibilityChange`)
- [x] 백그라운드 일시정지/재개 처리 (`visibilitychange`, `pagehide`, `blur/focus`)
- [x] 델타 타임 클램핑 (백그라운드 복귀 시 스파이크 방지: 1/30초로 제한)
- [x] Canvas 2D 컨텍스트 힌트 (`alpha: false`, `desynchronized: true`)

### 2. ParticleSystem.js 객체 풀링
- [x] 파티클 객체 풀 구현
  - 초기 풀 크기: 200개
  - 최대 풀 크기: 500개
- [x] `Particle.reset()` 메서드로 객체 재사용
- [x] `filter()` 대신 인플레이스 배열 업데이트
- [x] `forEach()` 대신 for 루프 사용 (콜백 오버헤드 방지)
- [x] 트레일 히스토리 객체 재사용

### 3. InputManager.js 입력 처리 최적화
- [x] `getBoundingClientRect()` 캐싱 (리사이즈 시에만 갱신)
- [x] 좌표 객체 재사용 (`_tempCoords`, `_touchStartCoords`, `_touchEndCoords`)
- [x] `slice()` 대신 `splice(0, n)` 사용 (새 배열 생성 방지)
- [x] `touches = []` 대신 `touches.length = 0` 사용
- [x] 오리엔테이션 변경 이벤트 처리
- [x] `invalidateRectCache()` 외부 호출 메서드 추가

### 4. Storage.js 데이터 무결성 강화
- [x] 체크섬 생성 및 검증 (djb2 해시)
- [x] 자동 백업 시스템 (저장 전 백업 생성)
- [x] 손상 데이터 자동 복구 (백업에서)
- [x] 스키마 버전 관리 및 마이그레이션 (`SCHEMA_VERSION`)
- [x] `QuotaExceededError` 처리 (백업 삭제로 공간 확보)
- [x] 저장 쓰로틀링 (`saveThrottled()`, 1초 간격)
- [x] 데이터 내보내기/가져오기 (`exportData()`, `importData()`)
- [x] playerData 필드 검증 (money, day, reputation)
- [x] 저장소 상태 확인 (`getStorageStats()`)

### 수정된 파일
- `src/core/Game.js` - 라이프사이클 핸들러, 바운드 함수
- `src/core/ParticleSystem.js` - 객체 풀링, 인플레이스 업데이트
- `src/core/InputManager.js` - rect 캐싱, 객체 재사용
- `src/utils/Storage.js` - 무결성 검증, 백업, 마이그레이션

### 성능 개선 효과
| 항목 | 개선 전 | 개선 후 |
|------|---------|---------|
| 게임 루프 함수 생성 | 60회/초 | 0회/초 |
| 파티클 객체 생성 | 무제한 | 풀에서 재사용 |
| 배열 생성 (filter) | 60회/초 | 0회/초 |
| getBoundingClientRect | 입력당 1회 | 리사이즈 시에만 |
| 저장소 쓰기 | 즉시 | 1초 쓰로틀링 |

---

## Phase 9.6: 8-Bit 픽셀 스타일 UI 리모델링 ✅
**완료일: 2026-01-18**

### 개요
ShopState UI를 대시보드 스타일에서 레트로 8-bit 픽셀 게임 스타일로 전면 개편. 모든 이모지를 텍스트 라벨과 기하학적 도형으로 대체.

### 1. 색상 팔레트 변경 (베이커리 테마)
```javascript
COLORS = {
  primary: '#5D4037',       // 다크 브라운
  secondary: '#8D6E63',     // 미디엄 브라운
  accent: '#D4A574',        // 골든 브라운
  success: '#4A7C59',       // 포레스트 그린
  danger: '#8B4513',        // 새들 브라운
  cardBg: '#FFF8E7',        // 크림 화이트
  border: '#2D2016',        // 두꺼운 검정 테두리
  shadow: '#1A1410'         // 하드 섀도우
}
```

### 2. 픽셀 스타일 헬퍼 메서드
- `drawPixelBox()` - 하드 섀도우, 검정 테두리 (border-radius 없음)
- `drawPixelButton()` - 눌림 효과가 있는 픽셀 버튼
- `drawPixelProgressBar()` - 10 세그먼트로 나뉜 프로그레스 바
- `drawPixelIcon()` - 기하학적 도형 아이콘 (cookie, oven, display, money, energy, star, moon, book)

### 3. 이모지 → 텍스트 라벨 변환
| 기존 이모지 | 새로운 라벨 |
|------------|-----------|
| 🧑‍🍳 | BAKE COOKIE |
| 💸 | SELL COOKIE |
| 📖 | RECIPE BOOK |
| 😴 | REST |
| 🌙 | END DAY |
| 📊 | [ TODAY STATS ] |
| 📆 | [ WEEKLY SCHEDULE ] |
| 📈 | [ COOKIE MARKET ] |
| ✓ 보유 | [OK] |

### 4. 변환된 UI 컴포넌트
- [x] **renderHeader** - 픽셀 패널 + 텍스트 라벨
- [x] **renderEnergyBar** - 10 세그먼트 픽셀 바 + 시간대 마커
- [x] **renderTabBar** - 5개 픽셀 버튼 (SHOP, PRICE, WEEK, STOCK, BUILD)
- [x] **renderMainTab** - 픽셀 액션 버튼 + 아이콘
- [x] **renderTodayInfoCard** - 시간대 픽셀 박스 (AM/PM/EVE/NT)
- [x] **renderStatsCard** - 텍스트 라벨 통계
- [x] **renderCalendarTab** - 요일 효과 심볼 ($, -, ^, *, !, +, Z)
- [x] **renderUpgradeSubTabs** - EQUIP/DECOR/INGRE
- [x] **renderUpgradeCard** - 픽셀 아이콘 박스 + [LOCKED]/[NO POWER]
- [x] **renderEventNotification** - [EVENT] 라벨
- [x] **renderDayEndModal** - [ DAY END ] + >> NEXT DAY >>
- [x] **spawnNews** - [UP]/[DN] 텍스트 마커

### 5. 픽셀 폰트 상수
```javascript
PIXEL_FONT = {
  title: 'bold 20px "DungGeunMo", monospace',
  large: 'bold 16px "DungGeunMo", monospace',
  normal: '14px "DungGeunMo", monospace',
  small: '12px "DungGeunMo", monospace',
  tiny: '10px "DungGeunMo", monospace'
}
```

### 수정된 파일
- `src/states/ShopState.js` - 전면 UI 리모델링 (~700줄 수정)

### 디자인 원칙
- **No Emojis**: 모든 이모지를 텍스트 라벨과 기하학적 도형으로 대체
- **Hard Shadows**: border-radius 대신 4px 하드 섀도우
- **Pixel Borders**: 2-4px 검정 테두리
- **High Contrast**: 따뜻한 베이커리 색상 팔레트
- **Segmented Bars**: 부드러운 바 대신 10칸 세그먼트

---

## Phase 10: 추가 기능 (예정) 📋

- [ ] 단골 손님 호감도 시스템 강화
- [ ] 업적 시스템
- [ ] 리더보드
- [ ] 실제 이미지 에셋 적용
- [ ] BGM 추가
- [ ] 진동 피드백 (모바일)
- [ ] PWA 설정

---

## Phase 10: 폴리싱 & 릴리즈 (예정) 📋

- [ ] 버그 수정 및 최적화
- [ ] 밸런스 조정
- [ ] 사운드 볼륨 조절 UI
- [ ] 저장/불러오기 완성
- [ ] 프로덕션 빌드 테스트
- [ ] 배포

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 빌드 | Vite |
| 언어 | Vanilla JavaScript (ES6+) |
| 렌더링 | HTML5 Canvas API |
| 사운드 | Web Audio API (프로시저럴) |
| 저장 | localStorage |
| 패턴 | State Machine |

---

## 메모

- 개발 서버: `npm run dev` → http://localhost:3000
- 개발자 모드: `?dev` URL 파라미터 (스킵 버튼 표시)
- 자동 스킵: `?skip` URL 파라미터 (인트로/튜토리얼 건너뜀)
- 해상도: 390x844 (모바일 기준)
