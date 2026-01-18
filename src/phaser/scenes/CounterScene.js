/**
 * CounterScene - 손님 응대 메인 홀
 * Good Pizza, Great Pizza 스타일의 1인칭 카운터 뷰
 * OOP 아키텍처: Customer Prefab 사용
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, ANIM, FONT_FAMILY } from '../config/GameConfig.js';
import { Customer } from '../prefabs/Customer.js';
import gameManager from '../managers/GameManager.js';
import EffectsManager from '../managers/EffectsManager.js';
import { soundManager } from '../../core/SoundManager.js';

export class CounterScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CounterScene' });
  }

  init() {
    // 상태 초기화
    this.currentCustomer = null;
    this.customerQueue = [];
    this.maxQueueSize = 5;
    this.pendingOrders = [];
    this.maxPendingOrders = 4;
    this.customerSpawnTimer = null;
    this.customerSpawnDelay = 3000;
  }

  create() {
    // 이펙트 매니저 초기화
    this.fx = new EffectsManager(this);

    // 배경 그리기
    this._createBackground();

    // 카운터 그리기
    this._createCounter();

    // 손님 영역
    this.customerSpawnY = 400;

    // 말풍선 컨테이너
    this.bubbleContainer = this.add.container(GAME_WIDTH / 2, 200);
    this.bubbleContainer.setVisible(false);

    // 버튼 생성
    this._createActionButtons();

    // 주방 버튼
    this._createKitchenButton();

    // 이벤트 리스너
    this._setupEventListeners();

    // 손님 스폰 시작
    this._startCustomerSpawning();

    // BGM 시작 (카운터 음악)
    soundManager.startBGM('counter');
  }

  // ========================================
  // 비주얼 생성
  // ========================================

  _createBackground() {
    // 벽 배경 (그라데이션 효과)
    const wallGradient = this.add.graphics();
    wallGradient.fillGradientStyle(
      COLORS.bgGradientTop, COLORS.bgGradientTop,
      COLORS.wallAccent, COLORS.wallAccent, 1
    );
    wallGradient.fillRect(0, 0, GAME_WIDTH, 600);

    // 벽 패턴 (미세한 텍스처)
    for (let i = 0; i < 8; i++) {
      const y = 80 + i * 70;
      this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 40, 2, COLORS.wallAccent, 0.3);
    }

    // 바닥 (체크 타일 패턴)
    const floorY = 600;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 10; col++) {
        const x = col * 80 + 40;
        const y = floorY + row * 80 + 40;
        const isLight = (row + col) % 2 === 0;
        this.add.rectangle(x, y, 78, 78, isLight ? COLORS.tileLight : COLORS.tileDark);
      }
    }

    // 창문 (더 디테일하게)
    const windowX = GAME_WIDTH / 2;
    const windowY = 180;

    // 창문 그림자
    this.add.rectangle(windowX + 4, windowY + 4, 220, 170, 0x000000, 0.2);

    // 창문 프레임 (외곽)
    this.add.rectangle(windowX, windowY, 220, 170, COLORS.counterWoodDark)
      .setStrokeStyle(4, COLORS.counterWoodDark);

    // 하늘 (그라데이션)
    const skyGradient = this.add.graphics();
    skyGradient.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xB0E0E6, 0xB0E0E6, 1);
    skyGradient.fillRect(windowX - 95, windowY - 70, 190, 140);

    // 구름 장식
    this.add.ellipse(windowX - 40, windowY - 30, 50, 25, 0xFFFFFF, 0.8);
    this.add.ellipse(windowX - 20, windowY - 25, 40, 20, 0xFFFFFF, 0.9);
    this.add.ellipse(windowX + 30, windowY - 40, 35, 18, 0xFFFFFF, 0.7);

    // 창문 십자 프레임
    this.add.rectangle(windowX, windowY, 10, 140, COLORS.counterWood);
    this.add.rectangle(windowX, windowY, 190, 10, COLORS.counterWood);

    // 창문 하이라이트
    this.add.rectangle(windowX - 45, windowY - 30, 80, 50, 0xFFFFFF, 0.15);

    // 가게 간판 (더 화려하게)
    const signY = 50;

    // 간판 그림자
    this.add.rectangle(GAME_WIDTH / 2 + 4, signY + 4, 420, 70, 0x000000, 0.3);

    // 간판 배경 (그라데이션 느낌)
    this.add.rectangle(GAME_WIDTH / 2, signY, 420, 70, COLORS.counterWoodDark)
      .setStrokeStyle(5, COLORS.counterWoodDark);
    this.add.rectangle(GAME_WIDTH / 2, signY, 410, 60, COLORS.counterWood);

    // 간판 장식 라인
    this.add.rectangle(GAME_WIDTH / 2, signY - 22, 380, 3, COLORS.accentDark);
    this.add.rectangle(GAME_WIDTH / 2, signY + 22, 380, 3, COLORS.accentDark);

    // 간판 텍스트 (그림자 포함)
    this.add.text(GAME_WIDTH / 2 + 2, signY + 2, '🍪 두쫀쿠 베이커리 🍪', {
      fontFamily: FONT_FAMILY,
      fontSize: '26px',
      color: '#000000'
    }).setOrigin(0.5).setAlpha(0.3);

    this.add.text(GAME_WIDTH / 2, signY, '🍪 두쫀쿠 베이커리 🍪', {
      fontFamily: FONT_FAMILY,
      fontSize: '26px',
      color: '#FFE4B5'
    }).setOrigin(0.5);

    // 벽 장식 (액자들)
    this._createWallDecoration(150, 350);
    this._createWallDecoration(570, 320);
  }

  _createWallDecoration(x, y) {
    // 액자 프레임
    this.add.rectangle(x + 2, y + 2, 100, 80, 0x000000, 0.2);
    this.add.rectangle(x, y, 100, 80, COLORS.counterWood)
      .setStrokeStyle(4, COLORS.counterWoodDark);

    // 액자 내부 (쿠키 그림)
    this.add.rectangle(x, y, 85, 65, COLORS.cardBg);
    this.add.text(x, y, '🍪', { fontSize: '32px' }).setOrigin(0.5);
  }

  _createCounter() {
    const counterY = 640;

    // 카운터 그림자
    this.add.rectangle(GAME_WIDTH / 2, counterY + 8, GAME_WIDTH + 20, 200, 0x000000, 0.25);

    // 카운터 상단 (대리석 느낌)
    const topGradient = this.add.graphics();
    topGradient.fillGradientStyle(
      COLORS.counterTopHighlight, COLORS.counterTopHighlight,
      COLORS.counterTop, COLORS.counterTop, 1
    );
    topGradient.fillRect(0, counterY - 15, GAME_WIDTH, 30);

    // 상단 하이라이트 라인
    this.add.rectangle(GAME_WIDTH / 2, counterY - 12, GAME_WIDTH - 20, 3, 0xFFFFFF, 0.4);

    // 카운터 본체 (나무 그라데이션)
    const woodGradient = this.add.graphics();
    woodGradient.fillGradientStyle(
      COLORS.counterWoodLight, COLORS.counterWoodLight,
      COLORS.counterWood, COLORS.counterWood, 1
    );
    woodGradient.fillRect(0, counterY + 15, GAME_WIDTH, 200);

    // 나무 패널 디테일
    for (let i = 0; i < 5; i++) {
      const panelX = i * 150 + 75;
      // 패널 분리선
      this.add.rectangle(panelX + 73, counterY + 115, 3, 180, COLORS.counterWoodDark, 0.5);
      // 패널 하이라이트
      this.add.rectangle(panelX, counterY + 115, 140, 170, 0xFFFFFF, 0.03);
    }

    // 장식 몰딩 (상단)
    this.add.rectangle(GAME_WIDTH / 2, counterY + 25, GAME_WIDTH - 20, 8, COLORS.counterWoodDark);
    this.add.rectangle(GAME_WIDTH / 2, counterY + 22, GAME_WIDTH - 30, 2, COLORS.accent, 0.5);

    // 장식 몰딩 (하단)
    this.add.rectangle(GAME_WIDTH / 2, counterY + 195, GAME_WIDTH, 15, COLORS.counterWoodDark);

    // 진열된 쿠키 (유리 케이스 느낌)
    for (let i = 0; i < 3; i++) {
      const x = 150 + i * 210;
      const y = counterY - 5;

      // 쿠키 받침대 그림자
      this.add.ellipse(x, y + 25, 70, 15, 0x000000, 0.2);

      // 쿠키 받침대
      this.add.ellipse(x, y + 20, 65, 12, COLORS.counterTop);
      this.add.ellipse(x, y + 18, 60, 10, COLORS.counterTopHighlight);

      // 쿠키
      this.add.image(x, y, 'cookie_icon').setScale(0.9);

      // 반짝임 효과
      const sparkle = this.add.text(x + 20, y - 15, '✨', { fontSize: '14px' }).setAlpha(0.7);
      this.tweens.add({
        targets: sparkle,
        alpha: { from: 0.4, to: 0.9 },
        scale: { from: 0.8, to: 1.1 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        delay: i * 200
      });
    }
  }

  _createActionButtons() {
    const btnY = 950;
    const btnSpacing = 220;

    // 수락 버튼
    this.acceptBtn = this.add.image(GAME_WIDTH / 2 - btnSpacing / 2, btnY, 'btn_success')
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        soundManager.playUIClick();
        this.fx.buttonPress(this.acceptBtn, () => this._onAcceptOrder());
      });

    this.fx.addHoverEffect(this.acceptBtn, 1.1);

    this.acceptBtnText = this.add.text(GAME_WIDTH / 2 - btnSpacing / 2, btnY, '수락', {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: '#FFF8E7'
    }).setOrigin(0.5);

    // 거절 버튼
    this.rejectBtn = this.add.image(GAME_WIDTH / 2 + btnSpacing / 2, btnY, 'btn_danger')
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        soundManager.playUIClick();
        this.fx.buttonPress(this.rejectBtn, () => this._onRejectOrder());
      });

    this.fx.addHoverEffect(this.rejectBtn, 1.1);

    this.rejectBtnText = this.add.text(GAME_WIDTH / 2 + btnSpacing / 2, btnY, '거절', {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: '#FFF8E7'
    }).setOrigin(0.5);

    // 버튼 초기 비활성화
    this._setButtonsEnabled(false);
  }

  _createKitchenButton() {
    this.kitchenBtn = this.add.rectangle(GAME_WIDTH / 2, 1150, 300, 70, COLORS.primary)
      .setStrokeStyle(4, 0x2D2016)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        soundManager.playUIClick();
        this.fx.buttonPress(this.kitchenBtn, () => this._goToKitchen());
      });

    this.fx.addHoverEffect(this.kitchenBtn, 1.05);

    this.add.text(GAME_WIDTH / 2, 1150, '>> 주방으로 >>', {
      fontFamily: FONT_FAMILY,
      fontSize: '22px',
      color: '#FFF8E7'
    }).setOrigin(0.5);
  }

  _setButtonsEnabled(enabled) {
    const alpha = enabled ? 1 : 0.3;
    this.acceptBtn.setAlpha(alpha);
    this.acceptBtnText.setAlpha(alpha);
    this.rejectBtn.setAlpha(alpha);
    this.rejectBtnText.setAlpha(alpha);

    if (enabled) {
      this.acceptBtn.setInteractive({ useHandCursor: true });
      this.rejectBtn.setInteractive({ useHandCursor: true });
    } else {
      this.acceptBtn.disableInteractive();
      this.rejectBtn.disableInteractive();
    }
  }

  // ========================================
  // 손님 관리
  // ========================================

  _startCustomerSpawning() {
    // 첫 손님은 즉시 생성
    this._spawnCustomer();

    // 이후 주기적으로 손님 생성
    this.customerSpawnTimer = this.time.addEvent({
      delay: this.customerSpawnDelay,
      callback: this._trySpawnCustomer,
      callbackScope: this,
      loop: true
    });
  }

  _trySpawnCustomer() {
    if (!this.currentCustomer && this.customerQueue.length < this.maxQueueSize) {
      this._spawnCustomer();
    }
  }

  _spawnCustomer() {
    // Customer Prefab 생성
    const customer = new Customer(this, GAME_WIDTH / 2, this.customerSpawnY + 200);

    // 인내심 바 추가
    customer.addPatienceBar();

    // 손님 등장 애니메이션
    customer.spawn(this.customerSpawnY).then(() => {
      this.currentCustomer = customer;

      // 등장 효과
      this.fx.popIn(customer, 0, customer.scale);
      this.fx.microShake();
      soundManager.playNews(true); // 손님 등장 알림

      // 주문 생성 및 표시
      const order = customer.generateOrder();
      this._showOrderBubble(order);
      this._setButtonsEnabled(true);
    });
  }

  _showOrderBubble(order) {
    // 기존 말풍선 제거
    this.bubbleContainer.removeAll(true);

    // 말풍선 배경
    const bubble = this.add.image(0, 0, 'speech_bubble').setOrigin(0.5, 1);
    this.bubbleContainer.add(bubble);

    // 주문 텍스트
    const orderText = this.add.text(0, -90, '주문이요~', {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#2D2016'
    }).setOrigin(0.5);
    this.bubbleContainer.add(orderText);

    // 레시피 이름
    const recipeText = this.add.text(0, -55, order.recipe.name, {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: '#5D4037'
    }).setOrigin(0.5);
    this.bubbleContainer.add(recipeText);

    // 수량
    const qtyText = this.add.text(0, -25, `x ${order.quantity}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: '#8D6E63'
    }).setOrigin(0.5);
    this.bubbleContainer.add(qtyText);

    // 팝업 애니메이션
    this.bubbleContainer.setScale(0);
    this.bubbleContainer.setVisible(true);

    this.tweens.add({
      targets: this.bubbleContainer,
      scale: 1,
      duration: ANIM.bubblePopDuration,
      ease: 'Back.easeOut'
    });
  }

  _hideOrderBubble() {
    this.tweens.add({
      targets: this.bubbleContainer,
      scale: 0,
      duration: 200,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.bubbleContainer.setVisible(false);
      }
    });
  }

  // ========================================
  // 주문 처리
  // ========================================

  _onAcceptOrder() {
    if (!this.currentCustomer) return;

    const order = this.currentCustomer.order;

    // 주문 수락 효과
    this.fx.successFlash(100);
    this.fx.microShake();
    this.fx.heartBurst(this.currentCustomer.x, this.currentCustomer.y - 50, 6);
    this.currentCustomer.onOrderAccepted();
    soundManager.playSuccess(); // 주문 수락

    // 대기 주문에 추가
    if (this.pendingOrders.length < this.maxPendingOrders) {
      this.pendingOrders.push({
        ...order,
        completed: 0
      });

      // UI 씬에 알림
      this.events.emit('orderAccepted', order);
      const uiScene = this.scene.get('UIScene');
      if (uiScene) {
        uiScene.events.emit('orderAccepted', order);
      }
    }

    // 손님 퇴장
    this._customerLeave(true);
  }

  _onRejectOrder() {
    if (!this.currentCustomer) return;

    // 거절 효과음
    soundManager.playFail();

    // 거절 효과
    this.fx.customerAngry(this.currentCustomer.x, this.currentCustomer.y - 50);

    // 거절 처리 (Customer 메서드 사용)
    this.currentCustomer.onOrderRejected();

    // 손님 퇴장 (화남)
    this._customerLeave(false);
  }

  _customerLeave(happy) {
    if (!this.currentCustomer) return;

    this._hideOrderBubble();
    this._setButtonsEnabled(false);

    const customer = this.currentCustomer;
    this.currentCustomer = null;

    // 만족/불만족 이펙트 및 사운드
    if (happy) {
      this.fx.customerHappy(customer.x, customer.y - 30);
      soundManager.playTap(); // 기분 좋은 발걸음
    } else {
      soundManager.playBuzzer(); // 불만족 퇴장
    }

    // Customer Prefab의 leave 메서드 사용
    customer.leave(happy).then(() => {
      customer.destroy();
      // 다음 손님 호출
      this.time.delayedCall(500, () => this._trySpawnCustomer());
    });
  }

  // ========================================
  // 쿠키 완성 처리
  // ========================================

  _onCookieCompleted(cookieData) {
    // 대기 주문에서 매칭되는 것 찾기
    const orderIndex = this.pendingOrders.findIndex(
      o => o.recipe.key === cookieData.recipeKey && o.completed < o.quantity
    );

    if (orderIndex !== -1) {
      this.pendingOrders[orderIndex].completed++;

      // 주문 완료 체크
      if (this.pendingOrders[orderIndex].completed >= this.pendingOrders[orderIndex].quantity) {
        const completedOrder = this.pendingOrders.splice(orderIndex, 1)[0];
        this._completeOrder(completedOrder);
      }
    }
  }

  _completeOrder(order) {
    // GameManager를 통한 골드 획득
    const earnings = Math.floor(
      order.recipe.basePrice * order.quantity * order.customerType.tipMultiplier
    );

    gameManager.addGold(earnings);
    gameManager.recordCustomerServed();
    gameManager.addReputation(3);

    // 돈 획득 효과 및 사운드
    this.fx.moneyGain(GAME_WIDTH / 2, 600, earnings);
    soundManager.playCoin(); // 돈 획득

    // 성공 축하
    this.fx.starBurst(GAME_WIDTH / 2, 600, 10);
    soundManager.playFanfare(); // 주문 완료 축하
  }

  // ========================================
  // 씬 전환
  // ========================================

  _goToKitchen() {
    this.cameras.main.fadeOut(300, 0, 0, 0);

    // BGM 전환 (주방 음악으로)
    soundManager.switchBGM('kitchen');

    this.time.delayedCall(300, () => {
      this.scene.switch('KitchenScene');
    });
  }

  // ========================================
  // 이벤트 리스너
  // ========================================

  _setupEventListeners() {
    // [Fix] 바운드 핸들러 저장 (나중에 off() 호출 위해)
    this._onWakeHandler = () => {
      this.cameras.main.fadeIn(300);
      // BGM 전환 (카운터 음악으로)
      soundManager.switchBGM('counter');
    };

    this._onCookieCompletedHandler = (cookieData) => {
      this._onCookieCompleted(cookieData);
    };

    this._onCustomerLeftHandler = (customer) => {
      if (customer === this.currentCustomer) {
        this._customerLeave(false);
      }
    };

    // KitchenScene에서 돌아올 때
    this.events.on('wake', this._onWakeHandler);

    // 쿠키 완성 이벤트
    this.events.on('cookieCompleted', this._onCookieCompletedHandler);

    // GameManager 이벤트 구독
    this._unsubGoldChanged = gameManager.on('goldChanged', (gold) => {
      // UI씬에 전달
      const uiScene = this.scene.get('UIScene');
      if (uiScene) {
        uiScene.events.emit('goldChanged', gold);
      }
    });

    // 손님 인내심 소진 이벤트
    this.events.on('customerLeft', this._onCustomerLeftHandler);

    // [Fix] sleep 이벤트 핸들러 (switch 사용 시)
    this.events.on('sleep', this._onSleep, this);
  }

  // [Fix] Scene sleep 핸들러
  _onSleep() {
    // 현재 손님 애니메이션 정리 (필요시)
    if (this.currentCustomer && this.currentCustomer.idleTween) {
      this.currentCustomer.idleTween.pause();
    }
  }

  // ========================================
  // 업데이트
  // ========================================

  update(time, delta) {
    // 현재 손님 인내심 업데이트
    if (this.currentCustomer && this.currentCustomer.state === 'waiting') {
      this.currentCustomer.updatePatience(delta);
    }
  }

  // ========================================
  // 정리
  // ========================================

  shutdown() {
    // [Fix] Scene 내부 이벤트 리스너 제거
    this.events.off('wake', this._onWakeHandler);
    this.events.off('cookieCompleted', this._onCookieCompletedHandler);
    this.events.off('customerLeft', this._onCustomerLeftHandler);
    this.events.off('sleep', this._onSleep, this);

    // GameManager 이벤트 구독 해제
    if (this._unsubGoldChanged) {
      this._unsubGoldChanged();
    }

    // 타이머 정리
    if (this.customerSpawnTimer) {
      this.customerSpawnTimer.destroy();
      this.customerSpawnTimer = null;
    }

    // 현재 손님 정리
    if (this.currentCustomer) {
      this.currentCustomer.destroy();
      this.currentCustomer = null;
    }

    // 이펙트 매니저 정리
    if (this.fx) {
      this.fx.destroy();
      this.fx = null;
    }
  }
}
