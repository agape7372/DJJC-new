/**
 * SellState - 판매 시스템 "두쫀코스피"
 * 실시간 가격 차트 + NPC 손님 상호작용
 *
 * 사운드/파티클 효과 통합
 */

import { BaseState } from './BaseState.js';
import { GameState } from '../core/StateManager.js';
import { soundManager } from '../core/SoundManager.js';
import { particleSystem, COLORS } from '../core/ParticleSystem.js';
import { recipeManager } from '../core/RecipeManager.js';
import { inventoryManager } from '../core/InventoryManager.js';
import { timeManager, TimePeriod, TimePeriodInfo } from '../core/TimeManager.js';

export class SellState extends BaseState {
  constructor(game) {
    super(game);

    // 가격 시스템
    this.basePrice = 5000;
    this.currentPrice = this.basePrice;
    this.prevPrice = this.basePrice;
    this.priceHistory = [];
    this.maxHistory = 100;
    this.trend = 0; // -1 ~ 1

    // 쿠키 재고 (인벤토리에서 로드)
    this.sellCookies = [];       // 판매할 쿠키 목록
    this.cookieCount = 0;        // 현재 판매 가능 개수
    this.maxDisplayCookies = 3;  // 화면에 표시할 최대 개수
    this.freshness = 100;

    // 뉴스 시스템
    this.newsQueue = [];
    this.currentNews = null;
    this.newsTimer = 0;
    this.newsSlideX = 0;

    // 손님 시스템
    this.currentCustomer = null;
    this.customerTimer = 0;
    this.customerScale = 0;
    this.customerBounce = 0;

    // 손님 유형
    this.customerTypes = [
      {
        id: 'student',
        name: '학생',
        icon: '🧑‍🎓',
        payMultiplier: 0.8,
        viralBonus: 20,
        dialogues: ['용돈 다 썼는데...', '친구들한테 자랑해야지!', '틱톡 올려야지!']
      },
      {
        id: 'hipster',
        name: '힙스터',
        icon: '🧔',
        payMultiplier: 1.2,
        dialogues: ['인스타 각이다', '맛없으면 별점 테러함', '여기 힙하네']
      },
      {
        id: 'dubai',
        name: '두바이 관광객',
        icon: '🧕',
        payMultiplier: 5,
        rare: true,
        dialogues: ['금으로 바꿔드릴까요?', 'Very good cookie!', 'Mashallah!']
      },
      {
        id: 'grandma',
        name: '할머니',
        icon: '👵',
        payMultiplier: 1,
        tipBonus: 2000,
        dialogues: ['이게 요즘 유행이래', '손주 줘야겠다', '고마워, 젊은이']
      }
    ];

    // 버튼 영역
    this.sellButton = null;
    this.serviceButton = null;
    this.talkButton = null;
    this.buttonPressed = null;

    // 단골 시스템
    this.regulars = [];

    // 게임 종료
    this.dayComplete = false;
    this.earnings = 0;
    this.displayedEarnings = 0;

    // 인트로
    this.showIntro = true;
    this.introTimer = 0;
    this.introDuration = 2.0;

    // 화면 효과
    this.screenShake = 0;
    this.shakeIntensity = 0;
    this.flashAlpha = 0;

    // 가격 변동 표시
    this.priceChangePopups = [];

    // 코인 파티클
    this.coinParticles = [];

    // 결과 화면 애니메이션
    this.resultRevealProgress = 0;

    // 쿠키 흔들림 애니메이션
    this.cookieShake = [0, 0, 0];
  }

  enter() {
    this.currentPrice = this.basePrice;
    this.prevPrice = this.basePrice;
    this.priceHistory = [this.basePrice];
    this.earnings = 0;

    // 인벤토리에서 쿠키 로드 (최대 maxDisplayCookies개)
    this.sellCookies = inventoryManager.cookies.slice(0, this.maxDisplayCookies);
    this.cookieCount = this.sellCookies.length;

    // 평균 신선도 계산
    if (this.sellCookies.length > 0) {
      this.freshness = this.sellCookies.reduce((sum, c) => sum + c.freshness, 0) / this.sellCookies.length;
    } else {
      this.freshness = 100;
    }
    this.displayedEarnings = 0;
    this.dayComplete = false;
    this.currentCustomer = null;
    this.customerScale = 0;
    this.customerBounce = 0;
    this.buttonPressed = null;

    this.showIntro = true;
    this.introTimer = 0;
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.priceChangePopups = [];
    this.coinParticles = [];
    this.resultRevealProgress = 0;
    this.cookieShake = [0, 0, 0];
    this.newsSlideX = -this.config.width;

    // 초기 뉴스
    this.scheduleNews();

    // 버튼 위치
    const btnWidth = 100;
    const btnHeight = 50;
    const btnY = this.config.height - 90;
    const spacing = 10;
    const totalWidth = btnWidth * 3 + spacing * 2;
    const startX = (this.config.width - totalWidth) / 2;

    this.sellButton = { x: startX, y: btnY, width: btnWidth, height: btnHeight };
    this.serviceButton = { x: startX + btnWidth + spacing, y: btnY, width: btnWidth, height: btnHeight };
    this.talkButton = { x: startX + (btnWidth + spacing) * 2, y: btnY, width: btnWidth, height: btnHeight };

    this.game.inputManager.onTap = (pos) => this.handleTap(pos);
  }

