/**
 * StateManager - 게임 상태 관리
 */

import { TitleState } from '../states/TitleState.js';
import { IntroState } from '../states/IntroState.js';
import { TutorialState } from '../states/TutorialState.js';
import { PrepState } from '../states/PrepState.js';
import { BakingState } from '../states/BakingState.js';
import { DecoState } from '../states/DecoState.js';
import { TastingState } from '../states/TastingState.js';
import { SellState } from '../states/SellState.js';
import { RecipeBookState } from '../states/RecipeBookState.js';

// 게임 상태 열거형
export const GameState = {
  TITLE: 'title',
  INTRO: 'intro',
  TUTORIAL: 'tutorial',
  PREP: 'prep',           // 재료준비
  BAKING: 'baking',       // 베이킹
  DECO: 'deco',           // 데코레이션
  TASTING: 'tasting',     // 품평회
  SELL: 'sell',           // 판매
  RECIPE_BOOK: 'recipe_book'  // 레시피북
};

export class StateManager {
  constructor(game) {
    this.game = game;
    this.currentState = null;
    this.currentStateName = null;
    this.states = {};
    this.isTransitioning = false;

    // 상태 클래스 등록
    this.registerStates();
  }

  /**
   * 상태 클래스 등록
   */
  registerStates() {
    this.states[GameState.TITLE] = TitleState;
    this.states[GameState.INTRO] = IntroState;
    this.states[GameState.TUTORIAL] = TutorialState;
    this.states[GameState.PREP] = PrepState;
    this.states[GameState.BAKING] = BakingState;
    this.states[GameState.DECO] = DecoState;
    this.states[GameState.TASTING] = TastingState;
    this.states[GameState.SELL] = SellState;
    this.states[GameState.RECIPE_BOOK] = RecipeBookState;
  }

  /**
   * 상태 변경
   */
  changeState(stateName, params = {}) {
    if (this.isTransitioning) return;

    const StateClass = this.states[stateName];
    if (!StateClass) {
      console.error(`알 수 없는 상태: ${stateName}`);
      return;
    }

    this.isTransitioning = true;

    // 현재 상태 종료
    if (this.currentState) {
      this.currentState.exit();
    }

    // 새 상태 생성 및 진입
    this.currentState = new StateClass(this.game);
    this.currentStateName = stateName;
    this.currentState.enter(params);

    this.isTransitioning = false;

    console.log(`상태 변경: ${stateName}`);
  }

  /**
   * 업데이트
   */
  update(dt) {
    if (this.currentState && !this.isTransitioning) {
      this.currentState.update(dt);
    }
  }

  /**
   * 렌더링
   */
  render(ctx) {
    if (this.currentState) {
      this.currentState.render(ctx);
    }
  }
}
