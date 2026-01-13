/**
 * RecipeManager - 레시피 관리 시스템
 * 레시피 해금, 저장, 보너스 관리
 */

import { Storage } from '../utils/Storage.js';

// 기본 레시피 정의
export const BASE_RECIPES = [
  {
    id: 'classic',
    name: '클래식 두쫀쿠',
    nameEn: 'Classic Dubai Cookie',
    description: '오리지널 두바이 쫀득 쿠키. 기본이지만 완벽한 맛.',
    icon: '🍪',
    rarity: 'common',
    unlocked: true,
    requirements: null,
    bonuses: {
      flavor: 0,
      texture: 0,
      visual: 0,
      priceMultiplier: 1.0
    },
    ingredients: {
      kadaif: 'normal',
      pistachio: 'normal',
      marshmallow: 'normal'
    },
    tips: '균형 잡힌 맛으로 누구나 좋아하는 맛!'
  },
  {
    id: 'golden',
    name: '골든 럭셔리',
    nameEn: 'Golden Luxury',
    description: '금박을 듬뿍 올린 럭셔리 버전. 두바이 관광객에게 인기!',
    icon: '✨',
    rarity: 'rare',
    unlocked: false,
    requirements: {
      type: 'score',
      condition: 'visual >= 90',
      description: '비주얼 점수 90점 이상 달성'
    },
    bonuses: {
      flavor: 0,
      texture: 0,
      visual: 20,
      priceMultiplier: 1.5
    },
    ingredients: {
      kadaif: 'premium',
      pistachio: 'normal',
      marshmallow: 'normal',
      goldFlake: true
    },
    tips: '금박은 아끼지 말고 듬뿍!'
  },
  {
    id: 'crunchy',
    name: '크런치 마스터',
    nameEn: 'Crunch Master',
    description: '바삭함을 극대화한 레시피. 식감 매니아를 위한 선택.',
    icon: '💥',
    rarity: 'uncommon',
    unlocked: false,
    requirements: {
      type: 'score',
      condition: 'texture >= 85',
      description: '식감 점수 85점 이상 달성'
    },
    bonuses: {
      flavor: 5,
      texture: 15,
      visual: 0,
      priceMultiplier: 1.2
    },
    ingredients: {
      kadaif: 'extra_crispy',
      pistachio: 'coarse',
      marshmallow: 'light'
    },
    tips: '카다이프를 얇게, 피스타치오는 굵게!'
  },
  {
    id: 'pistachio_bomb',
    name: '피스타치오 폭탄',
    nameEn: 'Pistachio Bomb',
    description: '피스타치오를 2배로! 견과류 러버를 위한 레시피.',
    icon: '🥜',
    rarity: 'uncommon',
    unlocked: false,
    requirements: {
      type: 'minigame',
      condition: 'pistachio_perfect >= 3',
      description: '피스타치오 미니게임 퍼펙트 3회'
    },
    bonuses: {
      flavor: 15,
      texture: 5,
      visual: 5,
      priceMultiplier: 1.3
    },
    ingredients: {
      kadaif: 'normal',
      pistachio: 'double',
      marshmallow: 'normal'
    },
    tips: '피스타치오 분쇄할 때 피버 모드 노려보세요!'
  },
  {
    id: 'chewy_dream',
    name: '쫀득 드림',
    nameEn: 'Chewy Dream',
    description: '마시멜로우 반죽을 극한까지! 쫀득함의 정점.',
    icon: '☁️',
    rarity: 'uncommon',
    unlocked: false,
    requirements: {
      type: 'minigame',
      condition: 'marshmallow_perfect >= 3',
      description: '마시멜로우 미니게임 퍼펙트 3회'
    },
    bonuses: {
      flavor: 5,
      texture: 10,
      visual: 10,
      priceMultiplier: 1.25
    },
    ingredients: {
      kadaif: 'soft',
      pistachio: 'fine',
      marshmallow: 'extra'
    },
    tips: 'RPM을 꾸준히 유지하는 게 핵심!'
  },
  {
    id: 'flavor_master',
    name: '풍미의 달인',
    nameEn: 'Flavor Master',
    description: '모든 재료의 풍미를 극대화한 장인의 레시피.',
    icon: '👨‍🍳',
    rarity: 'rare',
    unlocked: false,
    requirements: {
      type: 'score',
      condition: 'flavor >= 95',
      description: '풍미 점수 95점 이상 달성'
    },
    bonuses: {
      flavor: 20,
      texture: 5,
      visual: 5,
      priceMultiplier: 1.4
    },
    ingredients: {
      kadaif: 'aromatic',
      pistachio: 'roasted',
      marshmallow: 'vanilla'
    },
    tips: '재료 준비 단계에서 집중!'
  },
  {
    id: 'speed_demon',
    name: '스피드 데몬',
    nameEn: 'Speed Demon',
    description: '빠른 제작에 특화된 레시피. 대량 생산용.',
    icon: '⚡',
    rarity: 'uncommon',
    unlocked: false,
    requirements: {
      type: 'time',
      condition: 'total_time <= 60',
      description: '전체 제작 시간 60초 이내'
    },
    bonuses: {
      flavor: -5,
      texture: 0,
      visual: 0,
      priceMultiplier: 0.9,
      speedBonus: 1.5
    },
    ingredients: {
      kadaif: 'quick',
      pistachio: 'pre_crushed',
      marshmallow: 'instant'
    },
    tips: '빠르지만 품질은 조금 희생됩니다'
  },
  {
    id: 'perfect_balance',
    name: '퍼펙트 밸런스',
    nameEn: 'Perfect Balance',
    description: '모든 스탯이 균형 잡힌 완벽한 레시피.',
    icon: '⚖️',
    rarity: 'epic',
    unlocked: false,
    requirements: {
      type: 'score',
      condition: 'all >= 80',
      description: '모든 스탯 80점 이상 동시 달성'
    },
    bonuses: {
      flavor: 10,
      texture: 10,
      visual: 10,
      priceMultiplier: 1.6
    },
    ingredients: {
      kadaif: 'balanced',
      pistachio: 'balanced',
      marshmallow: 'balanced'
    },
    tips: '모든 미니게임에서 꾸준히 좋은 성적을!'
  },
  {
    id: 'dubai_royal',
    name: '두바이 로열',
    nameEn: 'Dubai Royal',
    description: '왕족을 위한 최고급 레시피. 전설의 쿠키.',
    icon: '👑',
    rarity: 'legendary',
    unlocked: false,
    requirements: {
      type: 'score',
      condition: 'total >= 280',
      description: '총점 280점 이상 달성'
    },
    bonuses: {
      flavor: 15,
      texture: 15,
      visual: 15,
      priceMultiplier: 2.0
    },
    ingredients: {
      kadaif: 'royal',
      pistachio: 'royal',
      marshmallow: 'royal',
      goldFlake: true,
      saffron: true
    },
    tips: '장인의 경지에 도달해야만 만들 수 있는 쿠키'
  },
  {
    id: 'viral_sensation',
    name: '바이럴 센세이션',
    nameEn: 'Viral Sensation',
    description: 'SNS에서 대박 난 그 레시피! 인스타그래머블!',
    icon: '📱',
    rarity: 'epic',
    unlocked: false,
    requirements: {
      type: 'sales',
      condition: 'daily_sales >= 30',
      description: '총 판매량 30개 이상 달성'
    },
    bonuses: {
      flavor: 5,
      texture: 5,
      visual: 25,
      priceMultiplier: 1.8,
      customerAttraction: 1.5
    },
    ingredients: {
      kadaif: 'photogenic',
      pistachio: 'colorful',
      marshmallow: 'fluffy',
      goldFlake: true
    },
    tips: '비주얼이 생명! 데코에 신경 쓰세요!'
  }
];

