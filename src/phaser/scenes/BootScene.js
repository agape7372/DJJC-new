/**
 * BootScene - 에셋 프리로딩 씬
 * 게임에 필요한 모든 이미지, 사운드, 폰트를 로드
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY } from '../config/GameConfig.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // 로딩 바 생성
    this.createLoadingBar();

    // 에셋이 없으므로 프로시저럴 텍스처 생성
    this.createProceduralAssets();
  }

  createLoadingBar() {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // 로딩 텍스트
    this.loadingText = this.add.text(centerX, centerY - 50, '로딩 중...', {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: '#5D4037'
    }).setOrigin(0.5);

    // 로딩 바 배경
    const barWidth = 400;
    const barHeight = 30;
    this.add.rectangle(centerX, centerY, barWidth, barHeight, 0x2D2016)
      .setStrokeStyle(4, 0x2D2016);

    // 로딩 바 진행
    this.progressBar = this.add.rectangle(
      centerX - barWidth / 2 + 5,
      centerY,
      0,
      barHeight - 10,
      COLORS.accent
    ).setOrigin(0, 0.5);

    // 로딩 진행 이벤트
    this.load.on('progress', (value) => {
      this.progressBar.width = (barWidth - 10) * value;
    });

    this.load.on('complete', () => {
      this.loadingText.setText('완료!');
    });
  }

  createProceduralAssets() {
    // 손님 스프라이트 (픽셀 아트 스타일 사각형)
    this.createCustomerTextures();

    // UI 요소들
    this.createUITextures();

    // 재료 텍스처
    this.createIngredientTextures();
  }

  createCustomerTextures() {
    const customerColors = {
      student: 0x4A90D9,
      hipster: 0x9B59B6,
      tourist: 0xF1C40F,
      grandma: 0xE67E22,
      businessman: 0x34495E
    };

    Object.entries(customerColors).forEach(([type, color]) => {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });

      // 몸통 (80x100 픽셀)
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, 30, 80, 100);

      // 머리 (원형)
      graphics.fillStyle(0xFFDBB4, 1); // 피부색
      graphics.fillCircle(40, 25, 25);

      // 눈
      graphics.fillStyle(0x2D2016, 1);
      graphics.fillCircle(32, 22, 4);
      graphics.fillCircle(48, 22, 4);

      // 입 (미소)
      graphics.lineStyle(2, 0x2D2016, 1);
      graphics.beginPath();
      graphics.arc(40, 30, 8, 0.2, Math.PI - 0.2);
      graphics.strokePath();

      // 특징적인 요소
      if (type === 'hipster') {
        // 힙스터: 수염
        graphics.fillStyle(0x5D4037, 1);
        graphics.fillRect(32, 35, 16, 8);
      } else if (type === 'grandma') {
        // 할머니: 안경
        graphics.lineStyle(2, 0x2D2016, 1);
        graphics.strokeCircle(32, 22, 8);
        graphics.strokeCircle(48, 22, 8);
        graphics.lineBetween(40, 22, 40, 22);
      } else if (type === 'businessman') {
        // 직장인: 넥타이
        graphics.fillStyle(0xC0392B, 1);
        graphics.fillTriangle(40, 40, 35, 80, 45, 80);
      }

      graphics.generateTexture(`customer_${type}`, 80, 130);
      graphics.destroy();
    });
  }

  createUITextures() {
    // 버튼 텍스처 팩토리 (DRY)
    const createBtnTexture = (name, color) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(color, 1);
      g.fillRoundedRect(0, 0, 200, 60, 8);
      g.lineStyle(4, 0x2D2016, 1);
      g.strokeRoundedRect(0, 0, 200, 60, 8);
      g.generateTexture(name, 200, 60);
      g.destroy();
    };

    // 버튼 텍스처 생성 (3개 → 1줄씩)
    createBtnTexture('btn_primary', COLORS.primary);
    createBtnTexture('btn_success', COLORS.success);
    createBtnTexture('btn_danger', COLORS.danger);

    // 말풍선 텍스처
    const bubbleGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    bubbleGraphics.fillStyle(0xFFFFFF, 1);
    bubbleGraphics.fillRoundedRect(0, 0, 300, 120, 16);
    bubbleGraphics.lineStyle(4, 0x2D2016, 1);
    bubbleGraphics.strokeRoundedRect(0, 0, 300, 120, 16);
    // 꼬리
    bubbleGraphics.fillStyle(0xFFFFFF, 1);
    bubbleGraphics.fillTriangle(150, 120, 130, 150, 170, 120);
    bubbleGraphics.lineStyle(4, 0x2D2016, 1);
    bubbleGraphics.lineBetween(130, 150, 150, 120);
    bubbleGraphics.lineBetween(130, 150, 170, 120);
    bubbleGraphics.generateTexture('speech_bubble', 300, 150);
    bubbleGraphics.destroy();

    // 쿠키 아이콘
    const cookieGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    cookieGraphics.fillStyle(0xD4A574, 1);
    cookieGraphics.fillCircle(30, 30, 28);
    cookieGraphics.lineStyle(3, 0x8B4513, 1);
    cookieGraphics.strokeCircle(30, 30, 28);
    // 토핑 점들
    cookieGraphics.fillStyle(0x7CB342, 1);
    cookieGraphics.fillCircle(20, 25, 5);
    cookieGraphics.fillCircle(38, 20, 4);
    cookieGraphics.fillCircle(30, 38, 5);
    cookieGraphics.generateTexture('cookie_icon', 60, 60);
    cookieGraphics.destroy();
  }

  createIngredientTextures() {
    const ingredients = {
      kadaif: 0xD4A574,
      pistachio: 0x7CB342,
      marshmallow: 0xFFEFD5,
      cocoa: 0x5D4037,
      gold: 0xFFD700
    };

    Object.entries(ingredients).forEach(([name, color]) => {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(color, 1);
      graphics.fillRoundedRect(0, 0, 80, 80, 12);
      graphics.lineStyle(3, 0x2D2016, 1);
      graphics.strokeRoundedRect(0, 0, 80, 80, 12);
      graphics.generateTexture(`ingredient_${name}`, 80, 80);
      graphics.destroy();
    });
  }

  create() {
    // 잠시 후 CounterScene으로 전환
    this.time.delayedCall(500, () => {
      this.scene.start('CounterScene');
      this.scene.launch('UIScene'); // UI는 병렬 실행
    });
  }
}
