/**
 * IntroState - 인트로 컷신
 * Typewriter Effect + Skip 기능 구현
 */

import { BaseState } from './BaseState.js';
import { GameState } from '../core/StateManager.js';

export class IntroState extends BaseState {
  constructor(game) {
    super(game);

    // 씬 데이터
    this.scenes = [
      {
        id: 'despair',
        background: '#1a1a2e',
        texts: [
          '하아... 오늘도 손님이 0명이라니...',
          '월세 낼 날짜는 다가오는데... 이대로 폐업인가...'
        ],
        emoji: '😔',
        flyAnimation: true
      },
      {
        id: 'discovery',
        background: '#16213e',
        texts: [
          '잠깐, 이 영상은 뭐지...?',
          '[SNS 영상] 쿠키를 반으로 쩍! 콰직-!',
          '피스타치오 스프레드가 용암처럼 흐르는...',
          '"지금 전국은 두쫀쿠 열풍! 없어서 못 판다!"'
        ],
        emoji: '📱',
        showComments: true
      },
      {
        id: 'pivot',
        background: '#0f3460',
        texts: [
          '이거야! 카다이프면과 피스타치오...',
          '그리고 나의 베이킹 실력이라면!',
          '사람들이 원하는 "진짜"를 만들어서',
          '이 가게를 다시 일으키는 거야!'
        ],
        emoji: '🔥',
        bgmChange: true
      },
      {
        id: 'action',
        background: '#1a1a2e',
        texts: [
          '[시스템] 창고에서 오래된 오븐을 발견했습니다.',
          '자, 먼저 시장에서 어렵게 구한',
          '카다이프부터 볶아볼까?'
        ],
        emoji: '🍪',
        isLast: true
      }
    ];

    this.currentScene = 0;
    this.currentText = 0;
    this.displayedChars = 0;
    this.charTimer = 0;
    this.charDelay = 0.05; // 타이핑 속도

    this.isTextComplete = false;
    this.flyX = 0;
    this.flyY = 0;
    this.flyAngle = 0;
  }

  enter() {
    this.game.inputManager.onTap = () => this.handleTap();
    this.currentScene = 0;
    this.currentText = 0;
    this.displayedChars = 0;
    this.isTextComplete = false;

    // 파리 초기 위치
    this.flyX = this.config.width * 0.3;
    this.flyY = this.config.height * 0.3;
  }

  exit() {
    this.game.inputManager.onTap = null;
  }

  handleTap() {
    const scene = this.scenes[this.currentScene];
    const currentFullText = scene.texts[this.currentText];

    if (!this.isTextComplete) {
      // 타이핑 중이면 즉시 완료
      this.displayedChars = currentFullText.length;
      this.isTextComplete = true;
    } else {
      // 다음 텍스트로
      this.currentText++;

      if (this.currentText >= scene.texts.length) {
        // 다음 씬으로
        this.currentScene++;
        this.currentText = 0;

        if (this.currentScene >= this.scenes.length) {
          // 인트로 종료 -> 튜토리얼로
          this.game.stateManager.changeState(GameState.TUTORIAL);
          return;
        }
      }

      this.displayedChars = 0;
      this.isTextComplete = false;
    }
  }

  update(dt) {
    const scene = this.scenes[this.currentScene];
    const currentFullText = scene.texts[this.currentText];

    // Typewriter Effect
    if (!this.isTextComplete) {
      this.charTimer += dt;
      if (this.charTimer >= this.charDelay) {
        this.charTimer = 0;
        this.displayedChars++;

        if (this.displayedChars >= currentFullText.length) {
          this.isTextComplete = true;
        }
      }
    }

    // 파리 애니메이션 (Scene 1)
    if (scene.flyAnimation) {
      this.flyAngle += dt * 2;
      this.flyX = this.config.width * 0.5 + Math.sin(this.flyAngle) * 100;
      this.flyY = this.config.height * 0.3 + Math.cos(this.flyAngle * 1.5) * 50;
    }
  }

  render(ctx) {
    const scene = this.scenes[this.currentScene];

    // 배경
    ctx.fillStyle = scene.background;
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    // 씬별 특수 효과
    this.renderSceneEffects(ctx, scene);

    // 이모지
    ctx.font = '80px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(scene.emoji, this.config.width / 2, this.config.height * 0.35);

    // 텍스트 박스
    this.renderTextBox(ctx, scene);

    // 스킵 안내
    ctx.font = '14px DungGeunMo, sans-serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('화면을 터치하여 진행', this.config.width / 2, this.config.height - 40);

    // 진행 표시
    this.renderProgress(ctx);
  }

  renderSceneEffects(ctx, scene) {
    // Scene 1: 파리 애니메이션
    if (scene.flyAnimation) {
      ctx.font = '24px sans-serif';
      ctx.fillText('🪰', this.flyX, this.flyY);
    }

    // Scene 2: 댓글 효과
    if (scene.showComments) {
      const comments = [
        { text: '"어디서 파나요?"', y: 0.5 },
        { text: '"새벽 4시부터 줄 섰어요 ㅠㅠ"', y: 0.55 },
        { text: '"3만원에 삽니다!!"', y: 0.6 }
      ];

      ctx.font = '12px DungGeunMo, sans-serif';
      ctx.textAlign = 'left';
      comments.forEach((c, i) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + i * 0.15})`;
        ctx.fillText(c.text, 50, this.config.height * c.y);
      });
    }

    // Scene 3: 불꽃 효과
    if (scene.bgmChange) {
      ctx.font = '30px sans-serif';
      ctx.fillText('✨', this.config.width * 0.2, this.config.height * 0.3);
      ctx.fillText('✨', this.config.width * 0.8, this.config.height * 0.35);
    }
  }

  renderTextBox(ctx, scene) {
    const boxY = this.config.height * 0.65;
    const boxHeight = 150;
    const padding = 20;

    // 텍스트 박스 배경
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(padding, boxY, this.config.width - padding * 2, boxHeight);

    // 테두리
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, boxY, this.config.width - padding * 2, boxHeight);

    // 텍스트
    const currentFullText = scene.texts[this.currentText];
    const displayText = currentFullText.substring(0, this.displayedChars);

    ctx.font = '18px DungGeunMo, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';

    // 텍스트 줄바꿈
    this.wrapText(ctx, displayText, padding + 15, boxY + 30, this.config.width - padding * 2 - 30, 28);

    // 타이핑 커서
    if (!this.isTextComplete) {
      ctx.fillStyle = '#f39c12';
      ctx.fillText('▌', padding + 15 + ctx.measureText(displayText).width, boxY + 30);
    }

    // 다음 표시
    if (this.isTextComplete) {
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#f39c12';
      ctx.textAlign = 'right';
      ctx.fillText('▼', this.config.width - padding - 15, boxY + boxHeight - 15);
    }
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const chars = text.split('');
    let line = '';
    let currentY = y;

    for (let i = 0; i < chars.length; i++) {
      const testLine = line + chars[i];
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, x, currentY);
        line = chars[i];
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  renderProgress(ctx) {
    const totalScenes = this.scenes.length;
    const dotSize = 8;
    const spacing = 20;
    const startX = (this.config.width - (totalScenes * dotSize + (totalScenes - 1) * spacing)) / 2;

    for (let i = 0; i < totalScenes; i++) {
      ctx.beginPath();
      ctx.arc(startX + i * (dotSize + spacing) + dotSize / 2, 50, dotSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = i === this.currentScene ? '#f39c12' : '#444';
      ctx.fill();
    }
  }
}