// 희귀도 색상
export const RARITY_COLORS = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800'
};

// 희귀도 이름
export const RARITY_NAMES = {
  common: '일반',
  uncommon: '고급',
  rare: '희귀',
  epic: '영웅',
  legendary: '전설'
};

class RecipeManager {
  constructor() {
    this.storage = new Storage('djjc_recipes');
    this.recipes = [];
    this.currentRecipe = null;
    this.stats = {
      pistachio_perfect: 0,
      marshmallow_perfect: 0,
      kadaif_perfect: 0,
      daily_sales: 0,      // 누적 판매량 (이름은 호환성 위해 유지)
      best_total_score: 0,
      best_flavor: 0,
      best_texture: 0,
      best_visual: 0
    };

    this.init();
  }

  /**
   * 초기화
   */
  init() {
    this.loadRecipes();
    this.loadStats();

    // 기본 레시피 선택
    if (!this.currentRecipe) {
      this.currentRecipe = this.recipes.find(r => r.id === 'classic');
    }
  }

  /**
   * 레시피 로드
   */
  loadRecipes() {
    const savedRecipes = this.storage.load('list');

    if (savedRecipes) {
      // 저장된 데이터와 기본 레시피 병합
      this.recipes = BASE_RECIPES.map(baseRecipe => {
        const saved = savedRecipes.find(s => s.id === baseRecipe.id);
        if (saved) {
          return { ...baseRecipe, unlocked: saved.unlocked };
        }
        return { ...baseRecipe };
      });
    } else {
      // 기본 레시피 복사
      this.recipes = BASE_RECIPES.map(r => ({ ...r }));
    }

    // 현재 선택된 레시피 로드
    const currentId = this.storage.load('current');
    if (currentId) {
      this.currentRecipe = this.recipes.find(r => r.id === currentId);
    }
  }

