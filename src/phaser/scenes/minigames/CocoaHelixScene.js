/**
 * CocoaHelixScene - 코코아 가루 수집 미니게임 (Helix Jump 스타일)
 *
 * 🎮 게임 메커니즘:
 * - 코코아빈이 회전하는 나선형 플랫폼을 뚫고 내려감
 * - 터치: 빈 공간으로 떨어짐 / 색칠된 플랫폼 = 튕김
 * - 연속 통과 → 콤보 보너스 + 코코아 가루 획득
 * - 빨간 플랫폼 = 게임 오버
 *
 * 🔥 Juiciness:
 * - 떨어질 때 스트레치, 착지 시 스쿼시
 * - 플랫폼 통과 시 파티클 폭발
 * - 콤보 시 화면 줌펀치 + 흔들림
 * - 피버 모드: 무적 + 자동 통과
 *
 * [Fix] v1.1 - 메모리 누수 및 성능 최적화
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY } from '../../config/GameConfig.js';
import { soundManager } from '../../../core/SoundManager.js';

// ============================================
// 유틸리티 함수 (DRY)
// ============================================

/** 각도를 0 ~ 2π 범위로 정규화 */
const normalizeAngle = (angle) => {
  const TWO_PI = Math.PI * 2;
  let normalized = angle % TWO_PI;
  return normalized < 0 ? normalized + TWO_PI : normalized;
};

/** 장식 객체의 위치를 회전에 맞게 업데이트 */
const updateDecorationPosition = (decoration, rotation) => {
  if (!decoration) return;
  const baseAngle = decoration.getData('baseAngle');
  const radius = decoration.getData('radius');
  const currentAngle = baseAngle + rotation;
  decoration.x = Math.cos(currentAngle) * radius;
  decoration.y = Math.sin(currentAngle) * radius;
};

/** 세그먼트 색상 결정 */
const getSegmentColor = (isDanger, isGold) => {
  if (isDanger) return CONFIG.COLORS.platform.danger;
  if (isGold) return CONFIG.COLORS.platform.gold;
  return Phaser.Utils.Array.GetRandom(CONFIG.COLORS.platform.normal);
};

// ============================================
// 상수 설정 (매직 넘버 제거)
// ============================================

const CONFIG = {
  // 게임 설정
  TOTAL_RINGS: 25,
  RING_SPACING: 120,
  ROTATION_SPEED: 0.8,

  // 볼 물리
  BALL: {
    RADIUS: 22,
    GRAVITY: 1800,
    BOUNCE_VELOCITY: -600,
    MAX_FALL_SPEED: 1200,
    STRETCH_FACTOR: 1.4,
    SQUASH_FACTOR: 0.6
  },

  // 링/플랫폼 설정
  RING: {
    INNER_RADIUS: 80,
    OUTER_RADIUS: 140,
    SEGMENTS: 6,
    GAP_COUNT: { min: 1, max: 3 },
    DANGER_CHANCE: 0.15
  },

  // 점수
  SCORE: {
    PASS_RING: 10,
    COMBO_MULTIPLIER: 5,
    PERFECT_BONUS: 50,
    FEVER_MULTIPLIER: 2
  },

  // 피버 모드
  FEVER: {
    COMBO_TRIGGER: 5,
    DURATION: 3000,
    SPEED_BOOST: 1.5
  },

  // 색상 팔레트
  COLORS: {
    bgTop: 0x5D4037,
    bgBottom: 0x3E2723,
    ball: 0x6D4C41,
    ballHighlight: 0x8D6E63,
    ballShadow: 0x4E342E,
    platform: {
      normal: [0xA1887F, 0xBCAAA4, 0x8D6E63],
      danger: 0xD32F2F,
      safe: 0x4CAF50,
      gold: 0xFFD700
    },
    cocoa: [0x5D4037, 0x6D4C41, 0x795548, 0x4E342E],
    sparkle: [0xFFE082, 0xFFD54F, 0xFFCA28]
  },

  // 카메라
  CAMERA: {
    FOLLOW_LERP: 0.1,
    SHAKE_INTENSITY: 0.01,
    ZOOM_PUNCH: 0.05
  }
};

// ============================================
// Ring Prefab (나선형 플랫폼 하나)
// [Fix] Text 객체를 매 프레임 생성하지 않고 초기화 시 한 번만 생성
// ============================================

class HelixRing {
  constructor(scene, y, index) {
    this.scene = scene;
    this.y = y;
    this.index = index;
    this.rotation = Math.random() * Math.PI * 2;
    this.passed = false;

    // [Fix] 장식용 객체 참조 저장
    this.decorations = [];

    this.segments = this._generateSegments();
    this._createVisual();
  }

  _generateSegments() {
    const { SEGMENTS, GAP_COUNT, DANGER_CHANCE } = CONFIG.RING;
    const GOLD_CHANCE = 0.05;

    // 세그먼트 생성
    const segments = Array.from({ length: SEGMENTS }, (_, i) => {
      const isDanger = Math.random() < DANGER_CHANCE;
      const isGold = !isDanger && Math.random() < GOLD_CHANCE;
      return {
        index: i,
        filled: true,
        danger: isDanger,
        gold: isGold,
        color: getSegmentColor(isDanger, isGold)
      };
    });

    // 랜덤 갭 설정
    const gapCount = Phaser.Math.Between(GAP_COUNT.min, GAP_COUNT.max);
    Phaser.Utils.Array.Shuffle([...segments.keys()])
      .slice(0, gapCount)
      .forEach(i => { segments[i].filled = false; });

    return segments;
  }

