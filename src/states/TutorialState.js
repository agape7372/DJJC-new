/**
 * TutorialState - 튜토리얼 상태
 */

import { BaseState } from './BaseState.js';
import { GameState } from '../core/StateManager.js';

export class TutorialState extends BaseState {
  constructor(game) {
    super(game);
    this.step = 0;
    this.tutorials = [
      {
        title: '재료 준비',
        desc: '카다이프, 피스타치오, 마시멜로우를\n미니게임으로 준비해요!',
        icon: '🥜'
      },
      {
        title: '베이킹',
        desc: '반죽을 동그랗게 굴려서\n완벽한 쿠키 모양을 만들어요!',
        icon: '🔥'
      },
      {
        title: '데코레이션',
        desc: '코코아 파우더와 토핑으로\n예쁘게 꾸며주세요!',
        icon: '✨'
      },
      {
        title: '판매',
        desc: '시세를 보고 최적의 타이밍에\n쿠키를 판매하세요!',
        icon: '💰'
      }
    ];
    this.skipButton = null;
  }

  enter() {
    this.step = 0;
    this.game.inputManager.onTap = (pos) => this.handleTap(pos);

    this.skipButton = {
      x: this.config.width - 100,
      y: 20,
      width: 80,
      height: 35
    };
  }

  exit() {
    this.game.inputManager.onTap = null;
  }

  handleTap(pos) {
    // 스킵 버튼 체크
    if (this.isPointInRect(pos, this.skipButton)) {
      this.game.stateManager.changeState(GameState.PREP);
      return;
    }

    // 다음 단계
    this.step++;
    if (this.step >= this.tutorials.length) {
      this.game.stateManager.changeState(GameState.PREP);
    }
  }

  update(dt) {
    // 애니메이션 업데이트
  }

  render(ctx) {
    // 배경
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    const tutorial = this.tutorials[this.step];

    // 아이콘
    ctx.font = '100px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(tutorial.icon, this.config.width / 2, this.config.height * 0.35);

    // 제목
    ctx.font = 'bold 28px DungGeunMo, sans-serif';
    ctx.fillStyle = '#f39c12';
    ctx.fillText(tutorial.title, this.config.width / 2, this.config.height * 0.5);

    // 설명
    ctx.font = '16px DungGeunMo, sans-serif';
    ctx.fillStyle = '#fff';
    const lines = tutorial.desc.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, this.config.width / 2, this.config.height * 0.58 + i * 25);
    });

    // 진행 표시
    this.renderProgress(ctx);

    // 스킵 버튼
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(this.skipButton.x, this.skipButton.y, this.skipButton.width, this.skipButton.height);
    ctx.font = '14px DungGeunMo, sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('SKIP', this.skipButton.x + this.skipButton.width / 2, this.skipButton.y + 22);

    // 터치 안내
    ctx.font = '14px DungGeunMo, sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('터치하여 계속', this.config.width / 2, this.config.height - 50);
  }

  renderProgress(ctx) {
    const total = this.tutorials.length;
    const barWidth = 200;
    const barHeight = 6;
    const x = (this.config.width - barWidth) / 2;
    const y = this.config.height * 0.75;

    // 배경 바
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, barWidth, barHeight);

    // 진행 바
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(x, y, barWidth * ((this.step + 1) / total), barHeight);

    // 단계 표시
    ctx.font = '12px DungGeunMo, sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.step + 1} / ${total}`, this.config.width / 2, y + 25);
  }
}
