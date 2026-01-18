/**
 * MarshmallowMeltScene - 마시멜로우 녹이기 미니게임 (고품질 버전)
 * 타이쿤 스타일 자원 관리 게임
 *
 * Features:
 * - 3단계 불 조절 (약불/중불/강불)
 * - 들러붙음 시스템 + 연타 해소
 * - 코코아 타이밍 보너스
 * - 풍부한 비주얼 이펙트
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY } from '../../config/GameConfig.js';
import { soundManager } from '../../../core/SoundManager.js';

// ============================================
// 상수 설정
// ============================================

const CONFIG = {
  // 게임 설정
  GAME_DURATION: 45,
  MELT_TARGET: 100,

  // 불 레벨
  HEAT_LEVELS: [
    {
      name: '약불',
      meltRate: 0.6,
      stickRate: 0.2,
      color: 0x4ECDC4,
      flameColor: 0x64B5F6,
      icon: '🔵',
      bubbleRate: 0.3
    },
    {
      name: '중불',
      meltRate: 1.2,
      stickRate: 0.6,
      color: 0xFFD93D,
      flameColor: 0xFFB74D,
      icon: '🟡',
      bubbleRate: 0.6
    },
    {
      name: '강불',
      meltRate: 2.2,
      stickRate: 1.8,
      color: 0xFF6B6B,
      flameColor: 0xFF5722,
      icon: '🔴',
      bubbleRate: 1.0
    }
  ],

  // 들러붙음
  STICK: {
    THRESHOLD: 100,
    RESOLVE_PER_TAP: 12,
    WARNING_THRESHOLD: 70,
    PENALTY_SCORE: 8
  },

  // 코코아
  COCOA: {
    OPTIMAL_MIN: 40,
    OPTIMAL_MAX: 70,
    PERFECT_BONUS: 20,
    EARLY_PENALTY: 10,
    LATE_PENALTY: 15,
    MISS_PENALTY: 20
  },

  // 비주얼
  COLORS: {
    bg: 0x1A1A2E,
    bgGradient: 0x16213E,
    pot: 0x5D4037,
    potInner: 0x3E2723,
    potHighlight: 0x8D6E63,
    marshmallow: 0xFFF5EE,
    marshmallowMelted: 0xFFE4C4,
    chocolate: 0x4E342E,
    stickWarning: 0xFF5252
  }
};

// ============================================
// Pot (냄비) 클래스
// ============================================

class Pot {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.container = scene.add.container(x, y);

    this._createVisual();
    this._createMarshmallow();
  }

  _createVisual() {
    const g = this.scene.add.graphics();

    // 냄비 그림자
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(8, 75, 180, 40);

    // 냄비 본체 (그라데이션 효과)
    g.fillStyle(CONFIG.COLORS.pot, 1);
    g.fillRoundedRect(-90, -40, 180, 110, 15);

    // 냄비 내부
    g.fillStyle(CONFIG.COLORS.potInner, 1);
    g.fillEllipse(0, -30, 160, 50);

    // 하이라이트
    g.fillStyle(CONFIG.COLORS.potHighlight, 0.3);
    g.fillRoundedRect(-85, -38, 30, 80, 10);

    // 손잡이
    g.fillStyle(CONFIG.COLORS.pot, 1);
    g.fillRoundedRect(-120, 10, 35, 15, 5);
    g.fillRoundedRect(85, 10, 35, 15, 5);

    this.container.add(g);
    this.potGraphics = g;
  }

  _createMarshmallow() {
    // 마시멜로우 컨테이너
    this.marshmallowContainer = this.scene.add.container(0, -25);

    // 마시멜로우 그래픽 (동적으로 업데이트됨)
    this.marshmallowGraphics = this.scene.add.graphics();
    this.marshmallowContainer.add(this.marshmallowGraphics);

    this.container.add(this.marshmallowContainer);

    // 초기 상태 그리기
    this.updateMarshmallow(0, false);
  }

  updateMarshmallow(meltProgress, hasChocolate) {
    const g = this.marshmallowGraphics;
    g.clear();

    // 녹은 정도에 따른 형태 변화
    const meltFactor = meltProgress / 100;
    const baseWidth = 120;
    const baseHeight = 35;

    // 녹을수록 넓어지고 낮아짐
    const width = baseWidth + meltFactor * 30;
    const height = baseHeight - meltFactor * 15;

    // 색상 보간 (흰색 → 크림색)
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(CONFIG.COLORS.marshmallow),
      Phaser.Display.Color.ValueToColor(CONFIG.COLORS.marshmallowMelted),
      100,
      meltProgress
    );
    const colorHex = Phaser.Display.Color.GetColor(color.r, color.g, color.b);

    // 마시멜로우 본체
    g.fillStyle(colorHex, 1);
    g.fillEllipse(0, 0, width, height);

    // 하이라이트
    g.fillStyle(0xFFFFFF, 0.4 - meltFactor * 0.3);
    g.fillEllipse(-width * 0.2, -height * 0.2, width * 0.4, height * 0.3);

    // 초콜릿 코팅
    if (hasChocolate) {
      g.fillStyle(CONFIG.COLORS.chocolate, 0.7);
      g.fillEllipse(0, 5, width * 0.8, height * 0.5);

      // 초콜릿 광택
      g.fillStyle(0x6D4C41, 0.5);
      g.fillEllipse(-width * 0.15, 3, width * 0.25, height * 0.2);
    }
  }

  shake() {
    this.scene.tweens.add({
      targets: this.container,
      x: this.x + Phaser.Math.Between(-5, 5),
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.container.x = this.x;
      }
    });
  }
}

// ============================================
// Flame (불꽃) 이펙트
// ============================================

class FlameEffect {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.particles = [];
    this.heatLevel = 0;
  }

  setHeatLevel(level) {
    this.heatLevel = level;
  }

  update(dt) {
    if (this.heatLevel < 0) return;

    const config = CONFIG.HEAT_LEVELS[this.heatLevel];
    const spawnChance = (0.3 + this.heatLevel * 0.3) * dt * 60;

    if (Math.random() < spawnChance) {
      this._spawnFlame(config);
    }

    // 파티클 업데이트
    this.particles = this.particles.filter(p => {
      p.life -= dt;
      if (p.life <= 0) {
        p.graphic.destroy();
        return false;
      }

      p.y -= p.speed * dt;
      p.x += Math.sin(p.phase) * 0.5;
      p.phase += dt * 10;

      p.graphic.setPosition(p.x, p.y);
      p.graphic.setAlpha(p.life / p.maxLife);
      p.graphic.setScale(0.5 + (1 - p.life / p.maxLife) * 0.5);

      return true;
    });
  }

  _spawnFlame(config) {
    const offsetX = (Math.random() - 0.5) * 100;
    const x = this.x + offsetX;
    const y = this.y;

    const size = 8 + Math.random() * 8 + this.heatLevel * 4;

    const flame = this.scene.add.ellipse(x, y, size, size * 1.5, config.flameColor, 0.8);

    const particle = {
      graphic: flame,
      x, y,
      speed: 40 + Math.random() * 30 + this.heatLevel * 20,
      life: 0.5 + Math.random() * 0.3,
      maxLife: 0.8,
      phase: Math.random() * Math.PI * 2
    };

    this.particles.push(particle);
  }

  destroy() {
    this.particles.forEach(p => p.graphic.destroy());
    this.particles = [];
  }
}

// ============================================
// Bubble (기포) 이펙트
// ============================================

class BubbleEffect {
  static emit(scene, x, y, hasChocolate) {
    const color = hasChocolate ? 0x6D4C41 : 0xFFFFFF;
    const count = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      const bx = x + (Math.random() - 0.5) * 60;
      const size = 4 + Math.random() * 6;

      const bubble = scene.add.circle(bx, y, size, color, 0.6);

      scene.tweens.add({
        targets: bubble,
        y: y - 30 - Math.random() * 20,
        alpha: 0,
        scale: 1.5,
        duration: 400 + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => bubble.destroy()
      });
    }
  }
}

// ============================================
// StickWarning (들러붙음 경고) 이펙트
// ============================================

class StickWarningEffect {
  static emit(scene, x, y) {
    // 연기
    for (let i = 0; i < 4; i++) {
      const smoke = scene.add.circle(
        x + (Math.random() - 0.5) * 50,
        y,
        6 + Math.random() * 8,
        0x5D4037,
        0.5
      );

      scene.tweens.add({
        targets: smoke,
        y: y - 50,
        alpha: 0,
        scale: 2.5,
        duration: 600,
        delay: i * 50,
        onComplete: () => smoke.destroy()
      });
    }

    // 스파크
    for (let i = 0; i < 6; i++) {
      const spark = scene.add.circle(
        x + (Math.random() - 0.5) * 40,
        y + (Math.random() - 0.5) * 20,
        2,
        0xFFD54F
      );

      scene.tweens.add({
        targets: spark,
        x: spark.x + (Math.random() - 0.5) * 30,
        y: spark.y - 20,
        alpha: 0,
        duration: 300,
        delay: i * 30,
        onComplete: () => spark.destroy()
      });
    }
  }
}

// ============================================
// MarshmallowMeltScene (메인 씬)
// ============================================

export class MarshmallowMeltScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MarshmallowMeltScene' });
  }

  init(data) {
    this.onComplete = data?.onComplete || null;

    // 게임 상태
    this.score = 0;
    this.timeLeft = CONFIG.GAME_DURATION;
    this.isPlaying = false;
    this.introActive = false;

    // 녹이기 상태
    this.meltProgress = 0;
    this.heatLevel = 0; // 0: 약불, 1: 중불, 2: 강불
    this.stickGauge = 0;
    this.isStuck = false;
    this.cocoaAdded = false;
    this.stirCount = 0;

    // 이펙트 타이머
    this.bubbleTimer = 0;
    this.sizzleTimer = 0;
  }

  create() {
    // [Fix] Phaser 시간 시스템 강제 초기화
    this.time.paused = false;
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;

    console.log('[MarshmallowMeltScene] 시간 시스템 초기화 완료');

    // [Fix] Scene lifecycle 이벤트 연결
    this.events.on('shutdown', this.shutdown, this);

    // BGM 전환 (미니게임 음악)
    soundManager.switchBGM('minigame');

    this._createBackground();
    this._createPot();
    this._createFlameEffect();
    this._createUI();
    this._createHeatButtons();
    this._createCocoaButton();

    // [Fix] 입력 시스템 안정화 대기
    this.time.delayedCall(100, () => {
      this._showIntro();
    });
  }

  // ========================================
  // 배경 & 오브젝트
  // ========================================

  _createBackground() {
    // 어두운 주방 분위기 그라데이션
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      0x1F2A44, 0x1F2A44,
      CONFIG.COLORS.bg, CONFIG.COLORS.bg, 1
    );
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 벽면 타일 패턴 (상단)
    const wallTileSize = 50;
    for (let y = 140; y < GAME_HEIGHT * 0.5; y += wallTileSize) {
      for (let x = 0; x < GAME_WIDTH; x += wallTileSize) {
        const isLight = ((x / wallTileSize) + (y / wallTileSize)) % 2 === 0;
        this.add.rectangle(x + wallTileSize / 2, y + wallTileSize / 2, wallTileSize - 3, wallTileSize - 3, isLight ? 0x2A3A5A : 0x1F2A44, 0.5);
      }
    }

    // 가스레인지 효과 (냄비 아래)
    const stoveY = GAME_HEIGHT * 0.52;
    const stoveBg = this.add.graphics();
    stoveBg.fillGradientStyle(0x1A1A1A, 0x1A1A1A, 0x2D2D2D, 0x2D2D2D, 1);
    stoveBg.fillRoundedRect(GAME_WIDTH / 2 - 130, stoveY, 260, 80, 8);

    // 가스레인지 테두리
    this.add.rectangle(GAME_WIDTH / 2, stoveY + 40, 260, 80, 0x000000, 0)
      .setStrokeStyle(3, 0x404040);

    // 가스 버너 링 (장식)
    this.add.circle(GAME_WIDTH / 2, stoveY + 40, 60, 0x333333, 0.8)
      .setStrokeStyle(2, 0x555555);
    this.add.circle(GAME_WIDTH / 2, stoveY + 40, 45, 0x222222, 0.8)
      .setStrokeStyle(2, 0x444444);

    // 주방 바닥 타일
    const floorY = GAME_HEIGHT * 0.72;
    for (let y = floorY; y < GAME_HEIGHT; y += 40) {
      for (let x = 0; x < GAME_WIDTH; x += 40) {
        const isLight = ((x / 40) + (y / 40)) % 2 === 0;
        this.add.rectangle(x + 20, y + 20, 38, 38, isLight ? 0x37474F : 0x263238);
        // 타일 하이라이트
        if (isLight) {
          this.add.rectangle(x + 8, y + 20, 2, 30, 0xFFFFFF, 0.05);
        }
      }
    }

    // 조리 장식 아이콘들 (측면)
    const decorIcons = ['🍳', '🥄', '🧂'];
    decorIcons.forEach((icon, i) => {
      this.add.text(30, 180 + i * 60, icon, { fontSize: '20px' })
        .setAlpha(0.15);
    });

    // 오른쪽 장식
    const decorIconsR = ['⏱️', '📋'];
    decorIconsR.forEach((icon, i) => {
      this.add.text(GAME_WIDTH - 50, 200 + i * 50, icon, { fontSize: '18px' })
        .setAlpha(0.15);
    });

    // 부드러운 조명 효과 (상단에서)
    const lightOverlay = this.add.graphics();
    lightOverlay.fillStyle(0xFFCC80, 0.03);
    lightOverlay.fillCircle(GAME_WIDTH / 2, 200, 250);
  }

  _createPot() {
    this.pot = new Pot(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.4);
  }

  _createFlameEffect() {
    this.flameEffect = new FlameEffect(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.55);
  }

  _createUI() {
    // 상단 패널 (따뜻한 주방 느낌)
    const panelBg = this.add.graphics();
    panelBg.fillGradientStyle(0x1A1A2E, 0x1A1A2E, 0x16213E, 0x16213E, 0.95);
    panelBg.fillRect(0, 0, GAME_WIDTH, 140);

    // 패널 하단 장식선 (따뜻한 색상)
    this.add.rectangle(GAME_WIDTH / 2, 138, GAME_WIDTH, 4, 0xFFCC80, 0.5);
    this.add.rectangle(GAME_WIDTH / 2, 140, GAME_WIDTH, 2, 0xFF9800, 0.3);

    // 제목 배경 장식
    this.add.rectangle(GAME_WIDTH / 2, 18, 180, 24, 0xFFCC80, 0.15).setStrokeStyle(1, 0xFFCC80, 0.3);

    // 제목
    this.add.text(GAME_WIDTH / 2, 18, '🔥 마시멜로우 녹이기', {
      fontFamily: FONT_FAMILY,
      fontSize: '15px',
      color: '#FFCC80'
    }).setOrigin(0.5);

    // 점수 영역 배경
    this.add.rectangle(70, 55, 110, 45, 0xFFD700, 0.1).setStrokeStyle(1, 0xFFD700, 0.2);

    // 점수
    this.scoreText = this.add.text(70, 48, '0', {
      fontFamily: FONT_FAMILY,
      fontSize: '28px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(70, 72, 'SCORE', {
      fontFamily: FONT_FAMILY,
      fontSize: '9px',
      color: '#FFCC80'
    }).setOrigin(0.5);

    // 시간 영역 배경
    this.add.rectangle(GAME_WIDTH - 70, 55, 100, 45, 0xFF6B6B, 0.1).setStrokeStyle(1, 0xFF6B6B, 0.2);

    // 시간
    this.timeText = this.add.text(GAME_WIDTH - 70, 48, '45', {
      fontFamily: FONT_FAMILY,
      fontSize: '28px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH - 70, 72, 'TIME', {
      fontFamily: FONT_FAMILY,
      fontSize: '9px',
      color: '#AAAAAA'
    }).setOrigin(0.5);

    // 녹음 진행도 바
    this._createMeltBar();

    // 들러붙음 게이지
    this._createStickGauge();

    // 상태 힌트 (배경 추가)
    this.add.rectangle(GAME_WIDTH / 2, 125, 320, 22, 0x000000, 0.3);
    this.hintText = this.add.text(GAME_WIDTH / 2, 125, '불을 조절해서 마시멜로우를 녹여요!', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#FFFFFF'
    }).setOrigin(0.5);
  }

  _createMeltBar() {
    const barX = GAME_WIDTH / 2;
    const barY = 50;
    const barWidth = 180;
    const barHeight = 16;

    // 배경
    this.add.rectangle(barX, barY, barWidth, barHeight, 0x333333)
      .setStrokeStyle(2, 0x000000);

    // 채우기
    this.meltBarFill = this.add.rectangle(
      barX - barWidth / 2 + 2, barY,
      0, barHeight - 4,
      0xFFCC80
    ).setOrigin(0, 0.5);

    // 적정 구간 마커 (40%-70%)
    const optimalStart = barX - barWidth / 2 + (barWidth * CONFIG.COCOA.OPTIMAL_MIN / 100);
    const optimalEnd = barX - barWidth / 2 + (barWidth * CONFIG.COCOA.OPTIMAL_MAX / 100);
    const optimalWidth = optimalEnd - optimalStart;

    this.add.rectangle(optimalStart + optimalWidth / 2, barY, optimalWidth, barHeight, 0x4CAF50, 0.3);

    // 레이블
    this.add.text(barX, barY, 'MELT', {
      fontFamily: FONT_FAMILY,
      fontSize: '9px',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // 퍼센트 표시
    this.meltPercentText = this.add.text(barX + barWidth / 2 + 10, barY, '0%', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#FFCC80'
    }).setOrigin(0, 0.5);
  }

  _createStickGauge() {
    const gaugeX = GAME_WIDTH / 2;
    const gaugeY = 90;
    const gaugeWidth = 120;
    const gaugeHeight = 12;

    // 배경
    this.stickGaugeBar = this.add.rectangle(gaugeX, gaugeY, gaugeWidth, gaugeHeight, 0x333333)
      .setStrokeStyle(1, 0x000000);

    // 채우기
    this.stickGaugeFill = this.add.rectangle(
      gaugeX - gaugeWidth / 2 + 1, gaugeY,
      0, gaugeHeight - 2,
      0xFF9800
    ).setOrigin(0, 0.5);

    // 레이블
    this.stickLabel = this.add.text(gaugeX - gaugeWidth / 2 - 5, gaugeY, '🔥', {
      fontSize: '12px'
    }).setOrigin(1, 0.5);

    this.add.text(gaugeX, gaugeY, 'STICK', {
      fontFamily: FONT_FAMILY,
      fontSize: '8px',
      color: '#FFFFFF'
    }).setOrigin(0.5);
  }

  _createHeatButtons() {
    const btnY = GAME_HEIGHT - 100;
    const btnWidth = 80;
    const btnHeight = 50;
    const spacing = 95;
    const startX = GAME_WIDTH / 2 - spacing;

    this.heatButtons = [];

    CONFIG.HEAT_LEVELS.forEach((level, i) => {
      const x = startX + i * spacing;

      // 버튼 배경
      const btnBg = this.add.rectangle(x, btnY, btnWidth, btnHeight, level.color, 0.8)
        .setStrokeStyle(3, 0x000000)
        .setInteractive({ useHandCursor: true });

      // 아이콘
      const icon = this.add.text(x, btnY - 8, level.icon, {
        fontSize: '20px'
      }).setOrigin(0.5);

      // 레이블
      const label = this.add.text(x, btnY + 15, level.name, {
        fontFamily: FONT_FAMILY,
        fontSize: '12px',
        color: '#FFFFFF'
      }).setOrigin(0.5);

      // 선택 표시
      const selector = this.add.rectangle(x, btnY, btnWidth + 6, btnHeight + 6, 0xFFFFFF, 0)
        .setStrokeStyle(3, 0xFFFFFF);
      selector.setVisible(i === 0);

      btnBg.on('pointerdown', () => {
        if (!this.isPlaying || this.isStuck) return;
        this._setHeatLevel(i);
        soundManager.playUIClick();
      });

      btnBg.on('pointerover', () => {
        this.tweens.add({
          targets: btnBg,
          scale: 1.1,
          duration: 100
        });
      });

      btnBg.on('pointerout', () => {
        this.tweens.add({
          targets: btnBg,
          scale: 1,
          duration: 100
        });
      });

      this.heatButtons.push({ bg: btnBg, selector });
    });

    // 초기 선택
    this._setHeatLevel(0);
  }

  _createCocoaButton() {
    const btnX = GAME_WIDTH / 2;
    const btnY = GAME_HEIGHT - 160;

    // 코코아 버튼
    this.cocoaBtn = this.add.rectangle(btnX, btnY, 140, 45, 0x5D4037, 0.9)
      .setStrokeStyle(3, 0x3E2723)
      .setInteractive({ useHandCursor: true });

    this.cocoaBtnText = this.add.text(btnX, btnY, '🍫 코코아 투입', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    this.cocoaBtn.on('pointerdown', () => {
      if (!this.isPlaying || this.isStuck || this.cocoaAdded) return;
      this._addCocoa();
    });

    this.cocoaBtn.on('pointerover', () => {
      if (!this.cocoaAdded) {
        this.tweens.add({
          targets: this.cocoaBtn,
          scale: 1.1,
          duration: 100
        });
      }
    });

    this.cocoaBtn.on('pointerout', () => {
      this.tweens.add({
        targets: this.cocoaBtn,
        scale: 1,
        duration: 100
      });
    });
  }

  _setHeatLevel(level) {
    this.heatLevel = level;

    // 선택 표시 업데이트
    this.heatButtons.forEach((btn, i) => {
      btn.selector.setVisible(i === level);
    });

    // 불꽃 이펙트 업데이트
    this.flameEffect.setHeatLevel(level);

    // 힌트 업데이트
    const levelConfig = CONFIG.HEAT_LEVELS[level];
    this.hintText.setText(`${levelConfig.icon} ${levelConfig.name}: 녹음 ${levelConfig.meltRate}x, 위험 ${levelConfig.stickRate}x`);
  }

  _addCocoa() {
    this.cocoaAdded = true;

    // 버튼 비활성화
    this.cocoaBtn.setFillStyle(0x424242);
    this.cocoaBtnText.setText('✓ 투입 완료');

    // 보너스 계산
    let bonus = 0;
    let message = '';

    if (this.meltProgress >= CONFIG.COCOA.OPTIMAL_MIN && this.meltProgress <= CONFIG.COCOA.OPTIMAL_MAX) {
      bonus = CONFIG.COCOA.PERFECT_BONUS;
      message = '🎯 퍼펙트 타이밍!';
      this._showPerfectEffect();
    } else if (this.meltProgress < CONFIG.COCOA.OPTIMAL_MIN) {
      bonus = -CONFIG.COCOA.EARLY_PENALTY;
      message = '⚠️ 너무 빨라요!';
    } else {
      bonus = -CONFIG.COCOA.LATE_PENALTY;
      message = '⚠️ 너무 늦었어요!';
    }

    this.score += bonus;
    this.scoreText.setText(Math.max(0, this.score).toString());

    // 메시지 표시
    const popup = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, message, {
      fontFamily: FONT_FAMILY,
      fontSize: '22px',
      color: bonus > 0 ? '#4CAF50' : '#FF5252',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup,
      y: popup.y - 50,
      alpha: 0,
      scale: 1.3,
      duration: 800,
      onComplete: () => popup.destroy()
    });

    // 냄비 업데이트
    this.pot.updateMarshmallow(this.meltProgress, true);

    // 초콜릿 투입 이펙트
    this._cocoaPourEffect();

    soundManager.playCocoaPour();
  }

  _cocoaPourEffect() {
    // 초콜릿 파우더 낙하
    for (let i = 0; i < 15; i++) {
      const x = GAME_WIDTH / 2 + (Math.random() - 0.5) * 60;
      const particle = this.add.circle(x, GAME_HEIGHT * 0.2, 3, 0x5D4037);

      this.tweens.add({
        targets: particle,
        y: GAME_HEIGHT * 0.38,
        alpha: 0,
        duration: 500 + Math.random() * 300,
        delay: i * 30,
        ease: 'Quad.easeIn',
        onComplete: () => particle.destroy()
      });
    }
  }

  _showPerfectEffect() {
    // 링 이펙트
    const ring = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT * 0.4, 20, 0x4CAF50, 0);
    ring.setStrokeStyle(4, 0x4CAF50);

    this.tweens.add({
      targets: ring,
      scale: 4,
      alpha: 0,
      duration: 500,
      onComplete: () => ring.destroy()
    });

    // 스파클
    for (let i = 0; i < 8; i++) {
      const sparkle = this.add.text(
        GAME_WIDTH / 2 + (Math.random() - 0.5) * 80,
        GAME_HEIGHT * 0.4 + (Math.random() - 0.5) * 40,
        '✨',
        { fontSize: '16px' }
      ).setOrigin(0.5);

      this.tweens.add({
        targets: sparkle,
        y: sparkle.y - 40,
        alpha: 0,
        scale: 0.5,
        duration: 500,
        delay: i * 50,
        onComplete: () => sparkle.destroy()
      });
    }

    this.cameras.main.flash(200, 76, 175, 80, true);
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

    const icon = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, '🍫', {
      fontSize: '64px'
    }).setOrigin(0.5).setDepth(101);
    this._introElements.push(icon);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, '마시멜로우 녹이기', {
      fontFamily: FONT_FAMILY,
      fontSize: '26px',
      color: '#FFCC80'
    }).setOrigin(0.5).setDepth(101);
    this._introElements.push(title);

    const desc = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40,
      '불 조절로 마시멜로우를 녹여라!\n🎯 40%~70%에 코코아 투입 시 보너스', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
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
    this.meltProgress = 0;
    this.stickGauge = 0;
    this.isStuck = false;
    this.cocoaAdded = false;

    // 타이머
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--;
        this.timeText.setText(this.timeLeft.toString());

        if (this.timeLeft <= 10) {
          this.timeText.setColor('#FF6B6B');
        }

        if (this.timeLeft <= 0) {
          this._endGame();
        }
      },
      repeat: CONFIG.GAME_DURATION - 1
    });

    // 들러붙음 상태에서 터치 처리
    this.input.on('pointerdown', this._onTap, this);
  }

  _onTap(pointer) {
    if (!this.isPlaying) return;

    // 들러붙음 상태일 때만 연타 처리
    if (this.isStuck) {
      this.stirCount++;
      this.stickGauge -= CONFIG.STICK.RESOLVE_PER_TAP;

      // 이펙트
      const popup = this.add.text(pointer.x, pointer.y, '💨', {
        fontSize: '24px'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: popup,
        y: pointer.y - 30,
        alpha: 0,
        duration: 300,
        onComplete: () => popup.destroy()
      });

      soundManager.playTap();

      // 해소 완료
      if (this.stickGauge <= 0) {
        this.stickGauge = 0;
        this.isStuck = false;
        this.hintText.setText('👍 들러붙음 해소! 계속 녹여요!');
        this.hintText.setColor('#4CAF50');

        this.time.delayedCall(1500, () => {
          if (this.isPlaying) {
            this.hintText.setColor('#FFFFFF');
            this._setHeatLevel(this.heatLevel);
          }
        });
      }
    }
  }

  _endGame() {
    this.isPlaying = false;

    if (this.gameTimer) this.gameTimer.remove();
    this.input.off('pointerdown', this._onTap, this);

    // 코코아 미투입 페널티
    if (!this.cocoaAdded) {
      this.score -= CONFIG.COCOA.MISS_PENALTY;
    }

    // 완성도 보너스
    this.score += Math.floor(this.meltProgress * 0.5);

    this.score = Math.max(0, this.score);

    soundManager.playSuccess();
    this.cameras.main.flash(300, 255, 204, 128, true);

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
      color: '#FFCC80'
    }).setOrigin(0.5).setScale(0);

    const scoreValue = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, this.score.toString(), {
      fontFamily: FONT_FAMILY,
      fontSize: '48px',
      color: '#FFFFFF'
    }).setOrigin(0.5).setAlpha(0);

    const meltLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70,
      `녹음: ${Math.floor(this.meltProgress)}%`, {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#FFCC80'
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
      targets: [scoreValue, meltLabel],
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
        this.onComplete(this.score, Math.floor(this.meltProgress));
      }

      // 4. 딜레이 후 미니게임 Scene stop
      this.time.delayedCall(50, () => {
        this.scene.stop();
      });
    });
  }

  // ========================================
  // UI 업데이트
  // ========================================

  _updateUI() {
    // 녹음 바
    const barWidth = 180 - 4;
    this.meltBarFill.width = (this.meltProgress / CONFIG.MELT_TARGET) * barWidth;
    this.meltPercentText.setText(`${Math.floor(this.meltProgress)}%`);

    // 들러붙음 게이지
    const stickWidth = 120 - 2;
    this.stickGaugeFill.width = (this.stickGauge / CONFIG.STICK.THRESHOLD) * stickWidth;

    // 들러붙음 경고 색상
    if (this.stickGauge >= CONFIG.STICK.WARNING_THRESHOLD) {
      this.stickGaugeFill.setFillStyle(CONFIG.COLORS.stickWarning);
      this.stickLabel.setText('⚠️');
    } else {
      this.stickGaugeFill.setFillStyle(0xFF9800);
      this.stickLabel.setText('🔥');
    }
  }

  // ========================================
  // 메인 업데이트
  // ========================================

  update(time, delta) {
    if (!this.isPlaying) return;

    const dt = delta / 1000;

    // 불꽃 이펙트 업데이트
    this.flameEffect.update(dt);

    // 들러붙음 상태일 때는 진행 중단
    if (this.isStuck) {
      // 경고 이펙트
      if (Math.random() < dt * 3) {
        StickWarningEffect.emit(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.35);
      }
      this._updateUI();
      return;
    }

    const heatConfig = CONFIG.HEAT_LEVELS[this.heatLevel];

    // 녹음 진행
    if (this.meltProgress < CONFIG.MELT_TARGET) {
      const prevProgress = this.meltProgress;
      this.meltProgress = Math.min(CONFIG.MELT_TARGET, this.meltProgress + heatConfig.meltRate * dt);

      // 점수 증가
      const progressDelta = this.meltProgress - prevProgress;
      this.score += progressDelta * 0.8;
      this.scoreText.setText(Math.floor(this.score).toString());

      // 버블 이펙트
      this.bubbleTimer += dt;
      if (this.bubbleTimer >= (0.5 - heatConfig.bubbleRate * 0.3)) {
        this.bubbleTimer = 0;
        BubbleEffect.emit(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.35, this.cocoaAdded);
        soundManager.playBubble();
      }

      // 지글 사운드 (불 세기에 따라)
      this.sizzleTimer += dt;
      const sizzleInterval = 0.6 - this.heatLevel * 0.15;
      if (this.sizzleTimer >= sizzleInterval) {
        this.sizzleTimer = 0;
        soundManager.playSizzle(this.heatLevel / 2);
      }

      // 마시멜로우 업데이트
      this.pot.updateMarshmallow(this.meltProgress, this.cocoaAdded);
    }

    // 들러붙음 게이지 증가
    this.stickGauge += heatConfig.stickRate * dt;

    // 들러붙음 경고
    if (this.stickGauge >= CONFIG.STICK.WARNING_THRESHOLD && this.stickGauge < CONFIG.STICK.THRESHOLD) {
      if (Math.random() < dt * 2) {
        this.pot.shake();
        soundManager.playStick();
      }
    }

    // 들러붙음 발생!
    if (this.stickGauge >= CONFIG.STICK.THRESHOLD) {
      this.stickGauge = CONFIG.STICK.THRESHOLD;
      this.isStuck = true;
      this.score = Math.max(0, this.score - CONFIG.STICK.PENALTY_SCORE);
      this.scoreText.setText(Math.floor(this.score).toString());

      this.hintText.setText('⚠️ 들러붙음! 연타로 해소하세요!');
      this.hintText.setColor('#FF5252');

      this.cameras.main.shake(200, 0.02);
      this.cameras.main.flash(200, 255, 82, 82, true);

      StickWarningEffect.emit(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.35);

      soundManager.playBuzzer();
    }

    // 100% 완료 체크
    if (this.meltProgress >= CONFIG.MELT_TARGET && this.timeLeft > 0) {
      // 남은 시간 보너스
      this.score += this.timeLeft * 2;
      this._endGame();
    }

    this._updateUI();
  }

  // ========================================
  // 정리
  // ========================================

  shutdown() {
    // [Fix] 이벤트 리스너 정리
    this.events.off('shutdown', this.shutdown, this);

    if (this.gameTimer) {
      this.gameTimer.remove();
      this.gameTimer = null;
    }

    if (this.flameEffect) {
      this.flameEffect.destroy();
    }

    this.input.off('pointerdown', this._onTap, this);
    this.input.off('pointerup');
  }
}