  _createVisual() {
    this.container = this.scene.add.container(GAME_WIDTH / 2, this.y);
    this.graphics = this.scene.add.graphics();
    this.container.add(this.graphics);

    // [Fix] 장식(경고, 별)은 초기화 시 한 번만 생성
    this._createDecorations();

    // 초기 렌더링
    this._drawRing();
  }

  // [Fix] 장식 객체를 별도로 생성하고 추적
  _createDecorations() {
    const innerR = CONFIG.RING.INNER_RADIUS;
    const outerR = CONFIG.RING.OUTER_RADIUS;
    const segmentAngle = (Math.PI * 2) / CONFIG.RING.SEGMENTS;

    this.segments.forEach((seg, i) => {
      if (!seg.filled) return;

      // 세그먼트 중앙 각도 (초기 회전 0 기준)
      const baseAngle = i * segmentAngle + segmentAngle / 2;
      const radius = (innerR + outerR) / 2;

      if (seg.danger) {
        const warning = this.scene.add.text(0, 0, '!', {
          fontFamily: FONT_FAMILY,
          fontSize: '16px',
          color: '#FFFFFF'
        }).setOrigin(0.5);

        // 초기 위치 설정
        warning.setData('baseAngle', baseAngle);
        warning.setData('radius', radius);

        this.container.add(warning);
        this.decorations.push(warning);
        seg.warningRef = warning;
      }

      if (seg.gold) {
        const star = this.scene.add.text(0, 0, '★', {
          fontSize: '14px',
          color: '#FFF8E1'
        }).setOrigin(0.5);

        star.setData('baseAngle', baseAngle);
        star.setData('radius', radius);

        this.container.add(star);
        this.decorations.push(star);
        seg.starRef = star;

        // [Fix] Tween 참조 저장
        seg.starTween = this.scene.tweens.add({
          targets: star,
          scale: { from: 0.8, to: 1.2 },
          alpha: { from: 0.7, to: 1 },
          duration: 400,
          yoyo: true,
          repeat: -1
        });
      }
    });
  }

  // [Fix] 장식 위치만 업데이트 (새 객체 생성 없음)
  _updateDecorationPositions() {
    const { rotation } = this;
    this.segments.forEach(({ warningRef, starRef }) => {
      updateDecorationPosition(warningRef, rotation);
      updateDecorationPosition(starRef, rotation);
    });
  }

  _drawRing() {
    this.graphics.clear();

    const innerR = CONFIG.RING.INNER_RADIUS;
    const outerR = CONFIG.RING.OUTER_RADIUS;
    const segmentAngle = (Math.PI * 2) / CONFIG.RING.SEGMENTS;

    this.segments.forEach((seg, i) => {
      if (!seg.filled) return;

      const startAngle = i * segmentAngle + this.rotation;
      const endAngle = startAngle + segmentAngle - 0.05;

      // 메인 세그먼트
      this.graphics.fillStyle(seg.color, 1);
      this.graphics.beginPath();

      // 외곽 호
      for (let a = startAngle; a <= endAngle; a += 0.1) {
        const x = Math.cos(a) * outerR;
        const y = Math.sin(a) * outerR;
        if (a === startAngle) {
          this.graphics.moveTo(x, y);
        } else {
          this.graphics.lineTo(x, y);
        }
      }

      // 내곽 호 (역방향)
      for (let a = endAngle; a >= startAngle; a -= 0.1) {
        const x = Math.cos(a) * innerR;
        const y = Math.sin(a) * innerR;
        this.graphics.lineTo(x, y);
      }

      this.graphics.closePath();
      this.graphics.fillPath();

      // 테두리
      this.graphics.lineStyle(2, 0x3E2723, 0.8);
      this.graphics.strokePath();

      // 3D 하이라이트
      if (!seg.danger) {
        this.graphics.fillStyle(0xFFFFFF, 0.15);
        const midAngle = (startAngle + endAngle) / 2;
        const hx = Math.cos(midAngle) * (innerR + outerR) / 2;
        const hy = Math.sin(midAngle) * (innerR + outerR) / 2;
        this.graphics.fillCircle(hx, hy - 5, 8);
      }
    });

    // 중앙 원 (장식)
    this.graphics.fillStyle(0x3E2723, 0.5);
    this.graphics.fillCircle(0, 0, innerR - 5);
    this.graphics.lineStyle(2, 0x5D4037, 0.8);
    this.graphics.strokeCircle(0, 0, innerR - 5);
  }

  update(dt, rotationSpeed) {
    this.rotation += rotationSpeed * dt;
    this._drawRing();
    // [Fix] 장식 위치만 업데이트
    this._updateDecorationPositions();
  }

