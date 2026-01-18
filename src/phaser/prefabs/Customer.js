/**
 * Customer - 손님 프리팹 클래스
 * 손님의 생성, 애니메이션, 상호작용을 관리
 */

import Phaser from 'phaser';
import { CUSTOMER_TYPES, ANIM, COLORS, RECIPES, FONT_FAMILY, hexToString } from '../config/GameConfig.js';
import gameManager from '../managers/GameManager.js';

export class Customer extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene - 씬 참조
   * @param {number} x - X 좌표
   * @param {number} y - Y 좌표
   * @param {string} [typeKey] - 손님 타입 키 (미지정시 랜덤)
   */
  constructor(scene, x, y, typeKey = null) {
    super(scene, x, y);

    // 씬에 추가
    scene.add.existing(this);

    // 손님 타입 결정
    this.customerType = typeKey
      ? CUSTOMER_TYPES[typeKey.toUpperCase()]
      : this._getRandomType();

    // 상태
    this.state = 'idle'; // idle, waiting, happy, angry, leaving
    this.patience = this.customerType.patience * 100; // 0-100
    this.maxPatience = this.patience;
    this.order = null;
    this.isServed = false;

    // 비주얼 생성
    this._createVisuals();

    // 대기 애니메이션 시작
    this._startIdleAnimation();
  }

  /**
   * 랜덤 손님 타입 선택
   */
  _getRandomType() {
    const types = Object.values(CUSTOMER_TYPES);
    return Phaser.Math.RND.pick(types);
  }

  /**
   * 손님 비주얼 생성
   */
  _createVisuals() {
    const type = this.customerType;

    // 몸통
    this.body = this.scene.add.rectangle(0, 15, 80, 100, type.color);
    this.add(this.body);

    // 머리
    this.head = this.scene.add.circle(0, -40, 30, 0xFFDBB4);
    this.add(this.head);

    // 눈
    this.leftEye = this.scene.add.circle(-10, -45, 5, 0x2D2016);
    this.rightEye = this.scene.add.circle(10, -45, 5, 0x2D2016);
    this.add(this.leftEye);
    this.add(this.rightEye);

    // 입 (표정에 따라 변경)
    this.mouth = this.scene.add.graphics();
    this._drawMouth('neutral');
    this.add(this.mouth);

    // 이름표
    this.nameTag = this.scene.add.text(0, 75, type.name, {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#FFF8E7',
      backgroundColor: hexToString(type.color),
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5);
    this.add(this.nameTag);

    // 타입별 특수 장식
    this._addTypeDecoration();
  }

  /**
   * 손님 타입별 장식 추가
   */
  _addTypeDecoration() {
    const type = this.customerType.key;

    switch (type) {
      case 'hipster':
        // 수염
        const beard = this.scene.add.rectangle(0, -20, 20, 10, 0x5D4037);
        this.add(beard);
        break;

      case 'grandma':
        // 안경
        const glasses = this.scene.add.graphics();
        glasses.lineStyle(2, 0x2D2016);
        glasses.strokeCircle(-10, -45, 12);
        glasses.strokeCircle(10, -45, 12);
        glasses.lineBetween(-2, -45, 2, -45);
        this.add(glasses);
        break;

      case 'businessman':
        // 넥타이
        const tie = this.scene.add.triangle(0, 30, 0, -10, -8, 40, 8, 40, 0xC0392B);
        this.add(tie);
        break;

      case 'tourist':
        // 카메라
        const camera = this.scene.add.rectangle(25, 10, 25, 20, 0x333333);
        this.add(camera);
        break;
    }
  }

  /**
   * 입 표정 그리기
   */
  _drawMouth(expression) {
    this.mouth.clear();
    this.mouth.lineStyle(3, 0x2D2016);

    switch (expression) {
      case 'happy':
        this.mouth.beginPath();
        this.mouth.arc(0, -30, 10, 0.2, Math.PI - 0.2);
        this.mouth.strokePath();
        break;

      case 'angry':
        this.mouth.beginPath();
        this.mouth.arc(0, -20, 10, Math.PI + 0.2, -0.2);
        this.mouth.strokePath();
        break;

      case 'neutral':
      default:
        this.mouth.lineBetween(-8, -28, 8, -28);
        break;
    }
  }

  /**
   * 대기 애니메이션
   */
  _startIdleAnimation() {
    // 좌우 흔들림
    this.idleTween = this.scene.tweens.add({
      targets: this,
      x: { from: this.x - 3, to: this.x + 3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * 손님 등장 (스폰)
   * @param {number} targetY - 목표 Y 위치
   * @returns {Promise}
   */
  spawn(targetY) {
    return new Promise((resolve) => {
      this.setAlpha(0);
      this.y = targetY + 200;

      this.scene.tweens.add({
        targets: this,
        y: targetY,
        alpha: 1,
        duration: ANIM.customerEnterDuration,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.state = 'waiting';
          resolve();
        }
      });
    });
  }

  /**
   * 주문 생성
   * @returns {Object} 주문 정보
   */
  generateOrder() {
    const availableRecipes = Object.values(RECIPES).filter(
      r => gameManager.isRecipeUnlocked(r.key)
    );

    const recipe = Phaser.Math.RND.pick(availableRecipes);
    const [minQty, maxQty] = this.customerType.orderQuantity;
    const quantity = Phaser.Math.Between(minQty, maxQty);

    this.order = {
      recipe,
      quantity,
      completed: 0,
      tip: recipe.basePrice * this.customerType.tipMultiplier * 0.1
    };

    return this.order;
  }

  /**
   * 주문 수락됨
   */
  onOrderAccepted() {
    this.state = 'waiting';
    this._drawMouth('happy');

    // 기쁨 효과
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 100,
      yoyo: true,
      repeat: 1
    });
  }

  /**
   * 주문 거절됨
   */
  onOrderRejected() {
    this.state = 'angry';
    this._drawMouth('angry');
    gameManager.recordCustomerRejected();
    gameManager.addReputation(-5);

    // 화남 효과 (화면 흔들림)
    this.scene.cameras.main.shake(100, 0.01);
  }

  /**
   * 주문 완료
   */
  onOrderCompleted() {
    this.isServed = true;
    this.state = 'happy';
    this._drawMouth('happy');

    // 골드 획득
    const earnings = Math.floor(
      this.order.recipe.basePrice *
      this.order.quantity *
      this.customerType.tipMultiplier
    );

    gameManager.addGold(earnings);
    gameManager.recordCustomerServed();
    gameManager.addReputation(3);

    // 축하 이펙트
    this._celebrationEffect();

    return earnings;
  }

  /**
   * 축하 이펙트
   */
  _celebrationEffect() {
    for (let i = 0; i < 10; i++) {
      const star = this.scene.add.star(
        this.x + Phaser.Math.Between(-50, 50),
        this.y + Phaser.Math.Between(-50, 0),
        5, 5, 10,
        0xFFD700
      );

      this.scene.tweens.add({
        targets: star,
        y: star.y - 100,
        alpha: 0,
        scale: 0,
        duration: 800,
        delay: i * 50,
        ease: 'Power2',
        onComplete: () => star.destroy()
      });
    }
  }

  /**
   * 손님 퇴장
   * @param {boolean} happy - 만족 여부
   * @returns {Promise}
   */
  leave(happy = true) {
    return new Promise((resolve) => {
      this.state = 'leaving';

      // 대기 애니메이션 중지
      if (this.idleTween) {
        this.idleTween.stop();
      }

      const targetY = happy ? this.y - 200 : this.y + 150;

      this.scene.tweens.add({
        targets: this,
        y: targetY,
        alpha: 0,
        duration: ANIM.customerExitDuration,
        ease: happy ? 'Power2' : 'Power1',
        onComplete: () => {
          resolve();
        }
      });
    });
  }

  /**
   * 인내심 감소 (매 프레임 호출)
   * @param {number} delta - 델타 타임
   */
  updatePatience(delta) {
    if (this.state !== 'waiting') return;

    this.patience -= delta * 0.01;

    // 인내심 바 업데이트 (있다면)
    if (this.patienceBar) {
      this.patienceBar.width = (this.patience / this.maxPatience) * 60;
    }

    // 인내심 색상 변경
    if (this.patience < this.maxPatience * 0.3) {
      this._drawMouth('angry');
    }

    // 인내심 소진
    if (this.patience <= 0) {
      this.onPatienceExpired();
    }
  }

  /**
   * 인내심 소진
   */
  onPatienceExpired() {
    this.state = 'angry';
    gameManager.addReputation(-10);
    this.scene.events.emit('customerLeft', this);
  }

  /**
   * 인내심 바 추가
   */
  addPatienceBar() {
    const barBg = this.scene.add.rectangle(0, -80, 64, 8, 0x2D2016);
    this.patienceBar = this.scene.add.rectangle(-30, -80, 60, 6, 0x4A7C59)
      .setOrigin(0, 0.5);

    this.add(barBg);
    this.add(this.patienceBar);
  }

  /**
   * 정리
   */
  destroy() {
    if (this.idleTween) {
      this.idleTween.stop();
    }
    super.destroy();
  }
}

export default Customer;
