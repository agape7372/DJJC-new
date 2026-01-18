/**
 * PrepState - 재료 준비 단계 (고품질 리팩토링)
 * 3가지 미니게임: 카다이프 썰기, 피스타치오 분쇄, 마시멜로우 녹이기
 *
 * 사운드 + 파티클 + 키치한 비주얼 적용
 */

import { BaseState } from './BaseState.js';
import { GameState } from '../core/StateManager.js';
import { COLORS } from '../core/ParticleSystem.js';
import { recipeManager } from '../core/RecipeManager.js';

/**
 * 마시멜로우 녹이기 게임 설정 상수
 * @constant
 */
const MELT_CONFIG = {
  // 불 세기별 설정 (약불/중불/강불)
  HEAT_LEVELS: [
    { name: '약불', meltRate: 0.8, stickRate: 0.3, color: '#4ECDC4', icon: '🔵' },
    { name: '중불', meltRate: 1.5, stickRate: 0.8, color: '#FFD93D', icon: '🟡' },
    { name: '강불', meltRate: 2.5, stickRate: 2.0, color: '#FF6B6B', icon: '🔴' }
  ],
  // 들러붙음 관련
  STICK_THRESHOLD: 100,           // 들러붙음 최대치
  STICK_RESOLVE_PER_TAP: 12,      // 연타 1회당 감소량
  STICK_PENALTY_SCORE: 5,         // 들러붙음 시 점수 페널티
  // 코코아 관련
  COCOA_OPTIMAL_MIN: 40,          // 코코아 투입 적정 구간 시작 (%)
  COCOA_OPTIMAL_MAX: 70,          // 코코아 투입 적정 구간 끝 (%)
  COCOA_PERFECT_BONUS: 25,        // 적정 타이밍 보너스
  COCOA_EARLY_PENALTY: 10,        // 너무 빠름 페널티
  COCOA_LATE_PENALTY: 15,         // 너무 늦음 페널티
  // 목표
  MELT_TARGET: 100,               // 녹임 목표치
  BASE_SCORE_PER_PERCENT: 0.8     // 1% 녹일 때마다 기본 점수
};

export class PrepState extends BaseState {
  constructor(game) {
    super(game);

    // 미니게임 단계
    this.phase = 0; // 0: 카다이프, 1: 피스타치오, 2: 마시멜로우
    this.phaseNames = ['카다이프 썰기', '피스타치오 분쇄', '마시멜로우 녹이기'];
    this.phaseIcons = ['🥖', '🥜', '🍫'];
    this.phaseDescriptions = [
      '날아오는 카다이프를 스와이프로 썰어라!',
      '피스타치오를 터치해서 으깨라!',
      '불 조절하며 마시멜로우를 녹여라!'
    ];

    // 공통 게임 상태
    this.score = 0;
    this.timeLeft = 30;
    this.isPlaying = false;
    this.showResult = false;
    this.showIntro = true;
    this.introTimer = 0;

    // 콤보 시스템
    this.combo = 0;
    this.maxCombo = 0;
    this.lastHitTime = 0;
    this.comboTimeout = 1000; // 1초 내 연속 히트

    // 스크린 셰이크
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;

    // 카다이프 게임
    this.kadaifs = [];
    this.sliceTrail = [];
    this.slicedPieces = []; // 잘린 조각들

    // 피스타치오 게임
    this.pistachios = [];
    this.feverGauge = 0;
    this.isFever = false;
    this.feverTimer = 0;

    // 마시멜로우 녹이기 게임 (리팩토링)
    this.melt = {
      progress: 0,              // 녹음 진행도 (0~100)
      heatLevel: 0,             // 현재 불 세기 (0: 약불, 1: 중불, 2: 강불)
      stickGauge: 0,            // 들러붙음 게이지 (0~100)
      isStuck: false,           // 들러붙음 상태 (연타 모드)
      cocoaAdded: false,        // 코코아 투입 여부
      cocoaBonus: 0,            // 코코아 타이밍 보너스
      bubbleTimer: 0,           // 버블 이펙트 타이머
      sizzleTimer: 0,           // 지글 사운드 타이머
      stirCount: 0,             // 젓기 횟수 (연타)
      lastStickSound: 0         // 마지막 찌직 소리 시간
    };
  }

  enter() {
    this.phase = 0;
    this.showIntro = true;
    this.introTimer = 0;

    this.game.inputManager.onTap = (pos) => this.handleTap(pos);
    this.game.inputManager.onDrag = (pos, dist, angle) => this.handleDrag(pos, dist, angle);
    this.game.inputManager.onDragEnd = () => this.handleDragEnd();

    // 파티클 초기화
    this.game.particles.clear();
  }

  exit() {
    this.game.inputManager.onTap = null;
    this.game.inputManager.onDrag = null;
    this.game.inputManager.onDragEnd = null;
  }

  startMiniGame() {
    this.score = 0;
    this.timeLeft = 30;
    this.isPlaying = true;
    this.showResult = false;
    this.showIntro = false;
    this.combo = 0;
    this.maxCombo = 0;

    if (this.phase === 0) {
      this.kadaifs = [];
      this.sliceTrail = [];
      this.slicedPieces = [];
    } else if (this.phase === 1) {
      this.pistachios = [];
      this.feverGauge = 0;
      this.isFever = false;
    } else if (this.phase === 2) {
      // 마시멜로우 녹이기 초기화
      this.melt = {
        progress: 0,
        heatLevel: 0,       // 약불로 시작
        stickGauge: 0,
        isStuck: false,
        cocoaAdded: false,
        cocoaBonus: 0,
        bubbleTimer: 0,
        sizzleTimer: 0,
        stirCount: 0,
        lastStickSound: 0
      };
    }

    this.game.sound.playUIClick();
  }

  handleTap(pos) {
    // DEV 모드 스킵 버튼 체크
    if (this.config.devMode) {
      const skipBtn = { x: this.config.width - 80, y: 120, width: 70, height: 35 };
      if (this.isPointInRect(pos, skipBtn)) {
        this.game.sound.playUIClick();
        this.game.stateManager.changeState(GameState.BAKING);
        return;
      }
    }

    if (this.showIntro) {
      this.startMiniGame();
      return;
    }

    if (this.showResult) {
      this.nextPhase();
      return;
    }

    // 피스타치오 게임 터치
    if (this.phase === 1 && this.isPlaying) {
      this.checkPistachioHit(pos);
    }

    // 마시멜로우 녹이기 게임 터치
    if (this.phase === 2 && this.isPlaying) {
      this.handleMarshmallowTap(pos);
    }
  }

