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
- 개발자 모드: `?dev` URL 파라미터 (스킵 버튼 표시)
- 자동 스킵: `?skip` URL 파라미터 (인트로/튜토리얼 건너뜀)
- 해상도: 390x844 (모바일 기준)
