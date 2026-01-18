/**
 * KadaifSliceScene - 카다이프 썰기 미니게임 (고품질 버전)
 * Fruit Ninja 스타일 스와이프 게임
 *
 * Features:
 * - 물리 기반 포물선 궤적
 * - 잘린 조각 분리 애니메이션
 * - 웨이브 스폰 시스템
 * - 콤보 + 슬로우모션 연출
 * - 상세한 면발 비주얼
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, FONTS, TYPOGRAPHY } from '../../config/GameConfig.js';
import { soundManager } from '../../../core/SoundManager.js';

// ============================================
// 카다이프 텍스처 생성 함수 (Bird's Nest Style)
// ============================================

/**
 * 실타래 질감의 카다이프 텍스처 생성
 * @param {Phaser.Scene} scene - Phaser Scene
 * @param {string} key - 텍스처 키
 * @param {number} size - 텍스처 크기
 * @param {string} type - 'normal' | 'golden' | 'premium' | 'super'
 */
function generateKadayifTexture(scene, key, size, type = 'normal') {
  const radius = size / 2;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // 색상 팔레트 (Crispy Golden Brown)
  const COLORS = {
    normal: {
      base: 0xE8D8A0,    // 생면 색
      mid: 0xD4A017,     // 노릇하게 튀겨진 색
      shadow: 0x8B4513   // 바삭하게 탄 부분
    },
    golden: {
      base: 0xFFE135,
      mid: 0xFFD700,
      shadow: 0xB8860B
    },
    premium: {
      base: 0xF5DEB3,
      mid: 0xDEB887,
      shadow: 0xA0522D
    },
    super: {
      base: 0xE6E6FA,
      mid: 0xDDA0DD,
      shadow: 0x8B668B
    }
  };

  const palette = COLORS[type] || COLORS.normal;
  const cx = size / 2;
  const cy = size / 2;

  // ========================================
  // Layer 1: Base 색상 면발 (가장 아래)
  // ========================================
  g.lineStyle(3, palette.base, 0.9);
  for (let i = 0; i < 40; i++) {
    drawRandomNoodle(g, cx, cy, radius * 0.9, palette.base, 3, 0.9);
  }

  // ========================================
  // Layer 2: Mid 색상 면발 (중간)
  // ========================================
  g.lineStyle(2.5, palette.mid, 0.85);
  for (let i = 0; i < 35; i++) {
    drawRandomNoodle(g, cx, cy, radius * 0.85, palette.mid, 2.5, 0.85);
  }

  // ========================================
  // Layer 3: Shadow 색상 면발 (맨 위, 바삭한 부분)
  // ========================================
  g.lineStyle(2, palette.shadow, 0.6);
  for (let i = 0; i < 20; i++) {
    drawRandomNoodle(g, cx, cy, radius * 0.75, palette.shadow, 2, 0.6);
  }

  // ========================================
  // 가장자리 울퉁불퉁한 면발 튀어나옴
  // ========================================
  g.lineStyle(2, palette.mid, 0.8);
  for (let i = 0; i < 25; i++) {
    const angle = Math.random() * Math.PI * 2;
    const innerR = radius * 0.7;
    const outerR = radius + Phaser.Math.Between(-5, 15); // 울퉁불퉁

    const x1 = cx + Math.cos(angle) * innerR;
    const y1 = cy + Math.sin(angle) * innerR;
    const x2 = cx + Math.cos(angle + Phaser.Math.FloatBetween(-0.3, 0.3)) * outerR;
    const y2 = cy + Math.sin(angle + Phaser.Math.FloatBetween(-0.3, 0.3)) * outerR;

    g.lineStyle(Phaser.Math.Between(1, 3), palette.mid, Phaser.Math.FloatBetween(0.5, 0.9));
    g.lineBetween(x1, y1, x2, y2);
  }

  // 텍스처로 변환
  g.generateTexture(key, size, size);
  g.destroy();
}

/**
 * 랜덤한 곡선 면발 하나 그리기
 */
function drawRandomNoodle(g, cx, cy, maxRadius, color, thickness, alpha) {
  g.lineStyle(thickness, color, alpha);

  // 시작점: 원 내부 랜덤
  const startAngle = Math.random() * Math.PI * 2;
  const startR = Phaser.Math.FloatBetween(0.1, 0.8) * maxRadius;
  const startX = cx + Math.cos(startAngle) * startR;
  const startY = cy + Math.sin(startAngle) * startR;

  // 끝점: 다른 랜덤 위치
  const endAngle = startAngle + Phaser.Math.FloatBetween(-2, 2);
  const endR = Phaser.Math.FloatBetween(0.2, 1.0) * maxRadius;
  const endX = cx + Math.cos(endAngle) * endR;
  const endY = cy + Math.sin(endAngle) * endR;

  // 제어점 (곡선용)
  const ctrlAngle = (startAngle + endAngle) / 2 + Phaser.Math.FloatBetween(-0.5, 0.5);
  const ctrlR = Phaser.Math.FloatBetween(0.3, 0.9) * maxRadius;
  const ctrlX = cx + Math.cos(ctrlAngle) * ctrlR;
  const ctrlY = cy + Math.sin(ctrlAngle) * ctrlR;

  // 곡선 또는 직선 랜덤 선택
  if (Math.random() > 0.3) {
    // 베지어 곡선 (더 자연스러운 면발)
    g.beginPath();
    g.moveTo(startX, startY);

    // Quadratic curve
    const steps = 10;
    for (let t = 0; t <= 1; t += 1 / steps) {
      const xt = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * ctrlX + t * t * endX;
      const yt = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * ctrlY + t * t * endY;
      g.lineTo(xt, yt);
    }
    g.strokePath();
  } else {
    // 직선
    g.lineBetween(startX, startY, endX, endY);
  }
}

