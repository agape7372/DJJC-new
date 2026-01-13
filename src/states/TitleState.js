/**
 * TitleState - 타이틀 화면
 */

import { BaseState } from './BaseState.js';
import { GameState } from '../core/StateManager.js';

export class TitleState extends BaseState {
  constructor(game) {
    super(game);
    this.startButton = null;
    this.recipeButton = null;
    this.devModeButton = null;  // DEV 모드 토글 버튼
    this.devSkipButton = null;
    this.titleY = 0;
    this.titleBounce = 0;
  }

  enter() {
    // 입력 이벤트 설정
    this.game.inputManager.onTap = (pos) => this.handleTap(pos);

    // 버튼 위치 설정
    const btnWidth = 200;
    const btnHeight = 60;
    this.startButton = {
      x: (this.config.width - btnWidth) / 2,
      y: this.config.height * 0.55,
      width: btnWidth,
      height: btnHeight
    };

    // 레시피북 버튼
    this.recipeButton = {
      x: (this.config.width - btnWidth) / 2,
      y: this.config.height * 0.65,
      width: btnWidth,
      height: 50
    };

    // DEV 모드 토글 버튼 (항상 표시)
    this.devModeButton = {
      x: this.config.width - 70,
      y: 10,
      width: 60,
      height: 30
    };

    // 개발자 모드 스킵 버튼 (devMode일 때만)
    this.updateDevSkipButton();
  }

  updateDevSkipButton() {
    const btnWidth = 200;
    if (this.config.devMode) {
      this.devSkipButton = {
        x: (this.config.width - btnWidth) / 2,
        y: this.config.height * 0.75,
        width: btnWidth,
        height: 50
      };
    } else {
      this.devSkipButton = null;
    }
  }

  exit() {
    this.game.inputManager.onTap = null;
  }

  handleTap(pos) {
    // DEV 모드 토글 버튼
    if (this.isPointInRect(pos, this.devModeButton)) {
      this.game.sound.playUIClick();
      this.config.devMode = !this.config.devMode;
      this.config.autoSkip = this.config.devMode;
      this.config.debug = this.config.devMode;
      this.updateDevSkipButton();
      return;
    }

    if (this.isPointInRect(pos, this.startButton)) {
      this.game.sound.playUIClick();
      this.game.stateManager.changeState(GameState.INTRO);
    }

    // 레시피북
    if (this.isPointInRect(pos, this.recipeButton)) {
      this.game.sound.playUIClick();
      this.game.stateManager.changeState(GameState.RECIPE_BOOK);
    }

    // 개발자 모드: 바로 재료준비로
    if (this.devSkipButton && this.isPointInRect(pos, this.devSkipButton)) {
      this.game.sound.playUIClick();
      this.game.stateManager.changeState(GameState.PREP);
    }
  }

  update(dt) {
    // 타이틀 바운스 애니메이션
    this.titleBounce += dt * 3;
    this.titleY = Math.sin(this.titleBounce) * 10;
  }

  render(ctx) {
    // 배경
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    // 배경 장식 (쿠키 패턴)
    this.drawBackgroundPattern(ctx);

    // 타이틀
    const titleY = this.config.height * 0.3 + this.titleY;

    // 그림자
    ctx.fillStyle = '#c0392b';
    ctx.font = 'bold 36px DungGeunMo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('두바이 쫀득 쿠키', this.config.width / 2 + 3, titleY + 3);
    ctx.fillText('타이쿤', this.config.width / 2 + 3, titleY + 48);

    // 메인 타이틀
    ctx.fillStyle = '#f39c12';
    ctx.fillText('두바이 쫀득 쿠키', this.config.width / 2, titleY);
    ctx.fillText('타이쿤', this.config.width / 2, titleY + 45);

    // 쿠키 이모지 (임시)
    ctx.font = '64px sans-serif';
    ctx.fillText('🍪', this.config.width / 2, titleY - 80);

    // 시작 버튼
    this.drawButton(
      '게임 시작',
      this.startButton.x,
      this.startButton.y,
      this.startButton.width,
      this.startButton.height
    );

    // 레시피북 버튼
    const recipeProgress = this.game.recipes.getUnlockProgress();
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(this.recipeButton.x, this.recipeButton.y, this.recipeButton.width, this.recipeButton.height);
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.recipeButton.x, this.recipeButton.y, this.recipeButton.width, this.recipeButton.height);

    ctx.font = '18px DungGeunMo, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('📖 레시피북', this.recipeButton.x + this.recipeButton.width / 2, this.recipeButton.y + 25);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`${recipeProgress.unlocked}/${recipeProgress.total} 해금`, this.recipeButton.x + this.recipeButton.width / 2, this.recipeButton.y + 42);

    // 개발자 모드 스킵 버튼
    if (this.devSkipButton) {
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(this.devSkipButton.x, this.devSkipButton.y, this.devSkipButton.width, this.devSkipButton.height);
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 3;
      ctx.strokeRect(this.devSkipButton.x, this.devSkipButton.y, this.devSkipButton.width, this.devSkipButton.height);

      ctx.font = '16px DungGeunMo, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('[DEV] 스킵 → 재료준비', this.devSkipButton.x + this.devSkipButton.width / 2, this.devSkipButton.y + 32);
    }

    // DEV 모드 토글 버튼 (우상단)
    const devBtn = this.devModeButton;
    ctx.fillStyle = this.config.devMode ? '#e74c3c' : '#555';
    ctx.beginPath();
    ctx.roundRect(devBtn.x, devBtn.y, devBtn.width, devBtn.height, 5);
    ctx.fill();
    ctx.strokeStyle = this.config.devMode ? '#c0392b' : '#777';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 12px DungGeunMo, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('DEV', devBtn.x + devBtn.width / 2, devBtn.y + 20);

    // 버전 정보
    ctx.font = '12px DungGeunMo, sans-serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('v1.0.0' + (this.config.devMode ? ' [DEV MODE]' : ''), this.config.width / 2, this.config.height - 30);
  }

  drawBackgroundPattern(ctx) {
    ctx.globalAlpha = 0.1;
    ctx.font = '30px sans-serif';
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 15; j++) {
        const x = i * 60 + (j % 2) * 30;
        const y = j * 60;
        ctx.fillText('🍪', x, y);
      }
    }
    ctx.globalAlpha = 1;
  }
}
