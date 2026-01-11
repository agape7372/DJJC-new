/**
 * Game - 메인 게임 엔진 클래스
 * 게임 루프, 상태 관리, 렌더링을 담당
 */

import { StateManager, GameState } from './StateManager.js';
import { InputManager } from './InputManager.js';
import { AssetManager } from './AssetManager.js';
import { AudioManager } from './AudioManager.js';
import { Storage } from '../utils/Storage.js';
import { soundManager } from './SoundManager.js';
import { particleSystem, COLORS } from './ParticleSystem.js';
import { recipeManager } from './RecipeManager.js';

export class Game {
  constructor(canvasId) {
    this.canvasId = canvasId;
    this.canvas = null;
    this.ctx = null;

    // 게임 설정
    this.config = {
      width: 390,      // 모바일 기준 너비
      height: 844,     // 모바일 기준 높이
      targetFPS: 60,
      debug: true,     // 개발자 모드
      devMode: true    // 스토리/튜토리얼 스킵 가능
    };

    // 매니저들
    this.stateManager = null;
    this.inputManager = null;
    this.assetManager = null;
    this.audioManager = null;
    this.storage = null;

    // 사운드 & 파티클 시스템 (전역 싱글톤 참조)
    this.sound = soundManager;
    this.particles = particleSystem;
    this.colors = COLORS;
    this.recipes = recipeManager;

    // 게임 루프
    this.lastTime = 0;
    this.deltaTime = 0;
    this.isRunning = false;

    // 쿠키 스탯
    this.cookieStats = {
      flavor: 0,      // 풍미
      texture: 0,     // 식감
      sweetness: 0,   // 달콤함
      completion: 0,  // 완성도
      visual: 0       // 비주얼
    };

    // 플레이어 데이터
    this.playerData = {
      money: 0,
      day: 1,
      reputation: 0,
      regulars: []    // 단골 목록
    };
  }

  /**
   * 게임 초기화
   */
  async init() {
    console.log('🍪 두바이 쫀득 쿠키 타이쿤 초기화 중...');

    // 캔버스 설정
    this.setupCanvas();

    // 매니저 초기화
    this.storage = new Storage('djjc_save');
    this.assetManager = new AssetManager();
    this.audioManager = new AudioManager();
    this.inputManager = new InputManager(this.canvas);
    this.stateManager = new StateManager(this);

    // 저장 데이터 로드
    this.loadGameData();

    // 에셋 로드
    await this.loadAssets();

    // 초기 상태 설정
    this.stateManager.changeState(GameState.TITLE);

    // 게임 루프 시작
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.gameLoop(time));

    console.log('🍪 게임 시작!');
  }

  /**
   * 캔버스 설정
   */
  setupCanvas() {
    this.canvas = document.getElementById(this.canvasId);
    this.ctx = this.canvas.getContext('2d');

    // 캔버스 크기 설정
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // 픽셀 아트 렌더링 설정
    this.ctx.imageSmoothingEnabled = false;
  }

  /**
   * 반응형 캔버스 크기 조절
   */
  resizeCanvas() {
    const container = this.canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // 비율 유지하면서 크기 조절
    const aspectRatio = this.config.width / this.config.height;
    let width, height;

    if (containerWidth / containerHeight > aspectRatio) {
      height = containerHeight;
      width = height * aspectRatio;
    } else {
      width = containerWidth;
      height = width / aspectRatio;
    }

    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;

    // 스케일 팩터 저장 (터치 좌표 변환용)
    this.scaleFactor = {
      x: this.config.width / width,
      y: this.config.height / height
    };
  }

  /**
   * 에셋 로드
   */
  async loadAssets() {
    // TODO: 실제 에셋 로드 구현
    console.log('에셋 로딩 중...');

    // 임시: 로딩 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('에셋 로딩 완료!');
  }

  /**
   * 게임 데이터 로드
   */
  loadGameData() {
    const savedData = this.storage.load();
    if (savedData) {
      this.playerData = { ...this.playerData, ...savedData.playerData };
      console.log('저장된 게임 데이터 로드 완료');
    }
  }

  /**
   * 게임 데이터 저장
   */
  saveGameData() {
    this.storage.save({
      playerData: this.playerData,
      timestamp: Date.now()
    });
    console.log('게임 데이터 저장 완료');
  }

  /**
   * 메인 게임 루프
   */
  gameLoop(currentTime) {
    if (!this.isRunning) return;

    // 델타 타임 계산 (초 단위)
    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // FPS 제한
    if (this.deltaTime > 1 / 30) {
      this.deltaTime = 1 / 30;
    }

    // 업데이트
    this.update(this.deltaTime);

    // 렌더링
    this.render();

    // 다음 프레임 요청
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  /**
   * 게임 상태 업데이트
   */
  update(dt) {
    this.inputManager.update();
    this.stateManager.update(dt);
    this.particles.update(dt);
  }

  /**
   * 렌더링
   */
  render() {
    // 화면 클리어
    this.ctx.fillStyle = '#16213e';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // 현재 상태 렌더링
    this.stateManager.render(this.ctx);

    // 파티클 렌더링 (상태 위에)
    this.particles.render(this.ctx);

    // 디버그 정보
    if (this.config.debug) {
      this.renderDebugInfo();
    }
  }

  /**
   * 디버그 정보 렌더링
   */
  renderDebugInfo() {
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`FPS: ${Math.round(1 / this.deltaTime)}`, 10, 20);
    this.ctx.fillText(`State: ${this.stateManager.currentStateName}`, 10, 35);
  }

  /**
   * 쿠키 스탯 리셋
   */
  resetCookieStats() {
    this.cookieStats = {
      flavor: 0,
      texture: 0,
      sweetness: 0,
      completion: 0,
      visual: 0
    };
  }

  /**
   * 총점 계산 (300점 만점)
   */
  calculateTotalScore() {
    const { flavor, texture, sweetness, completion, visual } = this.cookieStats;
    // 풍미(100) + 식감(100) + 비주얼/완성도(100)
    const flavorScore = Math.min(flavor, 100);
    const textureScore = Math.min(texture, 100);
    const visualScore = Math.min((completion + visual) / 2, 100);

    // ±10점 랜덤성 (심사위원 취향)
    const randomBonus = Math.floor(Math.random() * 21) - 10;

    return Math.max(0, Math.min(300, flavorScore + textureScore + visualScore + randomBonus));
  }
}
