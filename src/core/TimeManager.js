/**
 * TimeManager.js
 * 통합 시간 시스템: 에너지 + 시간대 + 캘린더
 *
 * 융합 설계:
 * - 에너지 100/일, 활동별 소모
 * - 4시간대 (아침/점심/저녁/밤), 에너지 25 소모당 1시간대 진행
 * - 7일 캘린더, 요일별 이벤트 + 특별 이벤트
 */

// ============================================
// 상수 정의
// ============================================

/** 시간대 열거형 */
export const TimePeriod = Object.freeze({
  MORNING: 'morning',   // 06:00 - 12:00
  AFTERNOON: 'afternoon', // 12:00 - 18:00
  EVENING: 'evening',   // 18:00 - 22:00
  NIGHT: 'night'        // 22:00 - 06:00
});

/** 요일 열거형 */
export const DayOfWeek = Object.freeze({
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6
});

/** 요일 이름 (한글) */
export const DayNames = Object.freeze([
  '월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'
]);

/** 요일 이름 (짧은 버전) */
export const DayNamesShort = Object.freeze([
  '월', '화', '수', '목', '금', '토', '일'
]);

/** 시간대 정보 */
export const TimePeriodInfo = Object.freeze({
  [TimePeriod.MORNING]: {
    name: '아침',
    icon: '🌅',
    hours: '06:00 - 12:00',
    bgGradient: ['#FFE4B5', '#FFA500'],
    ambientColor: 'rgba(255, 200, 100, 0.3)',
    description: '상쾌한 아침, 출근길 손님들'
  },
  [TimePeriod.AFTERNOON]: {
    name: '점심',
    icon: '☀️',
    hours: '12:00 - 18:00',
    bgGradient: ['#87CEEB', '#FFD700'],
    ambientColor: 'rgba(255, 255, 200, 0.2)',
    description: '분주한 점심시간, 직장인 러시'
  },
  [TimePeriod.EVENING]: {
    name: '저녁',
    icon: '🌆',
    hours: '18:00 - 22:00',
    bgGradient: ['#FF6B6B', '#4ECDC4'],
    ambientColor: 'rgba(255, 150, 100, 0.3)',
    description: '여유로운 저녁, SNS 활동 활발'
  },
  [TimePeriod.NIGHT]: {
    name: '밤',
    icon: '🌙',
    hours: '22:00 - 06:00',
    bgGradient: ['#1a1a2e', '#16213e'],
    ambientColor: 'rgba(100, 100, 200, 0.3)',
    description: '프리미엄 야간 영업'
  }
});

/** 요일별 효과 */
export const DayEffects = Object.freeze({
  [DayOfWeek.MONDAY]: {
    name: '월요일',
    icon: '💰',
    title: '재료 할인의 날',
    effects: {
      ingredientDiscount: 0.2,      // 재료 20% 할인
      customerMultiplier: 0.8,      // 손님 20% 감소 (월요병)
      priceVolatility: 1.0
    },
    description: '재료 20% 할인! 손님은 조금 적어요.'
  },
  [DayOfWeek.TUESDAY]: {
    name: '화요일',
    icon: '📅',
    title: '평범한 화요일',
    effects: {
      ingredientDiscount: 0,
      customerMultiplier: 1.0,
      priceVolatility: 1.0
    },
    description: '평범한 하루입니다.'
  },
  [DayOfWeek.WEDNESDAY]: {
    name: '수요일',
    icon: '📈',
    title: '시세 변동의 날',
    effects: {
      ingredientDiscount: 0,
      customerMultiplier: 1.0,
      priceVolatility: 2.0          // 가격 변동성 2배
    },
    description: '두쫀코스피 변동성 2배! 대박 or 쪽박?'
  },
  [DayOfWeek.THURSDAY]: {
    name: '목요일',
    icon: '❤️',
    title: '단골 감사의 날',
    effects: {
      ingredientDiscount: 0,
      customerMultiplier: 1.0,
      priceVolatility: 1.0,
      regularCustomerBonus: 2.0     // 단골 등장 확률 2배
    },
    description: '단골 손님 등장 확률 2배!'
  },
  [DayOfWeek.FRIDAY]: {
    name: '금요일',
    icon: '🎉',
    title: '불금 대박의 날',
    effects: {
      ingredientDiscount: 0,
      customerMultiplier: 1.5,      // 손님 50% 증가
      priceVolatility: 1.2,
      viralChance: 1.3              // 바이럴 확률 30% 증가
    },
    description: '불금! 손님 50% 증가, 바이럴 확률 UP!'
  },
  [DayOfWeek.SATURDAY]: {
    name: '토요일',
    icon: '✨',
    title: '프리미엄 주말',
    effects: {
      ingredientDiscount: 0,
      customerMultiplier: 1.3,
      priceVolatility: 1.0,
      revenueBonus: 0.1             // 매출 10% 보너스
    },
    description: '주말 특수! 매출 10% 보너스'
  },
  [DayOfWeek.SUNDAY]: {
    name: '일요일',
    icon: '😴',
    title: '휴식의 날',
    effects: {
      ingredientDiscount: 0,
      customerMultiplier: 0.5,      // 손님 50% 감소
      priceVolatility: 0.5,
      maxEnergy: 50,                // 에너지 50만 사용 가능
      researchBonus: 1.5            // 레시피 연구 효율 50% 증가
    },
    description: '반휴일! 레시피 연구에 집중하세요.'
  }
});