// ============================================
// 상수 설정
// ============================================

const CONFIG = {
  // 게임 설정
  GAME_DURATION: 30,
  COMBO_TIMEOUT: 1000,

  // 물리
  PHYSICS: {
    GRAVITY: 850,
    MIN_VY: -950,
    MAX_VY: -750,
    MAX_VX: 180,
    SPAWN_MARGIN: 0.15,
    APEX_MIN: 0.25,
    APEX_MAX: 0.45
  },

  // 스폰
  SPAWN: {
    BASE_RATE: 0.4,        // 초당 스폰 확률
    WAVE_CHANCE: 0.15,     // 웨이브 스폰 확률
    WAVE_COUNT_MIN: 3,
    WAVE_COUNT_MAX: 5,
    WAVE_DELAY: 80         // 웨이브 내 개별 딜레이
  },

  // 카다이프 타입별 설정
  TYPES: {
    normal:  { chance: 0.80, points: 10, color: 0xC9A86C, highlight: 0xE8D4A8 },
    premium: { chance: 0.08, points: 15, color: 0xD4B896, highlight: 0xF0E6D2 },
    golden:  { chance: 0.07, points: 20, color: 0xFFD700, highlight: 0xFFE135 },
    super:   { chance: 0.05, points: 30, color: 0x9B59B6, highlight: 0xBB8FCE }
  },

  // 비주얼
  COLORS: {
    bg: 0x2C1810,
    bgGradientTop: 0x3D2317,
    trail: 0xFFFFFF,
    trailGlow: 0xFFE4B5,
    comboText: 0xFF6B6B,
    perfectText: 0xFFD700
  },

  // 사이즈 (더 크게)
  SIZE: {
    MIN: 70,
    MAX: 100,
    SLICE_PIECE_SCALE: 0.55
  }
};

// ============================================
// Kadaif Prefab (카다이프 오브젝트)
// ============================================

// Kadaif 클래스 - 스프라이트 기반 (미리 생성된 텍스처 사용)
class Kadaif {
  constructor(scene, x, y, config) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.vx = config.vx || 0;
    this.vy = config.vy || 0;
    this.size = config.size || 80;
    this.type = config.type || 'normal';
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = config.rotSpeed || 2;
    this.sliced = false;

    // 타입별 설정
    const typeConfig = CONFIG.TYPES[this.type];
    this.points = typeConfig.points;

    // 텍스처 키
    const textureKey = `kadaif_${this.type}`;

    // 스프라이트 생성
    this.sprite = scene.add.sprite(x, y, textureKey);
    this.sprite.setDepth(200);
    this.sprite.setScale(this.size / 100); // 텍스처는 100px 기준

    // 그림자 (별도 스프라이트)
    this.shadow = scene.add.sprite(x + 5, y + 5, textureKey);
    this.shadow.setDepth(199);
    this.shadow.setScale(this.size / 100);
    this.shadow.setTint(0x000000);
    this.shadow.setAlpha(0.3);
  }

  update(dt) {
    if (this.sliced || !this.sprite) return false;

    // 위치 업데이트
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 중력 적용
    this.vy += CONFIG.PHYSICS.GRAVITY * dt;

    // 회전
    this.rotation += this.rotSpeed * dt;

    // 스프라이트 동기화
    this.sprite.setPosition(this.x, this.y);
    this.sprite.setRotation(this.rotation);

    // 그림자 동기화
    this.shadow.setPosition(this.x + 5, this.y + 5);
    this.shadow.setRotation(this.rotation);

    // 화면 밖 체크
    if (this.y > 1400 || this.x < -100 || this.x > 820) {
      this.destroy();
      return false;
    }

    return true;
  }

  slice(sliceAngle) {
    if (this.sliced) return null;
    this.sliced = true;

    // 숨기기
    if (this.sprite) this.sprite.setVisible(false);
    if (this.shadow) this.shadow.setVisible(false);

    return {
      pieces: [],
      points: this.points,
      type: this.type,
      x: this.x,
      y: this.y
    };
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    if (this.shadow) {
      this.shadow.destroy();
      this.shadow = null;
    }
  }
}

// ============================================
// SlicedPiece (잘린 조각)
// ============================================

class SlicedPiece {
  constructor(scene, config) {
    this.scene = scene;
    this.x = config.x;
    this.y = config.y;
    this.vx = config.vx;
    this.vy = config.vy;
    this.size = config.size;
    this.rotation = config.rotation;
    this.rotSpeed = config.rotSpeed;
    this.type = config.type;
    this.half = config.half; // 0: 왼쪽, 1: 오른쪽
    this.alpha = 1;

    this._createVisual();
  }