  /**
   * 마시멜로우 녹이기 게임 터치 처리
   * @param {{x: number, y: number}} pos - 터치 위치
   */
  handleMarshmallowTap(pos) {
    const W = this.config.width;
    const H = this.config.height;

    // 들러붙음 상태일 때 - 연타로 해소
    if (this.melt.isStuck) {
      this.melt.stirCount++;
      this.melt.stickGauge -= MELT_CONFIG.STICK_RESOLVE_PER_TAP;
      this.game.sound.playTap();
      this.game.particles.emitTapSuccess(pos.x, pos.y);
      this.addCombo();

      // 들러붙음 해소
      if (this.melt.stickGauge <= 0) {
        this.melt.stickGauge = 0;
        this.melt.isStuck = false;
        this.melt.stirCount = 0;
        this.game.sound.playSuccess();
        this.game.particles.emitSparkle(W / 2, H * 0.45, COLORS.ui.green);
      }
      return;
    }

    // 불 조절 버튼 체크 (화면 하단 좌측)
    const heatBtnY = H - 160;
    const heatBtnStartX = 30;
    const heatBtnWidth = 80;
    const heatBtnHeight = 50;
    const heatBtnGap = 10;

    for (let i = 0; i < 3; i++) {
      const btnX = heatBtnStartX + i * (heatBtnWidth + heatBtnGap);
      const btnRect = { x: btnX, y: heatBtnY, width: heatBtnWidth, height: heatBtnHeight };

      if (this.isPointInRect(pos, btnRect)) {
        if (this.melt.heatLevel !== i) {
          this.melt.heatLevel = i;
          this.game.sound.playUIClick();
          this.shakeIntensity = 3;
        }
        return;
      }
    }

    // 코코아 투입 버튼 체크 (화면 하단 우측)
    const cocoaBtnRect = { x: W - 110, y: heatBtnY, width: 80, height: heatBtnHeight };
    if (this.isPointInRect(pos, cocoaBtnRect) && !this.melt.cocoaAdded) {
      this.addCocoa();
      return;
    }

    // 냄비 영역 터치 - 젓기 (예방적 젓기)
    const potArea = { x: W / 2 - 80, y: H * 0.3, width: 160, height: 150 };
    if (this.isPointInRect(pos, potArea) && !this.melt.isStuck) {
      // 들러붙음 게이지 약간 감소 (예방)
      this.melt.stickGauge = Math.max(0, this.melt.stickGauge - 3);
      this.game.sound.playTap();

      // 살짝 반응
      const potCenterX = W / 2;
      const potCenterY = H * 0.45;
      this.game.particles.emitMeltBubble(potCenterX, potCenterY, this.melt.cocoaAdded);
    }
  }

  /**
   * 코코아 투입 처리
   */
  addCocoa() {
    if (this.melt.cocoaAdded) return;

    this.melt.cocoaAdded = true;
    const progress = this.melt.progress;
    const centerX = this.config.width / 2;
    const centerY = this.config.height * 0.45;

    // 파티클 & 사운드
    this.game.sound.playCocoaPour();
    this.game.particles.emitCocoaPour(centerX, centerY);

    // 타이밍 보너스 계산
    if (progress >= MELT_CONFIG.COCOA_OPTIMAL_MIN && progress <= MELT_CONFIG.COCOA_OPTIMAL_MAX) {
      // 퍼펙트 타이밍!
      this.melt.cocoaBonus = MELT_CONFIG.COCOA_PERFECT_BONUS;
      this.score += MELT_CONFIG.COCOA_PERFECT_BONUS;
      this.game.particles.emitPerfectTiming(centerX, centerY);
      this.game.sound.playFanfare();
      this.shakeIntensity = 8;
    } else if (progress < MELT_CONFIG.COCOA_OPTIMAL_MIN) {
      // 너무 빨리
      this.melt.cocoaBonus = -MELT_CONFIG.COCOA_EARLY_PENALTY;
      this.score = Math.max(0, this.score - MELT_CONFIG.COCOA_EARLY_PENALTY);
      this.game.sound.playFail();
      this.shakeIntensity = 5;
    } else {
      // 너무 늦게
      this.melt.cocoaBonus = -MELT_CONFIG.COCOA_LATE_PENALTY;
      this.score = Math.max(0, this.score - MELT_CONFIG.COCOA_LATE_PENALTY);
      this.game.sound.playFail();
      this.shakeIntensity = 5;
    }
  }

  handleDrag(pos, dist, angle) {
    if (!this.isPlaying || this.showIntro) return;

    // 카다이프 게임 슬라이스
    if (this.phase === 0) {
      this.sliceTrail.push({ ...pos, time: Date.now() });
      this.checkKadaifSlice(pos);
    }

    // 마시멜로우 녹이기 - 드래그로 젓기 (들러붙음 예방)
    if (this.phase === 2 && !this.melt.isStuck) {
      const W = this.config.width;
      const H = this.config.height;
      const potArea = { x: W / 2 - 80, y: H * 0.3, width: 160, height: 150 };

      if (this.isPointInRect(pos, potArea)) {
        // 드래그 거리에 비례해서 들러붙음 감소
        this.melt.stickGauge = Math.max(0, this.melt.stickGauge - dist * 0.5);

        // 버블 이펙트
        if (Math.random() < 0.3) {
          this.game.particles.emitMeltBubble(pos.x, pos.y, this.melt.cocoaAdded);
        }
      }
    }
  }

  handleDragEnd() {
    if (this.phase === 0) {
      this.sliceTrail = [];
    }
  }

  nextPhase() {
    // 점수를 쿠키 스탯에 반영
    this.applyScore();

    this.phase++;
    if (this.phase >= 3) {
      // 재료 준비 완료 -> 베이킹으로
      this.game.sound.playSuccess();
      this.game.stateManager.changeState(GameState.BAKING);
    } else {
      this.showIntro = true;
      this.introTimer = 0;
      this.game.sound.playUIClick();
    }
  }

  applyScore() {
    const bonus = Math.floor(this.score / 10);

    switch (this.phase) {
      case 0: // 카다이프 -> 식감
        this.game.cookieStats.texture += bonus;
        break;
      case 1: // 피스타치오 -> 풍미, 비주얼
        this.game.cookieStats.flavor += bonus;
        this.game.cookieStats.visual += Math.floor(bonus / 2);
        break;
      case 2: // 마시멜로우 -> 완성도, 달콤함
        this.game.cookieStats.completion += bonus;
        this.game.cookieStats.sweetness += Math.floor(bonus / 2);
        break;
    }
  }