/** 시간대별 손님 타입 가중치 */
export const CustomerWeightsByPeriod = Object.freeze({
  [TimePeriod.MORNING]: {
    student: 3.0,       // 등교하는 학생들
    worker: 2.0,        // 출근하는 직장인
    hipster: 0.5,
    tourist: 0.3,
    grandmother: 1.0
  },
  [TimePeriod.AFTERNOON]: {
    student: 1.5,
    worker: 3.0,        // 점심시간!
    hipster: 1.5,
    tourist: 1.0,
    grandmother: 1.5
  },
  [TimePeriod.EVENING]: {
    student: 1.0,
    worker: 1.5,
    hipster: 3.0,       // 힙한 저녁 시간
    tourist: 2.0,
    grandmother: 0.5
  },
  [TimePeriod.NIGHT]: {
    student: 0.3,
    worker: 0.5,
    hipster: 2.0,
    tourist: 4.0,       // 두바이 관광객 밤에 많음!
    grandmother: 0.1
  }
});

/** 활동별 에너지 소모량 */
export const ActivityEnergyCost = Object.freeze({
  MAKE_COOKIE: 30,      // 쿠키 제작 (전체 플로우)
  SELL_SESSION: 20,     // 판매 세션
  RECIPE_RESEARCH: 15,  // 레시피 연구
  UPGRADE_SHOP: 10,     // 업그레이드 구매
  REST: 0               // 휴식 (시간만 소모)
});

/** 특별 이벤트 타입 */
export const SpecialEventType = Object.freeze({
  FOOD_FESTIVAL: 'food_festival',
  INFLUENCER_VISIT: 'influencer_visit',
  HEALTH_INSPECTION: 'health_inspection',
  CELEBRITY_ORDER: 'celebrity_order',
  WEATHER_STORM: 'weather_storm',
  VIRAL_MOMENT: 'viral_moment'
});

