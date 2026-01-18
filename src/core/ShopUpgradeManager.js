/**
 * ShopUpgradeManager - 가게 업그레이드 시스템
 * 장비, 인테리어, 재료 품질 업그레이드 관리
 */

/**
 * 업그레이드 카테고리
 * @constant
 */
export const UpgradeCategory = {
  EQUIPMENT: 'equipment',   // 장비
  INTERIOR: 'interior',     // 인테리어
  INGREDIENT: 'ingredient'  // 재료
};

/**
 * 업그레이드 정의
 * @constant
 */
export const UPGRADES = {
  // ===== 장비 업그레이드 =====
  oven_basic: {
    id: 'oven_basic',
    name: '기본 오븐',
    description: '할머니가 쓰시던 오래된 오븐',
    category: UpgradeCategory.EQUIPMENT,
    icon: '🔥',
    price: 0,
    level: 1,
    maxLevel: 1,
    effect: { bakingSpeed: 1.0 },
    unlocked: true
  },
  oven_standard: {
    id: 'oven_standard',
    name: '표준 오븐',
    description: '안정적인 온도 조절이 가능',
    category: UpgradeCategory.EQUIPMENT,
    icon: '🔥',
    price: 50000,
    level: 2,
    maxLevel: 1,
    effect: { bakingSpeed: 1.2, completionBonus: 5 },
    requires: 'oven_basic'
  },
  oven_pro: {
    id: 'oven_pro',
    name: '프로 컨벡션 오븐',
    description: '균일한 열 전달로 완성도 UP',
    category: UpgradeCategory.EQUIPMENT,
    icon: '🔥',
    price: 150000,
    level: 3,
    maxLevel: 1,
    effect: { bakingSpeed: 1.5, completionBonus: 15 },
    requires: 'oven_standard'
  },

  mixer_basic: {
    id: 'mixer_basic',
    name: '손 거품기',
    description: '팔이 좀 아프지만 기본은 된다',
    category: UpgradeCategory.EQUIPMENT,
    icon: '🥄',
    price: 0,
    level: 1,
    maxLevel: 1,
    effect: { mixingSpeed: 1.0 },
    unlocked: true
  },
  mixer_stand: {
    id: 'mixer_stand',
    name: '스탠드 믹서',
    description: '자동으로 반죽을 섞어줌',
    category: UpgradeCategory.EQUIPMENT,
    icon: '🥄',
    price: 80000,
    level: 2,
    maxLevel: 1,
    effect: { mixingSpeed: 1.3, textureBonus: 5 },
    requires: 'mixer_basic'
  },

  storage_basic: {
    id: 'storage_basic',
    name: '기본 진열대',
    description: '쿠키 20개 보관 가능',
    category: UpgradeCategory.EQUIPMENT,
    icon: '📦',
    price: 0,
    level: 1,
    maxLevel: 1,
    effect: { storageCapacity: 20 },
    unlocked: true
  },
  storage_medium: {
    id: 'storage_medium',
    name: '확장 진열대',
    description: '쿠키 35개 보관 가능',
    category: UpgradeCategory.EQUIPMENT,
    icon: '📦',
    price: 30000,
    level: 2,
    maxLevel: 1,
    effect: { storageCapacity: 35 },
    requires: 'storage_basic'
  },
  storage_large: {
    id: 'storage_large',
    name: '대형 쇼케이스',
    description: '쿠키 50개 보관 + 신선도 유지',
    category: UpgradeCategory.EQUIPMENT,
    icon: '📦',
    price: 100000,
    level: 3,
    maxLevel: 1,
    effect: { storageCapacity: 50, freshnessBonus: 0.5 },
    requires: 'storage_medium'
  },

  // ===== 인테리어 업그레이드 =====
  deco_basic: {
    id: 'deco_basic',
    name: '기본 인테리어',
    description: '낡았지만 정이 가는 가게',
    category: UpgradeCategory.INTERIOR,
    icon: '🏠',
    price: 0,
    level: 1,
    maxLevel: 1,
    effect: { customerAttraction: 1.0 },
    unlocked: true
  },
  deco_cozy: {
    id: 'deco_cozy',
    name: '아늑한 카페풍',
    description: '따뜻한 조명과 나무 테이블',
    category: UpgradeCategory.INTERIOR,
    icon: '☕',
    price: 70000,
    level: 2,
    maxLevel: 1,
    effect: { customerAttraction: 1.2, regularBonus: 5 },
    requires: 'deco_basic'
  },
  deco_modern: {
    id: 'deco_modern',
    name: '모던 베이커리',
    description: 'SNS 감성 인테리어',
    category: UpgradeCategory.INTERIOR,
    icon: '✨',
    price: 200000,
    level: 3,
    maxLevel: 1,
    effect: { customerAttraction: 1.5, priceBonus: 10 },
    requires: 'deco_cozy'
  },

  sign_basic: {
    id: 'sign_basic',
    name: '손글씨 간판',
    description: '정성스러운 손글씨 간판',
    category: UpgradeCategory.INTERIOR,
    icon: '📝',
    price: 0,
    level: 1,
    maxLevel: 1,
    effect: { visibility: 1.0 },
    unlocked: true
  },
  sign_neon: {
    id: 'sign_neon',
    name: '네온 간판',
    description: '밤에도 눈에 띄는 간판',
    category: UpgradeCategory.INTERIOR,
    icon: '💡',
    price: 50000,
    level: 2,
    maxLevel: 1,
    effect: { visibility: 1.3, nightBonus: 20 },
    requires: 'sign_basic'
  },

  // ===== 재료 업그레이드 =====
  kadaif_basic: {
    id: 'kadaif_basic',
    name: '일반 카다이프',
    description: '시장에서 구한 기본 재료',
    category: UpgradeCategory.INGREDIENT,
    icon: '🥖',
    price: 0,
    level: 1,
    maxLevel: 1,
    effect: { textureBase: 0 },
    unlocked: true
  },
  kadaif_premium: {
    id: 'kadaif_premium',
    name: '프리미엄 카다이프',
    description: '터키 직수입 고급 면발',
    category: UpgradeCategory.INGREDIENT,
    icon: '🥖',
    price: 40000,
    level: 2,
    maxLevel: 1,
    effect: { textureBase: 10 },
    requires: 'kadaif_basic'
  },

  pistachio_basic: {
    id: 'pistachio_basic',
    name: '일반 피스타치오',
    description: '마트에서 구매한 피스타치오',
    category: UpgradeCategory.INGREDIENT,
    icon: '🥜',
    price: 0,
    level: 1,
    maxLevel: 1,
    effect: { flavorBase: 0 },
    unlocked: true
  },
  pistachio_iranian: {
    id: 'pistachio_iranian',
    name: '이란산 피스타치오',
    description: '최고급 이란산 피스타치오',
    category: UpgradeCategory.INGREDIENT,
    icon: '🥜',
    price: 60000,
    level: 2,
    maxLevel: 1,
    effect: { flavorBase: 15 },
    requires: 'pistachio_basic'
  },

  cocoa_basic: {
    id: 'cocoa_basic',
    name: '일반 코코아',
    description: '시중에 파는 코코아 파우더',
    category: UpgradeCategory.INGREDIENT,
    icon: '🍫',
    price: 0,
    level: 1,
    maxLevel: 1,
    effect: { sweetnessBase: 0 },
    unlocked: true
  },
  cocoa_valrhona: {
    id: 'cocoa_valrhona',
    name: '발로나 코코아',
    description: '프랑스 발로나사의 프리미엄 코코아',
    category: UpgradeCategory.INGREDIENT,
    icon: '🍫',
    price: 80000,
    level: 2,
    maxLevel: 1,
    effect: { sweetnessBase: 10, visualBase: 5 },
    requires: 'cocoa_basic'
  }
};