  /**
   * 통계 로드
   */
  loadStats() {
    const savedStats = this.storage.load('stats');
    if (savedStats) {
      this.stats = { ...this.stats, ...savedStats };
    }
  }

  /**
   * 레시피 저장
   */
  saveRecipes() {
    const toSave = this.recipes.map(r => ({
      id: r.id,
      unlocked: r.unlocked
    }));
    this.storage.save(toSave, 'list');

    if (this.currentRecipe) {
      this.storage.save(this.currentRecipe.id, 'current');
    }
  }

  /**
   * 통계 저장
   */
  saveStats() {
    this.storage.save(this.stats, 'stats');
  }

  /**
   * 레시피 선택
   */
  selectRecipe(recipeId) {
    const recipe = this.recipes.find(r => r.id === recipeId);
    if (recipe && recipe.unlocked) {
      this.currentRecipe = recipe;
      this.saveRecipes();
      return true;
    }
    return false;
  }

  /**
   * 현재 레시피 가져오기
   */
  getCurrentRecipe() {
    return this.currentRecipe || this.recipes.find(r => r.id === 'classic');
  }

  /**
   * 해금된 레시피 목록
   */
  getUnlockedRecipes() {
    return this.recipes.filter(r => r.unlocked);
  }

  /**
   * 잠긴 레시피 목록
   */
  getLockedRecipes() {
    return this.recipes.filter(r => !r.unlocked);
  }

  /**
   * 레시피 해금 체크 및 실행
   * @param {Object} gameData - 현재 게임 데이터
   * @returns {Array} 새로 해금된 레시피 목록
   */
  checkUnlocks(gameData) {
    const newUnlocks = [];

    for (const recipe of this.recipes) {
      if (recipe.unlocked) continue;
      if (!recipe.requirements) continue;

      let shouldUnlock = false;
      const req = recipe.requirements;

      switch (req.type) {
        case 'score':
          shouldUnlock = this.checkScoreCondition(req.condition, gameData);
          break;
        case 'minigame':
          shouldUnlock = this.checkMinigameCondition(req.condition);
          break;
        case 'time':
          shouldUnlock = this.checkTimeCondition(req.condition, gameData);
          break;
        case 'sales':
          shouldUnlock = this.checkSalesCondition(req.condition);
          break;
      }

      if (shouldUnlock) {
        recipe.unlocked = true;
        newUnlocks.push(recipe);
      }
    }

    if (newUnlocks.length > 0) {
      this.saveRecipes();
    }

    return newUnlocks;
  }

  /**
   * 점수 조건 체크
   */
  checkScoreCondition(condition, gameData) {
    const stats = gameData.cookieStats || {};

    if (condition.includes('>=')) {
      const [stat, value] = condition.split(' >= ');
      const targetValue = parseInt(value);

      if (stat === 'all') {
        return stats.flavor >= targetValue &&
               stats.texture >= targetValue &&
               stats.visual >= targetValue;
      }
      if (stat === 'total') {
        return gameData.totalScore >= targetValue;
      }
      return (stats[stat] || 0) >= targetValue;
    }

    return false;
  }