  checkCollision(ballX, ballY, ballRadius) {
    const RING_THICKNESS = 20;
    const { INNER_RADIUS, OUTER_RADIUS, SEGMENTS } = CONFIG.RING;
    const NO_COLLISION = { collided: false };

    // Early return: Y축 범위 체크
    if (Math.abs(ballY - this.y) > RING_THICKNESS) return NO_COLLISION;

    // Early return: 중심 거리 체크
    const relX = ballX - GAME_WIDTH / 2;
    const distFromCenter = Math.abs(relX);
    if (distFromCenter < INNER_RADIUS - ballRadius ||
        distFromCenter > OUTER_RADIUS + ballRadius) return NO_COLLISION;

    // 각도 기반 세그먼트 인덱스 계산
    const baseAngle = relX >= 0 ? 0 : Math.PI;
    const angle = normalizeAngle(baseAngle - this.rotation);
    const segmentIndex = Math.floor((angle / (Math.PI * 2)) * SEGMENTS) % SEGMENTS;
    const segment = this.segments[segmentIndex];

    // 빈 공간 통과
    if (!segment?.filled) return { collided: false, passed: true, gold: false };

    // 충돌
    return { collided: true, danger: segment.danger, gold: segment.gold };
  }

  playPassEffect() {
    if (this.passed) return;
    this.passed = true;

    // [Fix] Scene 유효성 체크
    if (!this.scene || !this.scene.tweens) return;

    this.scene.tweens.add({
      targets: this.container,
      scale: { from: 1, to: 1.1 },
      alpha: { from: 1, to: 0.7 },
      duration: 150,
      yoyo: true
    });
  }

  destroy() {
    // [Fix] Tween 정리
    this.segments.forEach(seg => {
      if (seg.starTween) {
        seg.starTween.stop();
        seg.starTween = null;
      }
    });

    // 장식 참조 정리
    this.decorations = [];

    if (this.container) {
      this.container.destroy();
      this.container = null;
    }

    this.scene = null;
  }
}

// ============================================
// CocoaBall Prefab (플레이어 볼)
// ============================================

class CocoaBall {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.velocityY = 0;
    this.isDropping = false;
    this.isBouncing = false;
    this.feverPulse = null;  // [Fix] 명시적 초기화

    this._createVisual();
  }

  _createVisual() {
    this.container = this.scene.add.container(this.x, this.y);

    const r = CONFIG.BALL.RADIUS;

    // 그림자
    this.shadow = this.scene.add.ellipse(3, 5, r * 1.6, r * 0.8, 0x000000, 0.3);
    this.container.add(this.shadow);

    // 메인 볼
    const g = this.scene.add.graphics();
    g.fillStyle(CONFIG.COLORS.ball, 1);
    g.fillEllipse(0, 0, r * 2, r * 1.6);
    g.fillStyle(CONFIG.COLORS.ballHighlight, 0.6);
    g.fillEllipse(-r * 0.3, -r * 0.3, r * 0.8, r * 0.5);
    g.lineStyle(3, CONFIG.COLORS.ballShadow, 1);
    g.strokeEllipse(0, 0, r * 2, r * 1.6);
    g.lineStyle(2, CONFIG.COLORS.ballShadow, 0.5);
    g.beginPath();
    g.moveTo(0, -r * 0.6);
    g.lineTo(0, r * 0.6);
    g.strokePath();

    this.ballGraphics = g;
    this.container.add(g);

    // 글로우 이펙트 (피버용)
    this.glow = this.scene.add.ellipse(0, 0, r * 3, r * 2.4, 0xFFD700, 0);
    this.container.addAt(this.glow, 0);

    this.container.setDepth(100);
  }

  drop() {
    this.isDropping = true;
    this.isBouncing = false;
  }

  bounce() {
    this.velocityY = CONFIG.BALL.BOUNCE_VELOCITY;
    this.isBouncing = true;
    this.isDropping = false;

    // [Fix] Scene 유효성 체크
    if (!this.scene || !this.scene.tweens) return;

    this.scene.tweens.add({
      targets: this.ballGraphics,
      scaleX: 1.3,
      scaleY: CONFIG.BALL.SQUASH_FACTOR,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut'
    });

    soundManager.playCrush();
  }

  update(dt) {
    const { GRAVITY, MAX_FALL_SPEED, STRETCH_FACTOR } = CONFIG.BALL;

    // 물리 업데이트
    if (this.isDropping || this.isBouncing) {
      this.velocityY = Math.min(this.velocityY + GRAVITY * dt, MAX_FALL_SPEED);
    }
    this.y += this.velocityY * dt;

    // 스트레치 효과 (Tween 중이 아닐 때만)
    const isTweening = this.scene?.tweens?.isTweening(this.ballGraphics);
    if (!isTweening) {
      const stretchAmount = Math.abs(this.velocityY) / MAX_FALL_SPEED;
      const scaleY = 1 + stretchAmount * (STRETCH_FACTOR - 1);
      this.ballGraphics.setScale(1 / Math.sqrt(scaleY), scaleY);
    }

    this.container?.setPosition(this.x, this.y);

    // 바운스 종료 체크
    if (this.isBouncing && this.velocityY >= 0) {
      this.isBouncing = false;
      this.isDropping = false;
      this.velocityY = 0;
    }
  }

  setFeverMode(active) {
    // [Fix] Scene 유효성 체크
    if (!this.scene || !this.scene.tweens) return;

    if (active) {
      this.scene.tweens.add({
        targets: this.glow,
        alpha: 0.4,
        duration: 200
      });

      this.feverPulse = this.scene.tweens.add({
        targets: this.glow,
        scale: { from: 1, to: 1.3 },
        alpha: { from: 0.4, to: 0.2 },
        duration: 300,
        yoyo: true,
        repeat: -1
      });
    } else {
      // [Fix] feverPulse 정리
      if (this.feverPulse) {
        this.feverPulse.stop();
        this.feverPulse = null;
      }
      this.scene.tweens.add({
        targets: this.glow,
        alpha: 0,
        duration: 200
      });
    }
  }

  destroy() {
    // [Fix] feverPulse 정리
    if (this.feverPulse) {
      this.feverPulse.stop();
      this.feverPulse = null;
    }

    if (this.container) {
      this.container.destroy();
      this.container = null;
    }

    this.scene = null;
  }
}