/** 특별 이벤트 정의 */
export const SpecialEvents = Object.freeze({
  [SpecialEventType.FOOD_FESTIVAL]: {
    name: '두바이 푸드 페스티벌',
    icon: '🎪',
    duration: 1,  // 1일
    probability: 0.05,
    effects: {
      customerMultiplier: 2.5,
      revenueBonus: 0.3,
      touristBonus: 3.0
    },
    description: '대박! 손님이 2.5배, 관광객 대거 방문!'
  },
  [SpecialEventType.INFLUENCER_VISIT]: {
    name: '인플루언서 방문',
    icon: '📸',
    duration: 1,
    probability: 0.08,
    effects: {
      viralChance: 3.0,
      revenueBonus: 0.2
    },
    description: '유명 인플루언서가 방문! 바이럴 확률 3배!'
  },
  [SpecialEventType.HEALTH_INSPECTION]: {
    name: '위생 점검',
    icon: '🔍',
    duration: 1,
    probability: 0.03,
    effects: {
      customerMultiplier: 0.5,
      qualityRequirement: 1.5
    },
    description: '위생 점검 중... 품질 기준이 높아집니다.'
  },
  [SpecialEventType.CELEBRITY_ORDER]: {
    name: 'VIP 셀럽 주문',
    icon: '🌟',
    duration: 1,
    probability: 0.04,
    effects: {
      premiumOrderChance: 0.5,
      revenueBonus: 0.5
    },
    description: '유명인이 대량 주문! 프리미엄 주문 확률 UP!'
  },
  [SpecialEventType.WEATHER_STORM]: {
    name: '사막 폭풍',
    icon: '🌪️',
    duration: 1,
    probability: 0.06,
    effects: {
      customerMultiplier: 0.3,
      deliveryCost: 2.0
    },
    description: '사막 폭풍으로 손님이 급감...'
  },
  [SpecialEventType.VIRAL_MOMENT]: {
    name: 'SNS 바이럴',
    icon: '🔥',
    duration: 2,
    probability: 0.05,
    effects: {
      customerMultiplier: 1.8,
      viralChance: 2.0,
      priceMultiplier: 1.2
    },
    description: '두쫀쿠가 SNS에서 대박! 2일간 효과!'
  }
});

// ============================================
// TimeManager 클래스
// ============================================

class TimeManager {
  constructor() {
    // 시간 상태
    this.day = 1;                           // 운영 n일째
    this.dayOfWeek = DayOfWeek.MONDAY;      // 현재 요일
    this.timePeriod = TimePeriod.MORNING;   // 현재 시간대
    this.timePeriodIndex = 0;               // 시간대 인덱스 (0-3)

    // 에너지 시스템
    this.maxEnergy = 100;
    this.energy = 100;
    this.energySpentToday = 0;

    // 특별 이벤트
    this.activeEvents = [];                 // 활성 이벤트들
    this.eventHistory = [];                 // 이벤트 히스토리

    // 통계
    this.stats = {
      totalDays: 1,
      totalEnergySpent: 0,
      activitiesCompleted: {
        cookies: 0,
        sales: 0,
        research: 0,
        upgrades: 0
      },
      bestDay: { day: 1, revenue: 0 },
      eventCount: {}
    };

    // 이벤트 리스너
    this.listeners = {
      onTimePeriodChange: [],
      onDayChange: [],
      onEnergyChange: [],
      onEventStart: [],
      onEventEnd: [],
      onDayEnd: []
    };

    // 애니메이션 상태
    this.transition = {
      active: false,
      type: null,           // 'period' | 'day'
      progress: 0,
      duration: 1000,       // ms
      from: null,
      to: null
    };

    // 일일 결산 데이터
    this.dailySummary = {
      revenue: 0,
      cookiesMade: 0,
      cookiesSold: 0,
      customersServed: 0,
      bestSale: 0
    };

    this._initialized = false;
  }

  /**
   * 초기화 (저장 데이터 로드 포함)
   */
  initialize() {
    if (this._initialized) return;

    this.load();
    this._initialized = true;

    // 일요일 에너지 제한 적용
    this._applyDayEnergyLimit();

    console.log(`[TimeManager] 초기화 완료 - ${this.day}일째 ${DayNames[this.dayOfWeek]} ${TimePeriodInfo[this.timePeriod].name}`);
  }

  // ============================================
  // 에너지 시스템
  // ============================================

