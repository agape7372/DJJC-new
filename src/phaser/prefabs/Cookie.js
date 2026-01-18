/**
 * Cookie - 쿠키 프리팹 클래스
 * 제작된 쿠키 오브젝트
 */

import Phaser from 'phaser';
import { RECIPES, COLORS, FONT_FAMILY } from '../config/GameConfig.js';
import gameManager from '../managers/GameManager.js';

// 쿠키 등급
export const CookieGrade = {
  S: { key: 'S', name: '완벽', color: 0xFFD700, minScore: 90 },
  A: { key: 'A', name: '훌륭', color: 0x9B59B6, minScore: 75 },
  B: { key: 'B', name: '양호', color: 0x3498DB, minScore: 50 },
  C: { key: 'C', name: '보통', color: 0x95A5A6, minScore: 0 }
};

export class Cookie extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {Object} data - 쿠키 데이터
   */
  constructor(scene, x, y, data = {}) {
    super(scene, x, y);
    scene.add.existing(this);

    // 쿠키 데이터
    this.cookieData = {
      recipeKey: data.recipeKey || 'classic',
      ingredients: data.ingredients || [],
      quality: data.quality || this._calculateQuality(data.ingredients),
      freshness: data.freshness || 100,
      createdAt: data.createdAt || Date.now(),
      ...data
    };

    // 레시피 정보
    this.recipe = RECIPES[this.cookieData.recipeKey.toUpperCase()] ||
                  Object.values(RECIPES)[0];

    // 등급 계산
    this.grade = this._calculateGrade();

    // 가격 계산
    this.price = this._calculatePrice();

    // 상태
    this.isSelected = false;
    this.isSold = false;

    // 비주얼 생성
    this._createVisuals();
  }

  /**
   * 품질 계산
   */
  _calculateQuality(ingredients = []) {
    // 재료 개수에 따른 기본 점수
    const ingredientScore = Math.min(100, ingredients.length * 25);

    // 랜덤 보너스 (-10 ~ +10)
    const randomBonus = Phaser.Math.Between(-10, 10);

    return Phaser.Math.Clamp(ingredientScore + randomBonus, 0, 100);
  }

  /**
   * 등급 계산
   */
  _calculateGrade() {
    const quality = this.cookieData.quality;

    if (quality >= CookieGrade.S.minScore) return CookieGrade.S;
    if (quality >= CookieGrade.A.minScore) return CookieGrade.A;
    if (quality >= CookieGrade.B.minScore) return CookieGrade.B;
    return CookieGrade.C;
  }

  /**
   * 가격 계산
   */
  _calculatePrice() {
    const basePrice = this.recipe.basePrice;
    const qualityMultiplier = 0.5 + (this.cookieData.quality / 100) * 1.0;
    const freshnessMultiplier = this.cookieData.freshness / 100;

    return Math.floor(basePrice * qualityMultiplier * freshnessMultiplier);
  }

  /**
   * 비주얼 생성
   */
  _createVisuals() {
    // 쿠키 베이스 (원형)
    this.base = this.scene.add.circle(0, 0, 40, 0xD4A574)
      .setStrokeStyle(3, 0x8B4513);
    this.add(this.base);

    // 토핑 (재료에 따라)
    this._addToppings();

    // 등급 배지
    this._addGradeBadge();

    // 인터랙티브 설정
    this.setSize(90, 90);
    this.setInteractive({ useHandCursor: true });

    this.on('pointerover', () => this._onHover(true));
    this.on('pointerout', () => this._onHover(false));
    this.on('pointerdown', () => this._onClick());
  }

  /**
   * 토핑 추가
   */
  _addToppings() {
    const ingredients = this.cookieData.ingredients;
    const toppingColors = {
      kadaif: 0xC9A86C,
      pistachio: 0x7CB342,
      marshmallow: 0xFFF5EE,
      cocoa: 0x4A3728,
      gold: 0xFFD700
    };

    // 랜덤 위치에 토핑 배치
    ingredients.forEach((ing, i) => {
      const color = toppingColors[ing] || 0xCCCCCC;
      const angle = (i / ingredients.length) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 15 + Math.random() * 15;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const size = 5 + Math.random() * 5;

      const topping = this.scene.add.circle(x, y, size, color);
      this.add(topping);
    });

    // 코코아 파우더 효과 (있으면)
    if (ingredients.includes('cocoa')) {
      const dustGraphics = this.scene.add.graphics();
      dustGraphics.fillStyle(0x5D4037, 0.3);
      for (let i = 0; i < 20; i++) {
        const x = Phaser.Math.Between(-30, 30);
        const y = Phaser.Math.Between(-30, 30);
        dustGraphics.fillCircle(x, y, 2);
      }
      this.add(dustGraphics);
    }
  }

  /**
   * 등급 배지 추가
   */
  _addGradeBadge() {
    const badge = this.scene.add.circle(30, -30, 15, this.grade.color)
      .setStrokeStyle(2, 0x2D2016);
    this.add(badge);

    const gradeText = this.scene.add.text(30, -30, this.grade.key, {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#FFF8E7',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(gradeText);
  }

  /**
   * 호버 효과
   */
  _onHover(isHover) {
    if (this.isSold) return;

    this.scene.tweens.add({
      targets: this,
      scale: isHover ? 1.1 : 1,
      duration: 100,
      ease: 'Power2'
    });

    if (isHover) {
      this._showTooltip();
    } else {
      this._hideTooltip();
    }
  }

  /**
   * 클릭 효과
   */
  _onClick() {
    if (this.isSold) return;

    this.isSelected = !this.isSelected;

    // 선택 표시
    if (this.selectionRing) {
      this.selectionRing.destroy();
      this.selectionRing = null;
    }

    if (this.isSelected) {
      this.selectionRing = this.scene.add.circle(0, 0, 50)
        .setStrokeStyle(4, COLORS.accent)
        .setFillStyle(0x000000, 0);
      this.addAt(this.selectionRing, 0);

      this.scene.events.emit('cookieSelected', this);
    } else {
      this.scene.events.emit('cookieDeselected', this);
    }
  }

  /**
   * 툴팁 표시
   */
  _showTooltip() {
    if (this.tooltip) return;

    const tooltipY = -70;

    this.tooltip = this.scene.add.container(0, tooltipY);

    const bg = this.scene.add.rectangle(0, 0, 150, 70, 0x2D2016, 0.9)
      .setStrokeStyle(2, COLORS.accent);
    this.tooltip.add(bg);

    const nameText = this.scene.add.text(0, -20, this.recipe.name, {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#FFF8E7'
    }).setOrigin(0.5);
    this.tooltip.add(nameText);

    const qualityText = this.scene.add.text(0, 0, `품질: ${this.cookieData.quality}%`, {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#D4A574'
    }).setOrigin(0.5);
    this.tooltip.add(qualityText);

    const priceText = this.scene.add.text(0, 18, `${this.price.toLocaleString()}G`, {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#FFD700'
    }).setOrigin(0.5);
    this.tooltip.add(priceText);

    this.add(this.tooltip);
  }

  /**
   * 툴팁 숨김
   */
  _hideTooltip() {
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }
  }

  /**
   * 신선도 감소
   * @param {number} amount - 감소량
   */
  reduceFreshness(amount) {
    this.cookieData.freshness = Math.max(0, this.cookieData.freshness - amount);
    this.price = this._calculatePrice();

    // 시각적 표시 (어두워짐)
    if (this.cookieData.freshness < 50) {
      this.base.setAlpha(0.7);
    }
    if (this.cookieData.freshness < 20) {
      this.base.setTint(0x888888);
    }
  }

  /**
   * 판매 처리
   */
  sell() {
    if (this.isSold) return 0;

    this.isSold = true;
    const earnings = this.price;

    // 판매 애니메이션
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.destroy();
      }
    });

    return earnings;
  }

  /**
   * 쿠키 데이터 직렬화 (저장용)
   */
  serialize() {
    return {
      ...this.cookieData,
      grade: this.grade.key,
      price: this.price
    };
  }

  /**
   * 정적: 저장된 데이터로 쿠키 생성
   */
  static fromData(scene, x, y, data) {
    return new Cookie(scene, x, y, data);
  }
}

export default Cookie;