// ============================================
// Particle Effects (파티클 이펙트)
// ============================================

class CocoaEffects {
  /** 공통: 방사형 파티클 생성 */
  static _emitRadialParticles(scene, x, y, { count, createFn, tweenFn }) {
    for (let i = 0; i < count; i++) {
      const particle = createFn(i);
      scene.tweens.add({
        targets: particle,
        ...tweenFn(i),
        onComplete: () => particle.destroy()
      });
    }
  }

  /** 공통: 텍스트 팝업 생성 */
  static _createPopupText(scene, x, y, text, style, tweenProps) {
    const textObj = scene.add.text(x, y, text, {
      fontFamily: FONT_FAMILY,
      ...style
    }).setOrigin(0.5).setDepth(200);

    scene.tweens.add({
      targets: textObj,
      ...tweenProps,
      onComplete: () => textObj.destroy()
    });

    return textObj;
  }

  static emitPassParticles(scene, x, y) {
    if (!scene?.add) return;

    // 코코아 파티클
    this._emitRadialParticles(scene, x, y, {
      count: 15,
      createFn: () => scene.add.circle(
        x, y,
        3 + Math.random() * 6,
        Phaser.Utils.Array.GetRandom(CONFIG.COLORS.cocoa)
      ),
      tweenFn: () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 120;
        return {
          x: x + Math.cos(angle) * speed,
          y: y + Math.sin(angle) * speed + 50,
          alpha: 0, scale: 0.3,
          duration: 400, ease: 'Quad.easeOut'
        };
      }
    });

    // 링 이펙트
    const ring = scene.add.circle(x, y, 20, 0x8D6E63, 0).setStrokeStyle(4, 0x8D6E63);
    scene.tweens.add({
      targets: ring,
      radius: 80, alpha: 0,
      duration: 300, ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    });
  }

  static emitComboEffect(scene, x, y, combo) {
    if (!scene?.add) return;

    // 콤보 텍스트
    this._createPopupText(scene, x, y - 50, `${combo} COMBO!`, {
      fontSize: `${Math.min(36, 20 + combo * 2)}px`,
      color: '#FFD700', stroke: '#3E2723', strokeThickness: 4
    }, {
      y: y - 120,
      scale: { from: 0.5, to: 1.2 },
      alpha: { from: 1, to: 0 },
      duration: 600, ease: 'Back.easeOut'
    });

    // 별 파티클
    const starCount = Math.min(combo * 2, 12);
    this._emitRadialParticles(scene, x, y, {
      count: starCount,
      createFn: () => scene.add.text(x, y, '★', { fontSize: '16px', color: '#FFE082' })
        .setOrigin(0.5).setDepth(150),
      tweenFn: (i) => {
        const angle = (i / starCount) * Math.PI * 2;
        return {
          x: x + Math.cos(angle) * 100,
          y: y + Math.sin(angle) * 60,
          rotation: Math.PI * 2, alpha: 0, scale: 0.3,
          duration: 500, delay: i * 30
        };
      }
    });
  }

  static emitGoldEffect(scene, x, y) {
    if (!scene?.add) return;

    // 코인 파티클
    this._emitRadialParticles(scene, x, y, {
      count: 8,
      createFn: () => scene.add.circle(
        x + Phaser.Math.Between(-30, 30), y,
        Phaser.Math.Between(4, 8), 0xFFD700
      ).setStrokeStyle(1, 0xB8860B).setDepth(150),
      tweenFn: (i) => ({
        y: y - Phaser.Math.Between(80, 150),
        alpha: 0, duration: 500, delay: i * 50, ease: 'Quad.easeOut'
      })
    });

    // 보너스 텍스트
    this._createPopupText(scene, x, y - 30, '+BONUS!', {
      fontSize: '24px', color: '#FFD700', stroke: '#000000', strokeThickness: 3
    }, { y: y - 100, alpha: 0, scale: 1.5, duration: 500 });
  }

  static emitDangerEffect(scene, x, y) {
    if (!scene?.cameras) return;

    scene.cameras.main.flash(200, 255, 50, 50, true);
    scene.cameras.main.shake(300, 0.03);

    // X 마크
    this._createPopupText(scene, x, y, '✗', {
      fontSize: '64px', color: '#FF5252'
    }, {
      scale: { from: 0.5, to: 2 }, alpha: 0, rotation: 0.5,
      duration: 500, ease: 'Quad.easeOut'
    });

    // 파편 파티클
    this._emitRadialParticles(scene, x, y, {
      count: 20,
      createFn: () => scene.add.rectangle(
        x, y,
        Phaser.Math.Between(5, 15), Phaser.Math.Between(5, 15),
        0xD32F2F
      ).setDepth(150),
      tweenFn: () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 150 + Math.random() * 200;
        return {
          x: x + Math.cos(angle) * speed,
          y: y + Math.sin(angle) * speed,
          rotation: Math.random() * 10, alpha: 0, duration: 600
        };
      }
    });
  }

  static emitFeverStart(scene) {
    if (!scene?.cameras) return;

    scene.cameras.main.flash(200, 255, 200, 0, true);

    const feverText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '🔥 FEVER! 🔥', {
      fontFamily: FONT_FAMILY,
      fontSize: '48px', color: '#FF6B00', stroke: '#000000', strokeThickness: 6
    }).setOrigin(0.5).setDepth(300).setScrollFactor(0);

    scene.tweens.add({
      targets: feverText,
      scale: { from: 0.5, to: 1.5 },
      alpha: { from: 1, to: 0 },
      duration: 800, ease: 'Back.easeOut',
      onComplete: () => feverText.destroy()
    });
  }
}

