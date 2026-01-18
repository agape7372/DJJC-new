/**
 * GameManager - 게임 상태 관리 싱글톤
 * 골드, 날짜, 인벤토리, 통계 등 모든 게임 데이터를 중앙 관리
 */

import { EventEmitter } from './EventEmitter.js';

class GameManager extends EventEmitter {
  constructor() {
    super();

    if (GameManager.instance) {
      return GameManager.instance;
    }
    GameManager.instance = this;

    this._initialized = false;
    this._data = null;
  }

  /**
   * 게임 매니저 초기화
   * @param {Phaser.Game} game - Phaser 게임 인스턴스
   */
  init(game) {
    if (this._initialized) return;

    this.game = game;
    this._data = this._createDefaultData();
    this._loadFromStorage();
    this._initialized = true;
  }

  /**
   * 기본 게임 데이터 생성
   */
  _createDefaultData() {
    return {
      // 재화
      gold: 10000,

      // 시간
      day: 1,
      dayOfWeek: 0, // 0 = 월요일
      timePeriod: 'morning', // morning, afternoon, evening, night
      energy: 100,
      maxEnergy: 100,

      // 평판
      reputation: 0,
      maxReputation: 100,

      // 인벤토리
      inventory: {
        cookies: [],
        ingredients: {
          kadaif: 100,
          pistachio: 100,
          marshmallow: 100,
          cocoa: 100,
          gold: 10
        }
      },

      // 업그레이드
      upgrades: {
        oven: 0,
        counter: 0,
        storage: 0
      },

      // 해금된 레시피
      unlockedRecipes: ['classic'],

      // 통계
      stats: {
        totalCookiesMade: 0,
        totalCookiesSold: 0,
        totalRevenue: 0,
        totalCustomersServed: 0,
        totalCustomersRejected: 0,
        perfectCookies: 0,
        highestDayRevenue: 0
      },

      // 설정
      settings: {
        bgmVolume: 0.7,
        sfxVolume: 1.0,
        vibration: true
      }
    };
  }

  // ========================================
  // Getters
  // ========================================

  get gold() { return this._data.gold; }
  get day() { return this._data.day; }
  get dayOfWeek() { return this._data.dayOfWeek; }
  get timePeriod() { return this._data.timePeriod; }
  get energy() { return this._data.energy; }
  get maxEnergy() { return this._data.maxEnergy; }
  get reputation() { return this._data.reputation; }
  get inventory() { return this._data.inventory; }
  get upgrades() { return this._data.upgrades; }
  get unlockedRecipes() { return this._data.unlockedRecipes; }
  get stats() { return this._data.stats; }
  get settings() { return this._data.settings; }

  // ========================================
  // 골드 관련
  // ========================================

  addGold(amount) {
    this._data.gold += amount;
    this._data.stats.totalRevenue += amount;
    this.emit('goldChanged', this._data.gold);
    this._autoSave();
    return this._data.gold;
  }

  spendGold(amount) {
    if (this._data.gold < amount) {
      this.emit('goldInsufficient', { required: amount, current: this._data.gold });
      return false;
    }
    this._data.gold -= amount;
    this.emit('goldChanged', this._data.gold);
    this._autoSave();
    return true;
  }

  canAfford(amount) {
    return this._data.gold >= amount;
  }

  // ========================================
  // 에너지 관련
  // ========================================

  useEnergy(amount) {
    if (this._data.energy < amount) {
      this.emit('energyInsufficient');
      return false;
    }
    this._data.energy -= amount;
    this.emit('energyChanged', this._data.energy);
    return true;
  }

  restoreEnergy(amount) {
    this._data.energy = Math.min(this._data.maxEnergy, this._data.energy + amount);
    this.emit('energyChanged', this._data.energy);
  }

  // ========================================
  // 시간 관련
  // ========================================

  advanceTime() {
    const periods = ['morning', 'afternoon', 'evening', 'night'];
    const currentIndex = periods.indexOf(this._data.timePeriod);

    if (currentIndex === periods.length - 1) {
      // 다음 날로
      this.advanceDay();
    } else {
      this._data.timePeriod = periods[currentIndex + 1];
      this.emit('timePeriodChanged', this._data.timePeriod);
    }
  }