  /**
   * 에너지 소모
   * @param {number} amount - 소모량
   * @param {string} activityType - 활동 타입
   * @returns {boolean} 성공 여부
   */
  consumeEnergy(amount, activityType = 'unknown') {
    if (amount < 0) {
      console.warn('[TimeManager] 음수 에너지 소모 시도');
      return false;
    }

    if (this.energy < amount) {
      console.log(`[TimeManager] 에너지 부족: ${this.energy}/${amount} 필요`);
      return false;
    }

    const previousEnergy = this.energy;
    this.energy -= amount;
    this.energySpentToday += amount;
    this.stats.totalEnergySpent += amount;

    // 활동 통계 업데이트
    this._updateActivityStats(activityType);

    // 에너지 변화 이벤트 발생
    this._emit('onEnergyChange', {
      previous: previousEnergy,
      current: this.energy,
      spent: amount,
      activityType
    });

    // 시간대 진행 체크 (25 에너지당 1시간대)
    this._checkTimePeriodProgress();

    // 하루 종료 체크
    if (this.energy <= 0) {
      this._triggerDayEnd('energy_depleted');
    }

    this.save();
    return true;
  }

  /**
   * 에너지 회복
   * @param {number} amount - 회복량
   */
  restoreEnergy(amount) {
    const maxE = this._getCurrentMaxEnergy();
    const previous = this.energy;
    this.energy = Math.min(maxE, this.energy + amount);

    this._emit('onEnergyChange', {
      previous,
      current: this.energy,
      restored: this.energy - previous
    });

    this.save();
  }

  /**
   * 특정 활동에 필요한 에너지가 있는지 확인
   * @param {string} activityKey - ActivityEnergyCost 키
   * @returns {boolean}
   */
  canPerformActivity(activityKey) {
    const cost = ActivityEnergyCost[activityKey];
    if (cost === undefined) {
      console.warn(`[TimeManager] 알 수 없는 활동: ${activityKey}`);
      return false;
    }
    return this.energy >= cost;
  }

  /**
   * 활동 수행 (에너지 자동 소모)
   * @param {string} activityKey - ActivityEnergyCost 키
   * @returns {boolean} 성공 여부
   */
  performActivity(activityKey) {
    const cost = ActivityEnergyCost[activityKey];
    if (cost === undefined) {
      console.error(`[TimeManager] 알 수 없는 활동: ${activityKey}`);
      return false;
    }

    return this.consumeEnergy(cost, activityKey);
  }

  /**
   * 현재 최대 에너지 (요일 효과 적용)
   * @private
   */
  _getCurrentMaxEnergy() {
    const dayEffect = DayEffects[this.dayOfWeek];
    return dayEffect.effects.maxEnergy || this.maxEnergy;
  }

  /**
   * 요일별 에너지 제한 적용
   * @private
   */
  _applyDayEnergyLimit() {
    const maxE = this._getCurrentMaxEnergy();
    if (this.energy > maxE) {
      this.energy = maxE;
    }
  }

  // ============================================
  // 시간대 시스템
  // ============================================

  /**
   * 시간대 진행 체크 (에너지 25당 1시간대)
   * @private
   */
  _checkTimePeriodProgress() {
    // 소모된 에너지를 기준으로 시간대 계산
    const expectedPeriodIndex = Math.min(3, Math.floor(this.energySpentToday / 25));

    if (expectedPeriodIndex > this.timePeriodIndex) {
      this._advanceTimePeriod();
    }
  }

  /**
   * 시간대 강제 진행
   * @private
   */
  _advanceTimePeriod() {
    const periods = Object.values(TimePeriod);
    const previousPeriod = this.timePeriod;

    this.timePeriodIndex++;

    if (this.timePeriodIndex >= periods.length) {
      // 밤이 지나면 하루 종료
      this._triggerDayEnd('night_passed');
      return;
    }

    this.timePeriod = periods[this.timePeriodIndex];

    // 트랜지션 시작
    this._startTransition('period', previousPeriod, this.timePeriod);

    this._emit('onTimePeriodChange', {
      previous: previousPeriod,
      current: this.timePeriod,
      info: TimePeriodInfo[this.timePeriod]
    });

    console.log(`[TimeManager] 시간대 변경: ${TimePeriodInfo[previousPeriod].name} → ${TimePeriodInfo[this.timePeriod].name}`);

    this.save();
  }