// ============================================
// CocoaHelixScene (메인 씬)
// ============================================

export class CocoaHelixScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CocoaHelixScene' });
  }

  init(data) {
    this.onComplete = data?.onComplete || null;

    // 게임 상태
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.ringsPassed = 0;
    this.isPlaying = false;
    this.isGameOver = false;
    this.introActive = false;

    // 피버 모드
    this.isFever = false;
    this.feverTimer = 0;

    // 오브젝트
    this.ball = null;
    this.rings = [];
    this.currentRingIndex = 0;

    // 회전 속도
    this.rotationSpeed = CONFIG.ROTATION_SPEED;

    // [Fix] 정리용 참조 배열
    this._backgroundTweens = [];
    this._inputHandler = null;
  }

  create() {
    // [Fix] Phaser 시간 시스템 강제 초기화
    this.time.paused = false;
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;

    console.log('[CocoaHelixScene] 시간 시스템 초기화 완료');

    // [Fix] Scene lifecycle 이벤트 등록
    this.events.on('shutdown', this.shutdown, this);
    this.events.on('destroy', this.shutdown, this);

    soundManager.switchBGM('minigame');

    this._createBackground();
    this._createRings();
    this._createBall();
    this._createUI();
    this._setupCamera();
    this._setupInput();

    this._showIntro();
  }

  // ========================================
  // 배경 생성
  // ========================================

  _createBackground() {
    const totalHeight = CONFIG.TOTAL_RINGS * CONFIG.RING_SPACING + GAME_HEIGHT;

    const bgGraphics = this.add.graphics();

    const sectionHeight = 400;
    for (let y = 0; y < totalHeight; y += sectionHeight) {
      const progress = y / totalHeight;
      const color1 = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(CONFIG.COLORS.bgTop),
        Phaser.Display.Color.ValueToColor(CONFIG.COLORS.bgBottom),
        100,
        Math.floor(progress * 100)
      );
      const color2 = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(CONFIG.COLORS.bgTop),
        Phaser.Display.Color.ValueToColor(CONFIG.COLORS.bgBottom),
        100,
        Math.floor((progress + sectionHeight / totalHeight) * 100)
      );

      bgGraphics.fillGradientStyle(
        Phaser.Display.Color.GetColor(color1.r, color1.g, color1.b),
        Phaser.Display.Color.GetColor(color1.r, color1.g, color1.b),
        Phaser.Display.Color.GetColor(color2.r, color2.g, color2.b),
        Phaser.Display.Color.GetColor(color2.r, color2.g, color2.b),
        1
      );
      bgGraphics.fillRect(0, y, GAME_WIDTH, sectionHeight + 2);
    }

    bgGraphics.setDepth(-10);

    // [Fix] 배경 Tween 참조 저장
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * totalHeight;
      const size = 2 + Math.random() * 4;

      const dust = this.add.circle(x, y, size, 0x4E342E, 0.3);
      dust.setDepth(-5);

      const tween = this.tweens.add({
        targets: dust,
        y: dust.y + 100 + Math.random() * 200,
        alpha: 0.1,
        duration: 3000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2000
      });

      this._backgroundTweens.push(tween);
    }
  }

  // ========================================
  // 링(플랫폼) 생성
  // ========================================

  _createRings() {
    const startY = 300;

    for (let i = 0; i < CONFIG.TOTAL_RINGS; i++) {
      const y = startY + i * CONFIG.RING_SPACING;
      const ring = new HelixRing(this, y, i);
      this.rings.push(ring);
    }

    this._createFinishPlatform();
  }

  _createFinishPlatform() {
    const finishY = 300 + CONFIG.TOTAL_RINGS * CONFIG.RING_SPACING + 100;

    this.finishContainer = this.add.container(GAME_WIDTH / 2, finishY);

    const bgCircle = this.add.circle(0, 0, CONFIG.RING.OUTER_RADIUS, 0x4CAF50);
    bgCircle.setStrokeStyle(4, 0x2E7D32);
    this.finishContainer.add(bgCircle);

    const goalText = this.add.text(0, 0, '🍫 GOAL!', {
      fontFamily: FONT_FAMILY,
      fontSize: '28px',
      color: '#FFFFFF'
    }).setOrigin(0.5);
    this.finishContainer.add(goalText);

    // [Fix] Tween 참조 저장
    this._finishTween = this.tweens.add({
      targets: this.finishContainer,
      scale: { from: 1, to: 1.05 },
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    this.finishY = finishY;
  }

  // ========================================
  // 볼(플레이어) 생성
  // ========================================

  _createBall() {
    this.ball = new CocoaBall(this, GAME_WIDTH / 2, 150);
  }

  // ========================================
  // UI 생성
  // ========================================

  _createUI() {
    this.uiContainer = this.add.container(0, 0);
    this.uiContainer.setScrollFactor(0);
    this.uiContainer.setDepth(500);

    const panelBg = this.add.rectangle(
      GAME_WIDTH / 2, 50,
      GAME_WIDTH - 40, 80,
      0x000000, 0.6
    );
    panelBg.setStrokeStyle(2, 0x8D6E63);
    this.uiContainer.add(panelBg);

    this.scoreText = this.add.text(60, 35, '0', {
      fontFamily: FONT_FAMILY,
      fontSize: '32px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0, 0.5);
    this.uiContainer.add(this.scoreText);

    const scoreLabel = this.add.text(60, 60, 'COCOA', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#BCAAA4'
    }).setOrigin(0, 0.5);
    this.uiContainer.add(scoreLabel);

    this.progressText = this.add.text(GAME_WIDTH - 60, 50, '0%', {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: '#FFFFFF'
    }).setOrigin(1, 0.5);
    this.uiContainer.add(this.progressText);

    const barWidth = 150;
    const barBg = this.add.rectangle(
      GAME_WIDTH / 2, 75,
      barWidth, 10,
      0x3E2723
    );
    barBg.setStrokeStyle(1, 0x5D4037);
    this.uiContainer.add(barBg);

    this.progressBar = this.add.rectangle(
      GAME_WIDTH / 2 - barWidth / 2, 75,
      0, 8,
      0x8BC34A
    ).setOrigin(0, 0.5);
    this.uiContainer.add(this.progressBar);

    // [Fix] comboText를 uiContainer에 추가
    this.comboText = this.add.text(GAME_WIDTH / 2, 130, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: '#FF9800',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0);
    this.uiContainer.add(this.comboText);

    this._createFeverGauge(this.uiContainer);
  }

  _createFeverGauge(container) {
    const gaugeWidth = 100;
    const gaugeX = GAME_WIDTH / 2;
    const gaugeY = 95;

    const gaugeBg = this.add.rectangle(
      gaugeX, gaugeY,
      gaugeWidth, 8,
      0x333333
    );
    gaugeBg.setStrokeStyle(1, 0x555555);
    container.add(gaugeBg);

    this.feverGauge = this.add.rectangle(
      gaugeX - gaugeWidth / 2, gaugeY,
      0, 6,
      0xFF6B00
    ).setOrigin(0, 0.5);
    container.add(this.feverGauge);

    this.feverLabel = this.add.text(gaugeX, gaugeY, 'FEVER', {
      fontFamily: FONT_FAMILY,
      fontSize: '8px',
      color: '#FFFFFF'
    }).setOrigin(0.5);
    container.add(this.feverLabel);

    this.feverGaugeWidth = gaugeWidth;
  }

  // ========================================
  // 카메라 설정
  // ========================================

  _setupCamera() {
    const totalHeight = CONFIG.TOTAL_RINGS * CONFIG.RING_SPACING + GAME_HEIGHT + 200;
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, totalHeight);
    this.cameras.main.scrollY = 0;
  }

  // ========================================
  // 입력 설정
  // [Fix] 핸들러 참조 저장하여 정리 가능하게
  // ========================================

  _setupInput() {
    this._inputHandler = () => {
      if (!this.isPlaying || this.isGameOver) return;

      if (this.ball && !this.ball.isDropping && !this.ball.isBouncing) {
        this.ball.drop();
        soundManager.playTap();
      }
    };

    this.input.on('pointerdown', this._inputHandler);
  }

  // ========================================
  // 인트로
  // ========================================

  _showIntro() {
    // 중복 실행 방지
    if (this.introActive) return;
    this.introActive = true;

    // 인트로 요소들 저장
    this._introElements = [];

    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0.85
    ).setScrollFactor(0).setDepth(600);
    this._introElements.push(overlay);

    const icon = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, '🍫', {
      fontSize: '72px'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(601);
    this._introElements.push(icon);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '코코아 가루 수집', {
      fontFamily: FONT_FAMILY,
      fontSize: '28px',
      color: '#BCAAA4'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(601);
    this._introElements.push(title);

    const desc = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60,
      '터치로 빈 틈을 통과하세요!\n🔴 빨간 플랫폼 주의!', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#FFFFFF',
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(601);
    this._introElements.push(desc);

    const startText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 150, '[ 터치하여 시작 ]', {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#8BC34A'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(601);
    this._introElements.push(startText);

    // 간단한 블링크
    let blinkAlpha = 1;
    let blinkDir = -1;
    this._blinkInterval = setInterval(() => {
      if (!startText || !startText.active) {
        clearInterval(this._blinkInterval);
        return;
      }
      blinkAlpha += blinkDir * 0.05;
      if (blinkAlpha <= 0.3) blinkDir = 1;
      if (blinkAlpha >= 1) blinkDir = -1;
      startText.setAlpha(blinkAlpha);
    }, 50);

    // 시작 핸들러 - 씬 전체 입력
    this._introStartHandler = () => {
      this._closeIntroAndStart();
    };
    this.input.once('pointerup', this._introStartHandler);
  }

  _closeIntroAndStart() {
    if (!this.introActive) return;
    this.introActive = false;

    if (this._blinkInterval) {
      clearInterval(this._blinkInterval);
      this._blinkInterval = null;
    }

    try { soundManager.playUIClick(); } catch (e) {}

    if (this._introElements) {
      this._introElements.forEach(el => {
        try { if (el && el.active) el.destroy(); } catch (e) {}
      });
      this._introElements = null;
    }

    this.time.delayedCall(0, () => {
      this._startGame();
    });
  }

  // ========================================
  // 게임 시작
  // ========================================

  _startGame() {
    // [Fix] 게임 시작 시 시간 시스템 다시 확인
    this.time.paused = false;
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;

    this.isPlaying = true;
    this.isGameOver = false;

    if (this.ball) {
      this.ball.drop();
    }
  }

  // ========================================
  // 메인 업데이트
  // ========================================

  update(time, delta) {
    if (!this.isPlaying || this.isGameOver) return;

    const dt = delta / 1000;

    // 볼 업데이트
    this.ball?.update(dt);

    // 링 업데이트 (피버 시 속도 부스트)
    const speed = this.rotationSpeed * (this.isFever ? CONFIG.FEVER.SPEED_BOOST : 1);
    this.rings.forEach(ring => ring.update(dt, speed));

    this._updateCamera();
    this._checkCollisions();

    // 피버 타이머
    if (this.isFever && (this.feverTimer -= delta) <= 0) {
      this._endFever();
    }

    this._updateUI();

    // 골인 체크
    if (this.ball?.y >= this.finishY - 50) {
      this._finishGame();
    }
  }

  _updateCamera() {
    if (!this.ball) return;

    const targetY = this.ball.y - GAME_HEIGHT * 0.35;
    const currentY = this.cameras.main.scrollY;
    const newY = currentY + (targetY - currentY) * CONFIG.CAMERA.FOLLOW_LERP;

    this.cameras.main.scrollY = Math.max(0, newY);
  }

  _checkCollisions() {
    if (!this.ball) return;

    const { x: ballX, y: ballY } = this.ball;
    const ballR = CONFIG.BALL.RADIUS;

    for (let i = this.currentRingIndex; i < this.rings.length; i++) {
      const ring = this.rings[i];

      // 이미 통과한 링
      if (ballY > ring.y + 30) {
        if (!ring.passed) this._onRingPassed(ring);
        this.currentRingIndex = i + 1;
        continue;
      }

      const result = ring.checkCollision(ballX, ballY, ballR);

      // 충돌 처리
      if (result.collided) {
        if (result.danger && !this.isFever) return this._gameOver();

        this.ball.bounce();
        this.combo = 0;
        this._updateComboUI();
        this.cameras.main.shake(100, CONFIG.CAMERA.SHAKE_INTENSITY);
        break;
      }

      // 빈 공간 통과
      if (result.passed && !ring.passed) {
        this._onRingPassed(ring, result.gold);
      }
    }
  }

  _onRingPassed(ring, isGold = false) {
    ring.playPassEffect();
    this.ringsPassed++;

    const { PASS_RING, COMBO_MULTIPLIER, PERFECT_BONUS, FEVER_MULTIPLIER } = CONFIG.SCORE;
    const { x: ballX, y: ballY } = this.ball;

    // 콤보 & 점수 계산
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);

    let points = PASS_RING + this.combo * COMBO_MULTIPLIER;
    if (isGold) {
      points += PERFECT_BONUS;
      CocoaEffects.emitGoldEffect(this, ballX, ballY);
      soundManager.playSpecial();
    }
    if (this.isFever) points *= FEVER_MULTIPLIER;

    this.score += points;

    // 이펙트
    CocoaEffects.emitPassParticles(this, ballX, ring.y);
    if (this.combo >= 3) {
      CocoaEffects.emitComboEffect(this, ballX, ring.y, this.combo);
      this.cameras.main.shake(50, 0.005);
    }

    // 피버 트리거
    if (this.combo >= CONFIG.FEVER.COMBO_TRIGGER && !this.isFever) {
      this._startFever();
    }

    soundManager.playCrush();
    this._updateComboUI();
    this.rotationSpeed += 0.02;
  }

  _startFever() {
    this.isFever = true;
    this.feverTimer = CONFIG.FEVER.DURATION;

    if (this.ball) {
      this.ball.setFeverMode(true);
    }

    CocoaEffects.emitFeverStart(this);
    soundManager.playFever();
  }

  _endFever() {
    this.isFever = false;
    if (this.ball) {
      this.ball.setFeverMode(false);
    }
  }

  _updateComboUI() {
    const showCombo = this.combo >= 2;
    this.comboText.setAlpha(showCombo ? 1 : 0);

    if (showCombo) {
      this.comboText.setText(`${this.combo} COMBO`);
      this.tweens.add({
        targets: this.comboText,
        scale: { from: 1.3, to: 1 },
        duration: 150,
        ease: 'Back.easeOut'
      });
    }

    // 피버 게이지 업데이트
    const gaugeMax = this.feverGaugeWidth - 4;
    const progress = this.isFever
      ? this.feverTimer / CONFIG.FEVER.DURATION
      : Math.min(this.combo / CONFIG.FEVER.COMBO_TRIGGER, 1);

    this.feverGauge.width = progress * gaugeMax;
    this.feverGauge.setFillStyle(this.isFever ? 0xFF6B00 : 0xFFB74D);
  }

  _updateUI() {
    this.scoreText?.setText(this.score.toString());

    const progress = Math.floor((this.ringsPassed / CONFIG.TOTAL_RINGS) * 100);
    this.progressText?.setText(`${progress}%`);
    if (this.progressBar) this.progressBar.width = (progress / 100) * 150;
  }

  // ========================================
  // 게임 오버
  // ========================================

  _gameOver() {
    this.isGameOver = true;
    this.isPlaying = false;

    if (this.ball) {
      CocoaEffects.emitDangerEffect(this, this.ball.x, this.ball.y);
    }
    soundManager.playFail();

    this.time.delayedCall(800, () => this._showResult(false));
  }

  _finishGame() {
    this.isGameOver = true;
    this.isPlaying = false;

    this.score += 100;

    soundManager.playSuccess();
    this.cameras.main.flash(300, 165, 214, 167, true);

    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 100, () => {
        CocoaEffects.emitPassParticles(
          this,
          GAME_WIDTH / 2 + Phaser.Math.Between(-100, 100),
          this.finishY
        );
      });
    }

    this.time.delayedCall(1000, () => this._showResult(true));
  }

  // ========================================
  // 결과 화면
  // ========================================

  _showResult(completed) {
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, this.cameras.main.scrollY + GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0.85
    ).setDepth(600);

    const centerY = this.cameras.main.scrollY + GAME_HEIGHT / 2;

    const titleText = completed ? '🍫 완료!' : '💥 실패...';
    const titleColor = completed ? '#8BC34A' : '#FF5252';

    const title = this.add.text(GAME_WIDTH / 2, centerY - 120, titleText, {
      fontFamily: FONT_FAMILY,
      fontSize: '36px',
      color: titleColor
    }).setOrigin(0.5).setDepth(601).setScale(0);

    const scoreLabel = this.add.text(GAME_WIDTH / 2, centerY - 40, '획득 코코아', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#BCAAA4'
    }).setOrigin(0.5).setDepth(601).setAlpha(0);

    const scoreValue = this.add.text(GAME_WIDTH / 2, centerY + 10, this.score.toString(), {
      fontFamily: FONT_FAMILY,
      fontSize: '48px',
      color: '#FFD700'
    }).setOrigin(0.5).setDepth(601).setAlpha(0);

    const comboLabel = this.add.text(GAME_WIDTH / 2, centerY + 70, `최대 콤보: ${this.maxCombo}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#FF9800'
    }).setOrigin(0.5).setDepth(601).setAlpha(0);

    const progressLabel = this.add.text(GAME_WIDTH / 2, centerY + 100,
      `진행률: ${Math.floor((this.ringsPassed / CONFIG.TOTAL_RINGS) * 100)}%`, {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#FFFFFF'
    }).setOrigin(0.5).setDepth(601).setAlpha(0);

    const continueBtn = this.add.text(GAME_WIDTH / 2, centerY + 170, '[ 계속하기 ]', {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: '#8BC34A'
    }).setOrigin(0.5).setDepth(601).setAlpha(0).setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: title,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });

    this.tweens.add({
      targets: [scoreLabel, scoreValue, comboLabel, progressLabel],
      alpha: 1,
      duration: 300,
      delay: 300
    });

    this.tweens.add({
      targets: continueBtn,
      alpha: 1,
      duration: 300,
      delay: 500
    });

    continueBtn.on('pointerdown', () => {
      soundManager.playUIClick();

      if (this.onComplete) {
        this.onComplete(this.score, this.maxCombo, completed);
      }

      this.scene.resume('KitchenScene');
      this.scene.stop();
    });
  }

  // ========================================
  // 정리
  // [Fix] 완전한 리소스 정리
  // ========================================

  shutdown() {
    // [Fix] Input 리스너 제거
    if (this._inputHandler) {
      this.input.off('pointerdown', this._inputHandler);
      this._inputHandler = null;
    }

    // [Fix] 배경 Tween 정리
    this._backgroundTweens.forEach(tween => {
      if (tween && tween.stop) {
        tween.stop();
      }
    });
    this._backgroundTweens = [];

    // [Fix] 인트로 Tween 정리
    if (this._introBlinkTween) {
      this._introBlinkTween.stop();
      this._introBlinkTween = null;
    }

    // [Fix] Finish Tween 정리
    if (this._finishTween) {
      this._finishTween.stop();
      this._finishTween = null;
    }

    // Ball 정리
    if (this.ball) {
      this.ball.destroy();
      this.ball = null;
    }

    // Rings 정리
    this.rings.forEach(ring => ring.destroy());
    this.rings = [];

    // Finish container 정리
    if (this.finishContainer) {
      this.finishContainer.destroy();
      this.finishContainer = null;
    }

    // UI container 정리
    if (this.uiContainer) {
      this.uiContainer.destroy();
      this.uiContainer = null;
    }

    // [Fix] Scene event 리스너 제거
    this.events.off('shutdown', this.shutdown, this);
    this.events.off('destroy', this.shutdown, this);
  }
}