/**
 * ShopUpgradeManager 클래스
 */
export class ShopUpgradeManager {
  constructor() {
    /** @type {Set<string>} 구매한 업그레이드 ID */
    this.purchased = new Set();

    /** @type {Set<string>} 현재 장착된 업그레이드 ID */
    this.equipped = new Set();

    // 기본 업그레이드 해금
    this.initDefaultUpgrades();
  }

  /**
   * 기본 업그레이드 초기화
   */
  initDefaultUpgrades() {
    Object.values(UPGRADES).forEach(upgrade => {
      if (upgrade.unlocked) {
        this.purchased.add(upgrade.id);
        this.equipped.add(upgrade.id);
      }
    });
  }

  /**
   * 업그레이드 구매 가능 여부 확인
   * @param {string} upgradeId
   * @param {number} currentMoney
   * @returns {object} { canBuy: boolean, reason: string }
   */
  canPurchase(upgradeId, currentMoney) {
    const upgrade = UPGRADES[upgradeId];

    if (!upgrade) {
      return { canBuy: false, reason: '존재하지 않는 업그레이드' };
    }

    if (this.purchased.has(upgradeId)) {
      return { canBuy: false, reason: '이미 구매함' };
    }

    if (upgrade.requires && !this.purchased.has(upgrade.requires)) {
      const required = UPGRADES[upgrade.requires];
      return { canBuy: false, reason: `선행 업그레이드 필요: ${required.name}` };
    }

    if (currentMoney < upgrade.price) {
      return { canBuy: false, reason: `자금 부족 (필요: ${upgrade.price.toLocaleString()}원)` };
    }

    return { canBuy: true, reason: '' };
  }