  _createVisual() {
    const typeConfig = CONFIG.TYPES[this.type];
    const g = this.scene.add.graphics();
    const s = this.size;

    // 반쪽 조각 그리기
    g.fillStyle(typeConfig.color, 1);

    g.beginPath();
    if (this.half === 0) {
      // 왼쪽 반쪽
      g.arc(0, 0, s * 0.5, Math.PI * 0.5, Math.PI * 1.5, false);
    } else {
      // 오른쪽 반쪽
      g.arc(0, 0, s * 0.5, -Math.PI * 0.5, Math.PI * 0.5, false);
    }
    g.closePath();
    g.fillPath();

    // 단면 (잘린 면)
    g.fillStyle(typeConfig.highlight, 0.8);
    g.fillRect(-2, -s * 0.4, 4, s * 0.8);

    // 면발 텍스처
    g.lineStyle(1, 0x8B6914, 0.5);
    for (let i = 0; i < 4; i++) {
      const angle = (this.half === 0 ? Math.PI : 0) + (i / 4 - 0.5) * Math.PI * 0.8;
      const r = s * 0.35;
      g.lineBetween(0, 0, Math.cos(angle) * r, Math.sin(angle) * r * 0.75);
    }

    this.graphics = g;
    this.graphics.setPosition(this.x, this.y);
    this.graphics.setRotation(this.rotation);
  }

  update(dt) {
    // 물리 업데이트
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += CONFIG.PHYSICS.GRAVITY * 1.3 * dt; // 조각은 더 빨리 떨어짐
    this.rotation += this.rotSpeed * dt;

    // 페이드 아웃
    this.alpha -= dt * 1.5;

    // 그래픽 동기화
    this.graphics.setPosition(this.x, this.y);
    this.graphics.setRotation(this.rotation);
    this.graphics.setAlpha(this.alpha);

    // 생존 체크
    if (this.alpha <= 0 || this.y > GAME_HEIGHT + 50) {
      this.destroy();
      return false;
    }

    return true;
  }

  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }
  }
}

// ============================================
// KadaifSliceScene (메인 씬)
// ============================================