  /**
   * 휴식하기 (시간대만 진행, 에너지 소모 없음)
   * @returns {boolean} 성공 여부
   */
  rest() {
    if (this.timePeriodIndex >= 3) {
      // 이미 밤이면 하루 종료
      this._triggerDayEnd('rest_at_night');
      return true;
    }

    // 에너지를 25 단위로 맞춤 (다음 시간대로)
    const energyToNextPeriod = 25 - (this.energySpentToday % 25);
    if (energyToNextPeriod > 0 && energyToNextPeriod < 25) {
      this.energySpentToday += energyToNextPeriod;
    } else {
      this.energySpentToday += 25;
    }

    this._advanceTimePeriod();
    return true;
  }

  /**
   * 현재 시간대 정보 가져오기
   * @returns {Object}
   */
  getCurrentTimePeriodInfo() {
    return {
      period: this.timePeriod,
      index: this.timePeriodIndex,
      ...TimePeriodInfo[this.timePeriod]
    };
  }

  /**
   * 현재 시간대의 손님 가중치 가져오기
   * @returns {Object}
   */
  getCustomerWeights() {
    const baseWeights = { ...CustomerWeightsByPeriod[this.timePeriod] };
    const dayEffect = DayEffects[this.dayOfWeek];

    // 요일 효과 적용
    if (dayEffect.effects.regularCustomerBonus) {
      // 단골 보너스 (모든 타입에 적용)
      Object.keys(baseWeights).forEach(type => {
        baseWeights[type] *= 1.2;
      });
    }

    if (dayEffect.effects.touristBonus) {
      baseWeights.tourist *= dayEffect.effects.touristBonus;
    }

    // 특별 이벤트 효과
    this.activeEvents.forEach(event => {
      if (event.effects.touristBonus) {
        baseWeights.tourist *= event.effects.touristBonus;
      }
    });

    return baseWeights;
  }

  // ============================================
  // 요일/캘린더 시스템
  // ============================================

  /**
   * 하루 종료 트리거
   * @param {string} reason - 종료 사유
   * @private
   */
  _triggerDayEnd(reason) {
    console.log(`[TimeManager] 하루 종료: ${reason}`);

    // 일일 결산 데이터 수집
    const summary = this._collectDailySummary();

    this._emit('onDayEnd', {
      day: this.day,
      dayOfWeek: this.dayOfWeek,
      reason,
      summary
    });
  }

  /**
   * 다음 날로 진행
   */
  advanceDay() {
    const previousDay = this.day;
    const previousDayOfWeek = this.dayOfWeek;

    // 날짜 증가
    this.day++;
    this.dayOfWeek = (this.dayOfWeek + 1) % 7;
    this.stats.totalDays = this.day;

    // 시간대 초기화
    this.timePeriod = TimePeriod.MORNING;
    this.timePeriodIndex = 0;

    // 에너지 초기화
    this.energySpentToday = 0;
    this.energy = this._getCurrentMaxEnergy();

    // 일일 결산 초기화
    this._resetDailySummary();

    // 이벤트 처리
    this._processEventsOnDayChange();
    this._rollForNewEvent();

    // 트랜지션 시작
    this._startTransition('day', previousDay, this.day);

    this._emit('onDayChange', {
      previousDay,
      previousDayOfWeek,
      currentDay: this.day,
      currentDayOfWeek: this.dayOfWeek,
      dayEffect: DayEffects[this.dayOfWeek],
      activeEvents: this.activeEvents
    });

    console.log(`[TimeManager] 새로운 날: ${this.day}일째 ${DayNames[this.dayOfWeek]}`);

    this.save();
  }

  /**
   * 현재 요일 효과 가져오기
   * @returns {Object}
   */
  getCurrentDayEffect() {
    return DayEffects[this.dayOfWeek];
  }