  // 콤보 증가
  addCombo() {
    const now = Date.now();
    if (now - this.lastHitTime < this.comboTimeout) {
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);

      if (this.combo >= 3) {
        this.game.sound.playCrunch();
        this.game.particles.emitComboExplosion(
          this.config.width / 2,
          this.config.height / 2,
          this.combo
        );
        this.shakeIntensity = Math.min(15, this.combo * 2);
      }
    } else {
      this.combo = 1;
    }
    this.lastHitTime = now;
  }

  update(dt) {
    // 인트로 타이머
    if (this.showIntro) {
      this.introTimer += dt;
      return;
    }

    if (!this.isPlaying) return;

    // 타이머
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.isPlaying = false;
      this.showResult = true;
      this.game.sound.playSuccess();
      this.game.particles.emitCelebration(
        this.config.width / 2,
        this.config.height / 2,
        this.config.width,
        this.config.height
      );

      // 퍼펙트 기록 (80점 이상 달성 시)
      const PERFECT_THRESHOLD = 80;
      if (this.score >= PERFECT_THRESHOLD) {
        const perfectTypes = ['kadaif', 'pistachio', 'marshmallow'];
        recipeManager.recordPerfect(perfectTypes[this.phase]);
      }

      return;
    }

    // 스크린 셰이크 감쇠
    this.shakeIntensity *= this.shakeDecay;

    // 미니게임별 업데이트
    if (this.phase === 0) this.updateKadaif(dt);
    else if (this.phase === 1) this.updatePistachio(dt);
    else if (this.phase === 2) this.updateMarshmallow(dt);
  }

  // ========== 카다이프 썰기 (Fruit Ninja 스타일) ==========

  // 카다이프 물리 상수 (Fruit Ninja 참고)
  static KADAIF_PHYSICS = {
    GRAVITY: 850,              // 중력 (더 강한 포물선)
    MIN_VY: -950,              // 최소 상향 속도
    MAX_VY: -750,              // 최대 상향 속도 (덜 세게)
    MIN_VX: -180,              // 좌측 최대 수평 속도
    MAX_VX: 180,               // 우측 최대 수평 속도
    SPAWN_MARGIN: 0.15,        // 화면 가장자리 여백 (15%)
    APEX_MIN: 0.25,            // 최소 정점 높이 (화면 상단 25%)
    APEX_MAX: 0.45,            // 최대 정점 높이 (화면 상단 45%)
  };

  updateKadaif(dt) {
    // 새 카다이프 생성 (스폰 레이트 조정)
    if (Math.random() < dt * 2.2) {
      this.spawnKadaif();
    }

    const GRAVITY = PrepState.KADAIF_PHYSICS.GRAVITY;

    // 카다이프 이동 (Fruit Ninja 스타일 물리)
    this.kadaifs.forEach(k => {
      // 위치 업데이트
      k.x += k.vx * dt;
      k.y += k.vy * dt;

      // 중력 적용 (강한 포물선 효과)
      k.vy += GRAVITY * dt;

      // 회전 (속도에 비례하여 더 역동적으로)
      const speed = Math.sqrt(k.vx * k.vx + k.vy * k.vy);
      k.rotation += k.rotSpeed * dt * (1 + speed / 500);

      // 정점 감지 (슬로우 모션 효과용 - 선택적)
      if (k.vy > -50 && k.vy < 50 && !k.reachedApex) {
        k.reachedApex = true;
      }
    });

    // 잘린 조각 업데이트
    this.slicedPieces = this.slicedPieces.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += GRAVITY * 1.2 * dt; // 조각은 약간 더 빠르게 떨어짐
      p.rotation += p.rotSpeed * dt;
      p.alpha -= dt * 1.2;
      return p.alpha > 0 && p.y < this.config.height + 100;
    });

    // 화면 밖 카다이프 제거 (좌우도 체크)
    this.kadaifs = this.kadaifs.filter(k =>
      !k.sliced &&
      k.y < this.config.height + 80 &&
      k.x > -100 &&
      k.x < this.config.width + 100
    );

    // 슬라이스 트레일 페이드
    const now = Date.now();
    this.sliceTrail = this.sliceTrail.filter(p => now - p.time < 100);
  }

  spawnKadaif() {
    const P = PrepState.KADAIF_PHYSICS;
    const W = this.config.width;
    const H = this.config.height;

    // 스페셜 타입 확률
    const rand = Math.random();
    let type = 'normal';
    if (rand < 0.05) type = 'super';
    else if (rand < 0.12) type = 'golden';
    else if (rand < 0.20) type = 'premium';

    // ===== Fruit Ninja 스타일 스폰 =====

    // 1. 스폰 X 위치: 화면 하단 전체 영역에서 랜덤 (15%~85%)
    const spawnX = W * P.SPAWN_MARGIN + Math.random() * W * (1 - 2 * P.SPAWN_MARGIN);

    // 2. 스폰 위치가 중앙에서 얼마나 떨어졌는지 계산 (-1 ~ 1)
    const centerOffset = (spawnX - W / 2) / (W / 2);

    // 3. 수평 속도 계산:
    //    - 왼쪽에서 스폰하면 오른쪽(양수)으로, 오른쪽에서 스폰하면 왼쪽(음수)으로
    //    - 가장자리일수록 중앙을 향해 더 빠르게
    //    - 약간의 랜덤성 추가
    const baseVx = -centerOffset * P.MAX_VX * (0.6 + Math.random() * 0.4);
    const randomVx = (Math.random() - 0.5) * 80; // 추가 랜덤
    const vx = baseVx + randomVx;

    // 4. 수직 속도 계산:
    //    - 목표 정점 높이를 기반으로 계산
    //    - 정점 높이 = H * (APEX_MIN ~ APEX_MAX)
    const targetApexY = H * (P.APEX_MIN + Math.random() * (P.APEX_MAX - P.APEX_MIN));
    const travelDistance = H - targetApexY; // 올라가야 할 거리

    // 물리 공식: v² = 2 * g * h → v = -sqrt(2 * g * h)
    const baseVy = -Math.sqrt(2 * P.GRAVITY * travelDistance);

    // 약간의 랜덤성 추가 (±10%)
    const vy = baseVy * (0.9 + Math.random() * 0.2);

    // 5. 회전 속도: 수평 속도에 비례 (자연스러운 회전)
    const rotSpeed = (Math.random() - 0.5) * 8 + (vx / P.MAX_VX) * 3;

    // 6. 크기 랜덤
    const size = 45 + Math.random() * 20;

    this.kadaifs.push({
      x: spawnX,
      y: H + 30,
      vx,
      vy,
      size,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed,
      type,
      sliced: false,
      reachedApex: false
    });

    // 스페셜 등장 사운드
    if (type !== 'normal') {
      this.game.sound.playSpecial();
    }
  }

  // 동시에 여러 개 스폰 (웨이브)
  spawnKadaifWave(count = 3) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => this.spawnKadaif(), i * 100);
    }
  }

  checkKadaifSlice(pos) {
    if (this.sliceTrail.length < 2) return;

    const prevPos = this.sliceTrail[this.sliceTrail.length - 2];
    const sliceAngle = Math.atan2(pos.y - prevPos.y, pos.x - prevPos.x);

    this.kadaifs.forEach(k => {
      if (k.sliced) return;

      const dx = pos.x - k.x;
      const dy = pos.y - k.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < k.size * 0.8) {
        k.sliced = true;

        // 점수 계산
        let points = 10;
        let particleColor = COLORS.kadaif.main;

        switch (k.type) {
          case 'premium':
            points = 15;
            particleColor = COLORS.kadaif.light;
            break;
          case 'golden':
            points = 20;
            particleColor = COLORS.kadaif.golden;
            break;
          case 'super':
            points = 30;
            particleColor = COLORS.ui.purple;
            break;
        }

        this.score += points;
        this.addCombo();

        // 사운드
        this.game.sound.playSlice();

        // 파티클 (슬라이스 방향으로)
        this.game.particles.emitSlice(k.x, k.y, sliceAngle);

        // 잘린 조각 생성
        this.createSlicedPieces(k, sliceAngle);

        // 스페셜 아이템 추가 효과
        if (k.type !== 'normal') {
          this.game.particles.emitSparkle(k.x, k.y, particleColor);
          this.shakeIntensity = 8;
        }
      }
    });
  }

  createSlicedPieces(kadaif, angle) {
    // 두 조각으로 분리
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;
      const perpAngle = angle + Math.PI / 2;

      this.slicedPieces.push({
        x: kadaif.x + Math.cos(perpAngle) * side * 10,
        y: kadaif.y + Math.sin(perpAngle) * side * 10,
        vx: Math.cos(perpAngle) * side * 80 + kadaif.vx,
        vy: kadaif.vy * 0.5 - 50,
        size: kadaif.size * 0.6,
        rotation: kadaif.rotation,
        rotSpeed: kadaif.rotSpeed * 2 + side * 3,
        type: kadaif.type,
        alpha: 1,
        half: i // 0: 왼쪽, 1: 오른쪽
      });
    }
  }

  // ========== 피스타치오 분쇄 ==========
  updatePistachio(dt) {
    // 피버 모드 타이머
    if (this.isFever) {
      this.feverTimer -= dt;
      this.feverGauge = (this.feverTimer / 3) * 100;

      // 피버 중 파티클
      this.game.particles.emitFeverFlame(
        this.config.width / 2,
        this.config.height * 0.6
      );

      if (this.feverTimer <= 0) {
        this.isFever = false;
        this.feverGauge = 0;
      }

      // 자동 분쇄
      this.pistachios.forEach(p => {
        if (!p.crushed && p.type !== 'bad') {
          p.crushed = true;
          this.score += 5;
          this.game.particles.emitCrush(p.x, p.y);
        }
      });
    }

    // 새 피스타치오 생성
    const spawnRate = this.isFever ? 5 : 3;
    if (Math.random() < dt * spawnRate) {
      this.spawnPistachio();
    }

    // 피스타치오 애니메이션
    this.pistachios.forEach(p => {
      if (!p.crushed) {
        p.bouncePhase += dt * 8;
        p.y = p.baseY + Math.sin(p.bouncePhase) * 8;
        p.scale = 1 + Math.sin(p.bouncePhase * 2) * 0.05;
      } else {
        p.fadeTimer -= dt;
      }
    });

    // 오래된 것 제거
    this.pistachios = this.pistachios.filter(p => !p.crushed || p.fadeTimer > 0);
  }

  spawnPistachio() {
    const rand = Math.random();
    let type = 'normal';
    if (rand < 0.08) type = 'emerald';
    else if (rand < 0.15) type = 'roasted';
    else if (rand < 0.22) type = 'bad';

    const pistachio = {
      x: 60 + Math.random() * (this.config.width - 120),
      baseY: this.config.height * 0.45 + Math.random() * 120,
      y: 0,
      size: 35 + Math.random() * 10,
      type,
      crushed: false,
      bouncePhase: Math.random() * Math.PI * 2,
      fadeTimer: 0.4,
      scale: 1
    };
    pistachio.y = pistachio.baseY;

    this.pistachios.push(pistachio);

    if (type === 'emerald' || type === 'roasted') {
      this.game.sound.playSpecial();
    }
  }

  checkPistachioHit(pos) {
    let hit = false;

    this.pistachios.forEach(p => {
      if (p.crushed) return;

      const dx = pos.x - p.x;
      const dy = pos.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < p.size) {
        p.crushed = true;
        hit = true;

        if (p.type === 'bad') {
          // 패널티
          this.score = Math.max(0, this.score - 10);
          this.timeLeft = Math.max(0, this.timeLeft - 1);
          this.combo = 0;
          this.game.sound.playFail();
          this.shakeIntensity = 12;
          this.game.particles.emitScreenFlash(this.config.width, this.config.height, '#ff0000');
        } else {
          // 점수
          let points = 10;
          if (p.type === 'emerald') points = 30;
          else if (p.type === 'roasted') points = 20;

          this.score += points;
          this.addCombo();

          // 피버 게이지
          if (!this.isFever) {
            this.feverGauge = Math.min(100, this.feverGauge + (p.type === 'roasted' ? 25 : 15));

            if (this.feverGauge >= 100) {
              this.isFever = true;
              this.feverTimer = 3;
              this.game.sound.playFever();
              this.game.particles.emitScreenFlash(this.config.width, this.config.height, COLORS.ui.red);
            }
          }

          this.game.sound.playCrush();
          this.game.particles.emitCrush(p.x, p.y);

          if (p.type !== 'normal') {
            this.game.particles.emitSparkle(p.x, p.y,
              p.type === 'emerald' ? COLORS.pistachio.light : COLORS.kadaif.main);
          }
        }
      }
    });
  }

  // ========== 마시멜로우 녹이기 (타이쿤 스타일) ==========

  /**
   * 마시멜로우 녹이기 게임 업데이트
   * @param {number} dt - 델타 타임
   */
  updateMarshmallow(dt) {
    const W = this.config.width;
    const H = this.config.height;
    const potCenterX = W / 2;
    const potCenterY = H * 0.45;

    // 들러붙음 상태면 진행 중단
    if (this.melt.isStuck) {
      // 연기/찌직 효과
      if (Math.random() < dt * 3) {
        this.game.particles.emitStickWarning(potCenterX, potCenterY);
      }
      return;
    }

    // 현재 불 세기 설정 가져오기
    const heatConfig = MELT_CONFIG.HEAT_LEVELS[this.melt.heatLevel];

    // 1. 녹음 진행도 증가
    if (this.melt.progress < MELT_CONFIG.MELT_TARGET) {
      const previousProgress = this.melt.progress;
      this.melt.progress = Math.min(
        MELT_CONFIG.MELT_TARGET,
        this.melt.progress + heatConfig.meltRate * dt
      );

      // 점수 증가 (녹은 양에 비례)
      const progressDelta = this.melt.progress - previousProgress;
      this.score += progressDelta * MELT_CONFIG.BASE_SCORE_PER_PERCENT;

      // 버블 이펙트 (불 세기에 따라 빈도 조절)
      this.melt.bubbleTimer += dt;
      const bubbleInterval = 0.3 - this.melt.heatLevel * 0.08;
      if (this.melt.bubbleTimer >= bubbleInterval) {
        this.melt.bubbleTimer = 0;
        this.game.particles.emitMeltBubble(potCenterX, potCenterY, this.melt.cocoaAdded);
        this.game.sound.playBubble();
      }
    }

    // 2. 들러붙음 게이지 증가 (불 세기에 따라)
    this.melt.stickGauge += heatConfig.stickRate * dt;

    // 지글지글 사운드 (주기적)
    this.melt.sizzleTimer += dt;
    const sizzleInterval = 0.4 - this.melt.heatLevel * 0.1;
    if (this.melt.sizzleTimer >= sizzleInterval) {
      this.melt.sizzleTimer = 0;
      this.game.sound.playSizzle(this.melt.heatLevel / 2);
    }

    // 불꽃 이펙트
    if (Math.random() < dt * (2 + this.melt.heatLevel * 2)) {
      this.game.particles.emitFlame(potCenterX, H * 0.58, this.melt.heatLevel);
    }

    // 3. 들러붙음 경고 (70% 이상)
    if (this.melt.stickGauge >= 70 && this.melt.stickGauge < MELT_CONFIG.STICK_THRESHOLD) {
      const now = Date.now();
      if (now - this.melt.lastStickSound > 800) {
        this.melt.lastStickSound = now;
        this.game.sound.playStick();
        this.shakeIntensity = 4;
      }
    }

    // 4. 들러붙음 발생!
    if (this.melt.stickGauge >= MELT_CONFIG.STICK_THRESHOLD) {
      this.melt.stickGauge = MELT_CONFIG.STICK_THRESHOLD;
      this.melt.isStuck = true;
      this.score = Math.max(0, this.score - MELT_CONFIG.STICK_PENALTY_SCORE);
      this.combo = 0;
      this.game.sound.playFail();
      this.game.particles.emitStickWarning(potCenterX, potCenterY);
      this.game.particles.emitScreenFlash(W, H, '#FF6B6B');
      this.shakeIntensity = 12;
    }

    // 5. 100% 녹음 완료 시 조기 종료 보너스
    if (this.melt.progress >= MELT_CONFIG.MELT_TARGET && this.timeLeft > 0) {
      // 남은 시간 보너스
      const timeBonus = Math.floor(this.timeLeft * 2);
      this.score += timeBonus;

      // 코코아 미투입 페널티
      if (!this.melt.cocoaAdded) {
        this.score = Math.max(0, this.score - 20);
      }

      // 완료 처리
      this.timeLeft = 0;
      this.isPlaying = false;
      this.showResult = true;
      this.game.sound.playSuccess();
      this.game.particles.emitCelebration(W / 2, H / 2, W, H);

      // 퍼펙트 기록
      const PERFECT_THRESHOLD = 80;
      if (this.score >= PERFECT_THRESHOLD) {
        recipeManager.recordPerfect('marshmallow');
      }
    }
  }

  render(ctx) {
    // 스크린 셰이크 적용
    ctx.save();
    if (this.shakeIntensity > 0.5) {
      ctx.translate(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity
      );
    }

    // 배경 (미니게임별 색상)
    this.renderBackground(ctx);

    if (this.showIntro) {
      this.renderIntro(ctx);
    } else {
      // 상단 UI
      this.renderUI(ctx);

      // DEV 스킵 버튼
      if (this.config.devMode) {
        this.renderDevSkipButton(ctx);
      }

      // 미니게임별 렌더링
      if (this.phase === 0) this.renderKadaif(ctx);
      else if (this.phase === 1) this.renderPistachio(ctx);
      else if (this.phase === 2) this.renderMarshmallow(ctx);

      // 콤보 표시
      if (this.combo >= 3) {
        this.renderCombo(ctx);
      }

      // 결과 화면
      if (this.showResult) {
        this.renderResult(ctx);
      }
    }

    ctx.restore();
  }

  renderBackground(ctx) {
    // 그라데이션 배경
    const gradient = ctx.createLinearGradient(0, 0, 0, this.config.height);

    if (this.phase === 0) {
      // 카다이프: 따뜻한 베이지 톤
      gradient.addColorStop(0, '#2D1F14');
      gradient.addColorStop(1, '#1A120B');
    } else if (this.phase === 1) {
      // 피스타치오: 시원한 그린 톤
      gradient.addColorStop(0, '#1B2E1B');
      gradient.addColorStop(1, '#0F1A0F');
    } else {
      // 마시멜로우: 따뜻한 핑크 톤
      gradient.addColorStop(0, '#2D1F24');
      gradient.addColorStop(1, '#1A1015');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    // 피버 모드 배경 효과
    if (this.isFever) {
      ctx.fillStyle = `rgba(231, 76, 60, ${0.1 + Math.sin(Date.now() / 100) * 0.05})`;
      ctx.fillRect(0, 0, this.config.width, this.config.height);
    }
  }

  renderIntro(ctx) {
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;

    // 아이콘
    ctx.font = '100px sans-serif';
    ctx.textAlign = 'center';
    const bounce = Math.sin(this.introTimer * 4) * 10;
    ctx.fillText(this.phaseIcons[this.phase], centerX, centerY - 60 + bounce);

    // 제목
    ctx.font = 'bold 28px DungGeunMo, sans-serif';
    ctx.fillStyle = COLORS.ui.gold;
    ctx.fillText(this.phaseNames[this.phase], centerX, centerY + 40);

    // 설명
    ctx.font = '16px DungGeunMo, sans-serif';
    ctx.fillStyle = '#ccc';
    ctx.fillText(this.phaseDescriptions[this.phase], centerX, centerY + 80);

    // 시작 안내 (깜빡임)
    if (Math.floor(this.introTimer * 2) % 2 === 0) {
      ctx.font = '18px DungGeunMo, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('터치하여 시작!', centerX, centerY + 150);
    }

    // 단계 표시
    this.renderPhaseIndicator(ctx);
  }

  renderPhaseIndicator(ctx) {
    const centerX = this.config.width / 2;
    const y = 50;
    const spacing = 80;
    const startX = centerX - spacing;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * spacing;
      const isCurrent = i === this.phase;
      const isCompleted = i < this.phase;

      // 원
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fillStyle = isCompleted ? COLORS.ui.green : (isCurrent ? COLORS.ui.gold : '#333');
      ctx.fill();

      // 번호/체크
      ctx.font = 'bold 14px DungGeunMo, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(isCompleted ? '✓' : (i + 1).toString(), x, y + 5);

      // 연결선
      if (i < 2) {
        ctx.strokeStyle = i < this.phase ? COLORS.ui.green : '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 20, y);
        ctx.lineTo(x + spacing - 20, y);
        ctx.stroke();
      }
    }
  }

  renderDevSkipButton(ctx) {
    const btn = { x: this.config.width - 80, y: 120, width: 70, height: 35 };

    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 5);
    ctx.fill();

    ctx.font = 'bold 11px DungGeunMo, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('SKIP →', btn.x + btn.width / 2, btn.y + 22);
  }

  renderUI(ctx) {
    // 게임 이름
    ctx.font = 'bold 22px DungGeunMo, sans-serif';
    ctx.fillStyle = COLORS.ui.gold;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.phaseIcons[this.phase]} ${this.phaseNames[this.phase]}`, this.config.width / 2, 35);

    // 타이머 (원형)
    this.renderTimer(ctx);

    // 점수
    ctx.font = 'bold 24px DungGeunMo, sans-serif';
    ctx.fillStyle = COLORS.ui.green;
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(this.score)}`, this.config.width - 20, 85);
    ctx.font = '12px DungGeunMo, sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText('점수', this.config.width - 20, 100);

    // 단계 표시
    this.renderPhaseIndicator(ctx);
  }

  renderTimer(ctx) {
    const x = 50;
    const y = 85;
    const radius = 25;
    const progress = this.timeLeft / 30;

    // 배경 원
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.fill();

    // 진행 호
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.strokeStyle = this.timeLeft < 10 ? COLORS.ui.red : COLORS.ui.green;
    ctx.lineWidth = 5;
    ctx.stroke();

    // 시간 텍스트
    ctx.font = 'bold 16px DungGeunMo, sans-serif';
    ctx.fillStyle = this.timeLeft < 10 ? COLORS.ui.red : '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(Math.ceil(this.timeLeft).toString(), x, y + 6);
  }

  renderCombo(ctx) {
    const centerX = this.config.width / 2;
    const y = 150;

    ctx.font = 'bold 32px DungGeunMo, sans-serif';
    ctx.fillStyle = COLORS.ui.gold;
    ctx.textAlign = 'center';

    const scale = 1 + Math.sin(Date.now() / 50) * 0.1;
    ctx.save();
    ctx.translate(centerX, y);
    ctx.scale(scale, scale);
    ctx.fillText(`${this.combo} COMBO!`, 0, 0);
    ctx.restore();
  }

  renderKadaif(ctx) {
    // 슬라이스 트레일 (검 자국)
    if (this.sliceTrail.length > 1) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(this.sliceTrail[0].x, this.sliceTrail[0].y);
      this.sliceTrail.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();

      ctx.shadowBlur = 0;
    }

    // 카다이프 렌더링
    this.kadaifs.forEach(k => {
      this.renderSingleKadaif(ctx, k);
    });

    // 잘린 조각들
    this.slicedPieces.forEach(p => {
      this.renderSlicedPiece(ctx, p);
    });
  }

  renderSingleKadaif(ctx, k) {
    ctx.save();
    ctx.translate(k.x, k.y);
    ctx.rotate(k.rotation);

    // 타입별 색상
    let mainColor, lightColor, hasGlow = false;
    switch (k.type) {
      case 'golden':
        mainColor = COLORS.kadaif.golden;
        lightColor = '#FFE082';
        hasGlow = true;
        break;
      case 'super':
        mainColor = COLORS.ui.purple;
        lightColor = '#CE93D8';
        hasGlow = true;
        break;
      case 'premium':
        mainColor = COLORS.kadaif.light;
        lightColor = '#FFF8E1';
        break;
      default:
        mainColor = COLORS.kadaif.main;
        lightColor = COLORS.kadaif.light;
    }

    // 글로우 효과
    if (hasGlow) {
      ctx.shadowColor = mainColor;
      ctx.shadowBlur = 20;
    }

    // 카다이프 본체 (면발 느낌)
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, k.size / 2, k.size / 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 면발 텍스처
    ctx.strokeStyle = lightColor;
    ctx.lineWidth = 1.5;
    for (let i = -4; i <= 4; i++) {
      const yOffset = i * 4;
      ctx.beginPath();
      ctx.moveTo(-k.size / 2 + 5, yOffset);
      // 웨이브 라인
      for (let x = -k.size / 2 + 5; x < k.size / 2 - 5; x += 8) {
        ctx.lineTo(x + 4, yOffset + (Math.sin(x * 0.5) * 2));
      }
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  renderSlicedPiece(ctx, p) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    const mainColor = p.type === 'golden' ? COLORS.kadaif.golden :
                     p.type === 'super' ? COLORS.ui.purple :
                     COLORS.kadaif.main;

    // 반쪽 카다이프
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    if (p.half === 0) {
      ctx.arc(0, 0, p.size / 2, Math.PI / 2, -Math.PI / 2);
    } else {
      ctx.arc(0, 0, p.size / 2, -Math.PI / 2, Math.PI / 2);
    }
    ctx.fill();

    ctx.restore();
  }

  renderPistachio(ctx) {
    // 절구통 배경
    const mortarX = this.config.width / 2;
    const mortarY = this.config.height * 0.55;

    // 그림자
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(mortarX, mortarY + 90, 160, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // 절구통 몸체
    const gradient = ctx.createRadialGradient(mortarX - 30, mortarY - 30, 0, mortarX, mortarY, 150);
    gradient.addColorStop(0, '#6D4C41');
    gradient.addColorStop(1, '#3E2723');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(mortarX, mortarY, 150, 85, 0, 0, Math.PI * 2);
    ctx.fill();

    // 내부
    ctx.fillStyle = '#2D1F14';
    ctx.beginPath();
    ctx.ellipse(mortarX, mortarY - 10, 120, 60, 0, 0, Math.PI * 2);
    ctx.fill();

    // 피스타치오 렌더링
    this.pistachios.forEach(p => {
      this.renderSinglePistachio(ctx, p);
    });

    // 피버 게이지
    this.renderFeverGauge(ctx);
  }

  renderSinglePistachio(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.scale, p.scale);

    if (p.crushed) {
      ctx.globalAlpha = p.fadeTimer;
    }

    // 색상
    let mainColor, innerColor, hasGlow = false;
    switch (p.type) {
      case 'emerald':
        mainColor = '#00BCD4';
        innerColor = '#E0F7FA';
        hasGlow = true;
        break;
      case 'roasted':
        mainColor = '#8D6E63';
        innerColor = COLORS.pistachio.main;
        hasGlow = true;
        break;
      case 'bad':
        mainColor = '#4E342E';
        innerColor = '#3E2723';
        break;
      default:
        mainColor = COLORS.pistachio.main;
        innerColor = COLORS.pistachio.light;
    }

    if (hasGlow) {
      ctx.shadowColor = mainColor;
      ctx.shadowBlur = 15;
    }

    // 껍질
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size / 2, p.size / 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 갈라진 틈 (나쁜 것 제외)
    if (p.type !== 'bad') {
      ctx.fillStyle = innerColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size / 4, p.size / 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 나쁜 것 표시
    if (p.type === 'bad') {
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💀', 0, 5);
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  renderFeverGauge(ctx) {
    const gaugeWidth = 220;
    const gaugeX = (this.config.width - gaugeWidth) / 2;
    const gaugeY = this.config.height - 90;

    // 라벨
    ctx.font = '12px DungGeunMo, sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('피버 게이지', this.config.width / 2, gaugeY - 8);

    // 배경
    ctx.fillStyle = '#222';
    ctx.fillRect(gaugeX, gaugeY, gaugeWidth, 20);

    // 게이지
    const gaugeColor = this.isFever ? COLORS.ui.red : COLORS.ui.gold;
    ctx.fillStyle = gaugeColor;
    ctx.fillRect(gaugeX, gaugeY, gaugeWidth * (this.feverGauge / 100), 20);

    // 테두리
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.strokeRect(gaugeX, gaugeY, gaugeWidth, 20);

    // 피버 텍스트
    if (this.isFever) {
      ctx.font = 'bold 18px DungGeunMo, sans-serif';
      ctx.fillStyle = COLORS.ui.red;
      const flicker = Math.sin(Date.now() / 50) > 0;
      if (flicker) {
        ctx.fillText('🔥 FEVER MODE! 🔥', this.config.width / 2, gaugeY + 50);
      }
    }
  }

  /**
   * 마시멜로우 녹이기 게임 렌더링
   */
  renderMarshmallow(ctx) {
    const W = this.config.width;
    const H = this.config.height;
    const centerX = W / 2;
    const potCenterY = H * 0.45;

    // 1. 냄비 렌더링
    this.renderPot(ctx, centerX, potCenterY);

    // 2. 마시멜로우 렌더링
    this.renderMeltingMarshmallow(ctx, centerX, potCenterY);

    // 3. 녹음 진행도 게이지
    this.renderMeltProgressGauge(ctx);

    // 4. 들러붙음 게이지
    this.renderStickGauge(ctx);

    // 5. 불 조절 버튼
    this.renderHeatButtons(ctx);

    // 6. 코코아 버튼
    this.renderCocoaButton(ctx);

    // 7. 상태 텍스트
    this.renderMeltStatusText(ctx);

    // 8. 들러붙음 연타 UI
    if (this.melt.isStuck) {
      this.renderStuckOverlay(ctx);
    }
  }

  /**
   * 냄비 렌더링
   */
  renderPot(ctx, x, y) {
    const heatConfig = MELT_CONFIG.HEAT_LEVELS[this.melt.heatLevel];

    // 냄비 그림자
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y + 70, 90, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // 불꽃 베이스 (냄비 아래)
    const flameGradient = ctx.createRadialGradient(x, y + 55, 0, x, y + 55, 70);
    flameGradient.addColorStop(0, heatConfig.color);
    flameGradient.addColorStop(0.5, `${heatConfig.color}66`);
    flameGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = flameGradient;
    ctx.beginPath();
    ctx.ellipse(x, y + 55, 70, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // 냄비 몸체
    const potGradient = ctx.createLinearGradient(x - 80, y, x + 80, y);
    potGradient.addColorStop(0, '#2C3E50');
    potGradient.addColorStop(0.3, '#4A5568');
    potGradient.addColorStop(0.7, '#4A5568');
    potGradient.addColorStop(1, '#2C3E50');
    ctx.fillStyle = potGradient;
    ctx.beginPath();
    ctx.ellipse(x, y, 80, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    // 냄비 테두리
    ctx.strokeStyle = '#1A202C';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(x, y, 80, 50, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 냄비 내부 (어두운 부분)
    ctx.fillStyle = '#1A1A2E';
    ctx.beginPath();
    ctx.ellipse(x, y - 5, 65, 35, 0, 0, Math.PI * 2);
    ctx.fill();

    // 냄비 손잡이
    ctx.fillStyle = '#4A5568';
    ctx.fillRect(x - 100, y - 8, 25, 16);
    ctx.fillRect(x + 75, y - 8, 25, 16);
  }

  /**
   * 녹는 마시멜로우 렌더링
   */
  renderMeltingMarshmallow(ctx, x, y) {
    const progress = this.melt.progress / 100;
    const hasCocoaAdded = this.melt.cocoaAdded;

    // 마시멜로우 색상 (코코아 섞임에 따라)
    let baseColor, highlightColor;
    if (hasCocoaAdded) {
      // 코코아 섞인 갈색
      const cocoa = Math.min(progress, 0.7);
      const r = Math.floor(255 - cocoa * 160);
      const g = Math.floor(250 - cocoa * 170);
      const b = Math.floor(240 - cocoa * 150);
      baseColor = `rgb(${r},${g},${b})`;
      highlightColor = `rgba(255,255,255,${0.3 - cocoa * 0.2})`;
    } else {
      // 흰색 마시멜로우
      baseColor = COLORS.marshmallow.white;
      highlightColor = 'rgba(255,255,255,0.5)';
    }

    // 녹음 상태에 따른 형태
    ctx.save();
    ctx.translate(x, y - 5);

    // 그림자
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;

    ctx.fillStyle = baseColor;
    ctx.beginPath();

    if (progress < 0.3) {
      // 덩어리 상태 (여러 개의 마시멜로우)
      const chunks = 5;
      for (let i = 0; i < chunks; i++) {
        const angle = (i / chunks) * Math.PI * 2;
        const dist = 25 - progress * 30;
        const cx = Math.cos(angle) * dist;
        const cy = Math.sin(angle) * dist * 0.5;
        const size = 18 - progress * 20;

        ctx.moveTo(cx + size, cy);
        ctx.arc(cx, cy, size, 0, Math.PI * 2);
      }
      // 중앙 덩어리
      ctx.moveTo(20, 0);
      ctx.arc(0, 0, 20 - progress * 10, 0, Math.PI * 2);
    } else if (progress < 0.7) {
      // 반쯤 녹은 상태 (울퉁불퉁)
      const wobble = Math.sin(Date.now() / 150) * 3;
      const baseRadius = 45;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const variance = Math.sin(i * 3 + wobble) * 8;
        const r = baseRadius + variance;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r * 0.4;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else {
      // 완전히 녹은 상태 (부드러운 타원)
      const wobble = Math.sin(Date.now() / 200) * 2;
      ctx.ellipse(0, 0, 55 + wobble, 25, 0, 0, Math.PI * 2);
    }

    ctx.fill();

    // 하이라이트
    ctx.fillStyle = highlightColor;
    ctx.beginPath();
    if (progress < 0.5) {
      ctx.ellipse(-10, -10, 12, 8, -0.5, 0, Math.PI * 2);
    } else {
      ctx.ellipse(-20, -8, 20, 8, -0.3, 0, Math.PI * 2);
    }
    ctx.fill();

    // 기포 효과 (녹는 중)
    if (progress > 0.2 && progress < 1) {
      const bubbleCount = Math.floor(progress * 5);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      for (let i = 0; i < bubbleCount; i++) {
        const bx = (Math.sin(Date.now() / 300 + i * 2) * 30);
        const by = (Math.cos(Date.now() / 400 + i * 3) * 10);
        const bSize = 3 + Math.sin(Date.now() / 200 + i) * 2;
        ctx.beginPath();
        ctx.arc(bx, by, bSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /**
   * 녹음 진행도 게이지
   */
  renderMeltProgressGauge(ctx) {
    const W = this.config.width;
    const gaugeWidth = W - 60;
    const gaugeX = 30;
    const gaugeY = 130;
    const gaugeHeight = 20;

    // 라벨
    ctx.font = '12px DungGeunMo, sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'left';
    ctx.fillText('녹음 진행도', gaugeX, gaugeY - 5);

    // 퍼센트 표시
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.ui.gold;
    ctx.fillText(`${Math.floor(this.melt.progress)}%`, gaugeX + gaugeWidth, gaugeY - 5);

    // 배경
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.roundRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight, 5);
    ctx.fill();

    // 코코아 적정 구간 표시
    const optimalStart = gaugeX + gaugeWidth * (MELT_CONFIG.COCOA_OPTIMAL_MIN / 100);
    const optimalWidth = gaugeWidth * ((MELT_CONFIG.COCOA_OPTIMAL_MAX - MELT_CONFIG.COCOA_OPTIMAL_MIN) / 100);
    ctx.fillStyle = 'rgba(93, 64, 55, 0.4)';
    ctx.fillRect(optimalStart, gaugeY, optimalWidth, gaugeHeight);

    // 코코아 아이콘 (적정 구간)
    if (!this.melt.cocoaAdded) {
      ctx.font = '10px DungGeunMo, sans-serif';
      ctx.fillStyle = COLORS.cocoa.light;
      ctx.textAlign = 'center';
      ctx.fillText('🍫 코코아', optimalStart + optimalWidth / 2, gaugeY + 14);
    }

    // 진행 게이지
    const progressWidth = gaugeWidth * (this.melt.progress / 100);
    const progressGradient = ctx.createLinearGradient(gaugeX, 0, gaugeX + progressWidth, 0);
    progressGradient.addColorStop(0, COLORS.marshmallow.cream);
    progressGradient.addColorStop(1, this.melt.cocoaAdded ? COLORS.cocoa.light : COLORS.marshmallow.pink);
    ctx.fillStyle = progressGradient;
    ctx.beginPath();
    ctx.roundRect(gaugeX, gaugeY, progressWidth, gaugeHeight, 5);
    ctx.fill();

    // 테두리
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight, 5);
    ctx.stroke();
  }

  /**
   * 들러붙음 게이지
   */
  renderStickGauge(ctx) {
    const W = this.config.width;
    const gaugeWidth = W - 60;
    const gaugeX = 30;
    const gaugeY = 170;
    const gaugeHeight = 16;

    // 라벨
    ctx.font = '11px DungGeunMo, sans-serif';
    ctx.fillStyle = this.melt.stickGauge > 70 ? COLORS.ui.red : '#888';
    ctx.textAlign = 'left';
    ctx.fillText('⚠️ 들러붙음', gaugeX, gaugeY - 4);

    // 배경
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.roundRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight, 4);
    ctx.fill();

    // 위험 구간 표시 (70% 이상)
    const dangerStart = gaugeX + gaugeWidth * 0.7;
    ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
    ctx.fillRect(dangerStart, gaugeY, gaugeWidth * 0.3, gaugeHeight);

    // 들러붙음 게이지
    const stickWidth = gaugeWidth * (this.melt.stickGauge / 100);
    let stickColor;
    if (this.melt.stickGauge < 50) {
      stickColor = COLORS.ui.green;
    } else if (this.melt.stickGauge < 70) {
      stickColor = COLORS.ui.gold;
    } else {
      stickColor = COLORS.ui.red;
    }

    // 깜빡임 효과 (위험 구간)
    if (this.melt.stickGauge > 70) {
      const flicker = Math.sin(Date.now() / 100) > 0;
      ctx.fillStyle = flicker ? stickColor : '#aa3333';
    } else {
      ctx.fillStyle = stickColor;
    }

    ctx.beginPath();
    ctx.roundRect(gaugeX, gaugeY, stickWidth, gaugeHeight, 4);
    ctx.fill();

    // 테두리
    ctx.strokeStyle = this.melt.stickGauge > 70 ? COLORS.ui.red : '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight, 4);
    ctx.stroke();
  }

  /**
   * 불 조절 버튼 렌더링
   */
  renderHeatButtons(ctx) {
    const H = this.config.height;
    const btnY = H - 160;
    const btnStartX = 30;
    const btnWidth = 80;
    const btnHeight = 50;
    const btnGap = 10;

    ctx.font = 'bold 12px DungGeunMo, sans-serif';
    ctx.textAlign = 'center';

    for (let i = 0; i < 3; i++) {
      const btnX = btnStartX + i * (btnWidth + btnGap);
      const heatConfig = MELT_CONFIG.HEAT_LEVELS[i];
      const isSelected = this.melt.heatLevel === i;

      // 버튼 배경
      if (isSelected) {
        ctx.shadowColor = heatConfig.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = heatConfig.color;
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#333';
      }

      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 8);
      ctx.fill();

      // 테두리
      ctx.strokeStyle = isSelected ? '#fff' : '#555';
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 8);
      ctx.stroke();

      ctx.shadowBlur = 0;

      // 아이콘
      ctx.font = '18px sans-serif';
      ctx.fillText(heatConfig.icon, btnX + btnWidth / 2, btnY + 22);

      // 라벨
      ctx.font = 'bold 11px DungGeunMo, sans-serif';
      ctx.fillStyle = isSelected ? '#fff' : '#888';
      ctx.fillText(heatConfig.name, btnX + btnWidth / 2, btnY + 42);
    }
  }

  /**
   * 코코아 버튼 렌더링
   */
  renderCocoaButton(ctx) {
    const W = this.config.width;
    const H = this.config.height;
    const btnX = W - 110;
    const btnY = H - 160;
    const btnWidth = 80;
    const btnHeight = 50;

    const isAdded = this.melt.cocoaAdded;
    const isOptimalTime = !isAdded &&
      this.melt.progress >= MELT_CONFIG.COCOA_OPTIMAL_MIN &&
      this.melt.progress <= MELT_CONFIG.COCOA_OPTIMAL_MAX;

    // 버튼 배경
    if (isAdded) {
      ctx.fillStyle = '#2a2a2a';
    } else if (isOptimalTime) {
      // 적정 타이밍 - 반짝이는 효과
      const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
      ctx.shadowColor = COLORS.cocoa.light;
      ctx.shadowBlur = 15 * pulse;
      ctx.fillStyle = COLORS.cocoa.main;
    } else {
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#444';
    }

    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 8);
    ctx.fill();

    // 테두리
    ctx.strokeStyle = isOptimalTime ? COLORS.ui.gold : '#555';
    ctx.lineWidth = isOptimalTime ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 8);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // 아이콘
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isAdded ? '✓' : '🍫', btnX + btnWidth / 2, btnY + 24);

    // 라벨
    ctx.font = 'bold 10px DungGeunMo, sans-serif';
    ctx.fillStyle = isAdded ? '#666' : (isOptimalTime ? COLORS.ui.gold : '#888');
    ctx.fillText(isAdded ? '투입완료' : '코코아', btnX + btnWidth / 2, btnY + 42);

    // 적정 타이밍 힌트
    if (isOptimalTime && !isAdded) {
      ctx.font = 'bold 10px DungGeunMo, sans-serif';
      ctx.fillStyle = COLORS.ui.gold;
      const flicker = Math.floor(Date.now() / 300) % 2 === 0;
      if (flicker) {
        ctx.fillText('지금!', btnX + btnWidth / 2, btnY - 8);
      }
    }
  }

  /**
   * 상태 텍스트 렌더링
   */
  renderMeltStatusText(ctx) {
    const W = this.config.width;
    const H = this.config.height;

    ctx.font = '14px DungGeunMo, sans-serif';
    ctx.textAlign = 'center';

    let statusText = '';
    let statusColor = '#888';

    if (this.melt.isStuck) {
      statusText = '🚨 들러붙었어요! 빠르게 터치하세요!';
      statusColor = COLORS.ui.red;
    } else if (this.melt.progress >= 100) {
      statusText = '✨ 완벽하게 녹았어요!';
      statusColor = COLORS.ui.green;
    } else if (this.melt.stickGauge > 70) {
      statusText = '⚠️ 들러붙기 직전! 젓거나 불을 낮추세요!';
      statusColor = COLORS.ui.red;
    } else if (this.melt.heatLevel === 2) {
      statusText = '🔥 강불! 빠르지만 위험해요!';
      statusColor = '#FF6B6B';
    } else if (this.melt.heatLevel === 0) {
      statusText = '🔵 약불로 천천히 녹이는 중...';
      statusColor = '#4ECDC4';
    } else {
      statusText = '🍡 마시멜로우가 녹고 있어요~';
      statusColor = COLORS.marshmallow.cream;
    }

    ctx.fillStyle = statusColor;
    ctx.fillText(statusText, W / 2, H - 85);
  }

  /**
   * 들러붙음 연타 오버레이
   */
  renderStuckOverlay(ctx) {
    const W = this.config.width;
    const H = this.config.height;

    // 반투명 오버레이
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, W, H);

    // 경고 박스
    const boxWidth = 280;
    const boxHeight = 150;
    const boxX = (W - boxWidth) / 2;
    const boxY = (H - boxHeight) / 2 - 50;

    // 박스 배경 (빨간 테두리)
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
    ctx.fill();

    const flicker = Math.sin(Date.now() / 100) > 0;
    ctx.strokeStyle = flicker ? COLORS.ui.red : '#aa3333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
    ctx.stroke();

    // 경고 아이콘
    ctx.font = '50px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔥', W / 2, boxY + 55);

    // 텍스트
    ctx.font = 'bold 18px DungGeunMo, sans-serif';
    ctx.fillStyle = COLORS.ui.red;
    ctx.fillText('들러붙었어요!', W / 2, boxY + 90);

    ctx.font = '14px DungGeunMo, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('화면을 빠르게 터치하세요!', W / 2, boxY + 115);

    // 남은 들러붙음 게이지
    const remainTaps = Math.ceil(this.melt.stickGauge / MELT_CONFIG.STICK_RESOLVE_PER_TAP);
    ctx.font = 'bold 16px DungGeunMo, sans-serif';
    ctx.fillStyle = COLORS.ui.gold;
    ctx.fillText(`남은 터치: ${remainTaps}회`, W / 2, boxY + 140);
  }

  renderResult(ctx) {
    // 반투명 배경
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;

    // 결과 박스
    const boxWidth = 320;
    const boxHeight = 280;
    const boxX = (this.config.width - boxWidth) / 2;
    const boxY = (this.config.height - boxHeight) / 2;

    // 박스 배경
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // 박스 테두리 (글로우)
    ctx.shadowColor = COLORS.ui.gold;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = COLORS.ui.gold;
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    ctx.shadowBlur = 0;

    // 아이콘
    ctx.font = '50px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.phaseIcons[this.phase], centerX, boxY + 60);

    // 제목
    ctx.font = 'bold 26px DungGeunMo, sans-serif';
    ctx.fillStyle = COLORS.ui.gold;
    ctx.fillText('완료!', centerX, boxY + 100);

    // 점수
    ctx.font = 'bold 48px DungGeunMo, sans-serif';
    ctx.fillStyle = COLORS.ui.green;
    ctx.fillText(`${Math.floor(this.score)}점`, centerX, boxY + 160);

    // 최대 콤보
    if (this.maxCombo >= 3) {
      ctx.font = '16px DungGeunMo, sans-serif';
      ctx.fillStyle = COLORS.ui.gold;
      ctx.fillText(`최대 콤보: ${this.maxCombo}x`, centerX, boxY + 195);
    }

    // 다음 안내
    ctx.font = '14px DungGeunMo, sans-serif';
    ctx.fillStyle = '#888';
    const nextText = this.phase < 2 ?
      `다음: ${this.phaseNames[this.phase + 1]}` :
      '다음: 베이킹';
    ctx.fillText(nextText, centerX, boxY + 230);

    // 터치 안내 (깜빡임)
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.fillStyle = '#fff';
      ctx.fillText('터치하여 계속', centerX, boxY + 260);
    }
  }
}
