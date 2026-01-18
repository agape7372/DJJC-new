/**
 * InventoryManager - 쿠키 재고 관리 시스템
 * 만들어진 쿠키를 저장하고 관리
 */

/**
 * 쿠키 등급 정의
 * @constant
 */
export const CookieGrade = {
  S: { name: 'S', minScore: 280, color: '#FFD700', priceMultiplier: 2.0 },
  A: { name: 'A', minScore: 220, color: '#C0C0C0', priceMultiplier: 1.5 },
  B: { name: 'B', minScore: 160, color: '#CD7F32', priceMultiplier: 1.2 },
  C: { name: 'C', minScore: 0, color: '#808080', priceMultiplier: 1.0 }
};

/**
 * 점수로 등급 계산
 * @param {number} score - 총점 (0~300)
 * @returns {object} 등급 정보
 */
export function getGradeByScore(score) {
  if (score >= CookieGrade.S.minScore) return CookieGrade.S;
  if (score >= CookieGrade.A.minScore) return CookieGrade.A;
  if (score >= CookieGrade.B.minScore) return CookieGrade.B;
  return CookieGrade.C;
}

/**
 * 쿠키 클래스
 */
export class Cookie {
  /**
   * @param {object} stats - 쿠키 스탯
   * @param {number} totalScore - 총점
   * @param {string} recipeName - 레시피 이름
   */
  constructor(stats, totalScore, recipeName = '클래식 두쫀쿠') {
    this.id = Date.now() + Math.random().toString(36).substr(2, 9);
    this.stats = { ...stats };
    this.totalScore = totalScore;
    this.grade = getGradeByScore(totalScore);
    this.recipeName = recipeName;
    this.createdAt = Date.now();
    this.freshness = 100; // 신선도 (0~100)
    this.basePrice = this.calculateBasePrice();
  }

  /**
   * 기본 가격 계산
   * @returns {number}
   */
  calculateBasePrice() {
    const base = 5000; // 기본 가격
    const scoreBonus = this.totalScore * 50; // 점수당 50원
    return Math.floor((base + scoreBonus) * this.grade.priceMultiplier);
  }

  /**
   * 현재 판매가 계산 (신선도 반영)
   * @returns {number}
   */
  getCurrentPrice() {
    const freshnessMultiplier = 0.5 + (this.freshness / 100) * 0.5;
    return Math.floor(this.basePrice * freshnessMultiplier);
  }

  /**
   * 신선도 감소
   * @param {number} amount - 감소량
   */
  decreaseFreshness(amount) {
    this.freshness = Math.max(0, this.freshness - amount);
  }

  /**
   * 쿠키가 상했는지 확인
   * @returns {boolean}
   */
  isSpoiled() {
    return this.freshness <= 0;
  }

  /**
   * 직렬화 (저장용)
   * @returns {object}
   */
  serialize() {
    return {
      id: this.id,
      stats: this.stats,
      totalScore: this.totalScore,
      recipeName: this.recipeName,
      createdAt: this.createdAt,
      freshness: this.freshness
    };
  }

  /**
   * 역직렬화 (로드용)
   * @param {object} data
   * @returns {Cookie}
   */
  static deserialize(data) {
    const cookie = new Cookie(data.stats, data.totalScore, data.recipeName);
    cookie.id = data.id;
    cookie.createdAt = data.createdAt;
    cookie.freshness = data.freshness;
    return cookie;
  }
}

/**
 * InventoryManager 클래스
 */
export class InventoryManager {
  constructor() {
    /** @type {Cookie[]} */
    this.cookies = [];

    /** @type {number} */
    this.maxCapacity = 20; // 기본 재고 용량

    /** @type {number} */
    this.totalCookiesMade = 0;

    /** @type {number} */
    this.totalCookiesSold = 0;
  }

  /**
   * 쿠키 추가
   * @param {Cookie} cookie
   * @returns {boolean} 성공 여부
   */
  addCookie(cookie) {
    if (this.cookies.length >= this.maxCapacity) {
      console.warn('재고가 가득 찼습니다!');
      return false;
    }

    this.cookies.push(cookie);
    this.totalCookiesMade++;
    console.log(`쿠키 추가: ${cookie.recipeName} (${cookie.grade.name}등급)`);
    return true;
  }

