/**
 * 두바이 쫀득 쿠키 타이쿤 - Entry Point
 */

import { Game } from './core/Game.js';

// 게임 인스턴스 생성 및 시작
const game = new Game('game-canvas');

// DOM 로드 완료 후 게임 초기화
// 모듈 스크립트는 deferred되므로 이미 로드되었을 수 있음
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    game.init();
  });
} else {
  // DOM이 이미 로드됨
  game.init();
}

// 전역 접근용 (디버깅)
window.game = game;