  /**
   * 미니게임 조건 체크
   */
  checkMinigameCondition(condition) {
    const [stat, value] = condition.split(' >= ');
    const targetValue = parseInt(value);
    return (this.stats[stat] || 0) >= targetValue;
  }

  /**
   * 시간 조건 체크
   */
  checkTimeCondition(condition, gameData) {
    if (condition.includes('<=')) {
      const [, value] = condition.split(' <= ');
      const targetValue = parseInt(value);
      return (gameData.totalTime || 999) <= targetValue;
    }
    return false;
  }

  /**
   * 판매 조건 체크
   */
  checkSalesCondition(condition) {
    const [stat, value] = condition.split(' >= ');
    const targetValue = parseInt(value);
    return (this.stats[stat] || 0) >= targetValue;
  }

  /**
   * 미니게임 퍼펙트 기록
   */
  recordPerfect(minigameType) {
    const key = `${minigameType}_perfect`;
    if (this.stats[key] !== undefined) {
      this.stats[key]++;
      this.saveStats();
    }
  }

  /**
   * 판매 기록 업데이트 (누적)
   */
  updateSalesStats(count) {
    this.stats.daily_sales += count;  // 누적 방식으로 변경
    this.saveStats();
  }

  /**
   * 최고 점수 업데이트
   */
  updateBestScores(cookieStats, totalScore) {
    let updated = false;

    if (totalScore > this.stats.best_total_score) {
      this.stats.best_total_score = totalScore;
      updated = true;
    }
    if (cookieStats.flavor > this.stats.best_flavor) {
      this.stats.best_flavor = cookieStats.flavor;
      updated = true;
    }
    if (cookieStats.texture > this.stats.best_texture) {
      this.stats.best_texture = cookieStats.texture;
      updated = true;
    }
    if (cookieStats.visual > this.stats.best_visual) {
      this.stats.best_visual = cookieStats.visual;
      updated = true;
    }

    if (updated) {
      this.saveStats();
    }
  }

  /**
   * 현재 레시피 보너스 적용
   */
  applyRecipeBonus(cookieStats) {
    const recipe = this.getCurrentRecipe();
    if (!recipe || !recipe.bonuses) return cookieStats;

    return {
      flavor: cookieStats.flavor + (recipe.bonuses.flavor || 0),
      texture: cookieStats.texture + (recipe.bonuses.texture || 0),
      sweetness: cookieStats.sweetness,
      completion: cookieStats.completion,
      visual: cookieStats.visual + (recipe.bonuses.visual || 0)
    };
  }

  /**
   * 가격 배율 가져오기
   */
  getPriceMultiplier() {
    const recipe = this.getCurrentRecipe();
    return recipe?.bonuses?.priceMultiplier || 1.0;
  }

  /**
   * 속도 보너스 가져오기
   */
  getSpeedBonus() {
    const recipe = this.getCurrentRecipe();
    return recipe?.bonuses?.speedBonus || 1.0;
  }

  /**
   * 손님 유치 보너스 가져오기
   */
  getCustomerAttraction() {
    const recipe = this.getCurrentRecipe();
    return recipe?.bonuses?.customerAttraction || 1.0;
  }

  /**
   * 레시피 진행도 (해금률)
   */
  getUnlockProgress() {
    const unlocked = this.recipes.filter(r => r.unlocked).length;
    return {
      unlocked,
      total: this.recipes.length,
      percentage: Math.round((unlocked / this.recipes.length) * 100)
    };
  }

  /**
   * 희귀도별 레시피 수
   */
  getRecipesByRarity() {
    const result = {};
    for (const rarity of Object.keys(RARITY_NAMES)) {
      result[rarity] = {
        total: this.recipes.filter(r => r.rarity === rarity).length,
        unlocked: this.recipes.filter(r => r.rarity === rarity && r.unlocked).length
      };
    }
    return result;
  }

  /**
   * 일일 통계 리셋
   */
  resetDailyStats() {
    this.stats.daily_sales = 0;
    this.saveStats();
  }
}

// 싱글톤 인스턴스
export const recipeManager = new RecipeManager();
