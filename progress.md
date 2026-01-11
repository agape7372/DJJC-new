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

## Phase 8: 추가 기능 (예정) 📋

- [ ] 업그레이드 시스템 (장비, 재료)
- [ ] 단골 손님 호감도 시스템 강화
- [ ] 업적 시스템
- [ ] 리더보드
- [ ] 실제 이미지 에셋 적용
- [ ] BGM 추가
- [ ] 진동 피드백 (모바일)
- [ ] PWA 설정

---

## Phase 9: 폴리싱 & 릴리즈 (예정) 📋

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
- 개발자 모드: `?dev=1` URL 파라미터
- 해상도: 390x844 (모바일 기준)