  /**
   * 업그레이드 구매
   * @param {string} upgradeId
   * @returns {boolean}
   */
  purchase(upgradeId) {
    const upgrade = UPGRADES[upgradeId];
    if (!upgrade) return false;

    this.purchased.add(upgradeId);
    this.equipped.add(upgradeId);

    // 같은 카테고리의 낮은 레벨 업그레이드 장착 해제
    Object.values(UPGRADES).forEach(other => {
      if (other.category === upgrade.category &&
          other.id !== upgradeId &&
          other.level < upgrade.level &&
          this.equipped.has(other.id)) {
        // 장비/재료는 상위로 교체, 인테리어는 누적 가능
        if (upgrade.category !== UpgradeCategory.INTERIOR) {
          this.equipped.delete(other.id);
        }
      }
    });

    console.log(`업그레이드 구매: ${upgrade.name}`);
    return true;
  }

  /**
   * 구매 여부 확인
   * @param {string} upgradeId
   * @returns {boolean}
   */
  hasPurchased(upgradeId) {
    return this.purchased.has(upgradeId);
  }

  /**
   * 장착 여부 확인
   * @param {string} upgradeId
   * @returns {boolean}
   */
  isEquipped(upgradeId) {
    return this.equipped.has(upgradeId);
  }

  /**
   * 카테고리별 업그레이드 목록 조회
   * @param {string} category
   * @returns {object[]}
   */
  getUpgradesByCategory(category) {
    return Object.values(UPGRADES)
      .filter(u => u.category === category)
      .map(u => ({
        ...u,
        purchased: this.purchased.has(u.id),
        equipped: this.equipped.has(u.id)
      }));
  }

  /**
   * 구매 가능한 업그레이드 목록
   * @param {number} currentMoney
   * @returns {object[]}
   */
  getAvailableUpgrades(currentMoney) {
    return Object.values(UPGRADES)
      .filter(u => !this.purchased.has(u.id))
      .filter(u => !u.requires || this.purchased.has(u.requires))
      .map(u => ({
        ...u,
        canAfford: currentMoney >= u.price
      }));
  }

  /**
   * 현재 효과 합산
   * @returns {object}
   */
  getTotalEffects() {
    const effects = {
      bakingSpeed: 1.0,
      mixingSpeed: 1.0,
      storageCapacity: 20,
      freshnessBonus: 0,
      customerAttraction: 1.0,
      regularBonus: 0,
      priceBonus: 0,
      visibility: 1.0,
      nightBonus: 0,
      textureBase: 0,
      flavorBase: 0,
      sweetnessBase: 0,
      visualBase: 0,
      completionBonus: 0
    };

    this.equipped.forEach(id => {
      const upgrade = UPGRADES[id];
      if (upgrade && upgrade.effect) {
        Object.entries(upgrade.effect).forEach(([key, value]) => {
          if (typeof effects[key] === 'number') {
            // 배율은 대체, 보너스는 합산
            if (key.endsWith('Speed') || key.endsWith('Attraction') || key === 'visibility') {
              effects[key] = Math.max(effects[key], value);
            } else if (key === 'storageCapacity') {
              effects[key] = Math.max(effects[key], value);
            } else {
              effects[key] += value;
            }
          }
        });
      }
    });

    return effects;
  }

  /**
   * 직렬화 (저장용)
   * @returns {object}
   */
  serialize() {
    return {
      purchased: Array.from(this.purchased),
      equipped: Array.from(this.equipped)
    };
  }

  /**
   * 역직렬화 (로드용)
   * @param {object} data
   */
  deserialize(data) {
    if (!data) return;

    this.purchased = new Set(data.purchased || []);
    this.equipped = new Set(data.equipped || []);

    // 기본 업그레이드 확인
    this.initDefaultUpgrades();
  }

  /**
   * 초기화 (새 게임)
   */
  reset() {
    this.purchased.clear();
    this.equipped.clear();
    this.initDefaultUpgrades();
  }
}

// 전역 싱글톤 인스턴스
export const shopUpgradeManager = new ShopUpgradeManager();