  advanceDay() {
    // 하루 수익 기록
    const dailyRevenue = this._data.stats.totalRevenue;
    if (dailyRevenue > this._data.stats.highestDayRevenue) {
      this._data.stats.highestDayRevenue = dailyRevenue;
    }

    this._data.day++;
    this._data.dayOfWeek = (this._data.dayOfWeek + 1) % 7;
    this._data.timePeriod = 'morning';
    this._data.energy = this._data.maxEnergy;

    this.emit('dayChanged', this._data.day);
    this._autoSave();
  }

  // ========================================
  // 인벤토리 관련
  // ========================================

  addCookie(cookie) {
    this._data.inventory.cookies.push(cookie);
    this._data.stats.totalCookiesMade++;
    this.emit('cookieAdded', cookie);
  }

  removeCookie(index) {
    if (index >= 0 && index < this._data.inventory.cookies.length) {
      const cookie = this._data.inventory.cookies.splice(index, 1)[0];
      this._data.stats.totalCookiesSold++;
      this.emit('cookieSold', cookie);
      return cookie;
    }
    return null;
  }

  useIngredient(type, amount = 1) {
    if (!this._data.inventory.ingredients[type]) return false;
    if (this._data.inventory.ingredients[type] < amount) {
      this.emit('ingredientInsufficient', type);
      return false;
    }
    this._data.inventory.ingredients[type] -= amount;
    this.emit('ingredientUsed', { type, remaining: this._data.inventory.ingredients[type] });
    return true;
  }

  addIngredient(type, amount = 1) {
    if (!this._data.inventory.ingredients[type]) {
      this._data.inventory.ingredients[type] = 0;
    }
    this._data.inventory.ingredients[type] += amount;
    this.emit('ingredientAdded', { type, total: this._data.inventory.ingredients[type] });
  }

  getIngredientCount(type) {
    return this._data.inventory.ingredients[type] || 0;
  }

  // ========================================
  // 레시피 관련
  // ========================================

  unlockRecipe(recipeKey) {
    if (!this._data.unlockedRecipes.includes(recipeKey)) {
      this._data.unlockedRecipes.push(recipeKey);
      this.emit('recipeUnlocked', recipeKey);
      this._autoSave();
    }
  }

  isRecipeUnlocked(recipeKey) {
    return this._data.unlockedRecipes.includes(recipeKey);
  }

  // ========================================
  // 업그레이드 관련
  // ========================================

  purchaseUpgrade(type) {
    // 업그레이드 로직은 별도 UpgradeManager에서 처리 가능
    if (this._data.upgrades[type] !== undefined) {
      this._data.upgrades[type]++;
      this.emit('upgradeChanged', { type, level: this._data.upgrades[type] });
      this._autoSave();
      return true;
    }
    return false;
  }

  getUpgradeLevel(type) {
    return this._data.upgrades[type] || 0;
  }

  // ========================================
  // 통계 관련
  // ========================================

  recordCustomerServed() {
    this._data.stats.totalCustomersServed++;
  }

  recordCustomerRejected() {
    this._data.stats.totalCustomersRejected++;
  }

  recordPerfectCookie() {
    this._data.stats.perfectCookies++;
  }

  // ========================================
  // 평판 관련
  // ========================================

  addReputation(amount) {
    this._data.reputation = Math.min(
      this._data.maxReputation,
      Math.max(0, this._data.reputation + amount)
    );
    this.emit('reputationChanged', this._data.reputation);
  }

  // ========================================
  // 저장/불러오기
  // ========================================

  _autoSave() {
    // 디바운스 적용
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
    }
    this._saveTimeout = setTimeout(() => this.save(), 1000);
  }

  save() {
    try {
      localStorage.setItem('djjc_phaser_save', JSON.stringify(this._data));
    } catch (e) {
      // 저장 실패 - 무시 (QuotaExceeded 등)
    }
  }

  _loadFromStorage() {
    try {
      const saved = localStorage.getItem('djjc_phaser_save');
      if (saved) {
        this._data = { ...this._data, ...JSON.parse(saved) };
      }
    } catch (e) {
      // 로드 실패 - 기본 데이터 사용
    }
  }

  reset() {
    this._data = this._createDefaultData();
    localStorage.removeItem('djjc_phaser_save');
    this.emit('gameReset');
  }

  // ========================================
  // 디버그
  // ========================================

  debug() {
    console.log('[GameManager] 현재 상태:', this._data);
  }
}

// 싱글톤 인스턴스 export
export const gameManager = new GameManager();
export default gameManager;
