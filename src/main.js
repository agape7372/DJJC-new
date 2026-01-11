/**
 * 두바이 쫀득 쿠키 타이쿤 - Entry Point
 */

import { Game } from './core/Game.js';

// 게임 인스턴스 생성 및 시작
const game = new Game('game-canvas');

// 게임 초기화 함수
async function startGame() {
  try {
    await game.init();
  } catch (error) {
    console.error('게임 초기화 실패:', error);
    // 에러 발생 시 화면에 표시
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = 390;
      canvas.height = 844;
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, 390, 844);
      ctx.fillStyle = '#ff0000';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Error: ' + error.message, 195, 400);
    }
  }
}

// DOM 로드 완료 후 게임 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame);
} else {
  startGame();
}

// 전역 접근용 (디버깅)
window.game = game;
