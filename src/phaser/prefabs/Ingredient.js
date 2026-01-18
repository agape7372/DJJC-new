/**
 * Ingredient - 드래그 가능한 재료 프리팹
 * Good Pizza, Great Pizza 스타일의 직관적인 드래그&드롭
 */

import Phaser from 'phaser';
import { INGREDIENTS, FONT_FAMILY } from '../config/GameConfig.js';
import gameManager from '../managers/GameManager.js';

// 재료별 색상 팔레트 (이미지 없이 기하학적 표현)
export const INGREDIENT_VISUALS = {
  kadaif: {
    color: 0xC9A86C,        // 골든 브라운 (면발)
    accent: 0x8B6914,       // 다크 골드
    shape: 'strands',       // 면발 모양
    size: 35
  },
  pistachio: {
    color: 0x7CB342,        // 피스타치오 그린
    accent: 0x558B2F,       // 다크 그린
    shape: 'chunks',        // 조각 모양
    size: 8
  },
  marshmallow: {
    color: 0xFFF5EE,        // 크림 화이트
    accent: 0xFFE4E1,       // 미스티 로즈
    shape: 'blobs',         // 부드러운 덩어리
    size: 20
  },
  cocoa: {
    color: 0x4A3728,        // 다크 초콜릿
    accent: 0x3D2314,       // 에스프레소
    shape: 'powder',        // 가루 형태
    size: 3
  },
  gold: {
    color: 0xFFD700,        // 골드
    accent: 0xFFA500,       // 오렌지 골드
    shape: 'flakes',        // 플레이크
    size: 4
  }
};

/**
 * DraggableIngredient - 드래그 가능한 재료 아이템
 */
export class DraggableIngredient extends Phaser.GameObjects.Container {
  constructor(scene, x, y, type, options = {}) {
    super(scene, x, y);
    scene.add.existing(this);

    this.ingredientType = type;
    this.ingredientData = INGREDIENTS[type.toUpperCase()] || { key: type, name: type };
    this.visual = INGREDIENT_VISUALS[type] || INGREDIENT_VISUALS.pistachio;

    // 원래 위치 저장
    this.originalX = x;
    this.originalY = y;

    // 상태
    this.isDragging = false;
    this.isOnDough = false;

    // 옵션
    this.size = options.size || 70;
    this.isInfinite = options.infinite !== false; // 트레이 재료는 무한

    // 비주얼 생성
    this._createVisuals();

    // 드래그 설정
    this._setupDrag();
  }

  _createVisuals() {
    const { color, accent, shape } = this.visual;

    // 배경 컨테이너 (그림자 효과)
    this.shadow = this.scene.add.ellipse(3, 3, this.size, this.size * 0.9, 0x000000, 0.2);
    this.add(this.shadow);

    // 메인 배경
    this.bg = this.scene.add.ellipse(0, 0, this.size, this.size * 0.9, color);
    this.bg.setStrokeStyle(3, accent);
    this.add(this.bg);

    // 재료별 아이콘 그리기
    this._drawIngredientIcon(shape, color, accent);

    // 인터랙티브 영역
    this.setSize(this.size + 10, this.size + 10);
    this.setInteractive({ draggable: true, useHandCursor: true });
  }

  _drawIngredientIcon(shape, color, accent) {
    const graphics = this.scene.add.graphics();

    switch (shape) {
      case 'strands': // 카다이프 면발
        graphics.lineStyle(2, accent);
        for (let i = -15; i <= 15; i += 6) {
          const waveOffset = Math.sin(i * 0.3) * 3;
          graphics.lineBetween(i, -12 + waveOffset, i + 2, 12 + waveOffset);
        }
        break;

      case 'chunks': // 피스타치오 조각
        graphics.fillStyle(accent);
        for (let i = 0; i < 5; i++) {
          const px = Phaser.Math.Between(-12, 12);
          const py = Phaser.Math.Between(-10, 10);
          graphics.fillEllipse(px, py, 8, 6);
        }
        break;

      case 'blobs': // 마시멜로우 덩어리
        graphics.fillStyle(0xFFFFFF, 0.8);
        graphics.fillCircle(-8, -5, 12);
        graphics.fillCircle(8, -3, 10);
        graphics.fillCircle(0, 8, 11);
        break;

      case 'powder': // 코코아 파우더
        graphics.fillStyle(accent, 0.8);
        for (let i = 0; i < 30; i++) {
          const px = Phaser.Math.Between(-18, 18);
          const py = Phaser.Math.Between(-15, 15);
          graphics.fillCircle(px, py, 2);
        }
        break;

      case 'flakes': // 금가루 플레이크
        for (let i = 0; i < 8; i++) {
          const px = Phaser.Math.Between(-15, 15);
          const py = Phaser.Math.Between(-12, 12);
          const star = this.scene.add.star(px, py, 4, 2, 4, color);
          star.setAngle(Phaser.Math.Between(0, 360));
          this.add(star);
        }
        break;
    }

    this.add(graphics);
  }