  /**
   * 쿠키 제거 (판매/폐기)
   * @param {string} cookieId
   * @returns {Cookie|null}
   */
  removeCookie(cookieId) {
    const index = this.cookies.findIndex(c => c.id === cookieId);
    if (index === -1) return null;

    const removed = this.cookies.splice(index, 1)[0];
    return removed;
  }

  /**
   * 쿠키 판매
   * @param {string} cookieId
   * @returns {number} 판매 금액 (0이면 실패)
   */
  sellCookie(cookieId) {
    const cookie = this.removeCookie(cookieId);
    if (!cookie) return 0;

    this.totalCookiesSold++;
    return cookie.getCurrentPrice();
  }

  /**
   * 가장 좋은 쿠키 가져오기 (판매용)
   * @returns {Cookie|null}
   */
  getBestCookie() {
    if (this.cookies.length === 0) return null;
    return this.cookies.reduce((best, current) =>
      current.totalScore > best.totalScore ? current : best
    );
  }

  /**
   * 가장 오래된 쿠키 가져오기
   * @returns {Cookie|null}
   */
  getOldestCookie() {
    if (this.cookies.length === 0) return null;
    return this.cookies.reduce((oldest, current) =>
      current.createdAt < oldest.createdAt ? current : oldest
    );
  }

  /**
   * 등급별 쿠키 수 조회
   * @returns {object}
   */
  getGradeCount() {
    const counts = { S: 0, A: 0, B: 0, C: 0 };
    this.cookies.forEach(cookie => {
      counts[cookie.grade.name]++;
    });
    return counts;
  }

  /**
   * 전체 재고 가치 계산
   * @returns {number}
   */
  getTotalValue() {
    return this.cookies.reduce((sum, cookie) => sum + cookie.getCurrentPrice(), 0);
  }

  /**
   * 시간 경과에 따른 신선도 감소
   * @param {number} hours - 경과 시간
   */
  updateFreshness(hours) {
    const freshnessLossPerHour = 5;
    const spoiledCookies = [];

    this.cookies.forEach(cookie => {
      cookie.decreaseFreshness(hours * freshnessLossPerHour);
      if (cookie.isSpoiled()) {
        spoiledCookies.push(cookie.id);
      }
    });

    // 상한 쿠키 제거
    spoiledCookies.forEach(id => {
      this.removeCookie(id);
      console.log('쿠키가 상해서 폐기되었습니다.');
    });

    return spoiledCookies.length;
  }

  /**
   * 재고가 비어있는지 확인
   * @returns {boolean}
   */
  isEmpty() {
    return this.cookies.length === 0;
  }

  /**
   * 재고가 가득 찼는지 확인
   * @returns {boolean}
   */
  isFull() {
    return this.cookies.length >= this.maxCapacity;
  }

  /**
   * 현재 재고 수
   * @returns {number}
   */
  getCount() {
    return this.cookies.length;
  }

  /**
   * 용량 업그레이드
   * @param {number} amount
   */
  upgradeCapacity(amount) {
    this.maxCapacity += amount;
  }

  /**
   * 직렬화 (저장용)
   * @returns {object}
   */
  serialize() {
    return {
      cookies: this.cookies.map(c => c.serialize()),
      maxCapacity: this.maxCapacity,
      totalCookiesMade: this.totalCookiesMade,
      totalCookiesSold: this.totalCookiesSold
    };
  }

  /**
   * 역직렬화 (로드용)
   * @param {object} data
   */
  deserialize(data) {
    if (!data) return;

    this.cookies = (data.cookies || []).map(c => Cookie.deserialize(c));
    this.maxCapacity = data.maxCapacity || 20;
    this.totalCookiesMade = data.totalCookiesMade || 0;
    this.totalCookiesSold = data.totalCookiesSold || 0;
  }

  /**
   * 초기화 (새 게임)
   */
  reset() {
    this.cookies = [];
    this.maxCapacity = 20;
    this.totalCookiesMade = 0;
    this.totalCookiesSold = 0;
  }
}

// 전역 싱글톤 인스턴스
export const inventoryManager = new InventoryManager();
