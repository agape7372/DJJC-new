/**
 * KitchenScene - 두바이 초콜릿 쿠키 주방
 *
 * 시스템:
 * 1. 미니게임 플레이 → 점수 비례 재료 재고 획득
 * 2. 쿠키 조합 → 재고에서 재료 소모
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY } from '../config/GameConfig.js';
import { AssetFactory } from '../prefabs/AssetFactory.js';
import gameManager from '../managers/GameManager.js';
import EffectsManager from '../managers/EffectsManager.js';
import { soundManager } from '../../core/SoundManager.js';

// Depth 레이어
const DEPTH = {
  BACKGROUND: 0,
  STATION: 20,
  UI: 100,
  POPUP: 200,
  OVERLAY: 300
};

// UI 색상
const UI_COLORS = {
  ready: 0x4CAF50,
  notReady: 0x9E9E9E,
  highlight: 0xFFD54F,
  danger: 0xE53935,
  primary: 0x8D6E63
};

// 재료 설정
const INGREDIENT_CONFIG = {
  kadaif: {
    name: '카다이프',
    emoji: '🍜',
    color: 0xDEB887,
    minigameScene: 'KadaifSliceScene',
    scoreMultiplier: 0.1  // 점수 * 0.1 = 획득량 (100점 → 10개)
  },
  pistachio: {
    name: '피스타치오',
    emoji: '🥜',
    color: 0x7CB342,
    minigameScene: 'PistachioCrushScene',
    scoreMultiplier: 0.1
  },
  marshmallow: {
    name: '마시멜로우',
    emoji: '☁️',
    color: 0xFFCDD2,
    minigameScene: 'MarshmallowMeltScene',
    scoreMultiplier: 0.1
  }
};

// 쿠키 제작에 필요한 재료량
const COOKIE_RECIPE = {
  kadaif: 5,
  pistachio: 3,
  marshmallow: 4,
  cocoa: 2
};

export class KitchenScene extends Phaser.Scene {
  constructor() {
    super({ key: 'KitchenScene' });
  }

  init() {
    this.stations = {};
  }

  create() {
    this.cameras.main.fadeIn(300);

    this.assetFactory = new AssetFactory(this);
    this.fx = new EffectsManager(this);

    this._createBackground();
    this._createIngredientStations();
    this._createCookieAssembly();
    this._createBackButton();

    this._updateAllUI();

    this.events.on('wake', this._onWake, this);

    soundManager.switchBGM('kitchen');

    console.log('[KitchenScene] create 완료');
  }

  // ========================================
  // 배경
  // ========================================

  _createBackground() {
    // 벽 그라데이션
    const wallGradient = this.add.graphics();
    wallGradient.fillGradientStyle(0xFFFBF5, 0xFFFBF5, 0xF5EDE3, 0xF5EDE3, 1);
    wallGradient.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    wallGradient.setDepth(DEPTH.BACKGROUND);

    // 타일 패턴
    const tileSize = 60;
    for (let y = 0; y < GAME_HEIGHT; y += tileSize) {
      for (let x = 0; x < GAME_WIDTH; x += tileSize) {
        const isLight = ((x / tileSize) + (y / tileSize)) % 2 === 0;
        this.add.rectangle(
          x + tileSize / 2, y + tileSize / 2,
          tileSize - 2, tileSize - 2,
          isLight ? 0xFAF0E6 : 0xF0E6DC, 0.5
        ).setDepth(DEPTH.BACKGROUND);
      }
    }

    // 상단 타이틀
    this.add.rectangle(GAME_WIDTH / 2, 50, GAME_WIDTH - 40, 70, 0xFFF8E7)
      .setStrokeStyle(3, 0x8D6E63)
      .setDepth(DEPTH.UI);

    this.add.text(GAME_WIDTH / 2, 50, '🍪 주방', {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: '#5D4037'
    }).setOrigin(0.5).setDepth(DEPTH.UI);
  }

  // ========================================
  // 재료 생산 스테이션 (미니게임)
  // ========================================

  _createIngredientStations() {
    // 섹션 제목
    this.add.text(GAME_WIDTH / 2, 120, '📦 재료 생산', {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#5D4037'
    }).setOrigin(0.5).setDepth(DEPTH.UI);

    const stationY = 200;
    const stationGap = 130;
    const types = ['kadaif', 'pistachio', 'marshmallow'];

    types.forEach((type, index) => {
      const x = GAME_WIDTH / 2 + (index - 1) * stationGap;
      this._createStation(type, x, stationY);
    });
  }

  _createStation(type, x, y) {
    const config = INGREDIENT_CONFIG[type];
    const container = this.add.container(x, y);
    container.setDepth(DEPTH.STATION);

    // 배경
    const bgShadow = this.add.circle(3, 3, 45, 0x000000, 0.2);
    const bg = this.add.circle(0, 0, 45, config.color);
    bg.setStrokeStyle(3, 0x5D4037);

    // 이모지
    const emoji = this.add.text(0, -5, config.emoji, {
      fontSize: '32px'
    }).setOrigin(0.5);

    // 이름
    const name = this.add.text(0, 60, config.name, {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#5D4037'
    }).setOrigin(0.5);

    // 재고 표시
    const stockText = this.add.text(0, 80, '재고: 0', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#666666'
    }).setOrigin(0.5);

    // 플레이 버튼 라벨
    const playLabel = this.add.text(0, 100, '▶ 생산', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#4CAF50'
    }).setOrigin(0.5);

    container.add([bgShadow, bg, emoji, name, stockText, playLabel]);

    // 상호작용
    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerdown', () => this._startMinigame(type));

    bg.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scale: 1.1,
        duration: 100,
        ease: 'Back.easeOut'
      });
    });

    bg.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 100
      });
    });

    this.stations[type] = { container, stockText, config };
  }

  _startMinigame(type) {
    soundManager.playUIClick();
    const config = INGREDIENT_CONFIG[type];

    this.cameras.main.fadeOut(200);

    this.time.delayedCall(200, () => {
      // [Fix] 미니게임 launch 후 pause
      this.scene.launch(config.minigameScene, {
        onComplete: (score, extra) => {
          // 점수 비례 재고 획득
          const gained = Math.max(1, Math.floor(score * config.scoreMultiplier));
          gameManager.addIngredient(type, gained);

          console.log(`[Kitchen] ${config.name} +${gained}개 (점수: ${score})`);

          // UI 업데이트
          this._updateStationUI(type);

          // 피드백
          const station = this.stations[type];
          this.fx.successFlash(50);
          this.fx.coinShower(station.container.x, station.container.y, gained);
          this.fx.floatingText(
            station.container.x,
            station.container.y - 30,
            `+${gained}`,
            '#4CAF50',
            24
          );

          soundManager.playSuccess();
        }
      });

      // [Fix] 미니게임이 완전히 시작된 후 KitchenScene pause
      // 약간의 딜레이로 미니게임 입력 시스템 초기화 보장
      setTimeout(() => {
        this.scene.pause();
      }, 50);
    });
  }

  _updateStationUI(type) {
    const station = this.stations[type];
    if (!station) return;

    const stock = gameManager.getIngredientCount(type);
    station.stockText.setText(`재고: ${stock}`);
  }

  // ========================================
  // 쿠키 조합 영역
  // ========================================

  _createCookieAssembly() {
    const panelY = 450;

    // 패널 배경
    this.add.rectangle(GAME_WIDTH / 2, panelY, GAME_WIDTH - 40, 260, 0xFFF8E7)
      .setStrokeStyle(4, 0x8D6E63)
      .setDepth(DEPTH.UI);

    // 제목
    this.add.text(GAME_WIDTH / 2, panelY - 100, '🍪 쿠키 만들기', {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: '#5D4037'
    }).setOrigin(0.5).setDepth(DEPTH.UI);

    // 필요 재료 표시
    this.recipeText = this.add.text(GAME_WIDTH / 2, panelY - 60, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#666666',
      align: 'center'
    }).setOrigin(0.5).setDepth(DEPTH.UI);

    // 현재 재고 상태
    this.stockStatusText = this.add.text(GAME_WIDTH / 2, panelY - 20, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#333333',
      align: 'center'
    }).setOrigin(0.5).setDepth(DEPTH.UI);

    // 만들기 버튼
    this.add.rectangle(GAME_WIDTH / 2 + 3, panelY + 40 + 3, 250, 55, 0x000000, 0.3)
      .setDepth(DEPTH.UI);

    this.makeBtn = this.add.rectangle(GAME_WIDTH / 2, panelY + 40, 250, 55, UI_COLORS.notReady)
      .setStrokeStyle(4, 0x666666)
      .setDepth(DEPTH.UI)
      .setInteractive({ useHandCursor: true });

    this.makeBtnText = this.add.text(GAME_WIDTH / 2, panelY + 40, '재료 부족', {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#FFFFFF'
    }).setOrigin(0.5).setDepth(DEPTH.UI);

    this.makeBtn.on('pointerdown', () => this._onMakeCookie());

    // 현재 쿠키 재고
    this.cookieStockText = this.add.text(GAME_WIDTH / 2, panelY + 95, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#8D6E63'
    }).setOrigin(0.5).setDepth(DEPTH.UI);
  }

  _updateAssemblyUI() {
    // 필요 재료
    const recipeStr = Object.entries(COOKIE_RECIPE)
      .map(([type, amount]) => {
        const cfg = INGREDIENT_CONFIG[type];
        const emoji = cfg?.emoji || '📦';
        return `${emoji}${amount}`;
      })
      .join('  ');
    this.recipeText.setText(`필요 재료: ${recipeStr}`);

    // 현재 재고 상태
    const statusParts = [];
    let canMake = true;

    for (const [type, required] of Object.entries(COOKIE_RECIPE)) {
      const have = gameManager.getIngredientCount(type);
      const cfg = INGREDIENT_CONFIG[type];
      const emoji = cfg?.emoji || '📦';
      const color = have >= required ? '🟢' : '🔴';
      statusParts.push(`${emoji}${have}/${required}${color}`);

      if (have < required) canMake = false;
    }

    this.stockStatusText.setText(statusParts.join('  '));

    // 버튼 상태
    if (canMake) {
      this.makeBtn.setFillStyle(UI_COLORS.ready);
      this.makeBtn.setStrokeStyle(4, 0x2D5A2D);
      this.makeBtnText.setText('🍪 두쫀쿠 만들기!');

      // 펄스 애니메이션
      if (!this._btnPulseTween) {
        this._btnPulseTween = this.tweens.add({
          targets: this.makeBtn,
          scale: { from: 1, to: 1.05 },
          duration: 500,
          yoyo: true,
          repeat: -1
        });
      }
    } else {
      this.makeBtn.setFillStyle(UI_COLORS.notReady);
      this.makeBtn.setStrokeStyle(4, 0x666666);
      this.makeBtnText.setText('재료 부족');

      if (this._btnPulseTween) {
        this._btnPulseTween.stop();
        this._btnPulseTween = null;
        this.makeBtn.setScale(1);
      }
    }

    // 쿠키 재고
    const cookieCount = gameManager.inventory.cookies?.length || 0;
    this.cookieStockText.setText(`🍪 쿠키 재고: ${cookieCount}개`);
  }

  _canMakeCookie() {
    for (const [type, required] of Object.entries(COOKIE_RECIPE)) {
      if (gameManager.getIngredientCount(type) < required) {
        return false;
      }
    }
    return true;
  }

  _onMakeCookie() {
    if (!this._canMakeCookie()) {
      soundManager.playError();
      this.fx.shakeObject(this.makeBtn, 5);
      return;
    }

    soundManager.playUIClick();

    // 재료 소모
    for (const [type, amount] of Object.entries(COOKIE_RECIPE)) {
      gameManager.useIngredient(type, amount);
    }

    // 쿠키 생성 (품질은 평균 재고 비율 기반으로 간단히 계산)
    const quality = 70 + Math.floor(Math.random() * 30); // 70~99

    const cookie = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      recipeKey: 'dubai_chocolate',
      recipeName: '클래식 두쫀쿠',
      quality,
      freshness: 100,
      createdAt: Date.now()
    };

    gameManager.addCookie(cookie);

    // 피드백
    this.fx.celebrate(GAME_WIDTH / 2, 400);
    soundManager.playFanfare();

    // 쿠키 팝업 텍스트
    this.fx.floatingText(
      GAME_WIDTH / 2,
      380,
      `🍪 +1 (품질 ${quality})`,
      '#FFD700',
      22
    );

    console.log(`[Kitchen] 쿠키 생성: 품질 ${quality}`);

    // UI 업데이트
    this._updateAllUI();
  }

  // ========================================
  // UI 업데이트
  // ========================================

  _updateAllUI() {
    Object.keys(this.stations).forEach(type => this._updateStationUI(type));
    this._updateAssemblyUI();
  }

  // ========================================
  // 뒤로가기
  // ========================================

  _createBackButton() {
    const y = GAME_HEIGHT - 50;

    this.add.rectangle(GAME_WIDTH / 2 + 3, y + 3, 180, 45, 0x000000, 0.3)
      .setDepth(DEPTH.UI);

    const backBtn = this.add.rectangle(GAME_WIDTH / 2, y, 180, 45, UI_COLORS.primary)
      .setStrokeStyle(3, 0x5D4037)
      .setDepth(DEPTH.UI)
      .setInteractive({ useHandCursor: true });

    this.add.text(GAME_WIDTH / 2, y, '⬅️ 카운터로', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#FFF8E7'
    }).setOrigin(0.5).setDepth(DEPTH.UI);

    backBtn.on('pointerdown', () => {
      soundManager.playUIClick();
      soundManager.switchBGM('counter');
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => {
        this.scene.switch('CounterScene');
      });
    });
  }

  // ========================================
  // 라이프사이클
  // ========================================

  _onWake() {
    this.cameras.main.fadeIn(300);
    soundManager.switchBGM('kitchen');
    this._updateAllUI();
  }

  wake() {
    this._onWake();
  }

  resume() {
    this.cameras.main.fadeIn(300);
    soundManager.switchBGM('kitchen');
    this._updateAllUI();
  }

  shutdown() {
    if (this._btnPulseTween) {
      this._btnPulseTween.stop();
      this._btnPulseTween = null;
    }
    if (this.fx) {
      this.fx.destroy();
      this.fx = null;
    }
  }
}