  /**
   * 전체 효과 계산 (요일 + 시간대 + 이벤트)
   * @returns {Object}
   */
  getCombinedEffects() {
    const dayEffect = DayEffects[this.dayOfWeek].effects;
    const combined = { ...dayEffect };

    // 특별 이벤트 효과 합산
    this.activeEvents.forEach(event => {
      Object.entries(event.effects).forEach(([key, value]) => {
        if (typeof value === 'number') {
          if (key.includes('Multiplier') || key.includes('Bonus') || key.includes('Chance')) {
            // 곱하기 효과
            combined[key] = (combined[key] || 1) * value;
          } else {
            // 더하기 효과
            combined[key] = (combined[key] || 0) + value;
          }
        }
      });
    });

    return combined;
  }

  /**
   * 이번 주 캘린더 데이터 가져오기
   * @returns {Array}
   */
  getWeekCalendar() {
    const calendar = [];
    const startOfWeek = this.day - this.dayOfWeek;

    for (let i = 0; i < 7; i++) {
      const dayNum = startOfWeek + i;
      const isToday = dayNum === this.day;
      const isPast = dayNum < this.day;
      const dayEffect = DayEffects[i];

      // 해당 날짜의 이벤트 찾기
      const events = this.eventHistory.filter(e => e.startDay <= dayNum && e.endDay >= dayNum);

      calendar.push({
        day: dayNum > 0 ? dayNum : null,
        dayOfWeek: i,
        dayName: DayNamesShort[i],
        fullDayName: DayNames[i],
        isToday,
        isPast,
        isFuture: dayNum > this.day,
        effect: dayEffect,
        events: isToday ? this.activeEvents : events
      });
    }

    return calendar;
  }

  // ============================================
  // 특별 이벤트 시스템
  // ============================================

  /**
   * 새 이벤트 발생 확률 체크
   * @private
   */
  _rollForNewEvent() {
    // 이미 이벤트가 있으면 추가 이벤트 확률 감소
    const eventPenalty = this.activeEvents.length * 0.5;

    Object.entries(SpecialEvents).forEach(([type, eventData]) => {
      const roll = Math.random();
      const adjustedProb = eventData.probability * (1 - eventPenalty);

      if (roll < adjustedProb) {
        this._startEvent(type);
      }
    });
  }

  /**
   * 이벤트 시작
   * @param {string} eventType
   * @private
   */
  _startEvent(eventType) {
    const eventData = SpecialEvents[eventType];
    if (!eventData) return;

    const event = {
      type: eventType,
      ...eventData,
      startDay: this.day,
      endDay: this.day + eventData.duration - 1
    };

    this.activeEvents.push(event);
    this.eventHistory.push(event);

    // 통계 업데이트
    this.stats.eventCount[eventType] = (this.stats.eventCount[eventType] || 0) + 1;

    this._emit('onEventStart', event);

    console.log(`[TimeManager] 이벤트 시작: ${eventData.name}`);
  }

  /**
   * 날짜 변경 시 이벤트 처리
   * @private
   */
  _processEventsOnDayChange() {
    const expiredEvents = [];

    this.activeEvents = this.activeEvents.filter(event => {
      if (this.day > event.endDay) {
        expiredEvents.push(event);
        return false;
      }
      return true;
    });

    expiredEvents.forEach(event => {
      this._emit('onEventEnd', event);
      console.log(`[TimeManager] 이벤트 종료: ${event.name}`);
    });
  }

  /**
   * 강제로 이벤트 시작 (테스트/치트용)
   * @param {string} eventType
   */
  forceStartEvent(eventType) {
    this._startEvent(eventType);
    this.save();
  }

  // ============================================
  // 일일 결산
  // ============================================

  /**
   * 일일 수익 기록
   * @param {number} amount
   */
  recordRevenue(amount) {
    this.dailySummary.revenue += amount;

    if (amount > this.dailySummary.bestSale) {
      this.dailySummary.bestSale = amount;
    }

    // 최고 기록 갱신 체크
    if (this.dailySummary.revenue > this.stats.bestDay.revenue) {
      this.stats.bestDay = {
        day: this.day,
        revenue: this.dailySummary.revenue
      };
    }
  }

  /**
   * 쿠키 제작 기록
   */
  recordCookieMade() {
    this.dailySummary.cookiesMade++;
  }