  exit() {
    this.game.inputManager.onTap = null;
  }

  handleTap(pos) {
    // DEV 모드 스킵 버튼 체크
    if (this.config.devMode && pos) {
      const skipBtn = { x: this.config.width - 80, y: 55, width: 70, height: 35 };
      if (this.isPointInRect(pos, skipBtn)) {
        soundManager.playUIClick();
        this.game.playerData.day++;
        this.game.saveGameData();
        this.game.resetCookieStats();
        this.game.stateManager.changeState(GameState.SHOP);
        return;
      }
    }

    if (this.showIntro) {
      this.showIntro = false;
      soundManager.playUIClick();
      return;
    }

    if (this.dayComplete) {
      // 가게 허브로 돌아가기 (판매 세션 종료)
      soundManager.playUIClick();
      this.game.playerData.money += this.earnings;
      this.game.saveGameData();
      this.game.resetCookieStats();
      // 날짜 증가는 ShopState의 TimeManager가 처리
      this.game.stateManager.changeState(GameState.SHOP);
      return;
    }

    if (!this.currentCustomer) return;

    // 버튼 체크
    if (this.isPointInRect(pos, this.sellButton)) {
      this.buttonPressed = 'sell';
      this.sellCookie();
    } else if (this.isPointInRect(pos, this.serviceButton)) {
      this.buttonPressed = 'service';
      this.giveService();
    } else if (this.isPointInRect(pos, this.talkButton)) {
      this.buttonPressed = 'talk';
      this.smallTalk();
    }

    // 버튼 애니메이션 리셋
    setTimeout(() => { this.buttonPressed = null; }, 100);
  }

  sellCookie() {
    if (this.cookieCount <= 0 || this.sellCookies.length === 0) return;

    const customer = this.currentCustomer;

    // 가장 앞의 쿠키 판매
    const cookieToSell = this.sellCookies[0];

    // 요일 효과 가져오기
    const combinedEffects = timeManager.getCombinedEffects();
    const revenueBonus = combinedEffects.revenueBonus || 0;

    // 쿠키 가격 계산 (쿠키 자체 가격 + 손님 배율 + 시장 가격 영향 + 요일 보너스)
    const cookieBasePrice = cookieToSell.getCurrentPrice();
    const marketInfluence = this.currentPrice / this.basePrice;
    const dayBonus = 1 + revenueBonus;
    const price = Math.floor(cookieBasePrice * customer.type.payMultiplier * marketInfluence * dayBonus);

    // 실제로 인벤토리에서 쿠키 제거
    inventoryManager.sellCookie(cookieToSell.id);
    this.sellCookies.shift();

    // 시간 시스템에 판매 기록
    timeManager.recordCookieSold();
    timeManager.recordRevenue(price);

    // 코인 사운드 & 파티클
    soundManager.playCoin();
    this.emitCoinParticles(this.config.width / 2, this.config.height * 0.35);

    // 수익 팝업 (요일 보너스 표시)
    const bonusText = revenueBonus > 0 ? ` (+${Math.round(revenueBonus * 100)}%)` : '';
    this.showEarningsPopup(price, this.config.width / 2, this.config.height * 0.3);

    this.earnings += price;

    // 바이럴 보너스 (요일 효과 반영)
    const viralChance = combinedEffects.viralChance || 1;
    if (customer.type.viralBonus) {
      this.trend += 0.1 * viralChance;
    }

    // 쿠키 흔들림
    if (this.cookieCount > 0) {
      this.cookieShake[this.cookieCount - 1] = 1;
    }
    this.cookieCount--;

    // 화면 효과
    this.triggerShake(3, 0.1);

    this.nextCustomer();
    this.checkDayEnd();
  }

  giveService() {
    if (this.cookieCount <= 0 || this.sellCookies.length === 0) return;

    const customer = this.currentCustomer;
    customer.affection = (customer.affection || 0) + 50;

    // 서비스로 제공하는 쿠키도 인벤토리에서 제거
    const cookieToGive = this.sellCookies[0];
    inventoryManager.removeCookie(cookieToGive.id);
    this.sellCookies.shift();

    // 서비스 사운드
    soundManager.playSuccess();
    particleSystem.emitSparkle(this.config.width / 2, this.config.height * 0.35, 15);

    // 단골 등록
    if (customer.affection >= 100 && !this.regulars.includes(customer.type.id)) {
      this.regulars.push(customer.type.id);
      this.game.playerData.regulars = this.regulars;

      // 특별 효과
      soundManager.playSpecial();
      particleSystem.emitCelebration(this.config.width / 2, this.config.height * 0.3);
      this.showEarningsPopup('단골 등록!', this.config.width / 2, this.config.height * 0.25, '#9b59b6');
    }

    this.cookieShake[this.cookieCount - 1] = 1;
    this.cookieCount--;

    this.nextCustomer();
    this.checkDayEnd();
  }

