/**
 * TimeManager 단위 테스트
 *
 * 테스트 항목:
 * 1. 에너지 시스템
 * 2. 시간대 시스템
 * 3. 요일/캘린더 시스템
 * 4. 특별 이벤트 시스템
 * 5. 저장/로드
 * 6. 엣지 케이스
 */

// 테스트용 Mock localStorage
const mockStorage = {
  data: {},
  getItem(key) { return this.data[key] || null; },
  setItem(key, value) { this.data[key] = value; },
  removeItem(key) { delete this.data[key]; },
  clear() { this.data = {}; }
};

// Node.js 환경에서 테스트할 경우 globalThis에 localStorage 설정
if (typeof globalThis !== 'undefined' && !globalThis.localStorage) {
  globalThis.localStorage = mockStorage;
}

// TimeManager 모듈 import (경로는 실행 환경에 맞게 조정)
import {
  timeManager,
  TimePeriod,
  DayOfWeek,
  DayNames,
  DayEffects,
  ActivityEnergyCost,
  SpecialEventType
} from '../src/core/TimeManager.js';

// 간단한 테스트 프레임워크
const tests = [];
let passed = 0;
let failed = 0;

function describe(name, fn) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`테스트 스위트: ${name}`);
  console.log('='.repeat(50));
  fn();
}

function it(name, fn) {
  tests.push({ name, fn });
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
    toBeGreaterThan(expected) {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeLessThan(expected) {
      if (actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value, but got ${actual}`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected falsy value, but got ${actual}`);
      }
    },
    toContain(item) {
      if (!actual.includes(item)) {
        throw new Error(`Expected ${actual} to contain ${item}`);
      }
    },
    toHaveLength(length) {
      if (actual.length !== length) {
        throw new Error(`Expected length ${length}, but got ${actual.length}`);
      }
    }
  };
}