export class KadaifSliceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'KadaifSliceScene' });
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

    // 오브젝트 풀
    this.kadaifs = [];
    this.slicedPieces = [];
    this.trailPoints = [];

    // 스폰 타이머
    this.spawnAccumulator = 0;

    // 슬로우모션
    this.timeScale = 1;

    // 입력 상태
    this.isDragging = false;
  }

  create() {
    console.log('[KadaifSliceScene] create() 시작');

    // [Fix] Scene lifecycle 이벤트 연결
    this.events.on('shutdown', this.shutdown, this);

    // ========================================
    // 카다이프 텍스처 미리 생성 (Bird's Nest Style)
    // ========================================
    if (!this.textures.exists('kadaif_normal')) {
      generateKadayifTexture(this, 'kadaif_normal', 100, 'normal');
    }
    if (!this.textures.exists('kadaif_golden')) {
      generateKadayifTexture(this, 'kadaif_golden', 100, 'golden');
    }
    if (!this.textures.exists('kadaif_premium')) {
      generateKadayifTexture(this, 'kadaif_premium', 100, 'premium');
    }
    if (!this.textures.exists('kadaif_super')) {
      generateKadayifTexture(this, 'kadaif_super', 100, 'super');
    }
    console.log('[KadaifSliceScene] 카다이프 텍스처 생성 완료');

    // BGM 전환 (미니게임 음악)
    soundManager.switchBGM('minigame');

    this._createBackground();
    this._createTrailGraphics();
    this._createUI();
    this._setupInput();


    // [CRITICAL FIX] Phaser time 시스템 우회 - JavaScript setTimeout 사용
    // Phaser의 this.time.delayedCall이 작동하지 않는 문제 해결
    setTimeout(() => {
      console.log('[KadaifSliceScene] setTimeout -> _forceStartGame 호출');
      this._forceStartGame();
    }, 300);

    console.log('[KadaifSliceScene] create() 완료');
  }

  // [NEW] 강제 게임 시작 - 모든 조건 무시하고 즉시 시작
  _forceStartGame() {
    console.log('[KadaifSliceScene] _forceStartGame() 실행');

    // 이미 플레이 중이면 무시
    if (this.isPlaying) {
      console.log('[KadaifSliceScene] 이미 플레이 중 - 무시');
      return;
    }

    // [FORCED] 게임 상태 강제 설정
    this.isPlaying = true;
    this.score = 0;
    this.timeLeft = CONFIG.GAME_DURATION;
    this.combo = 0;
    this.maxCombo = 0;
    this.spawnAccumulator = 0;
    this.timeScale = 1;

    console.log('[KadaifSliceScene] isPlaying =', this.isPlaying);

    // UI 초기화
    if (this.timeText) {
      this.timeText.setText(this.timeLeft.toString());
      this.timeText.setColor('#FFFFFF');
    }
    if (this.scoreText) {
      this.scoreText.setText('0');
    }


    // [FORCED] 첫 카다이프 즉시 스폰 (하단에서 위로)
    console.log('[KadaifSliceScene] 첫 카다이프 스폰 시도');
    try {
      this._spawnKadaif();
      console.log('[KadaifSliceScene] 첫 스폰 성공, kadaifs:', this.kadaifs.length);
    } catch (e) {
      console.error('[KadaifSliceScene] 첫 스폰 실패:', e);
    }

    // [CRITICAL FIX] JavaScript setInterval로 게임 타이머 강제 실행
    // Phaser의 this.time.addEvent 대신 사용
    this._jsGameTimer = setInterval(() => {
      if (!this.isPlaying) {
        clearInterval(this._jsGameTimer);
        return;
      }

      this.timeLeft--;
      console.log('[KadaifSliceScene] 타이머 틱 - timeLeft:', this.timeLeft);

      if (this.timeText) {
        this.timeText.setText(this.timeLeft.toString());
      }

      // 시간 부족 경고
      if (this.timeLeft <= 5 && this.timeText) {
        this.timeText.setColor('#FF6B6B');
        try { this.cameras.main.shake(50, 0.003); } catch(e) {}
      }

      if (this.timeLeft <= 0) {
        this._endGame();
      }
    }, 1000);

    // [CRITICAL FIX] JavaScript setInterval로 스폰 루프 강제 실행
    // update()가 호출되지 않는 문제 우회
    this._jsSpawnTimer = setInterval(() => {
      if (!this.isPlaying) {
        clearInterval(this._jsSpawnTimer);
        return;
      }

      // 스폰 (0.4초마다)
      if (Math.random() < CONFIG.SPAWN.WAVE_CHANCE) {
        this._spawnWave();
      } else {
        this._spawnKadaif();
      }
    }, 400);

    // [CRITICAL FIX] JavaScript requestAnimationFrame으로 게임 루프 강제 실행
    this._lastFrameTime = performance.now();
    this._runGameLoop();

    console.log('[KadaifSliceScene] 게임 시작 완료 - 모든 타이머 활성화');
  }

  // [NEW] JavaScript 기반 게임 루프
  _runGameLoop() {
    if (!this.isPlaying) return;

    const now = performance.now();
    const delta = now - this._lastFrameTime;
    this._lastFrameTime = now;

    const dt = (delta / 1000) * this.timeScale;

    // 카다이프 업데이트
    if (this.kadaifs && this.kadaifs.length > 0) {
      this.kadaifs = this.kadaifs.filter(k => {
        try {
          return k.update(dt);
        } catch(e) {
          return false;
        }
      });
    }

    // 잘린 조각 업데이트
    if (this.slicedPieces && this.slicedPieces.length > 0) {
      this.slicedPieces = this.slicedPieces.filter(p => {
        try {
          return p.update(dt);
        } catch(e) {
          return false;
        }
      });
    }

    // 트레일 페이드
    const nowMs = Date.now();
    if (this.trailPoints) {
      this.trailPoints = this.trailPoints.filter(p => nowMs - p.time < 100);
    }

    // 트레일 그리기
    try {
      this._drawTrail();
    } catch(e) {}

    // 다음 프레임 예약
    this._animFrameId = requestAnimationFrame(() => this._runGameLoop());
  }

  // ========================================
  // 배경 & UI
  // ========================================

  _createBackground() {
    // 그라데이션 배경 (더 풍부하게)
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      CONFIG.COLORS.bgGradientTop, CONFIG.COLORS.bgGradientTop,
      CONFIG.COLORS.bg, CONFIG.COLORS.bg, 1
    );
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 도마 느낌의 나무 텍스처 (하단)
    const boardY = GAME_HEIGHT * 0.7;
    const boardGradient = this.add.graphics();
    boardGradient.fillGradientStyle(0x8B7355, 0x8B7355, 0x5D4E37, 0x5D4E37, 1);
    boardGradient.fillRect(0, boardY, GAME_WIDTH, GAME_HEIGHT - boardY);

    // 나무 결 패턴
    for (let i = 0; i < 8; i++) {
      const y = boardY + 30 + i * 40;
      this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 40, 2, 0x4A3728, 0.3);
    }

    // 테두리 장식
    this.add.rectangle(GAME_WIDTH / 2, boardY + 5, GAME_WIDTH - 20, 8, 0x6B5344, 0.5);

    // 상단 장식 - 카다이프 아이콘들
    const decorY = 120;
    for (let i = 0; i < 3; i++) {
      const x = 80 + i * (GAME_WIDTH - 160) / 2;
      this.add.text(x, decorY, '🥖', { fontSize: '20px' })
        .setOrigin(0.5)
        .setAlpha(0.2);
    }

    // 반짝이는 별 패턴 (부드럽게)
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = 130 + Math.random() * (boardY - 150);
      const size = 2 + Math.random() * 3;
      const star = this.add.circle(x, y, size, 0xFFE4B5, 0.08);

      // 반짝임 애니메이션
      this.tweens.add({
        targets: star,
        alpha: { from: 0.03, to: 0.12 },
        duration: 1500 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 1000
      });
    }

    // 빛 줄기 효과 (상단에서 내려오는)
    for (let i = 0; i < 3; i++) {
      const x = 150 + i * 200;
      const light = this.add.graphics();
      light.fillStyle(0xFFFFFF, 0.03);
      light.beginPath();
      light.moveTo(x - 30, 100);
      light.lineTo(x + 30, 100);
      light.lineTo(x + 80, boardY);
      light.lineTo(x - 80, boardY);
      light.closePath();
      light.fillPath();
    }
  }

  _createTrailGraphics() {
    this.trailGraphics = this.add.graphics();
    this.trailGlowGraphics = this.add.graphics();
  }

  _createUI() {
    // 상단 UI 패널 (Premium Style)
    const panelHeight = 110;

    // 패널 그라데이션 배경
    const panelBg = this.add.graphics();
    panelBg.fillGradientStyle(0x1A1510, 0x1A1510, 0x2C1810, 0x2C1810, 0.97);
    panelBg.fillRect(0, 0, GAME_WIDTH, panelHeight);

    // 패널 하단 장식선 (더 세련되게)
    this.add.rectangle(GAME_WIDTH / 2, panelHeight - 3, GAME_WIDTH, 6, 0xD4A574, 0.7);
    this.add.rectangle(GAME_WIDTH / 2, panelHeight, GAME_WIDTH, 2, 0xFFE4B5, 0.3);

    // 제목 배경 장식 (더 고급스럽게)
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0xD4A574, 0.15);
    titleBg.fillRoundedRect(GAME_WIDTH / 2 - 100, 8, 200, 32, 8);
    titleBg.lineStyle(2, 0xD4A574, 0.4);
    titleBg.strokeRoundedRect(GAME_WIDTH / 2 - 100, 8, 200, 32, 8);

    // 제목 (Premium Typography)
    this.add.text(GAME_WIDTH / 2, 24, '🗡️ 카다이프 썰기', {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: '#FFE4B5',
      stroke: '#2C1810',
      strokeThickness: 2,
      letterSpacing: 2
    }).setOrigin(0.5);

    // 점수 영역 배경 (더 세련된 카드 스타일)
    const scoreBg = this.add.graphics();
    scoreBg.fillStyle(0xFFD700, 0.08);
    scoreBg.fillRoundedRect(20, 45, 130, 55, 10);
    scoreBg.lineStyle(2, 0xFFD700, 0.3);
    scoreBg.strokeRoundedRect(20, 45, 130, 55, 10);

    // 점수 (Premium Score Style)
    this.scoreText = this.add.text(85, 62, '0', {
      fontFamily: FONT_FAMILY,
      fontSize: '36px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 5,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
    }).setOrigin(0.5, 0.5);

    this.add.text(85, 90, 'SCORE', {
      fontFamily: FONT_FAMILY,
      fontSize: '11px',
      color: '#C9A86C',
      letterSpacing: 3
    }).setOrigin(0.5);

    // 시간 영역 배경
    const timeBg = this.add.graphics();
    timeBg.fillStyle(0xFF6B6B, 0.08);
    timeBg.fillRoundedRect(GAME_WIDTH - 150, 45, 130, 55, 10);
    timeBg.lineStyle(2, 0xFF6B6B, 0.3);
    timeBg.strokeRoundedRect(GAME_WIDTH - 150, 45, 130, 55, 10);

    // 시간 (Premium Time Style)
    this.timeText = this.add.text(GAME_WIDTH - 85, 62, '30', {
      fontFamily: FONT_FAMILY,
      fontSize: '36px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 5,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
    }).setOrigin(0.5, 0.5);

    this.add.text(GAME_WIDTH - 85, 90, 'TIME', {
      fontFamily: FONT_FAMILY,
      fontSize: '11px',
      color: '#AAAAAA',
      letterSpacing: 3
    }).setOrigin(0.5);

    // 콤보 (중앙) - Premium Combo Style
    this.comboText = this.add.text(GAME_WIDTH / 2, 70, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '28px',
      color: '#FF6B6B',
      stroke: '#2C1810',
      strokeThickness: 5,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
    }).setOrigin(0.5).setAlpha(0);
  }

  _setupInput() {
    // 드래그 상태 추적
    this.isDragging = false;

    // 터치/마우스 다운 시작
    this.input.on('pointerdown', (pointer) => {
      this.isDragging = true;
      this.trailPoints = [{
        x: pointer.x,
        y: pointer.y,
        time: Date.now()
      }];

      // 터치 시작 시에도 슬라이스 체크
      this._checkSlice(pointer.x, pointer.y);
    });

    // 드래그 중 슬라이스 체크
    this.input.on('pointermove', (pointer) => {
      if (!this.isDragging) return;

      this.trailPoints.push({
        x: pointer.x,
        y: pointer.y,
        time: Date.now()
      });

      this._checkSlice(pointer.x, pointer.y);
    });

    // 터치/마우스 업 종료
    this.input.on('pointerup', () => {
      this.isDragging = false;
      this.trailPoints = [];
    });
  }

  // ========================================
  // 인트로 & 아웃트로
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

    const icon = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, '🥖', {
      fontSize: '64px'
    }).setOrigin(0.5).setDepth(101);
    this._introElements.push(icon);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '카다이프 썰기', {
      fontFamily: FONT_FAMILY,
      fontSize: '28px',
      color: '#FFD700'
    }).setOrigin(0.5).setDepth(101);
    this._introElements.push(title);

    const desc = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, '스와이프로 카다이프를 썰어라!', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#FFFFFF'
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

    // 시작 핸들러 - 씬 전체 입력으로 바인딩
    this._introStartHandler = () => {
      this._closeIntroAndStart();
    };
    this.input.once('pointerup', this._introStartHandler);
  }

  _closeIntroAndStart() {
    // 중복 실행 방지
    if (!this.introActive) return;
    this.introActive = false;

    // 블링크 정지
    if (this._blinkInterval) {
      clearInterval(this._blinkInterval);
      this._blinkInterval = null;
    }

    // 사운드 재생
    try { soundManager.playUIClick(); } catch (e) {}

    // 인트로 요소들 제거
    if (this._introElements) {
      this._introElements.forEach(el => {
        try { if (el && el.active) el.destroy(); } catch (e) {}
      });
      this._introElements = null;
    }

    // 게임 시작 (다음 프레임에서)
    this.time.delayedCall(0, () => {
      this._startGame();
    });
  }

  // [DEPRECATED] 기존 _startGame - _forceStartGame으로 대체됨
  _startGame() {
    console.log('[KadaifSliceScene] _startGame -> _forceStartGame 리다이렉트');
    this._forceStartGame();
  }

  _endGame() {
    console.log('[KadaifSliceScene] _endGame 호출');
    this.isPlaying = false;

    // [CRITICAL] JavaScript 타이머 정리
    if (this._jsGameTimer) {
      clearInterval(this._jsGameTimer);
      this._jsGameTimer = null;
    }
    if (this._jsSpawnTimer) {
      clearInterval(this._jsSpawnTimer);
      this._jsSpawnTimer = null;
    }
    if (this._animFrameId) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = null;
    }

    // Phaser 타이머 정리 (레거시)
    if (this.gameTimer) this.gameTimer.remove();

    soundManager.playSuccess();

    // 화면 플래시
    try {
      this.cameras.main.flash(300, 255, 215, 0, true);
    } catch(e) {}

    // 결과 오버레이 - setTimeout 사용 (Phaser time 우회)
    setTimeout(() => this._showResult(), 500);
  }

  _showResult() {
    // 오버레이
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0.9
    ).setDepth(500);

    // 결과 카드 배경
    const cardBg = this.add.graphics().setDepth(501);
    cardBg.fillStyle(0x2C1810, 0.95);
    cardBg.fillRoundedRect(GAME_WIDTH / 2 - 160, GAME_HEIGHT / 2 - 180, 320, 360, 20);
    cardBg.lineStyle(4, 0xD4A574, 0.8);
    cardBg.strokeRoundedRect(GAME_WIDTH / 2 - 160, GAME_HEIGHT / 2 - 180, 320, 360, 20);

    // 완료 텍스트 (Premium)
    const completeText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 130, '🎉 완료!', {
      fontFamily: FONT_FAMILY,
      fontSize: '42px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 6, fill: true }
    }).setOrigin(0.5).setScale(0).setDepth(502);

    // 점수 라벨
    const scoreLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, '획득 점수', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#C9A86C',
      letterSpacing: 2
    }).setOrigin(0.5).setAlpha(0).setDepth(502);

    // 점수 값 (Premium)
    const scoreValue = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 5, this.score.toString(), {
      fontFamily: FONT_FAMILY,
      fontSize: '56px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 5,
      shadow: { offsetX: 2, offsetY: 2, color: '#FFD700', blur: 10, fill: false }
    }).setOrigin(0.5).setAlpha(0).setDepth(502);

    // 최대 콤보 (아이콘 추가)
    const comboLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, `🔥 최대 콤보: ${this.maxCombo}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: '#FF6B6B',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0).setDepth(502);

    // 계속 버튼 (Premium Button Style)
    const btnY = GAME_HEIGHT / 2 + 140;

    // 버튼 배경
    const btnBg = this.add.graphics().setDepth(502);
    btnBg.fillStyle(0x4CAF50, 1);
    btnBg.fillRoundedRect(GAME_WIDTH / 2 - 100, btnY - 25, 200, 50, 12);
    btnBg.lineStyle(3, 0x2E7D32, 1);
    btnBg.strokeRoundedRect(GAME_WIDTH / 2 - 100, btnY - 25, 200, 50, 12);
    btnBg.setAlpha(0);

    const continueBtn = this.add.text(GAME_WIDTH / 2, btnY, '계속하기', {
      fontFamily: FONT_FAMILY,
      fontSize: '22px',
      color: '#FFFFFF',
      stroke: '#2E7D32',
      strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0).setDepth(503).setInteractive({ useHandCursor: true });

    // 애니메이션
    this.tweens.add({
      targets: completeText,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });

    this.tweens.add({
      targets: [scoreLabel, scoreValue, comboLabel],
      alpha: 1,
      duration: 400,
      delay: 350
    });

    this.tweens.add({
      targets: [continueBtn, btnBg],
      alpha: 1,
      duration: 400,
      delay: 550
    });

    continueBtn.on('pointerdown', () => {
      soundManager.playUIClick();

      // [Fix] Scene 전환 순서 수정 - 검은 화면 버그 해결
      // 1. 먼저 KitchenScene resume
      this.scene.resume('KitchenScene');

      // 2. KitchenScene 카메라 강제 fadeIn (fadeOut 상태일 수 있음)
      const kitchenScene = this.scene.get('KitchenScene');
      if (kitchenScene && kitchenScene.cameras && kitchenScene.cameras.main) {
        kitchenScene.cameras.main.fadeIn(300);
      }

      // 3. onComplete 콜백 호출 (UI 업데이트)
      if (this.onComplete) {
        this.onComplete(this.score, this.maxCombo);
      }

      // 4. 약간의 딜레이 후 미니게임 Scene stop
      this.time.delayedCall(50, () => {
        this.scene.stop();
      });
    });

    // 호버 효과
    continueBtn.on('pointerover', () => {
      continueBtn.setScale(1.05);
    });
    continueBtn.on('pointerout', () => {
      continueBtn.setScale(1);
    });
  }

  // ========================================
  // 스폰 시스템
  // ========================================

  _spawnKadaif() {
    const P = CONFIG.PHYSICS;

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

    // [FIX] 고정 좌표 사용 - this.scale 문제 해결
    const gameW = GAME_WIDTH;
    const gameH = GAME_HEIGHT;

    // 스폰 위치 (화면 하단 바깥)
    const spawnX = gameW * P.SPAWN_MARGIN +
                   Math.random() * gameW * (1 - 2 * P.SPAWN_MARGIN);
    const spawnY = gameH + 50;

    // 수평 속도 (가장자리 → 중앙 방향)
    const centerOffset = (spawnX - gameW / 2) / (gameW / 2);
    const baseVx = -centerOffset * P.MAX_VX * (0.6 + Math.random() * 0.4);
    const vx = baseVx + (Math.random() - 0.5) * 80;

    // 수직 속도 - 화면 상단 20%~45%까지 도달
    const targetApexY = gameH * (0.2 + Math.random() * 0.25);
    const travelDistance = spawnY - targetApexY;
    const vy = -Math.sqrt(2 * P.GRAVITY * travelDistance) * 1.1;

    // 회전 속도
    const rotSpeed = (Math.random() - 0.5) * 8 + (vx / P.MAX_VX) * 3;

    // 크기
    const size = CONFIG.SIZE.MIN + Math.random() * (CONFIG.SIZE.MAX - CONFIG.SIZE.MIN);

    // 카다이프 생성
    try {
      const kadaif = new Kadaif(this, spawnX, spawnY, {
        vx, vy, size, type, rotSpeed
      });
      this.kadaifs.push(kadaif);

      // 스페셜 타입 사운드
      if (type !== 'normal') {
        try { soundManager.playSpecial(); } catch(e) {}
      }
    } catch (e) {
      console.error('[KadaifSliceScene] 카다이프 생성 실패:', e);
    }
  }

  _spawnWave() {
    const count = Phaser.Math.Between(CONFIG.SPAWN.WAVE_COUNT_MIN, CONFIG.SPAWN.WAVE_COUNT_MAX);

    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * CONFIG.SPAWN.WAVE_DELAY, () => {
        if (this.isPlaying) {
          this._spawnKadaif();
        }
      });
    }
  }

  // ========================================
  // 슬라이스 판정
  // ========================================

  _checkSlice(x, y) {
    const prevPoint = this.trailPoints.length >= 2
      ? this.trailPoints[this.trailPoints.length - 2]
      : { x, y };
    const sliceAngle = Math.atan2(y - prevPoint.y, x - prevPoint.x);

    for (let i = this.kadaifs.length - 1; i >= 0; i--) {
      const kadaif = this.kadaifs[i];
      if (kadaif.sliced) continue;

      const dx = x - kadaif.x;
      const dy = y - kadaif.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // 판정 범위 (size * 1.2)
      if (dist < kadaif.size * 1.2) {
        // 슬라이스!
        const result = kadaif.slice(sliceAngle);
        if (!result) continue;

        // 잘린 조각 생성
        result.pieces.forEach(pieceData => {
          const piece = new SlicedPiece(this, pieceData);
          this.slicedPieces.push(piece);
        });

        // 콤보 처리
        const now = Date.now();
        if (now - this.lastHitTime < CONFIG.COMBO_TIMEOUT) {
          this.combo++;
          this.maxCombo = Math.max(this.maxCombo, this.combo);
        } else {
          this.combo = 1;
        }
        this.lastHitTime = now;

        // 점수 계산 (콤보 보너스)
        let points = result.points;
        if (this.combo >= 3) {
          points = Math.floor(points * (1 + this.combo * 0.15));
        }
        this.score += points;
        this.scoreText.setText(this.score.toString());

        // 이펙트
        this._sliceEffect(result.x, result.y, prevPoint, { x, y }, result.type);

        // 콤보 표시
        this._showCombo();

        // 카메라 흔들림
        const shakeIntensity = Math.min(0.02, 0.005 * this.combo);
        this.cameras.main.shake(80, shakeIntensity);

        soundManager.playSlice();

        // 스페셜 타입 추가 효과
        if (result.type !== 'normal') {
          this._specialSliceEffect(result.x, result.y, result.type);
          soundManager.playCrunch();
        }
      }
    }
  }

  _sliceEffect(x, y, from, to, type) {
    const typeConfig = CONFIG.TYPES[type];

    // 슬라이스 라인
    const line = this.add.graphics();
    line.lineStyle(5, 0xFFFFFF, 1);
    line.lineBetween(from.x, from.y, to.x, to.y);

    this.tweens.add({
      targets: line,
      alpha: 0,
      duration: 150,
      onComplete: () => line.destroy()
    });

    // 파티클 폭발
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 80 + Math.random() * 120;
      const size = 4 + Math.random() * 6;

      const particle = this.add.ellipse(x, y, size, size * 0.7, typeConfig.color);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed + 60,
        alpha: 0,
        scale: 0.3,
        duration: 350,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    }

    // 점수 팝업
    const pointsText = this.add.text(x, y, `+${this.combo >= 3 ? this.combo + 'x' : ''}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.tweens.add({
      targets: pointsText,
      y: y - 60,
      alpha: 0,
      scale: 1.3,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => pointsText.destroy()
    });
  }

  _specialSliceEffect(x, y, type) {
    // 링 폭발
    const ring = this.add.circle(x, y, 10, CONFIG.TYPES[type].color, 0);
    ring.setStrokeStyle(4, CONFIG.TYPES[type].highlight);

    this.tweens.add({
      targets: ring,
      scale: 4,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    });

    // 스파클
    for (let i = 0; i < 6; i++) {
      const sparkle = this.add.text(
        x + (Math.random() - 0.5) * 40,
        y + (Math.random() - 0.5) * 40,
        '✨',
        { fontSize: '16px' }
      ).setOrigin(0.5);

      this.tweens.add({
        targets: sparkle,
        y: sparkle.y - 50,
        alpha: 0,
        scale: 0.5,
        duration: 400,
        delay: i * 30,
        onComplete: () => sparkle.destroy()
      });
    }
  }

  _showCombo() {
    if (this.combo < 3) {
      this.comboText.setAlpha(0);
      return;
    }

    this.comboText.setText(`${this.combo} COMBO!`);
    this.comboText.setAlpha(1);

    // 바운스 애니메이션
    this.tweens.add({
      targets: this.comboText,
      scale: { from: 1.5, to: 1 },
      duration: 200,
      ease: 'Back.easeOut'
    });

    // 페이드 아웃 예약
    this.time.delayedCall(800, () => {
      if (this.combo < 3) {
        this.tweens.add({
          targets: this.comboText,
          alpha: 0,
          duration: 200
        });
      }
    });
  }

  // ========================================
  // 트레일 렌더링
  // ========================================

  _drawTrail() {
    this.trailGraphics.clear();
    this.trailGlowGraphics.clear();

    if (this.trailPoints.length < 2) return;

    // 글로우 레이어
    this.trailGlowGraphics.lineStyle(12, CONFIG.COLORS.trailGlow, 0.3);
    this.trailGlowGraphics.beginPath();
    this.trailGlowGraphics.moveTo(this.trailPoints[0].x, this.trailPoints[0].y);

    for (let i = 1; i < this.trailPoints.length; i++) {
      this.trailGlowGraphics.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
    }
    this.trailGlowGraphics.strokePath();

    // 메인 트레일
    this.trailGraphics.lineStyle(6, CONFIG.COLORS.trail, 0.9);
    this.trailGraphics.beginPath();
    this.trailGraphics.moveTo(this.trailPoints[0].x, this.trailPoints[0].y);

    for (let i = 1; i < this.trailPoints.length; i++) {
      this.trailGraphics.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
    }
    this.trailGraphics.strokePath();
  }

  // ========================================
  // 메인 업데이트 루프
  // ========================================

  // [NOTE] Phaser update()는 이제 백업용 - 메인 로직은 _runGameLoop()에서 처리
  update(time, delta) {
    // 디버그: update가 호출되는지 확인 (처음 몇 번만)
    if (!this._updateLogCount) this._updateLogCount = 0;
    if (this._updateLogCount < 3) {
      console.log('[KadaifSliceScene] Phaser update() 호출됨, isPlaying:', this.isPlaying);
      this._updateLogCount++;
    }

    // 게임 로직은 _runGameLoop()에서 처리하므로 여기선 최소 로직만
    if (!this.isPlaying) return;

    // Phaser update가 정상 작동하면 추가 스폰 (백업)
    // _runGameLoop이 이미 처리하므로 여기선 스킵
  }

  // ========================================
  // 정리
  // ========================================

  shutdown() {
    console.log('[KadaifSliceScene] shutdown 시작');

    // 게임 상태 비활성화
    this.isPlaying = false;

    // [Fix] 이벤트 리스너 정리
    this.events.off('shutdown', this.shutdown, this);
    this.input.off('pointerdown');
    this.input.off('pointermove');
    this.input.off('pointerup');

    // [CRITICAL] JavaScript 타이머 정리
    if (this._jsGameTimer) {
      clearInterval(this._jsGameTimer);
      this._jsGameTimer = null;
    }
    if (this._jsSpawnTimer) {
      clearInterval(this._jsSpawnTimer);
      this._jsSpawnTimer = null;
    }
    if (this._animFrameId) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = null;
    }

    // Phaser 타이머 정리 (레거시)
    if (this.gameTimer) {
      this.gameTimer.remove();
      this.gameTimer = null;
    }

    // 오브젝트 정리
    if (this.kadaifs) {
      this.kadaifs.forEach(k => { try { k.destroy(); } catch(e) {} });
      this.kadaifs = [];
    }

    if (this.slicedPieces) {
      this.slicedPieces.forEach(p => { try { p.destroy(); } catch(e) {} });
      this.slicedPieces = [];
    }

    this.trailPoints = [];

    console.log('[KadaifSliceScene] shutdown 완료');
  }
}