  _setupDrag() {
    this.on('dragstart', (pointer) => {
      this.isDragging = true;
      this.scene.children.bringToTop(this);

      // 들어올리는 효과
      this.scene.tweens.add({
        targets: this,
        scale: 1.15,
        duration: 100,
        ease: 'Back.easeOut'
      });

      // 그림자 확대
      this.scene.tweens.add({
        targets: this.shadow,
        x: 6,
        y: 6,
        alpha: 0.3,
        duration: 100
      });
    });

    this.on('drag', (pointer, dragX, dragY) => {
      this.x = dragX;
      this.y = dragY;
    });

    this.on('dragend', (pointer, dropped) => {
      this.isDragging = false;

      // 내려놓는 효과
      this.scene.tweens.add({
        targets: this,
        scale: 1,
        duration: 100,
        ease: 'Power2'
      });

      this.scene.tweens.add({
        targets: this.shadow,
        x: 3,
        y: 3,
        alpha: 0.2,
        duration: 100
      });

      // 드롭되지 않았으면 원위치
      if (!dropped && !this.isOnDough) {
        this.returnToOrigin();
      }
    });
  }

  returnToOrigin() {
    this.scene.tweens.add({
      targets: this,
      x: this.originalX,
      y: this.originalY,
      duration: 250,
      ease: 'Back.easeOut'
    });
  }

  getData() {
    return {
      type: this.ingredientType,
      ...this.ingredientData,
      visual: this.visual
    };
  }
}

/**
 * IngredientTray - 재료 트레이 (하단)
 */
export class IngredientTray extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height) {
    super(scene, x, y);
    scene.add.existing(this);

    this.trayWidth = width;
    this.trayHeight = height;
    this.ingredients = [];

