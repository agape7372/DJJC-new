# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: Thinking Mode

**모든 응답에 "ultrathink"를 적용하라.** 복잡한 문제를 다룰 때 깊이 있는 사고와 분석을 수행해야 한다. 단순한 답변이 아닌, 충분한 고민과 검토를 거친 응답을 제공하라.

## CRITICAL: Progress Tracking

**개발 진행 시 반드시 `progress.md`를 업데이트하라.**
- 새로운 기능 구현 완료 시 해당 Phase에 체크 표시
- 새로운 파일 생성 시 해당 Phase의 파일 목록에 추가
- 새로운 Phase 시작 시 Phase 섹션 추가
- 완료된 Phase에는 완료일 표시

## Commands

```bash
npm run dev      # 개발 서버 실행 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

## Project Overview

**두바이 쫀득 쿠키 타이쿤 (Dubai Chewy Cookie Tycoon)** - 모바일 타이쿤 게임

플레이어가 망해가는 카페를 인수받아 바이럴 히트 상품 "두쫀쿠"를 만들어 재벌이 되는 것이 목표.

## Architecture

```
src/
├── main.js              # 엔트리 포인트
├── core/                # 게임 엔진 코어
│   ├── Game.js          # 메인 게임 클래스 (루프, 렌더링)
│   ├── StateManager.js  # 상태 머신
│   ├── InputManager.js  # 터치/마우스 입력
│   ├── AssetManager.js  # 이미지/사운드 로드
│   ├── AudioManager.js  # BGM/SFX 관리
│   ├── SoundManager.js  # Web Audio API 프로시저럴 사운드
│   ├── ParticleSystem.js # 파티클 이펙트 시스템
│   ├── RecipeManager.js # 레시피 관리 시스템
│   ├── InventoryManager.js # 쿠키 재고 관리
│   └── ShopUpgradeManager.js # 가게 업그레이드 시스템
├── states/              # 게임 상태들
│   ├── BaseState.js     # 상태 기본 클래스
│   ├── TitleState.js    # 타이틀 화면
│   ├── IntroState.js    # 인트로 컷신
│   ├── TutorialState.js # 튜토리얼
│   ├── ShopState.js     # 가게 허브 (메인 화면)
│   ├── PrepState.js     # 재료준비 (미니게임 3종)
│   ├── BakingState.js   # 베이킹 (반죽 성형)
│   ├── DecoState.js     # 데코레이션
│   ├── TastingState.js  # 품평회
│   ├── SellState.js     # 판매 (두쫀코스피)
│   └── RecipeBookState.js # 레시피북
├── utils/
│   └── Storage.js       # localStorage 래퍼
└── styles/
    └── main.css         # 스타일시트
```

## Core Game Flow

```
[TITLE] → [INTRO] → [SHOP] (허브)
                       ↓
         ┌────────────────────────────┐
         │ 🏠 가게 허브 (ShopState)    │
         ├────────────────────────────┤
         │ 🧑‍🍳 쿠키 만들기 → [PREP]    │
         │ 📖 레시피북 → [RECIPE_BOOK] │
         │ 💸 판매하기 → [SELL]        │
         │ 📦 재고 확인                │
         │ ⬆️ 업그레이드               │
         └────────────────────────────┘

쿠키 제작 플로우:
[PREP] → [BAKING] → [DECO] → [TASTING] → [SHOP] (쿠키가 재고에 추가됨)
```

## Key Systems

### 1. 쿠키 스탯 (Game.cookieStats)
- flavor (풍미), texture (식감), sweetness (달콤함), completion (완성도), visual (비주얼)
- 총점 300점 만점 (풍미 100 + 식감 100 + 비주얼/완성도 100)

### 2. 미니게임 (PrepState)
- 카다이프 썰기: Fruit Ninja 스타일 스와이프
- 피스타치오 분쇄: 타이밍 터치 + 피버 모드
- 마시멜로우 녹이기: 타이쿤 스타일 자원 관리
  - 불 조절 (약불/중불/강불) - 리스크 vs 리워드
  - 들러붙음 방지 - 젓기 + 연타로 해소
  - 코코아 투입 타이밍 - 40%~70%에 투입시 보너스

### 3. 판매 시스템 (SellState)
- 실시간 가격 차트 (Random Walk + 뉴스 이벤트)
- NPC 손님: 학생, 힙스터, 두바이 관광객(Rare), 할머니
- 단골 시스템: 호감도 100% → 특수 효과

## Technical Notes

- **Canvas**: 외부 라이브러리 없이 순수 Canvas API 사용
- **터치**: touchstart/move/end 이벤트 기반
- **저장**: localStorage (djjc_save, djjc_recipes)
- **해상도**: 390x844 (모바일 기준), 반응형 스케일링