  /**
   * 쿠키 판매 기록
   */
  recordCookieSold() {
    this.dailySummary.cookiesSold++;
    this.dailySummary.customersServed++;
  }

  /**
   * 일일 결산 데이터 수집
   * @returns {Object}
   * @private
   */
  _collectDailySummary() {
    return { ...this.dailySummary };
  }

  /**
   * 일일 결산 초기화
   * @private
   */
  _resetDailySummary() {
    this.dailySummary = {
      revenue: 0,
      cookiesMade: 0,
      cookiesSold: 0,
      customersServed: 0,
      bestSale: 0
    };
  }

  // ============================================
  // 활동 통계
  // ============================================

  /**
   * 활동 통계 업데이트
   * @param {string} activityType
   * @private
   */
  _updateActivityStats(activityType) {
    switch (activityType) {
      case 'MAKE_COOKIE':
        this.stats.activitiesCompleted.cookies++;
        break;
      case 'SELL_SESSION':
        this.stats.activitiesCompleted.sales++;
        break;
      case 'RECIPE_RESEARCH':
        this.stats.activitiesCompleted.research++;
        break;
      case 'UPGRADE_SHOP':
        this.stats.activitiesCompleted.upgrades++;
        break;
    }
  }

  // ============================================
  // 애니메이션/트랜지션
  // ============================================

  /**
   * 트랜지션 시작
   * @param {string} type - 'period' | 'day'
   * @param {any} from
   * @param {any} to
   * @private
   */
  _startTransition(type, from, to) {
    this.transition = {
      active: true,
      type,
      progress: 0,
      duration: type === 'day' ? 2000 : 1000,
      from,
      to,
      startTime: Date.now()
    };
  }

  /**
   * 트랜지션 업데이트
   * @param {number} deltaTime
   */
  updateTransition(deltaTime) {
    if (!this.transition.active) return;

    const elapsed = Date.now() - this.transition.startTime;
    this.transition.progress = Math.min(1, elapsed / this.transition.duration);

    if (this.transition.progress >= 1) {
      this.transition.active = false;
    }
  }

  /**
   * 현재 배경 그라데이션 가져오기 (트랜지션 보간 포함)
   * @returns {Array} [color1, color2]
   */
  getCurrentBackgroundGradient() {
    const currentInfo = TimePeriodInfo[this.timePeriod];

    if (this.transition.active && this.transition.type === 'period') {
      const fromInfo = TimePeriodInfo[this.transition.from];
      const toInfo = TimePeriodInfo[this.transition.to];
      const t = this._easeInOutCubic(this.transition.progress);

      return [
        this._lerpColor(fromInfo.bgGradient[0], toInfo.bgGradient[0], t),
        this._lerpColor(fromInfo.bgGradient[1], toInfo.bgGradient[1], t)
      ];
    }

    return currentInfo.bgGradient;
  }

  /**
   * 이징 함수
   * @private
   */
  _easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * 색상 보간
   * @private
   */
  _lerpColor(color1, color2, t) {
    const c1 = this._hexToRgb(color1);
    const c2 = this._hexToRgb(color2);

    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);

    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * HEX to RGB
   * @private
   */
  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  // ============================================
  // 이벤트 시스템
  // ============================================