    this._createTray();
    this._populateIngredients();
  }

  _createTray() {
    // 트레이 그림자
    const shadow = this.scene.add.rectangle(4, 4, this.trayWidth, this.trayHeight, 0x000000, 0.3);
    shadow.setStrokeStyle(0);
    this.add(shadow);

    // 트레이 배경 (나무 질감)
    const tray = this.scene.add.rectangle(0, 0, this.trayWidth, this.trayHeight, 0x8B4513);
    tray.setStrokeStyle(4, 0x5D4037);
    this.add(tray);

    // 트레이 내부 홈
    const inner = this.scene.add.rectangle(0, 0, this.trayWidth - 20, this.trayHeight - 16, 0x6D3810);
    inner.setStrokeStyle(2, 0x4A2508);
    this.add(inner);

    // 라벨
    const label = this.scene.add.text(0, -this.trayHeight / 2 - 20, '[ 재료 ]', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#5D4037'
    }).setOrigin(0.5);
    this.add(label);
  }

  _populateIngredients() {
    const types = Object.keys(INGREDIENTS);
    const spacing = this.trayWidth / (types.length + 1);

    types.forEach((type, i) => {
      const x = -this.trayWidth / 2 + spacing * (i + 1);
      const ingredient = new DraggableIngredient(this.scene, this.x + x, this.y, type.toLowerCase(), {
        size: 60,
        infinite: true
      });

      // 수량 표시
      const count = gameManager.getIngredientCount(type.toLowerCase());
      const countText = this.scene.add.text(x, 45, `x${count}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '12px',
        color: '#FFF8E7',
        backgroundColor: '#2D2016',
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5);
      this.add(countText);

      ingredient.countText = countText;
      this.ingredients.push(ingredient);
    });
  }

  updateQuantities() {
    this.ingredients.forEach(ing => {
      const count = gameManager.getIngredientCount(ing.ingredientType);
      if (ing.countText) {
        ing.countText.setText(`x${count}`);

        // 부족하면 빨간색
        if (count <= 0) {
          ing.countText.setColor('#FF6B6B');
          ing.setAlpha(0.5);
        } else if (count <= 10) {
          ing.countText.setColor('#FFD700');
          ing.setAlpha(1);
        } else {
          ing.countText.setColor('#FFF8E7');
          ing.setAlpha(1);
        }
      }
    });
  }

  getIngredientAt(index) {
    return this.ingredients[index];
  }
}

/**
 * Topping - 반죽 위에 올라간 토핑 (시각적 표현)
 */
export class Topping extends Phaser.GameObjects.Container {
  constructor(scene, x, y, type, options = {}) {
    super(scene, x, y);
    scene.add.existing(this);

    this.toppingType = type;
    this.visual = INGREDIENT_VISUALS[type] || INGREDIENT_VISUALS.pistachio;

    // 랜덤 각도
    this.setAngle(Phaser.Math.Between(-30, 30));

    // 토핑 생성
    this._createTopping(options.count || 1);

    // 등장 애니메이션
    this.setScale(0);
    scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
      delay: options.delay || 0
    });
  }

  _createTopping(count) {
    const { color, accent, shape, size } = this.visual;

    switch (shape) {
      case 'strands': // 카다이프
        this._createStrands(color, accent, count);
        break;

      case 'chunks': // 피스타치오
        this._createChunks(color, accent, count);
        break;

      case 'blobs': // 마시멜로우
        this._createBlobs(color, accent);
        break;

      case 'powder': // 코코아
        this._createPowder(color, accent, count * 10);
        break;

      case 'flakes': // 금가루
        this._createFlakes(color, count * 3);
        break;
    }
  }

  _createStrands(color, accent, count) {
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(3, color);

    for (let i = 0; i < count * 3; i++) {
      const startX = Phaser.Math.Between(-15, 15);
      const startY = Phaser.Math.Between(-10, 10);
      const endX = startX + Phaser.Math.Between(-8, 8);
      const endY = startY + Phaser.Math.Between(10, 20);

      graphics.beginPath();
      graphics.moveTo(startX, startY);
      // 곡선으로 면발 표현
      graphics.bezierCurveTo(
        startX + 5, startY + 5,
        endX - 5, endY - 5,
        endX, endY
      );
      graphics.strokePath();
    }

    this.add(graphics);
  }

  _createChunks(color, accent, count) {
    for (let i = 0; i < count; i++) {
      const px = Phaser.Math.Between(-12, 12);
      const py = Phaser.Math.Between(-12, 12);
      const size = Phaser.Math.Between(5, 9);

      const chunk = this.scene.add.ellipse(px, py, size, size * 0.7, color);
      chunk.setStrokeStyle(1, accent);
      chunk.setAngle(Phaser.Math.Between(0, 360));
      this.add(chunk);
    }
  }

  _createBlobs(color, accent) {
    const blob = this.scene.add.ellipse(0, 0, 18, 14, color);
    blob.setStrokeStyle(2, accent);
    this.add(blob);

    // 하이라이트
    const highlight = this.scene.add.ellipse(-4, -3, 6, 4, 0xFFFFFF, 0.5);
    this.add(highlight);
  }

  _createPowder(color, accent, count) {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color, 0.7);

    for (let i = 0; i < count; i++) {
      const px = Phaser.Math.Between(-20, 20);
      const py = Phaser.Math.Between(-20, 20);
      graphics.fillCircle(px, py, Phaser.Math.Between(1, 3));
    }

    this.add(graphics);
  }

  _createFlakes(color, count) {
    for (let i = 0; i < count; i++) {
      const px = Phaser.Math.Between(-15, 15);
      const py = Phaser.Math.Between(-15, 15);

      const flake = this.scene.add.star(px, py, 4, 1, 3, color);
      flake.setAngle(Phaser.Math.Between(0, 360));
      flake.setAlpha(Phaser.Math.FloatBetween(0.6, 1));
      this.add(flake);
    }
  }
}

// 기존 호환성을 위해 export
export class Ingredient extends DraggableIngredient {}
export class IngredientStation extends IngredientTray {}

export default DraggableIngredient;
