/**
 * PistachioCrushScene - 피스타치오 분쇄 미니게임 (고품질 버전)
 * 터치 + 피버 모드 게임
 *
 * Features:
 * - 4가지 피스타치오 타입 (normal, emerald, roasted, bad)
 * - 피버 게이지 시스템 (100% → 3초 자동 분쇄)
 * - 바운스 애니메이션
 * - 콤보 시스템
 * - Juicy 이펙트
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY } from '../../config/GameConfig.js';
import { soundManager } from '../../../core/SoundManager.js';

// ============================================
// 상수 설정
// ============================================

const CONFIG = {
  // 게임 설정
  GAME_DURATION: 25,
  COMBO_TIMEOUT: 1200,
  FEVER_DURATION: 3000,

  // 스폰
  SPAWN: {
    BASE_RATE: 0.35,
    FEVER_RATE: 0.15,
    MAX_ON_SCREEN: 12
  },

  // 피스타치오 타입별 설정
  TYPES: {
    normal: {
      chance: 0.55,
      points: 10,
      feverGain: 12,
      baseColor: 0x7CB342,
      shellColor: 0xD7CCC8,
      size: { min: 38, max: 48 }
    },
    emerald: {
      chance: 0.10,
      points: 30,
      feverGain: 25,
      baseColor: 0x00E676,
      shellColor: 0xE8F5E9,
      size: { min: 42, max: 52 }
    },
    roasted: {
      chance: 0.15,
      points: 20,
      feverGain: 20,
      baseColor: 0xA1887F,
      shellColor: 0xEFEBE9,
      size: { min: 40, max: 50 }
    },
    bad: {
      chance: 0.20,
      points: -15,
      feverGain: -25,
      timePenalty: 1.5,
      baseColor: 0x5D4037,
      shellColor: 0x6D4C41,
      size: { min: 35, max: 45 }
    }
  },

  // 비주얼
  COLORS: {
    bg: 0x1B2E1B,
    bgLight: 0x2E4A2E,
    feverBg: 0x4A1A1A,
    feverGlow: 0xFF6B6B,
    gaugeEmpty: 0x333333,
    gaugeFill: 0xFF9800,
    gaugeFever: 0xFF5722
  },

  // 피버 게이지
  FEVER: {
    MAX: 100,
    DECAY_RATE: 3  // 초당 감소량
  }
};

// ============================================
// Pistachio Prefab
// ============================================

class Pistachio {
  constructor(scene, x, y, type) {
    this.scene = scene;
    this.x = x;
    this.baseY = y;
    this.y = y;
    this.type = type;
    this.crushed = false;
    this.fadeTimer = 0;

    // 타입별 설정
    const typeConfig = CONFIG.TYPES[type];
    this.points = typeConfig.points;
    this.feverGain = typeConfig.feverGain;
    this.timePenalty = typeConfig.timePenalty || 0;

    // 크기
    this.size = Phaser.Math.Between(typeConfig.size.min, typeConfig.size.max);

    // 바운스 애니메이션
    this.bouncePhase = Math.random() * Math.PI * 2;
    this.bounceSpeed = 5 + Math.random() * 3;
    this.bounceHeight = 6 + Math.random() * 4;

    // 비주얼 생성
    this._createVisual(typeConfig);

    // 등장 애니메이션
    this._playSpawnAnimation();
  }

  _createVisual(typeConfig) {
    this.container = this.scene.add.container(this.x, this.y);

    const g = this.scene.add.graphics();
    const s = this.size;

    // 그림자
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(3, 5, s * 0.9, s * 0.5);

    // 껍데기 (양쪽)
    g.fillStyle(typeConfig.shellColor, 1);

    // 왼쪽 껍데기
    g.beginPath();
    g.arc(-s * 0.15, 0, s * 0.4, Math.PI * 0.6, Math.PI * 1.4, false);
    g.closePath();
    g.fillPath();

    // 오른쪽 껍데기
    g.beginPath();
    g.arc(s * 0.15, 0, s * 0.4, -Math.PI * 0.4, Math.PI * 0.4, false);
    g.closePath();
    g.fillPath();

    // 테두리
    g.lineStyle(2, 0x8D6E63, 0.8);
    g.strokeEllipse(0, 0, s * 0.8, s * 0.45);

    // 내부 (피스타치오 알맹이)
    g.fillStyle(typeConfig.baseColor, 1);
    g.fillEllipse(0, 0, s * 0.5, s * 0.3);

    // 하이라이트
    g.fillStyle(0xFFFFFF, 0.3);
    g.fillEllipse(-s * 0.1, -s * 0.08, s * 0.2, s * 0.1);

    this.container.add(g);
    this.graphics = g;

    // 스페셜 타입 이펙트
    if (this.type === 'emerald') {
      this._addEmeraldEffect();
    } else if (this.type === 'roasted') {
      this._addRoastedEffect();
    } else if (this.type === 'bad') {
      this._addBadEffect();
    }

    // 인터랙티브 설정
    const hitArea = new Phaser.Geom.Circle(0, 0, s * 0.6);
    this.container.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
  }

  _addEmeraldEffect() {
    // 반짝임
    const sparkle = this.scene.add.text(0, -this.size * 0.4, '💎', {
      fontSize: '16px'
    }).setOrigin(0.5);

    this.container.add(sparkle);

    this.scene.tweens.add({
      targets: sparkle,
      y: sparkle.y - 5,
      alpha: { from: 0.7, to: 1 },
      scale: { from: 0.8, to: 1.1 },
      duration: 400,
      yoyo: true,
      repeat: -1
    });

    // 글로우
    const glow = this.scene.add.ellipse(0, 0, this.size * 1.2, this.size * 0.7, 0x00E676, 0.2);
    this.container.addAt(glow, 0);

    this.scene.tweens.add({
      targets: glow,
      scale: { from: 1, to: 1.3 },
      alpha: { from: 0.2, to: 0.05 },
      duration: 600,
      yoyo: true,
      repeat: -1
    });
  }

  _addRoastedEffect() {
    // 연기 효과
    const smoke = this.scene.add.text(0, -this.size * 0.3, '~', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#BCAAA4'
    }).setOrigin(0.5);

    this.container.add(smoke);

    this.scene.tweens.add({
      targets: smoke,
      y: smoke.y - 15,
      alpha: 0,
      duration: 800,
      repeat: -1
    });
  }

  _addBadEffect() {
    // 경고 표시
    const warning = this.scene.add.text(0, -this.size * 0.4, '💀', {
      fontSize: '14px'
    }).setOrigin(0.5);

    this.container.add(warning);

    this.scene.tweens.add({
      targets: warning,
      scale: { from: 0.8, to: 1.2 },
      duration: 300,
      yoyo: true,
      repeat: -1
    });

    // 어두운 오라
    const aura = this.scene.add.ellipse(0, 0, this.size * 1.1, this.size * 0.65, 0x000000, 0.2);
    this.container.addAt(aura, 0);
  }

  _playSpawnAnimation() {
    this.container.setScale(0);
    this.container.setAlpha(0);

    this.scene.tweens.add({
      targets: this.container,
      scale: 1,
      alpha: 1,
      duration: 250,
      ease: 'Back.easeOut'
    });
  }

  update(dt) {
    if (this.crushed) {
      this.fadeTimer -= dt;
      if (this.fadeTimer <= 0) {
        this.destroy();
        return false;
      }
      return true;
    }

    // 바운스 애니메이션
    this.bouncePhase += this.bounceSpeed * dt;
    this.y = this.baseY + Math.sin(this.bouncePhase) * this.bounceHeight;

    // 살짝 기울기
    const tilt = Math.sin(this.bouncePhase * 0.7) * 0.1;

    this.container.setPosition(this.x, this.y);
    this.container.setRotation(tilt);

    return true;
  }

  crush() {
    if (this.crushed) return null;
    this.crushed = true;
    this.fadeTimer = 0.3;

    // 분쇄 애니메이션
    this.scene.tweens.add({
      targets: this.container,
      scale: 0.3,
      alpha: 0,
      duration: 200,
      ease: 'Quad.easeOut'
    });

    return {
      x: this.x,
      y: this.y,
      type: this.type,
      points: this.points,
      feverGain: this.feverGain,
      timePenalty: this.timePenalty
    };
  }

  // 피버 모드 자동 분쇄
  autoCrush() {
    if (this.crushed || this.type === 'bad') return null;
    return this.crush();
  }

  destroy() {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }
}

// ============================================
// CrushEffect (분쇄 이펙트)
// ============================================

class CrushEffect {
  static emit(scene, x, y, type) {
    const typeConfig = CONFIG.TYPES[type];

    if (type === 'bad') {
      CrushEffect._emitBadEffect(scene, x, y);
    } else {
      CrushEffect._emitCrushParticles(scene, x, y, typeConfig.baseColor);

      if (type === 'emerald') {
        CrushEffect._emitEmeraldBurst(scene, x, y);
      } else if (type === 'roasted') {
        CrushEffect._emitRoastedBurst(scene, x, y);
      }
    }
  }

  static _emitCrushParticles(scene, x, y, color) {
    // 파편 파티클
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 60 + Math.random() * 100;
      const size = 3 + Math.random() * 5;

      const particle = scene.add.ellipse(x, y, size, size * 0.6, color);

      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed + 40,
        alpha: 0,
        scale: 0.3,
        rotation: Math.random() * 3,
        duration: 350,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    }

    // 껍데기 조각
    for (let i = 0; i < 4; i++) {
      const shell = scene.add.arc(x, y, 8, 0, 180, false, 0xD7CCC8);
      const angle = (i / 4) * Math.PI * 2;

      scene.tweens.add({
        targets: shell,
        x: x + Math.cos(angle) * 50,
        y: y + Math.sin(angle) * 30 + 60,
        alpha: 0,
        rotation: Math.random() * 5,
        duration: 500,
        ease: 'Quad.easeOut',
        onComplete: () => shell.destroy()
      });
    }
  }

  static _emitBadEffect(scene, x, y) {
    // 빨간 X 표시
    const xMark = scene.add.text(x, y, '✗', {
      fontFamily: FONT_FAMILY,
      fontSize: '48px',
      color: '#FF5252'
    }).setOrigin(0.5);

    scene.tweens.add({
      targets: xMark,
      scale: { from: 0.5, to: 1.5 },
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => xMark.destroy()
    });

    // 연기
    for (let i = 0; i < 6; i++) {
      const smoke = scene.add.circle(
        x + (Math.random() - 0.5) * 30,
        y + (Math.random() - 0.5) * 20,
        5 + Math.random() * 8,
        0x5D4037,
        0.6
      );

      scene.tweens.add({
        targets: smoke,
        y: smoke.y - 40,
        alpha: 0,
        scale: 2,
        duration: 500,
        delay: i * 30,
        onComplete: () => smoke.destroy()
      });
    }

    // 화면 빨간 플래시
    scene.cameras.main.flash(200, 255, 50, 50, true);
  }

  static _emitEmeraldBurst(scene, x, y) {
    // 보석 반짝임
    for (let i = 0; i < 8; i++) {
      const gem = scene.add.text(x, y, '💎', {
        fontSize: '12px'
      }).setOrigin(0.5);

      const angle = (i / 8) * Math.PI * 2;

      scene.tweens.add({
        targets: gem,
        x: x + Math.cos(angle) * 70,
        y: y + Math.sin(angle) * 50,
        alpha: 0,
        scale: 0.5,
        duration: 500,
        ease: 'Quad.easeOut',
        onComplete: () => gem.destroy()
      });
    }

    // 링 이펙트
    const ring = scene.add.circle(x, y, 10, 0x00E676, 0);
    ring.setStrokeStyle(3, 0x00E676);

    scene.tweens.add({
      targets: ring,
      scale: 5,
      alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy()
    });
  }

  static _emitRoastedBurst(scene, x, y) {
    // 향기 이펙트
    for (let i = 0; i < 5; i++) {
      const aroma = scene.add.text(x, y, '~', {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        color: '#D7CCC8'
      }).setOrigin(0.5);

      scene.tweens.add({
        targets: aroma,
        x: x + (Math.random() - 0.5) * 60,
        y: y - 60 - Math.random() * 30,
        alpha: 0,
        scale: 1.5,
        duration: 600,
        delay: i * 80,
        onComplete: () => aroma.destroy()
      });
    }
  }
}

// ============================================
// PistachioCrushScene (메인 씬)
// ============================================

export class PistachioCrushScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PistachioCrushScene' });
  }

  init(data) {
    this.onComplete = data?.onComplete || null;

    // 게임 상태
    this.score = 0;
    this.timeLeft = CONFIG.GAME_DURATION;
    this.combo = 0;
    this.maxCombo = 0;
    this.isPlaying = false;
    this.introActive = false;
    this.lastHitTime = 0;

    // 피버 시스템
    this.feverGauge = 0;
    this.isFever = false;
    this.feverTimer = 0;

    // 오브젝트
    this.pistachios = [];

    // 스폰
    this.spawnAccumulator = 0;
  }

  create() {
    // [Fix] Phaser 시간 시스템 강제 초기화
    this.time.paused = false;
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;

    console.log('[PistachioCrushScene] 시간 시스템 초기화 완료');

    // [Fix] Scene lifecycle 이벤트 연결
    this.events.on('shutdown', this.shutdown, this);

    // BGM 전환 (미니게임 음악)
    soundManager.switchBGM('minigame');

    this._createBackground();
    this._createUI();
    this._createFeverOverlay();

    // [Fix] 입력 시스템 안정화 대기
    this.time.delayedCall(100, () => {
      this._showIntro();
    });
  }

  // ========================================
  // 배경 & UI
  // ========================================

  _createBackground() {
    // 그라데이션 배경 (숲 느낌)
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      0x3D5A3D, 0x3D5A3D,
      CONFIG.COLORS.bg, CONFIG.COLORS.bg, 1
    );
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 나무 바닥 질감
    const floorY = GAME_HEIGHT * 0.85;
    const floorGradient = this.add.graphics();
    floorGradient.fillGradientStyle(0x5D4037, 0x5D4037, 0x3E2723, 0x3E2723, 1);
    floorGradient.fillRect(0, floorY, GAME_WIDTH, GAME_HEIGHT - floorY);

    // 바닥 나무 결
    for (let i = 0; i < 5; i++) {
      const y = floorY + 15 + i * 30;
      this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 30, 2, 0x4E342E, 0.4);
    }

    // 산 실루엣 (먼 배경)
    const mountainGraphics = this.add.graphics();
    mountainGraphics.fillStyle(0x1B3D1B, 0.5);
    mountainGraphics.beginPath();
    mountainGraphics.moveTo(0, 300);
    mountainGraphics.lineTo(150, 180);
    mountainGraphics.lineTo(300, 260);
    mountainGraphics.lineTo(450, 150);
    mountainGraphics.lineTo(600, 220);
    mountainGraphics.lineTo(720, 180);
    mountainGraphics.lineTo(720, 300);
    mountainGraphics.closePath();
    mountainGraphics.fillPath();

    // 나뭇잎 떨어지는 효과
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = 150 + Math.random() * (floorY - 200);
      const size = 6 + Math.random() * 8;
      const leaf = this.add.ellipse(x, y, size, size * 0.5, 0x7CB342, 0.2);
      leaf.setRotation(Math.random() * Math.PI);

      // 떨어지는 애니메이션
      this.tweens.add({
        targets: leaf,
        y: leaf.y + 50 + Math.random() * 100,
        x: leaf.x + (Math.random() - 0.5) * 60,
        rotation: leaf.rotation + Math.PI,
        alpha: 0.05,
        duration: 4000 + Math.random() * 3000,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2000
      });
    }

    // 피스타치오 아이콘 장식 (상단)
    const decorY = 145;
    for (let i = 0; i < 3; i++) {
      const x = 100 + i * (GAME_WIDTH - 200) / 2;
      this.add.text(x, decorY, '🥜', { fontSize: '18px' })
        .setOrigin(0.5)
        .setAlpha(0.15);
    }

    // 부드러운 빛 효과
    const lightOverlay = this.add.graphics();
    lightOverlay.fillStyle(0xFFFFFF, 0.02);
    lightOverlay.fillCircle(GAME_WIDTH * 0.3, 250, 200);
    lightOverlay.fillCircle(GAME_WIDTH * 0.7, 350, 180);

    this.bgGraphics = bg;
  }

  _createUI() {
    // 상단 패널 (자연 느낌)
    const panelBg = this.add.graphics();
    panelBg.fillGradientStyle(0x1B2E1B, 0x1B2E1B, 0x2E4A2E, 0x2E4A2E, 0.9);
    panelBg.fillRect(0, 0, GAME_WIDTH, 120);

    // 패널 하단 장식선 (잎사귀 색)
    this.add.rectangle(GAME_WIDTH / 2, 118, GAME_WIDTH, 4, 0x7CB342, 0.5);
    this.add.rectangle(GAME_WIDTH / 2, 120, GAME_WIDTH, 2, 0x4CAF50, 0.3);

    // 제목 배경 장식
    this.add.rectangle(GAME_WIDTH / 2, 18, 160, 24, 0x7CB342, 0.2).setStrokeStyle(1, 0x7CB342, 0.3);

    // 제목
    this.add.text(GAME_WIDTH / 2, 18, '🌿 피스타치오 분쇄', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#A5D6A7'
    }).setOrigin(0.5);

    // 점수 영역 배경
    this.add.rectangle(75, 58, 120, 50, 0xFFD700, 0.1).setStrokeStyle(1, 0xFFD700, 0.2);

    // 점수
    this.scoreText = this.add.text(75, 50, '0', {
      fontFamily: FONT_FAMILY,
      fontSize: '32px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(75, 78, 'SCORE', {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: '#81C784'
    }).setOrigin(0.5);

    // 시간 영역 배경
    this.add.rectangle(GAME_WIDTH - 75, 58, 100, 50, 0xFF6B6B, 0.1).setStrokeStyle(1, 0xFF6B6B, 0.2);

    // 시간
    this.timeText = this.add.text(GAME_WIDTH - 75, 50, '25', {
      fontFamily: FONT_FAMILY,
      fontSize: '32px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH - 75, 78, 'TIME', {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: '#AAAAAA'
    }).setOrigin(0.5);

    // 피버 게이지
    this._createFeverGauge();

    // 콤보 텍스트
    this.comboText = this.add.text(GAME_WIDTH / 2, 95, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '22px',
      color: '#FF9800',
      stroke: '#1B2E1B',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);
  }

  _createFeverGauge() {
    const gaugeX = GAME_WIDTH / 2;
    const gaugeY = 50;
    const gaugeWidth = 150;
    const gaugeHeight = 18;

    // 배경
    this.gaugeBar = this.add.rectangle(
      gaugeX, gaugeY,
      gaugeWidth, gaugeHeight,
      CONFIG.COLORS.gaugeEmpty
    );
    this.gaugeBar.setStrokeStyle(2, 0x000000);

    // 채우기 (마스크용)
    this.gaugeFill = this.add.rectangle(
      gaugeX - gaugeWidth / 2, gaugeY,
      0, gaugeHeight - 4,
      CONFIG.COLORS.gaugeFill
    ).setOrigin(0, 0.5);

    // 레이블
    this.gaugeLabel = this.add.text(gaugeX, gaugeY, 'FEVER', {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: '#FFFFFF'
    }).setOrigin(0.5);
  }

  _createFeverOverlay() {
    // 피버 모드 오버레이 (처음엔 숨김)
    this.feverOverlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      CONFIG.COLORS.feverBg, 0
    );

    this.feverText = this.add.text(GAME_WIDTH / 2, 150, '🔥 FEVER MODE 🔥', {
      fontFamily: FONT_FAMILY,
      fontSize: '28px',
      color: '#FF5722',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);
  }

  // ========================================
  // 인트로 & 게임 플로우
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
    ).setDepth(100);
    this._introElements.push(overlay);

    const icon = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, '🥜', {
      fontSize: '64px'
    }).setOrigin(0.5).setDepth(101);
    this._introElements.push(icon);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '피스타치오 분쇄', {
      fontFamily: FONT_FAMILY,
      fontSize: '28px',
      color: '#A5D6A7'
    }).setOrigin(0.5).setDepth(101);
    this._introElements.push(title);

    const desc = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50,
      '터치로 피스타치오를 으깨라!\n💀 상한 것 주의!', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#FFFFFF',
      align: 'center'
    }).setOrigin(0.5).setDepth(101);
    this._introElements.push(desc);

    const startText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130, '[ 터치하여 시작 ]', {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#4CAF50'
    }).setOrigin(0.5).setDepth(101);
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

  _startGame() {
    // [Fix] 게임 시작 시 시간 시스템 다시 확인
    this.time.paused = false;
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;

    this.isPlaying = true;
    this.score = 0;
    this.timeLeft = CONFIG.GAME_DURATION;
    this.combo = 0;
    this.feverGauge = 0;
    this.isFever = false;

    // 타이머
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--;
        this.timeText.setText(this.timeLeft.toString());

        if (this.timeLeft <= 5) {
          this.timeText.setColor('#FF6B6B');
          this.cameras.main.shake(50, 0.003);
        }

        if (this.timeLeft <= 0) {
          this._endGame();
        }
      },
      repeat: CONFIG.GAME_DURATION - 1
    });
  }

  _endGame() {
    this.isPlaying = false;
    this.isFever = false;

    if (this.gameTimer) this.gameTimer.remove();

    soundManager.playSuccess();
    this.cameras.main.flash(300, 165, 214, 167, true);

    this.time.delayedCall(500, () => this._showResult());
  }

  _showResult() {
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0.85
    );

    const completeText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, '완료!', {
      fontFamily: FONT_FAMILY,
      fontSize: '36px',
      color: '#A5D6A7'
    }).setOrigin(0.5).setScale(0);

    const scoreValue = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, this.score.toString(), {
      fontFamily: FONT_FAMILY,
      fontSize: '48px',
      color: '#FFFFFF'
    }).setOrigin(0.5).setAlpha(0);

    const comboLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, `최대 콤보: ${this.maxCombo}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#FF9800'
    }).setOrigin(0.5).setAlpha(0);

    const continueBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140, '[ 계속하기 ]', {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: '#4CAF50'
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: completeText,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });

    this.tweens.add({
      targets: [scoreValue, comboLabel],
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

      // [Fix] Scene 전환 순서 수정 - 검은 화면 버그 해결
      // 1. 먼저 KitchenScene resume
      this.scene.resume('KitchenScene');

      // 2. KitchenScene 카메라 강제 fadeIn
      const kitchenScene = this.scene.get('KitchenScene');
      if (kitchenScene && kitchenScene.cameras && kitchenScene.cameras.main) {
        kitchenScene.cameras.main.fadeIn(300);
      }

      // 3. onComplete 콜백 호출
      if (this.onComplete) {
        this.onComplete(this.score, this.maxCombo);
      }

      // 4. 딜레이 후 미니게임 Scene stop
      this.time.delayedCall(50, () => {
        this.scene.stop();
      });
    });
  }

  // ========================================
  // 스폰 & 피버
  // ========================================

  _spawnPistachio() {
    if (this.pistachios.length >= CONFIG.SPAWN.MAX_ON_SCREEN) return;

    // 타입 결정
    let type = 'normal';
    const rand = Math.random();
    let cumulative = 0;

    for (const [typeName, typeConfig] of Object.entries(CONFIG.TYPES)) {
      cumulative += typeConfig.chance;
      if (rand < cumulative) {
        type = typeName;
        break;
      }
    }

    // 위치 (UI 영역 피함)
    const x = 50 + Math.random() * (GAME_WIDTH - 100);
    const y = 180 + Math.random() * (GAME_HEIGHT - 280);

    const pistachio = new Pistachio(this, x, y, type);

    // 터치 이벤트
    pistachio.container.on('pointerdown', () => {
      if (!this.isPlaying) return;
      this._onPistachioTap(pistachio);
    });

    this.pistachios.push(pistachio);

    // 스페셜 타입 사운드
    if (type === 'emerald' || type === 'roasted') {
      soundManager.playSpecial();
    }
  }

  _onPistachioTap(pistachio) {
    const result = pistachio.crush();
    if (!result) return;

    // 이펙트
    CrushEffect.emit(this, result.x, result.y, result.type);

    if (result.type === 'bad') {
      // 패널티
      this.score = Math.max(0, this.score + result.points);
      this.timeLeft = Math.max(0, this.timeLeft - result.timePenalty);
      this.timeText.setText(Math.ceil(this.timeLeft).toString());
      this.combo = 0;
      this.feverGauge = Math.max(0, this.feverGauge + result.feverGain);

      // 카메라 흔들림
      this.cameras.main.shake(150, 0.02);

      soundManager.playFail();
    } else {
      // 점수
      this.score += result.points;
      this.scoreText.setText(this.score.toString());

      // 콤보
      const now = Date.now();
      if (now - this.lastHitTime < CONFIG.COMBO_TIMEOUT) {
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
      } else {
        this.combo = 1;
      }
      this.lastHitTime = now;

      // 피버 게이지
      if (!this.isFever) {
        this.feverGauge = Math.min(CONFIG.FEVER.MAX, this.feverGauge + result.feverGain);

        if (this.feverGauge >= CONFIG.FEVER.MAX) {
          this._startFever();
        }
      }

      // 콤보 표시
      this._showCombo();

      // 카메라 흔들림
      this.cameras.main.shake(50, 0.005);

      soundManager.playCrush();
    }

    // 점수 팝업
    this._showScorePopup(result.x, result.y, result.points);
  }

  _startFever() {
    this.isFever = true;
    this.feverTimer = CONFIG.FEVER_DURATION;

    // 오버레이 활성화
    this.tweens.add({
      targets: this.feverOverlay,
      alpha: 0.3,
      duration: 200
    });

    this.tweens.add({
      targets: this.feverText,
      alpha: 1,
      scale: { from: 0.5, to: 1 },
      duration: 300,
      ease: 'Back.easeOut'
    });

    // 펄스 애니메이션
    this.feverPulse = this.tweens.add({
      targets: this.feverText,
      scale: { from: 1, to: 1.1 },
      duration: 200,
      yoyo: true,
      repeat: -1
    });

    soundManager.playFever();
    this.cameras.main.flash(200, 255, 152, 0, true);
  }

  _endFever() {
    this.isFever = false;
    this.feverGauge = 0;

    if (this.feverPulse) this.feverPulse.stop();

    this.tweens.add({
      targets: [this.feverOverlay, this.feverText],
      alpha: 0,
      duration: 300
    });
  }

  _feverAutoCrush() {
    this.pistachios.forEach(p => {
      if (!p.crushed && p.type !== 'bad') {
        const result = p.autoCrush();
        if (result) {
          this.score += Math.floor(result.points * 0.5); // 자동 분쇄는 50% 점수
          CrushEffect.emit(this, result.x, result.y, result.type);
        }
      }
    });
  }

  // ========================================
  // UI 업데이트
  // ========================================

  _updateFeverGauge() {
    const gaugeWidth = 150;
    const fillWidth = (this.feverGauge / CONFIG.FEVER.MAX) * (gaugeWidth - 4);

    this.gaugeFill.width = fillWidth;

    // 색상 변경
    const color = this.isFever ? CONFIG.COLORS.gaugeFever : CONFIG.COLORS.gaugeFill;
    this.gaugeFill.setFillStyle(color);

    // 피버 레이블
    if (this.isFever) {
      const remaining = Math.ceil(this.feverTimer / 1000);
      this.gaugeLabel.setText(`FEVER ${remaining}s`);
    } else {
      this.gaugeLabel.setText('FEVER');
    }
  }

  _showCombo() {
    if (this.combo < 3) {
      this.comboText.setAlpha(0);
      return;
    }

    this.comboText.setText(`${this.combo} COMBO!`);
    this.comboText.setAlpha(1);

    this.tweens.add({
      targets: this.comboText,
      scale: { from: 1.5, to: 1 },
      duration: 200,
      ease: 'Back.easeOut'
    });
  }

  _showScorePopup(x, y, points) {
    const color = points > 0 ? '#FFD700' : '#FF5252';
    const text = points > 0 ? `+${points}` : `${points}`;

    const popup = this.add.text(x, y, text, {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup,
      y: y - 50,
      alpha: 0,
      scale: 1.3,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => popup.destroy()
    });
  }

  // ========================================
  // 메인 업데이트
  // ========================================

  update(time, delta) {
    if (!this.isPlaying) return;

    const dt = delta / 1000;

    // 스폰
    const spawnRate = this.isFever ? CONFIG.SPAWN.FEVER_RATE : CONFIG.SPAWN.BASE_RATE;
    this.spawnAccumulator += dt;
    if (this.spawnAccumulator >= spawnRate) {
      this.spawnAccumulator = 0;
      this._spawnPistachio();
    }

    // 피스타치오 업데이트
    this.pistachios = this.pistachios.filter(p => p.update(dt));

    // 피버 모드
    if (this.isFever) {
      this.feverTimer -= delta;

      // 주기적 자동 분쇄
      if (Math.random() < dt * 5) {
        this._feverAutoCrush();
      }

      if (this.feverTimer <= 0) {
        this._endFever();
      }
    } else {
      // 피버 게이지 자연 감소
      this.feverGauge = Math.max(0, this.feverGauge - CONFIG.FEVER.DECAY_RATE * dt);
    }

    // UI 업데이트
    this._updateFeverGauge();
  }

  // ========================================
  // 정리
  // ========================================

  shutdown() {
    // [Fix] 이벤트 리스너 정리
    this.events.off('shutdown', this.shutdown, this);
    this.input.off('pointerdown');
    this.input.off('pointerup');

    if (this.gameTimer) {
      this.gameTimer.remove();
      this.gameTimer = null;
    }

    if (this.feverPulse) {
      this.feverPulse.stop();
      this.feverPulse = null;
    }

    this.pistachios.forEach(p => p.destroy());
    this.pistachios = [];
  }
}