  /**
   * 이벤트 리스너 등록
   * @param {string} eventName
   * @param {Function} callback
   */
  on(eventName, callback) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].push(callback);
    }
  }

  /**
   * 이벤트 리스너 제거
   * @param {string} eventName
   * @param {Function} callback
   */
  off(eventName, callback) {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
    }
  }

  /**
   * 이벤트 발생
   * @param {string} eventName
   * @param {any} data
   * @private
   */
  _emit(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[TimeManager] 이벤트 핸들러 오류 (${eventName}):`, error);
        }
      });
    }
  }

  // ============================================
  // 저장/로드
  // ============================================

  /**
   * 저장
   */
  save() {
    const saveData = {
      day: this.day,
      dayOfWeek: this.dayOfWeek,
      timePeriod: this.timePeriod,
      timePeriodIndex: this.timePeriodIndex,
      energy: this.energy,
      energySpentToday: this.energySpentToday,
      activeEvents: this.activeEvents,
      eventHistory: this.eventHistory.slice(-50), // 최근 50개만
      stats: this.stats,
      dailySummary: this.dailySummary,
      savedAt: Date.now()
    };

    try {
      localStorage.setItem('djjc_time', JSON.stringify(saveData));
    } catch (error) {
      console.error('[TimeManager] 저장 실패:', error);
    }
  }

  /**
   * 로드
   */
  load() {
    try {
      const saved = localStorage.getItem('djjc_time');
      if (!saved) return;

      const data = JSON.parse(saved);

      this.day = data.day || 1;
      this.dayOfWeek = data.dayOfWeek ?? DayOfWeek.MONDAY;
      this.timePeriod = data.timePeriod || TimePeriod.MORNING;
      this.timePeriodIndex = data.timePeriodIndex ?? 0;
      this.energy = data.energy ?? 100;
      this.energySpentToday = data.energySpentToday ?? 0;
      this.activeEvents = data.activeEvents || [];
      this.eventHistory = data.eventHistory || [];
      this.stats = { ...this.stats, ...data.stats };
      this.dailySummary = { ...this.dailySummary, ...data.dailySummary };

      console.log('[TimeManager] 데이터 로드 완료');
    } catch (error) {
      console.error('[TimeManager] 로드 실패:', error);
    }
  }

  /**
   * 데이터 초기화 (새 게임)
   */
  reset() {
    localStorage.removeItem('djjc_time');

    this.day = 1;
    this.dayOfWeek = DayOfWeek.MONDAY;
    this.timePeriod = TimePeriod.MORNING;
    this.timePeriodIndex = 0;
    this.energy = 100;
    this.energySpentToday = 0;
    this.activeEvents = [];
    this.eventHistory = [];
    this.stats = {
      totalDays: 1,
      totalEnergySpent: 0,
      activitiesCompleted: { cookies: 0, sales: 0, research: 0, upgrades: 0 },
      bestDay: { day: 1, revenue: 0 },
      eventCount: {}
    };
    this._resetDailySummary();

    this.save();
    console.log('[TimeManager] 초기화 완료');
  }

  // ============================================
  // 유틸리티
  // ============================================

  /**
   * 디버그 정보 출력
   */
  debug() {
    console.log('=== TimeManager Debug ===');
    console.log(`날짜: ${this.day}일째 ${DayNames[this.dayOfWeek]}`);
    console.log(`시간대: ${TimePeriodInfo[this.timePeriod].name} (${this.timePeriodIndex + 1}/4)`);
    console.log(`에너지: ${this.energy}/${this._getCurrentMaxEnergy()} (오늘 사용: ${this.energySpentToday})`);
    console.log(`활성 이벤트: ${this.activeEvents.map(e => e.name).join(', ') || '없음'}`);
    console.log(`요일 효과: ${DayEffects[this.dayOfWeek].title}`);
    console.log('========================');
  }

  /**
   * 상태 요약 가져오기 (UI용)
   * @returns {Object}
   */
  getStatusSummary() {
    const maxEnergy = this._getCurrentMaxEnergy();
    const dayEffect = DayEffects[this.dayOfWeek];
    const periodInfo = TimePeriodInfo[this.timePeriod];

    return {
      day: this.day,
      dayOfWeek: this.dayOfWeek,
      dayName: DayNames[this.dayOfWeek],
      dayNameShort: DayNamesShort[this.dayOfWeek],
      dayEffect,
      timePeriod: this.timePeriod,
      timePeriodIndex: this.timePeriodIndex,
      periodInfo,
      energy: this.energy,
      maxEnergy,
      energyPercent: (this.energy / maxEnergy) * 100,
      energySpentToday: this.energySpentToday,
      activeEvents: this.activeEvents,
      dailySummary: this.dailySummary,
      combinedEffects: this.getCombinedEffects()
    };
  }
}

// 싱글톤 인스턴스
export const timeManager = new TimeManager();
export default timeManager;
