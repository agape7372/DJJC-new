/**
 * UIScene - 게임 오버레이 UI
 * 골드, 설정, 대기 주문 등 항상 표시되는 UI 요소
 * OOP 아키텍처: GameManager 이벤트 기반 업데이트
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY } from '../config/GameConfig.js';
import gameManager from '../managers/GameManager.js';
import { soundManager } from '../../core/SoundManager.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // [Fix] 캐시 초기화 (update loop 최적화용)
    this._cachedDay = gameManager.day;
    this._cachedReputation = gameManager.reputation;

    // 상단 헤더 바
    this._createHeader();

    // 대기 주문 표시
    this._createPendingOrdersUI();

    // 이벤트 리스너 설정
    this._setupEventListeners();
  }

  // ========================================
  // 헤더 UI
  // ========================================

  _createHeader() {
    // 헤더 그라데이션 배경
    const headerGradient = this.add.graphics();
    headerGradient.fillGradientStyle(0x6D4C41, 0x6D4C41, 0x4E342E, 0x4E342E, 1);
    headerGradient.fillRect(0, 0, GAME_WIDTH, 80);

    // 헤더 상단 하이라이트
    this.add.rectangle(GAME_WIDTH / 2, 2, GAME_WIDTH, 4, 0x8D6E63, 0.6);

    // 헤더 하단 장식선
    this.add.rectangle(GAME_WIDTH / 2, 78, GAME_WIDTH, 2, 0xFFB74D, 0.6);
    this.add.rectangle(GAME_WIDTH / 2, 80, GAME_WIDTH, 4, 0x2D2016);

    // 골드 영역 배경
    const goldBg = this.add.graphics();
    goldBg.fillStyle(0x000000, 0.2);
    goldBg.fillRoundedRect(15, 20, 150, 40, 8);

    // 골드 아이콘 배경
    this.add.circle(40, 40, 18, 0xFFD700, 0.3);

    // 골드 아이콘
    this.add.text(40, 40, '🪙', {
      fontSize: '22px'
    }).setOrigin(0.5);

    // 골드 텍스트 (GameManager에서 가져옴)
    this.goldText = this.add.text(70, 40, this._formatGold(gameManager.gold), {
      fontFamily: FONT_FAMILY,
      fontSize: '22px',
      color: '#FFD700',
      stroke: '#3E2723',
      strokeThickness: 2
    }).setOrigin(0, 0.5);

    // 일차/평판 영역 배경
    const dayBg = this.add.graphics();
    dayBg.fillStyle(0x000000, 0.2);
    dayBg.fillRoundedRect(GAME_WIDTH - 130, 15, 115, 50, 8);

    // 일차 표시
    this.dayText = this.add.text(GAME_WIDTH - 25, 30, `${gameManager.day}일차`, {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#FFF8E7',
      stroke: '#3E2723',
      strokeThickness: 1
    }).setOrigin(1, 0.5);

    // 평판 표시 (별 아이콘 추가)
    this.reputationText = this.add.text(GAME_WIDTH - 25, 52, `⭐ ${gameManager.reputation}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#FFCC80'
    }).setOrigin(1, 0.5);

    // 설정 버튼 (더 세련되게)
    const settingsBtnShadow = this.add.rectangle(GAME_WIDTH / 2 + 2, 42, 50, 50, 0x000000, 0.3);
    settingsBtnShadow.setStrokeStyle(0);

    this.settingsBtn = this.add.rectangle(GAME_WIDTH / 2, 40, 50, 50, 0x8D6E63)
      .setStrokeStyle(3, 0x5D4037)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        soundManager.playUIClick();
        this._openSettings();
      })
      .on('pointerover', () => {
        this.tweens.add({
          targets: this.settingsBtn,
          scale: 1.1,
          duration: 100
        });
      })
      .on('pointerout', () => {
        this.tweens.add({
          targets: this.settingsBtn,
          scale: 1,
          duration: 100
        });
      });

    // 설정 아이콘 (기어)
    this.add.text(GAME_WIDTH / 2, 40, '⚙️', {
      fontSize: '26px'
    }).setOrigin(0.5);
  }

  // ========================================
  // 대기 주문 UI
  // ========================================

  _createPendingOrdersUI() {
    // 대기 주문 컨테이너 (하단 좌측)
    this.ordersContainer = this.add.container(20, GAME_HEIGHT - 105);

    // 배경 그라데이션 효과
    const bgGradient = this.add.graphics();
    bgGradient.fillGradientStyle(0x3E2723, 0x3E2723, 0x2D2016, 0x2D2016, 0.9);
    bgGradient.fillRoundedRect(0, 0, 210, 90, 10);
    this.ordersContainer.add(bgGradient);

    // 테두리
    const border = this.add.graphics();
    border.lineStyle(2, 0xFFB74D, 0.6);
    border.strokeRoundedRect(0, 0, 210, 90, 10);
    this.ordersContainer.add(border);

    // 상단 장식선
    const topDecor = this.add.rectangle(105, 3, 190, 2, 0x8D6E63, 0.5);
    this.ordersContainer.add(topDecor);

    // 라벨 배경
    const labelBg = this.add.rectangle(105, 14, 100, 18, 0x000000, 0.3);
    this.ordersContainer.add(labelBg);

    // 라벨
    const label = this.add.text(105, 14, '📋 대기 주문', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#FFCC80'
    }).setOrigin(0.5);
    this.ordersContainer.add(label);

    // 주문 슬롯들
    this.orderSlots = [];
    for (let i = 0; i < 4; i++) {
      const slotX = 28 + i * 46;
      const slotY = 55;

      // 슬롯 그림자
      const slotShadow = this.add.rectangle(slotX + 2, slotY + 2, 40, 40, 0x000000, 0.3);
      this.ordersContainer.add(slotShadow);

      // 슬롯 본체
      const slot = this.add.rectangle(slotX, slotY, 40, 40, 0x1a1a2e)
        .setStrokeStyle(2, 0x5D4037);
      this.ordersContainer.add(slot);

      // 슬롯 번호 (빈 상태일 때)
      const slotNum = this.add.text(slotX, slotY, `${i + 1}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '16px',
        color: '#3E2723'
      }).setOrigin(0.5).setAlpha(0.3);
      this.ordersContainer.add(slotNum);

      // 주문 텍스트
      const slotText = this.add.text(slotX, slotY, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '11px',
        color: '#FFF8E7'
      }).setOrigin(0.5);
      this.ordersContainer.add(slotText);

      this.orderSlots.push({ slot, text: slotText, numText: slotNum, order: null });
    }
  }

  // ========================================
  // 이벤트 리스너
  // ========================================

  _setupEventListeners() {
    // [Fix] 바운드 핸들러 저장
    this._onGoldChangedHandler = (newGold) => {
      this._updateGold(newGold);
    };

    this._onOrderAcceptedHandler = (order) => {
      this._addPendingOrder(order);
    };

    this._onOrderCompletedHandler = (orderIndex) => {
      this._removePendingOrder(orderIndex);
    };

    // Phaser 씬 이벤트
    this.events.on('goldChanged', this._onGoldChangedHandler);
    this.events.on('orderAccepted', this._onOrderAcceptedHandler);
    this.events.on('orderCompleted', this._onOrderCompletedHandler);

    // GameManager 이벤트 구독
    this._unsubGold = gameManager.on('goldChanged', (gold) => {
      this._updateGold(gold);
    });

    this._unsubReputation = gameManager.on('reputationChanged', (rep) => {
      this._cachedReputation = rep; // [Fix] 캐시 업데이트
      this.reputationText.setText(`평판: ${rep}`);
    });

    this._unsubDay = gameManager.on('dayChanged', (day) => {
      this._cachedDay = day; // [Fix] 캐시 업데이트
      this.dayText.setText(`${day}일차`);
    });
  }

  // ========================================
  // 골드 업데이트
  // ========================================

  _formatGold(gold) {
    if (gold >= 1000000) {
      return `${(gold / 1000000).toFixed(1)}M`;
    } else if (gold >= 1000) {
      return `${(gold / 1000).toFixed(1)}K`;
    }
    return gold.toString();
  }

  _updateGold(newGold) {
    // 골드 증가 사운드 (증가할 때만)
    const prevGold = this._cachedGold || 0;
    if (newGold > prevGold) {
      soundManager.playCoin();
    }
    this._cachedGold = newGold;

    // 골드 증가 애니메이션
    const currentText = this.goldText.text;
    let currentGold = 0;

    // 현재 표시된 값 파싱
    if (currentText.includes('M')) {
      currentGold = parseFloat(currentText) * 1000000;
    } else if (currentText.includes('K')) {
      currentGold = parseFloat(currentText) * 1000;
    } else {
      currentGold = parseInt(currentText) || 0;
    }

    // 카운터 애니메이션
    this.tweens.addCounter({
      from: currentGold,
      to: newGold,
      duration: 500,
      ease: 'Power2',
      onUpdate: (tween) => {
        this.goldText.setText(this._formatGold(Math.floor(tween.getValue())));
      }
    });

    // 반짝임 효과
    this.tweens.add({
      targets: this.goldText,
      scale: { from: 1.2, to: 1 },
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  // ========================================
  // 대기 주문 관리
  // ========================================

  _addPendingOrder(order) {
    // 빈 슬롯 찾기
    const emptyIndex = this.orderSlots.findIndex(s => s.order === null);

    if (emptyIndex !== -1) {
      const slot = this.orderSlots[emptyIndex];
      slot.order = order;
      slot.slot.setFillStyle(COLORS.accent);
      slot.text.setText(`0/${order.quantity}`);
      slot.numText.setAlpha(0); // 번호 숨기기

      // 주문 추가 사운드
      soundManager.playTap();

      // 팝업 효과
      this.tweens.add({
        targets: slot.slot,
        scale: { from: 0.5, to: 1 },
        duration: 200,
        ease: 'Back.easeOut'
      });
    }
  }

  _removePendingOrder(orderIndex) {
    if (this.orderSlots[orderIndex]) {
      const slot = this.orderSlots[orderIndex];
      slot.order = null;
      slot.slot.setFillStyle(0x1a1a2e);
      slot.text.setText('');
      slot.numText.setAlpha(0.3); // 번호 다시 표시

      // 주문 완료 사운드
      soundManager.playSuccess();

      // 완료 효과
      this.tweens.add({
        targets: slot.slot,
        scale: { from: 1.2, to: 1 },
        duration: 200,
        ease: 'Power2'
      });
    }
  }

  _updatePendingOrder(orderIndex, completed, total) {
    if (this.orderSlots[orderIndex]) {
      this.orderSlots[orderIndex].text.setText(`${completed}/${total}`);

      // 진행 표시 색상
      if (completed >= total) {
        this.orderSlots[orderIndex].slot.setFillStyle(COLORS.success);
      }
    }
  }

  // ========================================
  // 설정 모달
  // ========================================

  _openSettings() {
    // 오버레이 (더 부드럽게)
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x1A1A1A, 0.8
    ).setInteractive();

    // 모달 컨테이너
    const modalContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    // 모달 그림자
    const modalShadow = this.add.rectangle(8, 8, 400, 500, 0x000000, 0.4);
    modalContainer.add(modalShadow);

    // 모달 배경 그라데이션
    const modalBg = this.add.graphics();
    modalBg.fillGradientStyle(0xFFFBF5, 0xFFFBF5, 0xF5EDE3, 0xF5EDE3, 1);
    modalBg.fillRoundedRect(-200, -250, 400, 500, 15);
    modalContainer.add(modalBg);

    // 모달 테두리
    const modalBorder = this.add.graphics();
    modalBorder.lineStyle(4, 0x6D4C41);
    modalBorder.strokeRoundedRect(-200, -250, 400, 500, 15);
    modalContainer.add(modalBorder);

    // 상단 장식 바
    const topBar = this.add.rectangle(0, -245, 380, 8, 0xFFB74D, 0.8);
    modalContainer.add(topBar);

    // 타이틀 배경
    const titleBg = this.add.rectangle(0, -200, 140, 40, 0x6D4C41, 0.1);
    modalContainer.add(titleBg);

    // 타이틀
    const title = this.add.text(0, -200, '⚙️ 설정', {
      fontFamily: FONT_FAMILY,
      fontSize: '26px',
      color: '#5D4037'
    }).setOrigin(0.5);
    modalContainer.add(title);

    // BGM 볼륨
    const bgmLabel = this.add.text(-150, -100, 'BGM 볼륨', {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#5D4037'
    }).setOrigin(0, 0.5);
    modalContainer.add(bgmLabel);

    const bgmBar = this._createVolumeBar(modalContainer, 50, -100, soundManager.bgmVolume, (val) => {
      gameManager.settings.bgmVolume = val;
      soundManager.setBGMVolume(val);
    });

    // SFX 볼륨
    const sfxLabel = this.add.text(-150, -30, 'SFX 볼륨', {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#5D4037'
    }).setOrigin(0, 0.5);
    modalContainer.add(sfxLabel);

    const sfxBar = this._createVolumeBar(modalContainer, 50, -30, soundManager.sfxVolume, (val) => {
      gameManager.settings.sfxVolume = val;
      soundManager.setSFXVolume(val);
    });

    // 진동 토글
    const vibLabel = this.add.text(-150, 40, '진동', {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#5D4037'
    }).setOrigin(0, 0.5);
    modalContainer.add(vibLabel);

    const vibToggle = this.add.rectangle(100, 40, 60, 30, gameManager.settings.vibration ? COLORS.success : 0x666666)
      .setStrokeStyle(2, 0x2D2016)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        soundManager.playUIClick();
        gameManager.settings.vibration = !gameManager.settings.vibration;
        vibToggle.setFillStyle(gameManager.settings.vibration ? COLORS.success : 0x666666);
        vibText.setText(gameManager.settings.vibration ? 'ON' : 'OFF');
      });
    modalContainer.add(vibToggle);

    const vibText = this.add.text(100, 40, gameManager.settings.vibration ? 'ON' : 'OFF', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#FFF8E7'
    }).setOrigin(0.5);
    modalContainer.add(vibText);

    // 데이터 초기화 버튼
    const resetBtn = this.add.rectangle(0, 120, 200, 50, COLORS.danger)
      .setStrokeStyle(3, 0x2D2016)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        soundManager.playUIClick();
        if (confirm('정말 모든 데이터를 초기화하시겠습니까?')) {
          soundManager.playBuzzer(); // 초기화 경고음
          gameManager.reset();
          this._closeModal(overlay, modalContainer);
        }
      });
    modalContainer.add(resetBtn);

    const resetText = this.add.text(0, 120, '데이터 초기화', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#FFF8E7'
    }).setOrigin(0.5);
    modalContainer.add(resetText);

    // 닫기 버튼
    const closeBtn = this.add.rectangle(0, 200, 200, 60, COLORS.primary)
      .setStrokeStyle(3, 0x2D2016)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        soundManager.playUIClick();
        this._closeModal(overlay, modalContainer);
      });
    modalContainer.add(closeBtn);

    const closeText = this.add.text(0, 200, '닫기', {
      fontFamily: FONT_FAMILY,
      fontSize: '22px',
      color: '#FFF8E7'
    }).setOrigin(0.5);
    modalContainer.add(closeText);

    // 모달 등장 애니메이션
    modalContainer.setScale(0);
    this.tweens.add({
      targets: modalContainer,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });

    // 참조 저장
    this.currentModal = { overlay, container: modalContainer };
  }

  _createVolumeBar(container, x, y, initialValue, onChange) {
    // 바 배경 (인셋 효과)
    const barInset = this.add.rectangle(x, y, 124, 24, 0x3E2723, 0.3);
    container.add(barInset);

    const barBg = this.add.rectangle(x, y, 120, 20, 0x4E342E)
      .setStrokeStyle(2, 0x3E2723);
    container.add(barBg);

    // 채우기 그라데이션 효과
    const barFill = this.add.rectangle(x - 55, y, initialValue * 110, 14, 0xFFB74D)
      .setOrigin(0, 0.5);
    container.add(barFill);

    // 채우기 하이라이트
    const barHighlight = this.add.rectangle(x - 55, y - 3, initialValue * 110, 4, 0xFFCC80, 0.5)
      .setOrigin(0, 0.5);
    container.add(barHighlight);

    // 핸들 (드래그 표시)
    const handle = this.add.circle(x - 55 + initialValue * 110, y, 8, 0xFFFFFF)
      .setStrokeStyle(2, 0x5D4037);
    container.add(handle);

    // 퍼센트 표시
    const percent = this.add.text(x + 75, y, `${Math.round(initialValue * 100)}%`, {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#8D6E63'
    }).setOrigin(0, 0.5);
    container.add(percent);

    // 클릭으로 볼륨 조절
    barBg.setInteractive({ useHandCursor: true })
      .on('pointerdown', (pointer) => {
        const localX = pointer.x - (GAME_WIDTH / 2 + x - 60);
        const value = Phaser.Math.Clamp(localX / 120, 0, 1);
        barFill.width = value * 110;
        barHighlight.width = value * 110;
        handle.x = x - 55 + value * 110;
        percent.setText(`${Math.round(value * 100)}%`);
        onChange(value);
        soundManager.playTap();
      });

    return { bg: barBg, fill: barFill, handle, percent };
  }

  _closeModal(overlay, container) {
    this.tweens.add({
      targets: container,
      scale: 0,
      duration: 150,
      ease: 'Back.easeIn',
      onComplete: () => {
        overlay.destroy();
        container.destroy();
        this.currentModal = null;
      }
    });
  }

  // ========================================
  // 업데이트
  // ========================================

  update(time, delta) {
    // [Fix] 캐시된 값과 비교하여 GC 압력 제거
    // 매 프레임 새 문자열 생성 방지
    if (this._cachedDay !== gameManager.day) {
      this._cachedDay = gameManager.day;
      this.dayText.setText(`${this._cachedDay}일차`);
    }
    if (this._cachedReputation !== gameManager.reputation) {
      this._cachedReputation = gameManager.reputation;
      this.reputationText.setText(`평판: ${this._cachedReputation}`);
    }
  }

  // ========================================
  // 정리
  // ========================================

  shutdown() {
    // [Fix] Scene 내부 이벤트 리스너 제거
    this.events.off('goldChanged', this._onGoldChangedHandler);
    this.events.off('orderAccepted', this._onOrderAcceptedHandler);
    this.events.off('orderCompleted', this._onOrderCompletedHandler);

    // GameManager 이벤트 구독 해제
    if (this._unsubGold) {
      this._unsubGold();
      this._unsubGold = null;
    }
    if (this._unsubReputation) {
      this._unsubReputation();
      this._unsubReputation = null;
    }
    if (this._unsubDay) {
      this._unsubDay();
      this._unsubDay = null;
    }

    // 모달이 열려있으면 닫기
    if (this.currentModal) {
      this.currentModal.overlay.destroy();
      this.currentModal.container.destroy();
      this.currentModal = null;
    }
  }
}
