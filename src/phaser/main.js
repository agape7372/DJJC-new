/**
 * 두바이 쫀득 쿠키 타이쿤 - Phaser.js Entry Point
 * Good Pizza, Great Pizza 스타일 모바일 타이쿤 게임
 *
 * 아키텍처:
 * - GameManager: 싱글톤 상태 관리 (골드, 인벤토리, 통계)
 * - Scenes: BootScene → CounterScene ↔ KitchenScene (UIScene 오버레이)
 * - Prefabs: Customer, Ingredient, Cookie (OOP 게임 오브젝트)
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config/GameConfig.js';
import { BootScene } from './scenes/BootScene.js';
import { CounterScene } from './scenes/CounterScene.js';
import { KitchenScene } from './scenes/KitchenScene.js';
import { UIScene } from './scenes/UIScene.js';
import { KadaifSliceScene } from './scenes/minigames/KadaifSliceScene.js';
import { PistachioCrushScene } from './scenes/minigames/PistachioCrushScene.js';
import { MarshmallowMeltScene } from './scenes/minigames/MarshmallowMeltScene.js';
import { CocoaHelixScene } from './scenes/minigames/CocoaHelixScene.js';
import gameManager from './managers/GameManager.js';

// Phaser 게임 설정
const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: COLORS.background,

  // 픽셀 아트 설정 (도트가 뭉개지지 않게)
  pixelArt: true,
  antialias: false,
  roundPixels: true,

  // 모바일 최적화 스케일 설정
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 360,
      height: 640
    },
    max: {
      width: 720,
      height: 1280
    }
  },

  // 물리 엔진 설정 (Kitchen에서 사용)
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },

  // 입력 설정
  input: {
    activePointers: 3,  // 멀티터치 지원
    touch: {
      capture: true
    }
  },

  // Scene 목록
  scene: [BootScene, CounterScene, KitchenScene, UIScene, KadaifSliceScene, PistachioCrushScene, MarshmallowMeltScene, CocoaHelixScene],

  // 콜백
  callbacks: {
    postBoot: (game) => {
      // GameManager 초기화 (Phaser 게임 인스턴스 전달)
      gameManager.init(game);
      console.log('[Main] GameManager 초기화 완료');
    }
  }
};

// 게임 인스턴스 생성
const game = new Phaser.Game(config);

// 전역 접근 (디버깅용)
window.game = game;
window.gameManager = gameManager;

// 개발 모드 디버그 헬퍼
if (import.meta.env.DEV) {
  window.debug = {
    // 골드 추가
    addGold: (amount) => {
      gameManager.addGold(amount);
      console.log(`[Debug] +${amount}G → 현재: ${gameManager.gold}G`);
    },

    // 재료 추가
    addIngredient: (type, amount = 10) => {
      gameManager.addIngredient(type, amount);
      console.log(`[Debug] +${amount} ${type}`);
    },

    // 모든 재료 추가
    fillIngredients: () => {
      ['kadaif', 'pistachio', 'marshmallow', 'cocoa', 'gold'].forEach(type => {
        gameManager.addIngredient(type, 100);
      });
      console.log('[Debug] 모든 재료 100개 추가');
    },

    // 다음 날로
    nextDay: () => {
      gameManager.advanceDay();
      console.log(`[Debug] ${gameManager.day}일차`);
    },

    // 상태 출력
    status: () => {
      gameManager.debug();
    },

    // 리셋
    reset: () => {
      gameManager.reset();
      console.log('[Debug] 게임 리셋');
    }
  };

  console.log('🔧 개발 모드 활성화');
  console.log('   debug.addGold(1000) - 골드 추가');
  console.log('   debug.fillIngredients() - 재료 채우기');
  console.log('   debug.nextDay() - 다음 날로');
  console.log('   debug.status() - 상태 출력');
  console.log('   debug.reset() - 리셋');
}

console.log('🍪 두바이 쫀득 쿠키 타이쿤 (Phaser.js) 시작!');