function runTests() {
  console.log('\n\n' + '#'.repeat(60));
  console.log('# TimeManager 테스트 시작');
  console.log('#'.repeat(60));

  for (const test of tests) {
    try {
      // 각 테스트 전 리셋
      mockStorage.clear();
      timeManager.reset();

      test.fn();
      console.log(`  [PASS] ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`  [FAIL] ${test.name}`);
      console.log(`         ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '-'.repeat(50));
  console.log(`결과: ${passed} 통과, ${failed} 실패 (총 ${tests.length} 테스트)`);
  console.log('-'.repeat(50));

  return failed === 0;
}

// ============================================
// 테스트 케이스 정의
// ============================================

describe('에너지 시스템', () => {
  it('초기 에너지는 100이어야 함', () => {
    expect(timeManager.energy).toBe(100);
    expect(timeManager.maxEnergy).toBe(100);
  });

  it('에너지 소모가 정상 작동해야 함', () => {
    const result = timeManager.consumeEnergy(30, 'MAKE_COOKIE');
    expect(result).toBe(true);
    expect(timeManager.energy).toBe(70);
  });

  it('에너지 부족 시 소모 실패해야 함', () => {
    timeManager.energy = 20;
    const result = timeManager.consumeEnergy(30, 'MAKE_COOKIE');
    expect(result).toBe(false);
    expect(timeManager.energy).toBe(20);
  });

  it('canPerformActivity가 정확히 판단해야 함', () => {
    timeManager.energy = 30;
    expect(timeManager.canPerformActivity('MAKE_COOKIE')).toBe(true);  // 30 필요
    expect(timeManager.canPerformActivity('SELL_SESSION')).toBe(true); // 20 필요

    timeManager.energy = 15;
    expect(timeManager.canPerformActivity('MAKE_COOKIE')).toBe(false); // 30 필요
    expect(timeManager.canPerformActivity('RECIPE_RESEARCH')).toBe(true); // 15 필요
  });

  it('performActivity가 에너지를 정확히 소모해야 함', () => {
    const startEnergy = timeManager.energy;
    timeManager.performActivity('SELL_SESSION');
    expect(timeManager.energy).toBe(startEnergy - ActivityEnergyCost.SELL_SESSION);
  });

  it('에너지 회복이 최대치를 초과하지 않아야 함', () => {
    timeManager.energy = 90;
    timeManager.restoreEnergy(20);
    expect(timeManager.energy).toBe(100);
  });
});

describe('시간대 시스템', () => {
  it('초기 시간대는 아침이어야 함', () => {
    expect(timeManager.timePeriod).toBe(TimePeriod.MORNING);
    expect(timeManager.timePeriodIndex).toBe(0);
  });

  it('에너지 25 소모 시 시간대가 변경되어야 함', () => {
    timeManager.consumeEnergy(25, 'test');
    expect(timeManager.timePeriodIndex).toBe(1);
    expect(timeManager.timePeriod).toBe(TimePeriod.AFTERNOON);
  });

  it('휴식이 시간대를 진행시켜야 함', () => {
    const initialPeriod = timeManager.timePeriodIndex;
    timeManager.rest();
    expect(timeManager.timePeriodIndex).toBe(initialPeriod + 1);
  });

  it('시간대 정보를 올바르게 반환해야 함', () => {
    const info = timeManager.getCurrentTimePeriodInfo();
    expect(info.period).toBe(TimePeriod.MORNING);
    expect(info.name).toBe('아침');
    expect(info.icon).toBe('🌅');
  });

  it('손님 가중치가 시간대별로 달라야 함', () => {
    const morningWeights = timeManager.getCustomerWeights();
    expect(morningWeights.student).toBeGreaterThan(1);  // 아침에 학생 많음

    // 밤으로 변경
    timeManager.timePeriod = TimePeriod.NIGHT;
    timeManager.timePeriodIndex = 3;

    const nightWeights = timeManager.getCustomerWeights();
    expect(nightWeights.tourist).toBeGreaterThan(1);  // 밤에 관광객 많음
  });
});

describe('요일/캘린더 시스템', () => {
  it('초기 요일은 월요일이어야 함', () => {
    expect(timeManager.dayOfWeek).toBe(DayOfWeek.MONDAY);
    expect(timeManager.day).toBe(1);
  });

  it('advanceDay가 날짜를 증가시켜야 함', () => {
    timeManager.advanceDay();
    expect(timeManager.day).toBe(2);
    expect(timeManager.dayOfWeek).toBe(DayOfWeek.TUESDAY);
  });

  it('요일이 7일 후 월요일로 돌아와야 함', () => {
    for (let i = 0; i < 7; i++) {
      timeManager.advanceDay();
    }
    expect(timeManager.dayOfWeek).toBe(DayOfWeek.MONDAY);
  });

  it('요일별 효과가 올바르게 적용되어야 함', () => {
    // 월요일
    expect(DayEffects[DayOfWeek.MONDAY].effects.ingredientDiscount).toBe(0.2);

    // 수요일
    expect(DayEffects[DayOfWeek.WEDNESDAY].effects.priceVolatility).toBe(2.0);

    // 금요일
    expect(DayEffects[DayOfWeek.FRIDAY].effects.customerMultiplier).toBe(1.5);

    // 일요일
    expect(DayEffects[DayOfWeek.SUNDAY].effects.maxEnergy).toBe(50);
  });

  it('일요일에 에너지 최대치가 50이어야 함', () => {
    timeManager.dayOfWeek = DayOfWeek.SUNDAY;
    timeManager._applyDayEnergyLimit();
    expect(timeManager.energy).toBe(50);
  });

  it('주간 캘린더가 올바르게 생성되어야 함', () => {
    const calendar = timeManager.getWeekCalendar();
    expect(calendar).toHaveLength(7);

    // 오늘 체크
    const today = calendar.find(d => d.isToday);
    expect(today).toBeTruthy();
    expect(today.day).toBe(timeManager.day);
  });

  it('advanceDay 후 에너지와 시간대가 리셋되어야 함', () => {
    timeManager.energy = 30;
    timeManager.timePeriodIndex = 2;
    timeManager.advanceDay();

    expect(timeManager.energy).toBe(100);
    expect(timeManager.timePeriodIndex).toBe(0);
    expect(timeManager.timePeriod).toBe(TimePeriod.MORNING);
  });
});

describe('특별 이벤트 시스템', () => {
  it('강제 이벤트가 추가되어야 함', () => {
    timeManager.forceStartEvent(SpecialEventType.FOOD_FESTIVAL);
    expect(timeManager.activeEvents).toHaveLength(1);
    expect(timeManager.activeEvents[0].type).toBe(SpecialEventType.FOOD_FESTIVAL);
  });

  it('이벤트가 종료일 후 제거되어야 함', () => {
    timeManager.forceStartEvent(SpecialEventType.INFLUENCER_VISIT);
    expect(timeManager.activeEvents).toHaveLength(1);

    // 이벤트는 1일 지속
    timeManager.advanceDay();
    timeManager.advanceDay();  // 이벤트 종료

    expect(timeManager.activeEvents).toHaveLength(0);
  });

  it('이벤트 효과가 combinedEffects에 반영되어야 함', () => {
    timeManager.forceStartEvent(SpecialEventType.FOOD_FESTIVAL);
    const effects = timeManager.getCombinedEffects();

    expect(effects.customerMultiplier).toBeGreaterThan(1);
    expect(effects.revenueBonus).toBeGreaterThan(0);
  });
});

describe('일일 결산', () => {
  it('수익 기록이 작동해야 함', () => {
    timeManager.recordRevenue(10000);
    expect(timeManager.dailySummary.revenue).toBe(10000);

    timeManager.recordRevenue(5000);
    expect(timeManager.dailySummary.revenue).toBe(15000);
  });

  it('쿠키 제작 기록이 작동해야 함', () => {
    timeManager.recordCookieMade();
    timeManager.recordCookieMade();
    expect(timeManager.dailySummary.cookiesMade).toBe(2);
  });

  it('쿠키 판매 기록이 작동해야 함', () => {
    timeManager.recordCookieSold();
    expect(timeManager.dailySummary.cookiesSold).toBe(1);
    expect(timeManager.dailySummary.customersServed).toBe(1);
  });

  it('최고 판매가 기록이 갱신되어야 함', () => {
    timeManager.recordRevenue(5000);
    expect(timeManager.dailySummary.bestSale).toBe(5000);

    timeManager.recordRevenue(8000);
    expect(timeManager.dailySummary.bestSale).toBe(8000);

    timeManager.recordRevenue(3000);
    expect(timeManager.dailySummary.bestSale).toBe(8000);  // 갱신 안됨
  });

  it('advanceDay 후 일일 결산이 리셋되어야 함', () => {
    timeManager.recordRevenue(10000);
    timeManager.recordCookieMade();
    timeManager.advanceDay();

    expect(timeManager.dailySummary.revenue).toBe(0);
    expect(timeManager.dailySummary.cookiesMade).toBe(0);
  });
});

describe('저장/로드', () => {
  it('데이터가 저장되어야 함', () => {
    timeManager.day = 5;
    timeManager.energy = 50;
    timeManager.save();

    expect(mockStorage.getItem('djjc_time')).toBeTruthy();
  });

  it('데이터가 로드되어야 함', () => {
    timeManager.day = 5;
    timeManager.energy = 50;
    timeManager.dayOfWeek = DayOfWeek.FRIDAY;
    timeManager.save();

    // 리셋 후 로드
    timeManager.day = 1;
    timeManager.energy = 100;
    timeManager.dayOfWeek = DayOfWeek.MONDAY;

    timeManager.load();

    expect(timeManager.day).toBe(5);
    expect(timeManager.energy).toBe(50);
    expect(timeManager.dayOfWeek).toBe(DayOfWeek.FRIDAY);
  });

  it('reset이 모든 데이터를 초기화해야 함', () => {
    timeManager.day = 10;
    timeManager.energy = 30;
    timeManager.forceStartEvent(SpecialEventType.FOOD_FESTIVAL);

    timeManager.reset();

    expect(timeManager.day).toBe(1);
    expect(timeManager.energy).toBe(100);
    expect(timeManager.activeEvents).toHaveLength(0);
  });
});

describe('엣지 케이스', () => {
  it('음수 에너지 소모 시도를 방지해야 함', () => {
    const result = timeManager.consumeEnergy(-10, 'test');
    expect(result).toBe(false);
  });

  it('에너지 0에서 하루 종료 트리거되어야 함', () => {
    let dayEndTriggered = false;
    timeManager.on('onDayEnd', () => { dayEndTriggered = true; });

    timeManager.energy = 10;
    timeManager.consumeEnergy(10, 'test');

    expect(dayEndTriggered).toBe(true);
  });

  it('밤 시간대 후 휴식 시 하루 종료', () => {
    timeManager.timePeriodIndex = 3;  // 밤
    timeManager.timePeriod = TimePeriod.NIGHT;

    let dayEndTriggered = false;
    timeManager.on('onDayEnd', () => { dayEndTriggered = true; });

    timeManager.rest();

    expect(dayEndTriggered).toBe(true);
  });

  it('이벤트 리스너가 정상 작동해야 함', () => {
    let energyChanged = false;
    const handler = () => { energyChanged = true; };

    timeManager.on('onEnergyChange', handler);
    timeManager.consumeEnergy(10, 'test');

    expect(energyChanged).toBe(true);

    // 리스너 제거 테스트
    energyChanged = false;
    timeManager.off('onEnergyChange', handler);
    timeManager.consumeEnergy(10, 'test');

    expect(energyChanged).toBe(false);
  });

  it('getStatusSummary가 모든 필드를 반환해야 함', () => {
    const status = timeManager.getStatusSummary();

    expect(status.day).toBeTruthy();
    expect(status.dayOfWeek !== undefined).toBe(true);
    expect(status.dayName).toBeTruthy();
    expect(status.timePeriod).toBeTruthy();
    expect(status.energy !== undefined).toBe(true);
    expect(status.maxEnergy !== undefined).toBe(true);
    expect(status.periodInfo).toBeTruthy();
    expect(status.dayEffect).toBeTruthy();
  });
});

// 테스트 실행
runTests();

// HTML에서 직접 테스트 결과를 볼 수 있도록 export
export { runTests, tests, passed, failed };
