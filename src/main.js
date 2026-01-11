/**
 * 두바이 쫀득 쿠키 타이쿤 - Entry Point
 */

import { Game } from './core/Game.js';

// 게임 인스턴스 생성 및 시작
const game = new Game('game-canvas');

// DOM 로드 완료 후 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
  game.init();
});

// 전역 접근용 (디버깅)
window.game = game;