  smallTalk() {
    const success = Math.random() > 0.3;

    if (success) {
      const tip = Math.floor(this.currentPrice * 0.1);
      this.earnings += tip;

      soundManager.playCoin();
      this.showEarningsPopup(`팁 +${tip.toLocaleString()}`, this.config.width / 2, this.config.height * 0.3, '#f1c40f');
      particleSystem.emitSparkle(this.config.width / 2, this.config.height * 0.35, 8);
    } else {
      soundManager.playFail();
      this.showEarningsPopup('실패...', this.config.width / 2, this.config.height * 0.3, '#e74c3c');
    }

    this.nextCustomer();
  }

  showEarningsPopup(text, x, y, color = '#2ecc71') {
    this.priceChangePopups.push({
      text: typeof text === 'number' ? `+₩${text.toLocaleString()}` : text,
      x, y,
      vy: -80,
      life: 1,
      color
    });
  }

  emitCoinParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      this.coinParticles.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y,
        vx: (Math.random() - 0.5) * 100,
        vy: -Math.random() * 150 - 50,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 10,
        life: 1,
        size: Math.random() * 8 + 6
      });
    }
  }

  nextCustomer() {
    this.currentCustomer = null;
    this.customerTimer = 0;
    this.customerScale = 0;
  }

  checkDayEnd() {
    if (this.cookieCount <= 0 || this.freshness <= 0) {
      this.dayComplete = true;
      this.resultRevealProgress = 0;

      // 일일 판매량 기록 (레시피 해금 조건용)
      const initialCount = Math.min(this.maxDisplayCookies, inventoryManager.totalCookiesMade);
      const soldCount = initialCount - this.sellCookies.length;
      recipeManager.updateSalesStats(soldCount);

      // 결과 효과
      soundManager.playFanfare();
      this.triggerShake(8, 0.3);

      // 수익에 따른 축하
      if (this.earnings >= 30000) {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            particleSystem.emitCelebration(
              Math.random() * this.config.width,
              this.config.height * 0.4
            );
          }, i * 300);
        }
      }
    }
  }

  triggerShake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.screenShake = duration;
  }

  scheduleNews() {
    const newsItems = [
      { text: '유튜버 쯔냥, 두쫀쿠 먹방 업로드!', effect: 0.3, positive: true },
      { text: '두쫀쿠 오픈런 사태 발생!', effect: 0.2, positive: true },
      { text: '편의점 짝퉁 두바이 쿠키 출시', effect: -0.3, positive: false },
      { text: '카다이프면 품절 대란', effect: -0.2, positive: false },
      { text: '인플루언서 "인생 쿠키" 발언', effect: 0.25, positive: true },
      { text: 'MZ세대 새로운 디저트 열풍!', effect: 0.15, positive: true },
      { text: '건강 전문가 "설탕 과다" 경고', effect: -0.15, positive: false }
    ];

    setTimeout(() => {
      if (this.dayComplete) return;

      const news = newsItems[Math.floor(Math.random() * newsItems.length)];
      this.currentNews = news;
      this.newsTimer = 5;
      this.newsSlideX = -this.config.width;
      this.trend += news.effect;

      // 뉴스 사운드
      soundManager.playNews(news.positive);

      // 가격 영향 파티클
      const chartCenterX = this.config.width / 2;
      if (news.positive) {
        particleSystem.emitSparkle(chartCenterX, 130, 10);
      }

      if (!this.dayComplete) {
        this.scheduleNews();
      }
    }, 5000 + Math.random() * 10000);
  }

  spawnCustomer() {
    // 시간대별 손님 가중치 가져오기
    const customerWeights = timeManager.getCustomerWeights();
    const combinedEffects = timeManager.getCombinedEffects();

    // 레시피 보너스와 요일 효과 결합
    const customerAttraction = recipeManager.getCustomerAttraction();
    const customerMultiplier = combinedEffects.customerMultiplier || 1;

    // 희귀 손님 확률 (레시피 보너스 + 요일 효과)
    let availableTypes = this.customerTypes.filter(t => !t.rare);
    const rareChance = 0.1 * customerAttraction * (customerWeights.tourist / 1.0);
    const isRare = Math.random() < rareChance;

    if (isRare) {
      availableTypes = this.customerTypes.filter(t => t.rare);
    }

    // 시간대별 가중치 적용하여 손님 타입 선택
    const weightedTypes = availableTypes.map(t => {
      let weight = 1;
      if (t.id === 'student') weight = customerWeights.student || 1;
      else if (t.id === 'hipster') weight = customerWeights.hipster || 1;
      else if (t.id === 'dubai') weight = customerWeights.tourist || 1;
      else if (t.id === 'grandma') weight = customerWeights.grandmother || 1;
      return { type: t, weight };
    });

    // 가중치 기반 랜덤 선택
    const totalWeight = weightedTypes.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedType = weightedTypes[0].type;

    for (const wt of weightedTypes) {
      random -= wt.weight;
      if (random <= 0) {
        selectedType = wt.type;
        break;
      }
    }

    this.currentCustomer = {
      type: selectedType,
      dialogue: selectedType.dialogues[Math.floor(Math.random() * selectedType.dialogues.length)],
      affection: 0,
      timeBonus: customerMultiplier  // 요일 보너스 저장
    };

    this.customerScale = 0;
    this.customerBounce = 0;

    // 희귀 손님 효과
    if (selectedType.rare) {
      soundManager.playSpecial();
      this.flashAlpha = 0.5;
      particleSystem.emitSparkle(this.config.width / 2, this.config.height * 0.35, 20);
    } else {
      soundManager.playUIClick();
    }
  }

  update(dt) {
    // 인트로
    if (this.showIntro) {
      this.introTimer += dt;
      if (this.introTimer >= this.introDuration) {
        this.showIntro = false;
      }
      return;
    }

    // 화면 흔들림
    if (this.screenShake > 0) {
      this.screenShake -= dt;
    }

    // 플래시 감소
    if (this.flashAlpha > 0) {
      this.flashAlpha -= dt * 2;
    }

    // 결과 화면 애니메이션
    if (this.dayComplete) {
      this.resultRevealProgress = Math.min(1, this.resultRevealProgress + dt);

      // 수익 카운팅
      if (this.displayedEarnings < this.earnings) {
        this.displayedEarnings += dt * this.earnings * 2;
        if (this.displayedEarnings > this.earnings) {
          this.displayedEarnings = this.earnings;
        }
      }
      return;
    }

    // 가격 변동
    this.prevPrice = this.currentPrice;
    this.updatePrice(dt);

    // 큰 가격 변동 시 효과
    const priceChange = this.currentPrice - this.prevPrice;
    if (Math.abs(priceChange) > 50) {
      this.showEarningsPopup(
        priceChange > 0 ? `▲${Math.floor(priceChange)}` : `▼${Math.floor(Math.abs(priceChange))}`,
        this.config.width - 60,
        100,
        priceChange > 0 ? '#e74c3c' : '#3498db'
      );
    }

    // 신선도 감소
    this.freshness = Math.max(0, this.freshness - dt * 2);
    if (this.freshness <= 0) {
      this.dayComplete = true;
    }

    // 뉴스 타이머
    if (this.newsTimer > 0) {
      this.newsTimer -= dt;
      // 뉴스 슬라이드 인
      this.newsSlideX += (0 - this.newsSlideX) * 0.1;
      if (this.newsTimer <= 0) {
        this.currentNews = null;
      }
    }

    // 손님 스폰
    if (!this.currentCustomer && this.cookieCount > 0) {
      this.customerTimer += dt;
      if (this.customerTimer > 1.5) {
        this.spawnCustomer();
      }
    }

    // 손님 애니메이션
    if (this.currentCustomer) {
      this.customerScale += (1 - this.customerScale) * 0.15;
      if (this.customerBounce > 0) {
        this.customerBounce -= dt * 5;
      }
    }

    // 쿠키 흔들림 감소
    for (let i = 0; i < 3; i++) {
      if (this.cookieShake[i] > 0) {
        this.cookieShake[i] -= dt * 5;
      }
    }

    // 팝업 업데이트
    this.priceChangePopups.forEach(popup => {
      popup.y += popup.vy * dt;
      popup.vy += 100 * dt;
      popup.life -= dt * 1.5;
    });
    this.priceChangePopups = this.priceChangePopups.filter(p => p.life > 0);

    // 코인 파티클 업데이트
    this.coinParticles.forEach(coin => {
      coin.x += coin.vx * dt;
      coin.y += coin.vy * dt;
      coin.vy += 400 * dt;
      coin.rotation += coin.rotationSpeed * dt;
      coin.life -= dt * 1.5;
    });
    this.coinParticles = this.coinParticles.filter(c => c.life > 0);
  }

  updatePrice(dt) {
    // 요일 효과: 가격 변동성
    const combinedEffects = timeManager.getCombinedEffects();
    const volatility = combinedEffects.priceVolatility || 1;

    const randomChange = (Math.random() - 0.5) * 200 * volatility;
    const trendChange = this.trend * 100 * volatility;

    this.currentPrice = Math.max(1000, Math.min(20000,
      this.currentPrice + (randomChange + trendChange) * dt
    ));

    this.trend *= 0.99;

    this.priceHistory.push(this.currentPrice);
    if (this.priceHistory.length > this.maxHistory) {
      this.priceHistory.shift();
    }
  }

  render(ctx) {
    // 화면 흔들림
    ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(shakeX, shakeY);
    }

    // 배경
    this.renderBackground(ctx);

    if (!this.dayComplete) {
      // 차트
      this.renderChart(ctx);

      // 뉴스 티커
      this.renderNewsTicker(ctx);

      // 매대
      this.renderCounter(ctx);

      // 손님
      this.renderCustomer(ctx);

      // UI
      this.renderUI(ctx);

      // DEV 스킵 버튼
      if (this.config.devMode) {
        this.renderDevSkipButton(ctx);
      }

      // 버튼
      this.renderButtons(ctx);

      // 코인 파티클
      this.renderCoinParticles(ctx);

      // 팝업
      this.renderPopups(ctx);
    }

    // 플래시
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 200, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, this.config.width, this.config.height);
    }

    ctx.restore();

    // 인트로
    if (this.showIntro) {
      this.renderIntro(ctx);
    }

    // 하루 종료
    if (this.dayComplete) {
      this.renderDayEnd(ctx);
    }
  }

  renderBackground(ctx) {
    // 그라데이션 배경
    const gradient = ctx.createLinearGradient(0, 0, 0, this.config.height);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(0.5, '#0f1525');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    // 그리드 패턴
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.config.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.config.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.config.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.config.width, y);
      ctx.stroke();
    }
  }

  renderChart(ctx) {
    const chartX = 20;
    const chartY = 60;
    const chartWidth = this.config.width - 40;
    const chartHeight = 150;

    // 차트 배경
    const chartBg = ctx.createLinearGradient(chartX, chartY, chartX, chartY + chartHeight);
    chartBg.addColorStop(0, 'rgba(20, 20, 40, 0.9)');
    chartBg.addColorStop(1, 'rgba(10, 10, 25, 0.9)');
    ctx.fillStyle = chartBg;
    ctx.beginPath();
    ctx.roundRect(chartX, chartY, chartWidth, chartHeight, 10);
    ctx.fill();

    // 차트 테두리
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(chartX, chartY, chartWidth, chartHeight, 10);
    ctx.stroke();

    // 그리드
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 1; i < 4; i++) {
      const y = chartY + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(chartX + 10, y);
      ctx.lineTo(chartX + chartWidth - 10, y);
      ctx.stroke();
    }

    // 가격 라인
    if (this.priceHistory.length > 1) {
      const minPrice = Math.min(...this.priceHistory) * 0.95;
      const maxPrice = Math.max(...this.priceHistory) * 1.05;
      const priceRange = maxPrice - minPrice || 1;

      // 그라데이션 영역
      const isUp = this.currentPrice > this.basePrice;
      const areaGradient = ctx.createLinearGradient(0, chartY, 0, chartY + chartHeight);
      if (isUp) {
        areaGradient.addColorStop(0, 'rgba(231, 76, 60, 0.3)');
        areaGradient.addColorStop(1, 'rgba(231, 76, 60, 0)');
      } else {
        areaGradient.addColorStop(0, 'rgba(52, 152, 219, 0.3)');
        areaGradient.addColorStop(1, 'rgba(52, 152, 219, 0)');
      }

      // 영역 채우기
      ctx.beginPath();
      this.priceHistory.forEach((price, i) => {
        const x = chartX + 10 + (i / (this.maxHistory - 1)) * (chartWidth - 20);
        const y = chartY + chartHeight - 10 - ((price - minPrice) / priceRange) * (chartHeight - 20);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(chartX + 10 + ((this.priceHistory.length - 1) / (this.maxHistory - 1)) * (chartWidth - 20), chartY + chartHeight - 10);
      ctx.lineTo(chartX + 10, chartY + chartHeight - 10);
      ctx.closePath();
      ctx.fillStyle = areaGradient;
      ctx.fill();

      // 라인
      ctx.beginPath();
      ctx.strokeStyle = isUp ? '#e74c3c' : '#3498db';
      ctx.lineWidth = 2;
      ctx.shadowColor = isUp ? '#e74c3c' : '#3498db';
      ctx.shadowBlur = 5;

      this.priceHistory.forEach((price, i) => {
        const x = chartX + 10 + (i / (this.maxHistory - 1)) * (chartWidth - 20);
        const y = chartY + chartHeight - 10 - ((price - minPrice) / priceRange) * (chartHeight - 20);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 현재 점
      const lastX = chartX + 10 + ((this.priceHistory.length - 1) / (this.maxHistory - 1)) * (chartWidth - 20);
      const lastY = chartY + chartHeight - 10 - ((this.currentPrice - minPrice) / priceRange) * (chartHeight - 20);

      ctx.fillStyle = isUp ? '#e74c3c' : '#3498db';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
      ctx.fill();

      // 펄스 효과
      const pulseSize = 5 + Math.sin(Date.now() * 0.01) * 3;
      ctx.strokeStyle = isUp ? 'rgba(231, 76, 60, 0.5)' : 'rgba(52, 152, 219, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lastX, lastY, pulseSize, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 현재 가격
    ctx.font = 'bold 28px DungGeunMo, sans-serif';
    ctx.shadowColor = this.currentPrice > this.basePrice ? '#e74c3c' : '#3498db';
    ctx.shadowBlur = 10;
    ctx.fillStyle = this.currentPrice > this.basePrice ? '#e74c3c' : '#3498db';
    ctx.textAlign = 'right';
    ctx.fillText(`₩${Math.floor(this.currentPrice).toLocaleString()}`, chartX + chartWidth - 15, chartY + 35);
    ctx.shadowBlur = 0;

    // 변동률
    const changePercent = ((this.currentPrice - this.basePrice) / this.basePrice * 100).toFixed(1);
    const arrow = this.currentPrice > this.basePrice ? '▲' : '▼';
    ctx.font = '14px DungGeunMo, sans-serif';
    ctx.fillText(`${arrow} ${Math.abs(changePercent)}%`, chartX + chartWidth - 15, chartY + 55);

    // 제목
    ctx.font = 'bold 14px DungGeunMo, sans-serif';
    ctx.fillStyle = '#f39c12';
    ctx.textAlign = 'left';
    ctx.fillText('📈 두쫀코스피', chartX + 15, chartY + 25);
  }

  renderNewsTicker(ctx) {
    if (!this.currentNews) return;

    const tickerY = 220;
    const tickerHeight = 35;

    // 배경
    ctx.save();
    ctx.translate(this.newsSlideX, 0);

    const bgColor = this.currentNews.positive ? 'rgba(231, 76, 60, 0.95)' : 'rgba(52, 152, 219, 0.95)';
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(10, tickerY, this.config.width - 20, tickerHeight, 5);
    ctx.fill();

    // 아이콘
    ctx.font = '16px sans-serif';
    ctx.fillText(this.currentNews.positive ? '📈' : '📉', 25, tickerY + 24);

    // 텍스트
    ctx.font = '14px DungGeunMo, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(this.currentNews.text, 50, tickerY + 23);

    ctx.restore();
  }

  renderCounter(ctx) {
    const counterY = this.config.height * 0.52;
    const counterHeight = 90;

    // 매대 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(25, counterY + 5, this.config.width - 50, counterHeight, 8);
    ctx.fill();

    // 매대
    const counterGradient = ctx.createLinearGradient(0, counterY, 0, counterY + counterHeight);
    counterGradient.addColorStop(0, '#8b6914');
    counterGradient.addColorStop(0.5, '#6d4c0a');
    counterGradient.addColorStop(1, '#5d4037');
    ctx.fillStyle = counterGradient;
    ctx.beginPath();
    ctx.roundRect(20, counterY, this.config.width - 40, counterHeight, 8);
    ctx.fill();

    // 유리 케이스
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(30, counterY + 10, this.config.width - 60, 50, 5);
    ctx.fill();

    // 쿠키 재고 (sellCookies 배열 기준으로 렌더링)
    for (let i = 0; i < this.maxDisplayCookies; i++) {
      const x = 70 + i * 80;
      const y = counterY + 35;

      if (i < this.sellCookies.length) {
        const cookie = this.sellCookies[i];

        ctx.save();
        const shake = this.cookieShake[i];
        if (shake > 0) {
          ctx.translate(x, y);
          ctx.rotate(Math.sin(shake * 20) * 0.2);
          ctx.translate(-x, -y);
        }

        // 쿠키 그림자
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + 15, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🍪', x, y + 10);

        // 등급 배지
        ctx.fillStyle = cookie.grade.color;
        ctx.beginPath();
        ctx.arc(x + 20, y - 10, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 10px DungGeunMo, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cookie.grade.name, x + 20, y - 10);

        ctx.restore();
      } else {
        // 빈 자리
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 재고 텍스트
    ctx.font = '12px DungGeunMo, sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`재고: ${this.sellCookies.length}/${this.maxDisplayCookies}`, this.config.width / 2, counterY + counterHeight - 10);
  }

  renderCustomer(ctx) {
    const customerY = this.config.height * 0.38;

    if (!this.currentCustomer) {
      // 대기 중
      const dotCount = Math.floor(Date.now() / 500) % 4;
      const dots = '.'.repeat(dotCount);

      ctx.font = '16px DungGeunMo, sans-serif';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.fillText(`손님을 기다리는 중${dots}`, this.config.width / 2, customerY);
      return;
    }

    const customer = this.currentCustomer;
    const scale = this.customerScale;
    const bounceY = Math.sin(this.customerBounce * Math.PI * 3) * this.customerBounce * 10;

    ctx.save();
    ctx.translate(this.config.width / 2, customerY - bounceY);
    ctx.scale(scale, scale);

    // 손님 배경 (희귀 시 황금빛)
    if (customer.type.rare) {
      const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 60);
      glowGradient.addColorStop(0, 'rgba(241, 196, 15, 0.3)');
      glowGradient.addColorStop(1, 'rgba(241, 196, 15, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(0, 0, 60, 0, Math.PI * 2);
      ctx.fill();
    }

    // 손님 아이콘
    ctx.font = '55px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(customer.type.icon, 0, 0);

    ctx.restore();

    // 손님 이름
    ctx.font = customer.type.rare ? 'bold 16px DungGeunMo, sans-serif' : '16px DungGeunMo, sans-serif';
    ctx.fillStyle = customer.type.rare ? '#f1c40f' : '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(customer.type.name, this.config.width / 2, customerY + 45);

    // 희귀 표시
    if (customer.type.rare) {
      ctx.font = '12px DungGeunMo, sans-serif';
      ctx.fillStyle = '#f1c40f';
      ctx.fillText('⭐ RARE', this.config.width / 2, customerY + 62);
    }

    // 말풍선
    this.renderCustomerBubble(ctx, customer.dialogue);
  }

  renderCustomerBubble(ctx, text) {
    const x = this.config.width / 2;
    const y = this.config.height * 0.26;

    ctx.font = '13px DungGeunMo, sans-serif';
    const textWidth = ctx.measureText(text).width;
    const bubbleWidth = Math.min(textWidth + 24, 200);
    const bubbleHeight = 35;

    // 말풍선 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.roundRect(x - bubbleWidth / 2 + 3, y - bubbleHeight / 2 + 3, bubbleWidth, bubbleHeight, 10);
    ctx.fill();

    // 말풍선 배경
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(x - bubbleWidth / 2, y - bubbleHeight / 2, bubbleWidth, bubbleHeight, 10);
    ctx.fill();

    // 꼬리
    ctx.beginPath();
    ctx.moveTo(x - 8, y + bubbleHeight / 2);
    ctx.lineTo(x, y + bubbleHeight / 2 + 10);
    ctx.lineTo(x + 8, y + bubbleHeight / 2);
    ctx.fill();

    // 텍스트
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y + 4);
  }

  renderDevSkipButton(ctx) {
    const btn = { x: this.config.width - 80, y: 55, width: 70, height: 35 };

    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 5);
    ctx.fill();

    ctx.font = 'bold 11px DungGeunMo, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('SKIP →', btn.x + btn.width / 2, btn.y + 22);
  }

  renderUI(ctx) {
    // 상단 UI 배경
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, this.config.width, 50);

    ctx.font = '14px DungGeunMo, sans-serif';
    ctx.textAlign = 'left';

    // Day
    ctx.fillStyle = '#f39c12';
    ctx.fillText(`Day ${this.game.playerData.day}`, 15, 25);

    // 신선도 바
    const freshBarX = 90;
    const freshBarWidth = 80;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.roundRect(freshBarX, 15, freshBarWidth, 16, 4);
    ctx.fill();

    const freshColor = this.freshness < 30 ? '#e74c3c' : this.freshness < 60 ? '#f39c12' : '#2ecc71';
    ctx.fillStyle = freshColor;
    ctx.beginPath();
    ctx.roundRect(freshBarX, 15, freshBarWidth * (this.freshness / 100), 16, 4);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '10px DungGeunMo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`신선도 ${Math.floor(this.freshness)}%`, freshBarX + freshBarWidth / 2, 27);

    // 수익
    ctx.font = 'bold 16px DungGeunMo, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#2ecc71';
    ctx.fillText(`₩${this.earnings.toLocaleString()}`, this.config.width - 15, 28);

    ctx.font = '10px DungGeunMo, sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText('수익', this.config.width - 15, 42);
  }

  renderButtons(ctx) {
    if (!this.currentCustomer || this.dayComplete) return;

    const buttons = [
      { rect: this.sellButton, text: '💰 판매', color: '#27ae60', id: 'sell' },
      { rect: this.serviceButton, text: '🎁 서비스', color: '#9b59b6', id: 'service' },
      { rect: this.talkButton, text: '💬 대화', color: '#3498db', id: 'talk' }
    ];

    buttons.forEach(btn => {
      const isPressed = this.buttonPressed === btn.id;
      const scale = isPressed ? 0.95 : 1;
      const yOffset = isPressed ? 2 : 0;

      ctx.save();
      ctx.translate(btn.rect.x + btn.rect.width / 2, btn.rect.y + btn.rect.height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-(btn.rect.x + btn.rect.width / 2), -(btn.rect.y + btn.rect.height / 2));

      // 버튼 그림자
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.roundRect(btn.rect.x + 2, btn.rect.y + 4, btn.rect.width, btn.rect.height, 8);
      ctx.fill();

      // 버튼 배경
      const btnGradient = ctx.createLinearGradient(
        btn.rect.x, btn.rect.y,
        btn.rect.x, btn.rect.y + btn.rect.height
      );
      btnGradient.addColorStop(0, btn.color);
      btnGradient.addColorStop(1, this.darkenColor(btn.color, 30));
      ctx.fillStyle = btnGradient;
      ctx.beginPath();
      ctx.roundRect(btn.rect.x, btn.rect.y + yOffset, btn.rect.width, btn.rect.height, 8);
      ctx.fill();

      // 버튼 텍스트
      ctx.font = 'bold 14px DungGeunMo, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(btn.text, btn.rect.x + btn.rect.width / 2, btn.rect.y + yOffset + 32);

      ctx.restore();
    });
  }

  darkenColor(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
    const b = Math.max(0, (num & 0x0000FF) - amount);
    return `rgb(${r}, ${g}, ${b})`;
  }

  renderCoinParticles(ctx) {
    this.coinParticles.forEach(coin => {
      ctx.save();
      ctx.translate(coin.x, coin.y);
      ctx.rotate(coin.rotation);
      ctx.globalAlpha = coin.life;

      // 코인
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coin.size);
      gradient.addColorStop(0, '#fff9c4');
      gradient.addColorStop(0.5, '#ffd700');
      gradient.addColorStop(1, '#b8860b');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, coin.size, coin.size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // 광택
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.ellipse(-coin.size * 0.3, -coin.size * 0.2, coin.size * 0.3, coin.size * 0.15, -0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }

  renderPopups(ctx) {
    this.priceChangePopups.forEach(popup => {
      ctx.globalAlpha = popup.life;
      ctx.font = 'bold 18px DungGeunMo, sans-serif';
      ctx.fillStyle = popup.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = popup.color;
      ctx.shadowBlur = 5;
      ctx.fillText(popup.text, popup.x, popup.y);
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;
  }

  renderIntro(ctx) {
    const progress = Math.min(1, this.introTimer / this.introDuration);

    ctx.fillStyle = `rgba(0, 0, 0, ${1 - progress * 0.3})`;
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    const slideOffset = (1 - progress) * 50;

    ctx.save();
    ctx.translate(0, slideOffset);

    ctx.font = 'bold 20px DungGeunMo, sans-serif';
    ctx.fillStyle = '#f39c12';
    ctx.textAlign = 'center';
    ctx.fillText('STEP 7', this.config.width / 2, this.config.height * 0.35);

    ctx.font = 'bold 36px DungGeunMo, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('판매 시작!', this.config.width / 2, this.config.height * 0.43);

    ctx.font = '16px DungGeunMo, sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('손님에게 쿠키를 팔아보세요!', this.config.width / 2, this.config.height * 0.52);

    const emojiScale = 1 + Math.sin(this.introTimer * 5) * 0.1;
    ctx.font = `${60 * emojiScale}px sans-serif`;
    ctx.fillText('💰', this.config.width / 2, this.config.height * 0.68);

    ctx.restore();

    if (progress > 0.5) {
      const blinkAlpha = 0.5 + Math.sin(this.introTimer * 8) * 0.3;
      ctx.font = '14px DungGeunMo, sans-serif';
      ctx.fillStyle = `rgba(255, 255, 255, ${blinkAlpha})`;
      ctx.textAlign = 'center';
      ctx.fillText('터치하여 시작', this.config.width / 2, this.config.height * 0.85);
    }
  }

  renderDayEnd(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    const centerX = this.config.width / 2;
    const revealProgress = this.resultRevealProgress;

    // 제목
    if (revealProgress > 0.1) {
      const titleAlpha = Math.min(1, (revealProgress - 0.1) * 5);
      ctx.globalAlpha = titleAlpha;

      ctx.font = 'bold 32px DungGeunMo, sans-serif';
      ctx.shadowColor = '#f39c12';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#f39c12';
      ctx.textAlign = 'center';
      ctx.fillText('🏪 영업 종료!', centerX, this.config.height * 0.2);
      ctx.shadowBlur = 0;
    }

    // Day (TimeManager에서 가져오기)
    if (revealProgress > 0.2) {
      const dayAlpha = Math.min(1, (revealProgress - 0.2) * 5);
      ctx.globalAlpha = dayAlpha;
      const timeStatus = timeManager.getStatusSummary();

      ctx.font = '20px DungGeunMo, sans-serif';
      ctx.fillStyle = '#888';
      ctx.fillText(`${timeStatus.day}일째 ${timeStatus.dayNameShort} ${timeStatus.periodInfo.icon}`, centerX, this.config.height * 0.3);
    }

    // 수익
    if (revealProgress > 0.4) {
      const earningsAlpha = Math.min(1, (revealProgress - 0.4) * 3);
      ctx.globalAlpha = earningsAlpha;

      ctx.font = '16px DungGeunMo, sans-serif';
      ctx.fillStyle = '#aaa';
      ctx.fillText('오늘의 수익', centerX, this.config.height * 0.4);

      const displayEarnings = Math.floor(this.displayedEarnings);
      ctx.font = 'bold 48px DungGeunMo, sans-serif';
      ctx.shadowColor = '#2ecc71';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#2ecc71';
      ctx.fillText(`₩${displayEarnings.toLocaleString()}`, centerX, this.config.height * 0.5);
      ctx.shadowBlur = 0;
    }

    // 평가
    if (revealProgress > 0.7) {
      const gradeAlpha = Math.min(1, (revealProgress - 0.7) * 3);
      ctx.globalAlpha = gradeAlpha;

      let grade, gradeColor, gradeText;
      if (this.earnings >= 40000) {
        grade = 'S'; gradeColor = '#ffd700'; gradeText = '대박!!! 💎';
      } else if (this.earnings >= 25000) {
        grade = 'A'; gradeColor = '#2ecc71'; gradeText = '훌륭해요! ⭐';
      } else if (this.earnings >= 15000) {
        grade = 'B'; gradeColor = '#3498db'; gradeText = '괜찮아요 👍';
      } else {
        grade = 'C'; gradeColor = '#e74c3c'; gradeText = '분발하세요 💪';
      }

      // 등급 배경
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(centerX, this.config.height * 0.65, 50, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 60px DungGeunMo, sans-serif';
      ctx.shadowColor = gradeColor;
      ctx.shadowBlur = 20;
      ctx.fillStyle = gradeColor;
      ctx.fillText(grade, centerX, this.config.height * 0.67);
      ctx.shadowBlur = 0;

      ctx.font = '16px DungGeunMo, sans-serif';
      ctx.fillStyle = gradeColor;
      ctx.fillText(gradeText, centerX, this.config.height * 0.77);
    }

    ctx.globalAlpha = 1;

    // 다음 버튼
    if (revealProgress >= 1) {
      const blinkAlpha = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
      ctx.font = '16px DungGeunMo, sans-serif';
      ctx.fillStyle = `rgba(255, 255, 255, ${blinkAlpha})`;
      ctx.textAlign = 'center';
      ctx.fillText('터치하여 가게로 돌아가기 →', centerX, this.config.height - 50);
    }
  }
}
