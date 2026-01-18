/**
 * ShopState - Good Pizza, Great Pizza Style UI
 * 1인칭 시점 시뮬레이션 (Counter / Kitchen Scene)
 */

import { BaseState } from './BaseState.js';
import { GameState } from '../core/StateManager.js';
import { inventoryManager } from '../core/InventoryManager.js';
import { shopUpgradeManager, UPGRADES, UpgradeCategory } from '../core/ShopUpgradeManager.js';
import { soundManager } from '../core/SoundManager.js';
import { particleSystem } from '../core/ParticleSystem.js';
import {
  timeManager,
  TimePeriod,
  TimePeriodInfo,
  ActivityEnergyCost
} from '../core/TimeManager.js';
import { BASE_RECIPES } from '../core/RecipeManager.js';

// ============================================
// Scene 상수 정의
// ============================================

const ShopScene = {
  COUNTER: 'counter',
  KITCHEN: 'kitchen'
};

const ModalType = {
  NONE: null,
  MARKET: 'market',
  CALENDAR: 'calendar',
  INVENTORY: 'inventory',
  UPGRADE: 'upgrade'
};

const UpgradeTab = {
  EQUIPMENT: 'equipment',
  INTERIOR: 'interior',
  INGREDIENT: 'ingredient'
};

const CustomerType = {
  STUDENT: 'student',
  HIPSTER: 'hipster',
  TOURIST: 'tourist',
  GRANDMA: 'grandma',
  BUSINESSMAN: 'businessman'
};

const CustomerInfo = {
  [CustomerType.STUDENT]: { name: '학생', patience: 1.0, tipMultiplier: 0.8, orderQuantity: [1, 2], color: '#4A90D9' },
  [CustomerType.HIPSTER]: { name: '힙스터', patience: 0.7, tipMultiplier: 1.2, orderQuantity: [1, 1], color: '#9B59B6' },
  [CustomerType.TOURIST]: { name: '관광객', patience: 0.9, tipMultiplier: 2.0, orderQuantity: [2, 4], color: '#F1C40F' },
  [CustomerType.GRANDMA]: { name: '할머니', patience: 1.5, tipMultiplier: 1.0, orderQuantity: [1, 3], color: '#E67E22' },
  [CustomerType.BUSINESSMAN]: { name: '직장인', patience: 0.5, tipMultiplier: 1.5, orderQuantity: [1, 2], color: '#34495E' }
};

const IngredientType = {
  KADAIF: 'kadaif',
  PISTACHIO: 'pistachio',
  MARSHMALLOW: 'marshmallow',
  COCOA: 'cocoa'
};

const IngredientInfo = {
  [IngredientType.KADAIF]: { name: '카다이프', color: '#D4A574', points: 25 },
  [IngredientType.PISTACHIO]: { name: '피스타치오', color: '#7CB342', points: 25 },
  [IngredientType.MARSHMALLOW]: { name: '마시멜로', color: '#FFEFD5', points: 25 },
  [IngredientType.COCOA]: { name: '코코아', color: '#5D4037', points: 25 }
};

const TIME_COLORS = {
  [TimePeriod.MORNING]: { background: '#F5E6C8', primary: '#D4893E', secondary: '#E8B86D', ambient: 'rgba(212, 137, 62, 0.1)' },
  [TimePeriod.AFTERNOON]: { background: '#F0DEB4', primary: '#C76F30', secondary: '#E09850', ambient: 'rgba(199, 111, 48, 0.1)' },
  [TimePeriod.EVENING]: { background: '#E8D4B8', primary: '#A0522D', secondary: '#CD853F', ambient: 'rgba(160, 82, 45, 0.15)' },
  [TimePeriod.NIGHT]: { background: '#3D3D5C', primary: '#6B5B95', secondary: '#8B7B8B', ambient: 'rgba(107, 91, 149, 0.2)' }
};

const COLORS = {
  primary: '#5D4037', secondary: '#8D6E63', accent: '#D4A574',
  success: '#4A7C59', danger: '#8B4513', warning: '#CC8B3C', disabled: '#9E9E9E',
  text: '#2D2016', textLight: '#6D5D4D', textBright: '#FFF8E7',
  cardBg: '#FFF8E7', panelBg: '#F5E6C8', border: '#2D2016', shadow: '#1A1410',
  energyFull: '#4A7C59', energyMid: '#CC8B3C', energyLow: '#A0522D'
};

const PIXEL_FONT = {
  title: 'bold 20px "DungGeunMo", monospace',
  large: 'bold 16px "DungGeunMo", monospace',
  normal: '14px "DungGeunMo", monospace',
  small: '12px "DungGeunMo", monospace',
  tiny: '10px "DungGeunMo", monospace'
};

export class ShopState extends BaseState {
  constructor(game) {
    super(game);
    this.currentScene = ShopScene.COUNTER;
    this.activeModal = ModalType.NONE;
    this.upgradeTab = UpgradeTab.EQUIPMENT;
    this.customerQueue = [];
    this.currentCustomer = null;
    this.customerSpawnTimer = 0;
    this.customerSpawnInterval = 3;
    this.maxQueueSize = 5;
    this.rejectedCount = 0;
    this.pendingOrders = [];
    this.maxOrders = 4;
    this.selectedOrder = null;
    this.workArea = { ingredients: [], progress: 0, recipe: null };
    this.draggedItem = null;
    this.dragStartPos = null;
    this.isDragging = false;
    this.buttons = [];
    this.scrollY = 0;
    this.touchStartY = 0;
    this.isScrolling = false;
    this.animTime = 0;
    this.toast = null;
    this.basePrice = 5000;
    this.currentPrice = 5000;
    this.priceHistory = [];
    this.maxHistory = 60;
    this.trend = 0;
    this.currentNews = null;
    this.newsTimer = 0;
    this.newsScheduleTimer = 0;
    this.showDayEndModal = false;
    this.dayEndSummary = null;
    this.showEventNotification = false;
    this.eventNotification = null;
    this.eventNotificationTimer = 0;
    this.energyPulse = 0;
    this.periodTransition = { active: false, progress: 0 };
    this.customerBobTime = 0;
    this.screenShake = { intensity: 0, duration: 0 };
    this.energyWarningCooldown = 0;
    this.lastEnergyWarningLevel = 100;
  }

  enter(params = {}) {
    this.currentScene = ShopScene.COUNTER;
    this.activeModal = ModalType.NONE;
    this.scrollY = 0;
    this.animTime = 0;
    this.showDayEndModal = false;
    this.customerQueue = [];
    this.currentCustomer = null;
    this.customerSpawnTimer = 1;
    this.rejectedCount = 0;
    timeManager.initialize();
    this.game.inputManager.onTap = (pos) => this.handleTap(pos);
    this.game.inputManager.onDrag = (pos, distance) => {
      if (distance === 0) this.handleDragStart(pos);
      else this.handleDragMove(pos);
    };
    this.game.inputManager.onDragEnd = () => this.handleDragEnd();
    const effects = shopUpgradeManager.getTotalEffects();
    inventoryManager.maxCapacity = effects.storageCapacity;
    if (this.priceHistory.length === 0) {
      this.currentPrice = this.basePrice;
      this.priceHistory = [this.basePrice];
      this.trend = 0;
    }
    this.newsScheduleTimer = 5 + Math.random() * 5;
    this._bindTimeEvents();
    console.log('ShopState entered (Good Pizza Style)');
  }

  exit() {
    this.game.inputManager.onTap = null;
    this.game.inputManager.onDrag = null;
    this.game.inputManager.onDragEnd = null;
    this._unbindTimeEvents();
  }

  _bindTimeEvents() {
    this._onDayEnd = (data) => this._handleDayEnd(data);
    this._onEventStart = (event) => this._handleEventStart(event);
    this._onTimePeriodChange = (data) => this._handleTimePeriodChange(data);
    timeManager.on('onDayEnd', this._onDayEnd);
    timeManager.on('onEventStart', this._onEventStart);
    timeManager.on('onTimePeriodChange', this._onTimePeriodChange);
  }

  _unbindTimeEvents() {
    if (this._onDayEnd) timeManager.off('onDayEnd', this._onDayEnd);
    if (this._onEventStart) timeManager.off('onEventStart', this._onEventStart);
    if (this._onTimePeriodChange) timeManager.off('onTimePeriodChange', this._onTimePeriodChange);
  }

  _handleDayEnd(data) {
    this.showDayEndModal = true;
    this.dayEndSummary = data.summary;
    soundManager.playDayEnd();
    particleSystem.emitDayEnd(this.config.width, this.config.height);
  }

  _handleEventStart(event) {
    this.showEventNotification = true;
    this.eventNotification = event;
    this.eventNotificationTimer = 4;
    soundManager.playEventStart();
    this.screenShake = { intensity: 5, duration: 0.3 };
  }

  _handleTimePeriodChange(data) {
    this.periodTransition = { active: true, progress: 0 };
    soundManager.playTimePeriodChange();
  }

  handleTap(pos) {
    if (this.showDayEndModal) { this._handleDayEndModalClick(pos); return; }
    if (this.activeModal !== ModalType.NONE) { this._handleModalClick(pos); return; }
    if (this.isScrolling) { this.isScrolling = false; return; }
    for (const btn of this.buttons) {
      if (this.isPointInRect(pos, btn)) { this.handleButtonClick(btn); return; }
    }
  }

  handleDragStart(pos) {
    this.touchStartY = pos.y;
    this.isScrolling = false;
    this.dragStartPos = { x: pos.x, y: pos.y };
    if (this.currentScene === ShopScene.KITCHEN && this.activeModal === ModalType.NONE) {
      const station = this._getIngredientStationAt(pos);
      if (station) {
        this.isDragging = true;
        this.draggedItem = { type: station.type, x: pos.x, y: pos.y };
        soundManager.playClick();
      }
    }
  }

  handleDragMove(pos) {
    if (this.isDragging && this.draggedItem) {
      this.draggedItem.x = pos.x;
      this.draggedItem.y = pos.y;
      return;
    }
    if (this.activeModal !== ModalType.NONE) {
      const deltaY = this.touchStartY - pos.y;
      if (Math.abs(deltaY) > 10) {
        this.isScrolling = true;
        this.scrollY = Math.max(0, this.scrollY + deltaY * 0.5);
        this.touchStartY = pos.y;
      }
    }
  }

  handleDragEnd() {
    if (this.isDragging && this.draggedItem) {
      if (this._getDropZone(this.draggedItem) === 'workArea') {
        this._addIngredientToWorkArea(this.draggedItem.type);
        soundManager.playSuccess();
      }
      this.isDragging = false;
      this.draggedItem = null;
    }
    this.isScrolling = false;
  }

  _getIngredientStationAt(pos) {
    const stations = this._getIngredientStations();
    for (const s of stations) {
      if (pos.x >= s.x && pos.x <= s.x + s.width && pos.y >= s.y && pos.y <= s.y + s.height) return s;
    }
    return null;
  }

  _getIngredientStations() {
    const y = 380, size = 70, gap = 15;
    const startX = (this.config.width - (size * 4 + gap * 3)) / 2;
    return [
      { type: IngredientType.KADAIF, x: startX, y, width: size, height: size },
      { type: IngredientType.PISTACHIO, x: startX + size + gap, y, width: size, height: size },
      { type: IngredientType.MARSHMALLOW, x: startX + (size + gap) * 2, y, width: size, height: size },
      { type: IngredientType.COCOA, x: startX + (size + gap) * 3, y, width: size, height: size }
    ];
  }

  _getDropZone(item) {
    const b = { x: 60, y: 490, width: this.config.width - 120, height: 140 };
    if (item.x >= b.x && item.x <= b.x + b.width && item.y >= b.y && item.y <= b.y + b.height) return 'workArea';
    return null;
  }

  _addIngredientToWorkArea(type) {
    if (this.workArea.ingredients.includes(type)) { this.showToast('Already added!', 'warning'); return; }
    this.workArea.ingredients.push(type);
    this.workArea.progress = Math.min(100, this.workArea.progress + IngredientInfo[type].points);
  }

  _handleDayEndModalClick(pos) {
    const btnX = this.config.width / 2 - 80, btnY = this.config.height / 2 + 120;
    if (pos.x >= btnX && pos.x <= btnX + 160 && pos.y >= btnY && pos.y <= btnY + 50) {
      this.showDayEndModal = false;
      this.dayEndSummary = null;
      timeManager.advanceDay();
      soundManager.playSuccess();
    }
  }

  _handleModalClick(pos) {
    const closeBtn = { x: this.config.width - 50, y: 125, width: 35, height: 35 };
    if (this.isPointInRect(pos, closeBtn)) {
      this.activeModal = ModalType.NONE;
      this.scrollY = 0;
      soundManager.playClick();
      return;
    }
    for (const btn of this.buttons) {
      if (this.isPointInRect(pos, btn)) { this.handleButtonClick(btn); return; }
    }
  }

  handleButtonClick(btn) {
    soundManager.playClick();
    switch (btn.action) {
      case 'goto_kitchen': this.currentScene = ShopScene.KITCHEN; break;
      case 'goto_counter': this.currentScene = ShopScene.COUNTER; break;
      case 'open_market': this.activeModal = ModalType.MARKET; this.scrollY = 0; break;
      case 'open_calendar': this.activeModal = ModalType.CALENDAR; this.scrollY = 0; break;
      case 'open_inventory': this.activeModal = ModalType.INVENTORY; this.scrollY = 0; break;
      case 'open_upgrade': this.activeModal = ModalType.UPGRADE; this.scrollY = 0; break;
      case 'upgrade_equipment': this.upgradeTab = UpgradeTab.EQUIPMENT; this.scrollY = 0; break;
      case 'upgrade_interior': this.upgradeTab = UpgradeTab.INTERIOR; this.scrollY = 0; break;
      case 'upgrade_ingredient': this.upgradeTab = UpgradeTab.INGREDIENT; this.scrollY = 0; break;
      case 'accept_order': this._handleAcceptOrder(); break;
      case 'reject_order': this._handleRejectOrder(); break;
      case 'select_order': this._handleSelectOrder(btn.orderIndex); break;
      case 'bake_cookie': this._handleBakeCookie(); break;
      case 'clear_workarea': this._handleClearWorkArea(); break;
      case 'rest': this._handleRest(); break;
      case 'end_day': timeManager._triggerDayEnd('manual'); break;
      case 'buy_upgrade': this.handleBuyUpgrade(btn.upgradeId); break;
    }
  }

  _handleAcceptOrder() {
    if (!this.currentCustomer) return;
    if (this.pendingOrders.length >= this.maxOrders) { this.showToast('Order queue full!', 'warning'); return; }
    if (!timeManager.canPerformActivity('MAKE_COOKIE')) { this.showToast('에너지 부족!', 'error'); soundManager.playBuzzer(); return; }
    const order = {
      customer: this.currentCustomer,
      recipe: this.currentCustomer.order.recipe,
      quantity: this.currentCustomer.order.quantity,
      completed: 0
    };
    this.pendingOrders.push(order);
    soundManager.playSuccess();
    this.currentCustomer = null;
    this.customerSpawnTimer = 2;
    this.showToast('Order accepted!', 'success');
  }

  _handleRejectOrder() {
    if (!this.currentCustomer) return;
    this.rejectedCount++;
    soundManager.playBuzzer();
    this.screenShake = { intensity: 3, duration: 0.15 };
    this.currentCustomer = null;
    this.customerSpawnTimer = 1;
    this.showToast('Customer left...', 'warning');
  }

  _spawnCustomer() {
    if (this.currentCustomer) return;
    const types = Object.values(CustomerType);
    const weights = [0.3, 0.25, 0.1, 0.2, 0.15];
    let r = Math.random(), sel = types[0], cum = 0;
    for (let i = 0; i < types.length; i++) { cum += weights[i]; if (r < cum) { sel = types[i]; break; } }
    const info = CustomerInfo[sel];
    const recipes = BASE_RECIPES.filter(r => r.unlocked !== false);
    const recipe = recipes[Math.floor(Math.random() * recipes.length)] || BASE_RECIPES[0];
    const [min, max] = info.orderQuantity;
    const qty = Math.floor(Math.random() * (max - min + 1)) + min;
    this.currentCustomer = { type: sel, info, patience: info.patience, order: { recipe, quantity: qty } };
  }

  _handleSelectOrder(idx) {
    if (idx >= 0 && idx < this.pendingOrders.length) {
      this.selectedOrder = idx;
      this.workArea.recipe = this.pendingOrders[idx].recipe;
      soundManager.playClick();
    }
  }

  _handleBakeCookie() {
    if (this.workArea.progress < 100) { this.showToast('Add more ingredients!', 'warning'); return; }
    if (this.selectedOrder === null || this.selectedOrder >= this.pendingOrders.length) { this.showToast('Select an order!', 'warning'); return; }
    if (!timeManager.canPerformActivity('MAKE_COOKIE')) { this.showToast('에너지 부족!', 'error'); soundManager.playBuzzer(); return; }
    timeManager.performActivity('MAKE_COOKIE');
    soundManager.playEnergyDrain();
    const order = this.pendingOrders[this.selectedOrder];
    order.completed++;
    inventoryManager.addCookie({
      recipeId: order.recipe.id,
      recipeName: order.recipe.name,
      stats: { flavor: 70 + Math.random() * 20, texture: 70 + Math.random() * 20, visual: 70 + Math.random() * 20 },
      totalScore: 75
    });
    soundManager.playSuccess();
    if (order.completed >= order.quantity) {
      const reward = Math.floor(order.recipe.bonuses.priceMultiplier * 5000 * order.quantity);
      this.game.money += reward;
      this.pendingOrders.splice(this.selectedOrder, 1);
      this.selectedOrder = null;
      this.showToast(`Complete! +${reward}G`, 'success');
    } else {
      this.showToast(`${order.completed}/${order.quantity}`, 'info');
    }
    this._handleClearWorkArea();
  }

  _handleClearWorkArea() { this.workArea.ingredients = []; this.workArea.progress = 0; }

  _handleRest() {
    const status = timeManager.getStatusSummary();
    if (status.timePeriodIndex >= 3) { this.showToast('Night. End the day.', 'info'); return; }
    timeManager.rest();
    this.showToast('Rested!', 'success');
  }

  handleBuyUpgrade(id) {
    const upgrade = UPGRADES[id];
    if (!upgrade) return;
    if (!timeManager.canPerformActivity('UPGRADE_SHOP')) { this.showToast('에너지 부족!', 'error'); soundManager.playBuzzer(); return; }
    const result = shopUpgradeManager.canPurchase(id, this.game.money);
    if (!result.canBuy) { this.showToast(result.reason, 'error'); soundManager.playBuzzer(); return; }
    this.game.money -= upgrade.price;
    shopUpgradeManager.purchase(id);
    timeManager.performActivity('UPGRADE_SHOP');
    soundManager.playSuccess();
    this.showToast(`${upgrade.name} purchased!`, 'success');
  }

  showToast(msg, type = 'info') { this.toast = { message: msg, type, startTime: Date.now(), duration: 2500 }; }

  update(dt) {
    this.animTime += dt;
    this.customerBobTime += dt;
    this.energyPulse = Math.sin(this.animTime * 3) * 0.5 + 0.5;
    particleSystem.update(dt);
    timeManager.updateTransition(dt * 1000);
    if (this.periodTransition.active) {
      this.periodTransition.progress += dt * 2;
      if (this.periodTransition.progress >= 1) this.periodTransition.active = false;
    }
    if (this.screenShake.duration > 0) {
      this.screenShake.duration -= dt;
      if (this.screenShake.duration <= 0) this.screenShake.intensity = 0;
    }
    if (this.toast && Date.now() - this.toast.startTime > this.toast.duration) this.toast = null;
    if (this.showEventNotification) {
      this.eventNotificationTimer -= dt;
      if (this.eventNotificationTimer <= 0) this.showEventNotification = false;
    }
    if (this.currentScene === ShopScene.COUNTER && !this.currentCustomer) {
      this.customerSpawnTimer -= dt;
      if (this.customerSpawnTimer <= 0) { this._spawnCustomer(); this.customerSpawnTimer = this.customerSpawnInterval; }
    }
    if (this.activeModal === ModalType.MARKET) this.updateMarket(dt);
    inventoryManager.updateFreshness(dt);
  }

  updateMarket(dt) {
    const dayEffect = timeManager.getCombinedEffects();
    const vol = dayEffect.priceVolatility || 1;
    this.currentPrice = Math.max(1000, Math.min(15000, this.currentPrice + ((Math.random() - 0.5) * 150 * vol + this.trend * 80) * dt));
    this.trend *= 0.995;
    this.priceHistory.push(this.currentPrice);
    if (this.priceHistory.length > this.maxHistory) this.priceHistory.shift();
    if (this.newsTimer > 0) { this.newsTimer -= dt; if (this.newsTimer <= 0) this.currentNews = null; }
    this.newsScheduleTimer -= dt;
    if (this.newsScheduleTimer <= 0) { this.spawnNews(); this.newsScheduleTimer = 8 + Math.random() * 12; }
  }

  spawnNews() {
    const items = [
      { text: '[UP] VIRAL HIT!', effect: 0.4, positive: true },
      { text: '[DN] FAKE COOKIE', effect: -0.35, positive: false },
      { text: '[UP] TREND!', effect: 0.3, positive: true },
      { text: '[DN] SHORTAGE', effect: -0.25, positive: false }
    ];
    const news = items[Math.floor(Math.random() * items.length)];
    this.currentNews = news;
    this.newsTimer = 5;
    this.trend += news.effect;
    soundManager.playNews(news.positive);
  }

  render(ctx) {
    this.buttons = [];
    ctx.save();
    if (this.screenShake.intensity > 0) {
      ctx.translate((Math.random() - 0.5) * this.screenShake.intensity * 2, (Math.random() - 0.5) * this.screenShake.intensity * 2);
    }
    const status = timeManager.getStatusSummary();
    const tc = TIME_COLORS[status.timePeriod];
    this.renderBackground(ctx, status, tc);
    this.renderHeader(ctx, status, tc);
    if (this.currentScene === ShopScene.COUNTER) this.renderCounterScene(ctx, status);
    else this.renderKitchenScene(ctx, status);
    particleSystem.render(ctx);
    if (this.isDragging && this.draggedItem) this.renderDraggedItem(ctx);
    if (this.activeModal !== ModalType.NONE) this.renderModal(ctx, status);
    if (this.showEventNotification) this.renderEventNotification(ctx);
    if (this.showDayEndModal) this.renderDayEndModal(ctx, status);
    this.renderToast(ctx);
    ctx.restore();
  }

  renderBackground(ctx, status, tc) {
    const g = ctx.createLinearGradient(0, 0, 0, this.config.height);
    const bg = timeManager.getCurrentBackgroundGradient();
    g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, this.config.width, this.config.height);
    ctx.fillStyle = tc.ambient; ctx.fillRect(0, 0, this.config.width, this.config.height);
    if (status.timePeriod === TimePeriod.NIGHT) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      [[50,60],[120,30],[200,50],[280,25],[350,45]].forEach(([x,y]) => {
        ctx.globalAlpha = 0.3 + Math.sin(this.animTime * 2 + x) * 0.35 + 0.35;
        ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
  }

  renderHeader(ctx, status, tc) {
    this.drawPixelBox(ctx, 0, 0, this.config.width, 115, { fill: COLORS.primary, borderWidth: 4, shadow: false });
    this.drawPixelBox(ctx, 8, 8, this.config.width - 16, 99, { fill: COLORS.panelBg, borderWidth: 2, shadow: false });
    this.drawText(ctx, `${status.day}일차`, 20, 28, { font: PIXEL_FONT.large, color: COLORS.text });
    this.drawText(ctx, `[${status.dayNameShort}]`, 100, 28, { font: PIXEL_FONT.small, color: COLORS.secondary });
    const tl = status.timePeriod === TimePeriod.NIGHT ? 'NIGHT' : status.timePeriod === TimePeriod.EVENING ? 'EVE' : status.timePeriod === TimePeriod.AFTERNOON ? 'NOON' : 'AM';
    this.drawText(ctx, `< ${tl} >`, this.config.width - 20, 28, { font: PIXEL_FONT.large, color: tc.primary, align: 'right' });
    this.renderEnergyBar(ctx, status);
    this.drawText(ctx, '두쫀쿠 베이커리', this.config.width / 2, 92, { font: PIXEL_FONT.title, color: COLORS.text, align: 'center' });
    this.drawPixelIcon(ctx, 'money', this.config.width - 100, 92, 16);
    this.drawText(ctx, `${(this.game.money || 0).toLocaleString()}G`, this.config.width - 20, 92, { font: PIXEL_FONT.normal, color: COLORS.accent, align: 'right' });
    this.renderMiniButtons(ctx);
  }

  renderEnergyBar(ctx, status) {
    const bx = 20, by = 45, bw = this.config.width - 40, bh = 28;
    const ratio = status.energy / status.maxEnergy;
    const ec = ratio > 0.5 ? COLORS.energyFull : ratio > 0.25 ? COLORS.energyMid : COLORS.energyLow;
    this.drawPixelProgressBar(ctx, bx, by, bw, bh, ratio, { bgColor: '#3D3226', fillColor: ec, segments: 10 });
    const my = by + bh + 4;
    for (let i = 0; i < 4; i++) {
      const mx = bx + (bw / 4) * i + (bw / 8);
      const active = i === status.timePeriodIndex, past = i < status.timePeriodIndex;
      ctx.fillStyle = active ? COLORS.accent : past ? COLORS.disabled : COLORS.cardBg;
      ctx.fillRect(mx - 8, my, 16, 8);
      ctx.strokeStyle = COLORS.border; ctx.lineWidth = 1; ctx.strokeRect(mx - 8, my, 16, 8);
      if (active) { ctx.fillStyle = COLORS.text; ctx.beginPath(); ctx.moveTo(mx, my - 3); ctx.lineTo(mx - 4, my); ctx.lineTo(mx + 4, my); ctx.closePath(); ctx.fill(); }
    }
    this.drawText(ctx, `에너지: ${status.energy}/${status.maxEnergy}`, bx + bw / 2, by + bh / 2, { font: PIXEL_FONT.small, color: COLORS.textBright, align: 'center', baseline: 'middle' });
  }

  renderMiniButtons(ctx) {
    const btns = [{ i: '$', a: 'open_market' }, { i: 'C', a: 'open_calendar' }, { i: 'B', a: 'open_inventory' }, { i: 'U', a: 'open_upgrade' }];
    const s = 28, gap = 8, sx = 15, y = 88;
    btns.forEach((b, i) => {
      const x = sx + i * (s + gap);
      ctx.fillStyle = COLORS.secondary; ctx.fillRect(x, y, s, s);
      ctx.strokeStyle = COLORS.border; ctx.lineWidth = 2; ctx.strokeRect(x, y, s, s);
      this.drawText(ctx, b.i, x + s / 2, y + s / 2, { font: PIXEL_FONT.small, color: COLORS.textBright, align: 'center', baseline: 'middle' });
      this.buttons.push({ x, y, width: s, height: s, action: b.a });
    });
  }

  renderCounterScene(ctx, status) {
    ctx.fillStyle = '#8B4513'; ctx.fillRect(0, this.config.height - 150, this.config.width, 150);
    ctx.fillStyle = '#5D3A1A'; ctx.fillRect(0, this.config.height - 150, this.config.width, 8);
    this.renderCustomerArea(ctx);
    if (this.currentCustomer) { this.renderOrderBubble(ctx); this.renderOrderButtons(ctx); }
    this.renderSceneButton(ctx, 'kitchen');
    this.renderPendingOrdersPreview(ctx);
  }

  renderCustomerArea(ctx) {
    const cx = this.config.width / 2, cy = 240;
    if (this.currentCustomer) {
      const bob = Math.sin(this.customerBobTime * 2) * 3;
      this.drawPixelCustomer(ctx, this.currentCustomer.type, cx, cy + bob, 80);
      const info = this.currentCustomer.info;
      ctx.fillStyle = info.color; ctx.fillRect(cx - 40, cy + 50, 80, 22);
      ctx.strokeStyle = COLORS.border; ctx.lineWidth = 2; ctx.strokeRect(cx - 40, cy + 50, 80, 22);
      this.drawText(ctx, info.name, cx, cy + 61, { font: PIXEL_FONT.small, color: COLORS.textBright, align: 'center', baseline: 'middle' });
    } else {
      const dots = '.'.repeat(Math.floor(this.animTime * 2) % 4);
      this.drawText(ctx, `손님 대기중${dots}`, cx, cy + 20, { font: PIXEL_FONT.normal, color: COLORS.textLight, align: 'center' });
    }
  }

  renderOrderBubble(ctx) {
    if (!this.currentCustomer) return;
    const bx = 30, by = 380, bw = this.config.width - 60, bh = 100;
    this.drawPixelBox(ctx, bx, by, bw, bh, { fill: COLORS.cardBg, borderWidth: 3, shadow: true });
    ctx.fillStyle = COLORS.cardBg;
    ctx.beginPath(); ctx.moveTo(this.config.width / 2 - 15, by); ctx.lineTo(this.config.width / 2, by - 20); ctx.lineTo(this.config.width / 2 + 15, by); ctx.fill();
    ctx.strokeStyle = COLORS.border; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(this.config.width / 2 - 15, by); ctx.lineTo(this.config.width / 2, by - 20); ctx.lineTo(this.config.width / 2 + 15, by); ctx.stroke();
    const o = this.currentCustomer.order;
    this.drawText(ctx, '주문:', bx + 15, by + 25, { font: PIXEL_FONT.small, color: COLORS.textLight });
    this.drawText(ctx, o.recipe.name, bx + 15, by + 50, { font: PIXEL_FONT.large, color: COLORS.text });
    this.drawText(ctx, `x ${o.quantity}`, bx + bw - 20, by + 50, { font: PIXEL_FONT.title, color: COLORS.accent, align: 'right' });
    this.drawPixelIcon(ctx, 'cookie', bx + bw - 70, by + 45, 24);
  }

  renderOrderButtons(ctx) {
    const by = 500, bw = 140, bh = 55, gap = 30;
    const ax = this.config.width / 2 - bw - gap / 2;
    this.drawPixelBox(ctx, ax, by, bw, bh, { fill: COLORS.success, borderWidth: 3, shadow: true });
    this.drawText(ctx, '수락', ax + bw / 2, by + 20, { font: PIXEL_FONT.large, color: COLORS.textBright, align: 'center' });
    this.drawText(ctx, 'V', ax + bw / 2, by + 42, { font: PIXEL_FONT.title, color: COLORS.textBright, align: 'center' });
    this.buttons.push({ x: ax, y: by, width: bw, height: bh, action: 'accept_order' });
    const rx = this.config.width / 2 + gap / 2;
    this.drawPixelBox(ctx, rx, by, bw, bh, { fill: COLORS.danger, borderWidth: 3, shadow: true });
    this.drawText(ctx, '거절', rx + bw / 2, by + 20, { font: PIXEL_FONT.large, color: COLORS.textBright, align: 'center' });
    this.drawText(ctx, 'X', rx + bw / 2, by + 42, { font: PIXEL_FONT.title, color: COLORS.textBright, align: 'center' });
    this.buttons.push({ x: rx, y: by, width: bw, height: bh, action: 'reject_order' });
  }

  renderPendingOrdersPreview(ctx) {
    const py = 580, ss = 50, gap = 10;
    const sx = (this.config.width - (ss * this.maxOrders + gap * (this.maxOrders - 1))) / 2;
    this.drawText(ctx, '대기 주문', this.config.width / 2, py - 15, { font: PIXEL_FONT.small, color: COLORS.textLight, align: 'center' });
    for (let i = 0; i < this.maxOrders; i++) {
      const x = sx + i * (ss + gap), has = i < this.pendingOrders.length;
      ctx.fillStyle = has ? COLORS.accent : 'rgba(0,0,0,0.2)'; ctx.fillRect(x, py, ss, ss);
      ctx.strokeStyle = COLORS.border; ctx.lineWidth = 2; ctx.strokeRect(x, py, ss, ss);
      if (has) {
        const o = this.pendingOrders[i];
        this.drawText(ctx, `${o.completed}/${o.quantity}`, x + ss / 2, py + ss / 2, { font: PIXEL_FONT.small, color: COLORS.text, align: 'center', baseline: 'middle' });
      }
    }
  }

  renderKitchenScene(ctx, status) {
    ctx.fillStyle = '#D4C4B0'; ctx.fillRect(0, 120, this.config.width, this.config.height - 120);
    this.renderKitchenTiles(ctx);
    this.renderOrderSlots(ctx);
    this.renderIngredientStations(ctx);
    this.renderWorkArea(ctx);
    this.renderOvenArea(ctx);
    this.renderSceneButton(ctx, 'counter');
  }

  renderKitchenTiles(ctx) {
    const ts = 40, sy = 120;
    for (let y = sy; y < sy + 80; y += ts) {
      for (let x = 0; x < this.config.width; x += ts) {
        ctx.fillStyle = ((x / ts) + (y / ts)) % 2 === 0 ? '#E8DED0' : '#DDD4C4';
        ctx.fillRect(x, y, ts, ts);
      }
    }
  }

  renderOrderSlots(ctx) {
    const sy = 210, ss = 70, gap = 12;
    const sx = (this.config.width - (ss * this.maxOrders + gap * (this.maxOrders - 1))) / 2;
    this.drawText(ctx, '[ 주문 목록 ]', this.config.width / 2, sy - 20, { font: PIXEL_FONT.normal, color: COLORS.text, align: 'center' });
    for (let i = 0; i < this.maxOrders; i++) {
      const x = sx + i * (ss + gap), has = i < this.pendingOrders.length, sel = this.selectedOrder === i;
      this.drawPixelBox(ctx, x, sy, ss, ss, { fill: sel ? COLORS.accent : has ? COLORS.cardBg : 'rgba(0,0,0,0.1)', borderWidth: sel ? 3 : 2, shadow: has });
      if (has) {
        const o = this.pendingOrders[i];
        this.drawPixelIcon(ctx, 'cookie', x + ss / 2, sy + 25, 20);
        this.drawText(ctx, `${o.completed}/${o.quantity}`, x + ss / 2, sy + 55, { font: PIXEL_FONT.small, color: COLORS.text, align: 'center' });
        this.buttons.push({ x, y: sy, width: ss, height: ss, action: 'select_order', orderIndex: i });
      }
    }
  }

  renderIngredientStations(ctx) {
    const stations = this._getIngredientStations();
    this.drawText(ctx, '[ 재료 ]', this.config.width / 2, 360, { font: PIXEL_FONT.normal, color: COLORS.text, align: 'center' });
    stations.forEach(s => {
      const info = IngredientInfo[s.type];
      this.drawPixelBox(ctx, s.x, s.y, s.width, s.height, { fill: info.color, borderWidth: 3, shadow: true });
      this.drawText(ctx, info.name, s.x + s.width / 2, s.y + s.height - 12, { font: PIXEL_FONT.tiny, color: COLORS.textBright, align: 'center' });
      this.drawPixelIngredient(ctx, s.type, s.x + s.width / 2, s.y + 28, 28);
    });
  }

  renderWorkArea(ctx) {
    const ax = 60, ay = 490, aw = this.config.width - 120, ah = 140;
    this.drawText(ctx, '[ 작업대 ]', this.config.width / 2, ay - 15, { font: PIXEL_FONT.normal, color: COLORS.text, align: 'center' });
    this.drawPixelBox(ctx, ax, ay, aw, ah, { fill: '#C4B4A0', borderWidth: 3, shadow: false });
    const bx = ax + 15, by = ay + 15, bw = aw - 30, bh = 25;
    this.drawPixelProgressBar(ctx, bx, by, bw, bh, this.workArea.progress / 100, { bgColor: '#8B7B6B', fillColor: COLORS.success, segments: 10 });
    this.drawText(ctx, `${this.workArea.progress}%`, bx + bw / 2, by + bh / 2, { font: PIXEL_FONT.small, color: COLORS.textBright, align: 'center', baseline: 'middle' });
    const iy = ay + 60, is = 40, ig = 10, isx = ax + 20;
    this.workArea.ingredients.forEach((ing, i) => {
      const x = isx + i * (is + ig), info = IngredientInfo[ing];
      ctx.fillStyle = info.color; ctx.fillRect(x, iy, is, is);
      ctx.strokeStyle = COLORS.border; ctx.lineWidth = 2; ctx.strokeRect(x, iy, is, is);
      this.drawPixelIngredient(ctx, ing, x + is / 2, iy + is / 2, 20);
    });
    if (this.workArea.ingredients.length < 4) {
      const hx = isx + this.workArea.ingredients.length * (is + ig);
      ctx.strokeStyle = COLORS.textLight; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.strokeRect(hx, iy, is, is); ctx.setLineDash([]);
      this.drawText(ctx, '+', hx + is / 2, iy + is / 2, { font: PIXEL_FONT.large, color: COLORS.textLight, align: 'center', baseline: 'middle' });
    }
    if (this.workArea.ingredients.length > 0) {
      const cx = ax + aw - 70, cy = iy;
      ctx.fillStyle = COLORS.danger; ctx.fillRect(cx, cy, 55, is);
      ctx.strokeStyle = COLORS.border; ctx.lineWidth = 2; ctx.strokeRect(cx, cy, 55, is);
      this.drawText(ctx, '지움', cx + 27, cy + is / 2, { font: PIXEL_FONT.small, color: COLORS.textBright, align: 'center', baseline: 'middle' });
      this.buttons.push({ x: cx, y: cy, width: 55, height: is, action: 'clear_workarea' });
    }
  }

  renderOvenArea(ctx) {
    const ox = 30, oy = 650, ow = 90, oh = 80;
    this.drawPixelBox(ctx, ox, oy, ow, oh, { fill: '#4A4A4A', borderWidth: 3, shadow: true });
    ctx.fillStyle = this.workArea.progress >= 100 ? '#FF6B35' : '#2A2A2A';
    ctx.fillRect(ox + 15, oy + 15, ow - 30, oh - 40);
    ctx.strokeStyle = COLORS.border; ctx.lineWidth = 2; ctx.strokeRect(ox + 15, oy + 15, ow - 30, oh - 40);
    this.drawText(ctx, '오븐', ox + ow / 2, oy + oh - 10, { font: PIXEL_FONT.tiny, color: COLORS.textBright, align: 'center' });
    const bx = 140, bw = this.config.width - 170, canBake = this.workArea.progress >= 100 && this.selectedOrder !== null;
    this.drawPixelBox(ctx, bx, oy, bw, oh, { fill: canBake ? COLORS.success : COLORS.disabled, borderWidth: 3, shadow: canBake });
    this.drawText(ctx, '쿠키 굽기', bx + bw / 2, oy + 25, { font: PIXEL_FONT.large, color: COLORS.textBright, align: 'center' });
    this.drawText(ctx, canBake ? '준비 완료!' : '재료 추가', bx + bw / 2, oy + 50, { font: PIXEL_FONT.small, color: canBake ? COLORS.textBright : 'rgba(255,255,255,0.5)', align: 'center' });
    if (canBake) this.buttons.push({ x: bx, y: oy, width: bw, height: oh, action: 'bake_cookie' });
  }

  renderSceneButton(ctx, target) {
    const by = this.config.height - 60, bw = 180, bh = 45, bx = (this.config.width - bw) / 2;
    const toK = target === 'kitchen';
    this.drawPixelBox(ctx, bx, by, bw, bh, { fill: COLORS.secondary, borderWidth: 3, shadow: true });
    this.drawText(ctx, toK ? '>> 주방 >>' : '<< 카운터 <<', bx + bw / 2, by + bh / 2, { font: PIXEL_FONT.normal, color: COLORS.textBright, align: 'center', baseline: 'middle' });
    this.buttons.push({ x: bx, y: by, width: bw, height: bh, action: toK ? 'goto_kitchen' : 'goto_counter' });
  }

  renderDraggedItem(ctx) {
    if (!this.draggedItem) return;
    const info = IngredientInfo[this.draggedItem.type], s = 50;
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = info.color; ctx.fillRect(this.draggedItem.x - s / 2, this.draggedItem.y - s / 2, s, s);
    ctx.strokeStyle = COLORS.border; ctx.lineWidth = 3; ctx.strokeRect(this.draggedItem.x - s / 2, this.draggedItem.y - s / 2, s, s);
    this.drawPixelIngredient(ctx, this.draggedItem.type, this.draggedItem.x, this.draggedItem.y, 24);
    ctx.globalAlpha = 1;
  }

  renderModal(ctx, status) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, this.config.width, this.config.height);
    const mx = 15, my = 120, mw = this.config.width - 30, mh = this.config.height - 150;
    this.drawPixelBox(ctx, mx, my, mw, mh, { fill: COLORS.cardBg, borderWidth: 4, shadow: true });
    const cx = this.config.width - 50, cy = 125;
    ctx.fillStyle = COLORS.danger; ctx.fillRect(cx, cy, 35, 35);
    ctx.strokeStyle = COLORS.border; ctx.lineWidth = 2; ctx.strokeRect(cx, cy, 35, 35);
    this.drawText(ctx, 'X', cx + 17, cy + 17, { font: PIXEL_FONT.large, color: COLORS.textBright, align: 'center', baseline: 'middle' });
    ctx.save();
    ctx.beginPath(); ctx.rect(mx + 5, my + 50, mw - 10, mh - 60); ctx.clip();
    if (this.activeModal === ModalType.MARKET) this.renderMarketModal(ctx, mx, my, mw, mh);
    else if (this.activeModal === ModalType.CALENDAR) this.renderCalendarModal(ctx, mx, my, mw, mh, status);
    else if (this.activeModal === ModalType.INVENTORY) this.renderInventoryModal(ctx, mx, my, mw, mh);
    else if (this.activeModal === ModalType.UPGRADE) this.renderUpgradeModal(ctx, mx, my, mw, mh);
    ctx.restore();
  }

  renderMarketModal(ctx, mx, my, mw, mh) {
    this.drawText(ctx, '[ 시세 ]', mx + mw / 2, my + 30, { font: PIXEL_FONT.title, color: COLORS.primary, align: 'center' });
    const isUp = this.currentPrice >= this.basePrice;
    const pc = isUp ? '#e74c3c' : '#3498db';
    const chg = ((this.currentPrice - this.basePrice) / this.basePrice * 100);
    this.drawText(ctx, `${Math.floor(this.currentPrice).toLocaleString()}G`, mx + mw / 2, my + 90, { font: 'bold 28px DungGeunMo, monospace', color: pc, align: 'center' });
    this.drawText(ctx, `${isUp ? '▲' : '▼'} ${Math.abs(chg).toFixed(1)}%`, mx + mw / 2, my + 120, { font: PIXEL_FONT.normal, color: pc, align: 'center' });
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(mx + 15, my + 150, mw - 30, 150);
    if (this.priceHistory.length > 1) {
      const min = Math.min(...this.priceHistory) * 0.95, max = Math.max(...this.priceHistory) * 1.05, range = max - min || 1;
      ctx.beginPath(); ctx.strokeStyle = pc; ctx.lineWidth = 2;
      this.priceHistory.forEach((p, i) => {
        const px = mx + 25 + (i / (this.maxHistory - 1)) * (mw - 50);
        const py = my + 290 - ((p - min) / range) * 130;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.stroke();
    }
    if (this.currentNews) {
      ctx.fillStyle = this.currentNews.positive ? '#27ae60' : '#e74c3c'; ctx.fillRect(mx + 15, my + 320, mw - 30, 35);
      this.drawText(ctx, this.currentNews.text, mx + mw / 2, my + 337, { font: PIXEL_FONT.normal, color: COLORS.textBright, align: 'center', baseline: 'middle' });
    }
  }

  renderCalendarModal(ctx, mx, my, mw, mh, status) {
    this.drawText(ctx, '[ 캘린더 ]', mx + mw / 2, my + 30, { font: PIXEL_FONT.title, color: COLORS.primary, align: 'center' });
    const cal = timeManager.getWeekCalendar(), cw = (mw - 30) / 7, ch = 90, cy = my + 60;
    cal.forEach((d, i) => {
      const x = mx + 15 + i * cw, today = d.isToday, past = d.isPast;
      ctx.fillStyle = today ? COLORS.primary : past ? '#E0E0E0' : COLORS.cardBg;
      ctx.fillRect(x, cy, cw - 4, ch);
      ctx.strokeStyle = COLORS.border; ctx.lineWidth = today ? 3 : 1; ctx.strokeRect(x, cy, cw - 4, ch);
      this.drawText(ctx, d.dayName, x + (cw - 4) / 2, cy + 15, { font: PIXEL_FONT.tiny, color: today ? COLORS.textBright : COLORS.text, align: 'center' });
      if (d.day > 0) this.drawText(ctx, d.day.toString(), x + (cw - 4) / 2, cy + 40, { font: PIXEL_FONT.large, color: today ? COLORS.textBright : COLORS.text, align: 'center' });
    });
  }

  renderInventoryModal(ctx, mx, my, mw, mh) {
    this.drawText(ctx, '[ 재고 ]', mx + mw / 2, my + 30, { font: PIXEL_FONT.title, color: COLORS.primary, align: 'center' });
    const cookies = inventoryManager.cookies, sy = my + 60 - this.scrollY;
    if (cookies.length === 0) { this.drawText(ctx, '쿠키 없음', mx + mw / 2, my + 150, { font: PIXEL_FONT.normal, color: COLORS.textLight, align: 'center' }); return; }
    cookies.forEach((c, i) => {
      const cy = sy + i * 80;
      if (cy < my + 50 || cy > my + mh - 20) return;
      this.drawPixelBox(ctx, mx + 15, cy, mw - 30, 70, { fill: COLORS.panelBg, borderWidth: 2 });
      ctx.fillStyle = c.grade.color; ctx.fillRect(mx + 25, cy + 10, 30, 30);
      this.drawText(ctx, c.grade.name, mx + 40, cy + 25, { font: PIXEL_FONT.normal, color: COLORS.textBright, align: 'center', baseline: 'middle' });
      this.drawText(ctx, c.recipeName, mx + 70, cy + 20, { font: PIXEL_FONT.normal, color: COLORS.text });
      this.drawText(ctx, `Score: ${c.totalScore}`, mx + 70, cy + 45, { font: PIXEL_FONT.small, color: COLORS.textLight });
      this.drawText(ctx, `${c.getCurrentPrice().toLocaleString()}G`, mx + mw - 25, cy + 35, { font: PIXEL_FONT.normal, color: COLORS.accent, align: 'right' });
    });
  }

  renderUpgradeModal(ctx, mx, my, mw, mh) {
    this.drawText(ctx, '[ 업그레이드 ]', mx + mw / 2, my + 30, { font: PIXEL_FONT.title, color: COLORS.primary, align: 'center' });
    const tabs = [{ id: UpgradeTab.EQUIPMENT, l: 'EQUIP', a: 'upgrade_equipment' }, { id: UpgradeTab.INTERIOR, l: 'DECOR', a: 'upgrade_interior' }, { id: UpgradeTab.INGREDIENT, l: 'INGRE', a: 'upgrade_ingredient' }];
    const tw = (mw - 40) / 3, ty = my + 50;
    tabs.forEach((t, i) => {
      const x = mx + 15 + i * tw, active = this.upgradeTab === t.id;
      ctx.fillStyle = active ? COLORS.primary : COLORS.panelBg; ctx.fillRect(x, ty, tw - 5, 30);
      ctx.strokeStyle = COLORS.border; ctx.lineWidth = 2; ctx.strokeRect(x, ty, tw - 5, 30);
      this.drawText(ctx, t.l, x + (tw - 5) / 2, ty + 15, { font: PIXEL_FONT.small, color: active ? COLORS.textBright : COLORS.text, align: 'center', baseline: 'middle' });
      this.buttons.push({ x, y: ty, width: tw - 5, height: 30, action: t.a });
    });
    const catMap = { [UpgradeTab.EQUIPMENT]: UpgradeCategory.EQUIPMENT, [UpgradeTab.INTERIOR]: UpgradeCategory.INTERIOR, [UpgradeTab.INGREDIENT]: UpgradeCategory.INGREDIENT };
    const ups = shopUpgradeManager.getUpgradesByCategory(catMap[this.upgradeTab]);
    const sy = ty + 45 - this.scrollY, ch = 75;
    ups.forEach((u, i) => {
      const cy = sy + i * (ch + 8);
      if (cy < ty + 35 || cy > my + mh - 20) return;
      const bought = u.purchased, can = shopUpgradeManager.canPurchase(u.id, this.game.money);
      this.drawPixelBox(ctx, mx + 15, cy, mw - 30, ch, { fill: bought ? '#D4E6D4' : COLORS.cardBg, borderWidth: 2 });
      this.drawText(ctx, u.name, mx + 25, cy + 18, { font: PIXEL_FONT.normal, color: COLORS.text });
      this.drawText(ctx, u.description, mx + 25, cy + 38, { font: PIXEL_FONT.tiny, color: COLORS.textLight });
      if (bought) {
        this.drawText(ctx, '[보유]', mx + mw - 35, cy + 35, { font: PIXEL_FONT.small, color: COLORS.success, align: 'right' });
      } else {
        this.drawText(ctx, `${u.price.toLocaleString()}G`, mx + mw - 35, cy + 20, { font: PIXEL_FONT.normal, color: can.canBuy ? COLORS.success : COLORS.danger, align: 'right' });
        if (can.canBuy) {
          const bx = mx + mw - 80, by = cy + 45;
          ctx.fillStyle = COLORS.success; ctx.fillRect(bx, by, 55, 22);
          ctx.strokeStyle = COLORS.border; ctx.lineWidth = 1; ctx.strokeRect(bx, by, 55, 22);
          this.drawText(ctx, '구매', bx + 27, by + 11, { font: PIXEL_FONT.small, color: COLORS.textBright, align: 'center', baseline: 'middle' });
          this.buttons.push({ x: bx, y: by, width: 55, height: 22, action: 'buy_upgrade', upgradeId: u.id });
        }
      }
    });
  }

  drawPixelCustomer(ctx, type, x, y, size) {
    const info = CustomerInfo[type], hs = size * 0.4, bs = size * 0.5;
    ctx.fillStyle = info.color; ctx.fillRect(x - bs / 2, y - bs / 4, bs, bs);
    ctx.strokeStyle = COLORS.border; ctx.lineWidth = 2; ctx.strokeRect(x - bs / 2, y - bs / 4, bs, bs);
    ctx.fillStyle = '#FFD5B5'; ctx.fillRect(x - hs / 2, y - bs / 4 - hs, hs, hs); ctx.strokeRect(x - hs / 2, y - bs / 4 - hs, hs, hs);
    ctx.fillStyle = COLORS.text; ctx.fillRect(x - 6, y - bs / 4 - hs + 10, 4, 4); ctx.fillRect(x + 2, y - bs / 4 - hs + 10, 4, 4);
    if (type === CustomerType.HIPSTER) { ctx.strokeStyle = COLORS.text; ctx.lineWidth = 1; ctx.strokeRect(x - 8, y - bs / 4 - hs + 8, 7, 6); ctx.strokeRect(x + 1, y - bs / 4 - hs + 8, 7, 6); }
    if (type === CustomerType.TOURIST) { ctx.fillStyle = '#F1C40F'; ctx.fillRect(x - hs / 2 - 3, y - bs / 4 - hs - 8, hs + 6, 8); }
    if (type === CustomerType.GRANDMA) { ctx.fillStyle = '#C0C0C0'; ctx.fillRect(x - hs / 2, y - bs / 4 - hs - 5, hs, 8); }
    if (type === CustomerType.BUSINESSMAN) { ctx.fillStyle = '#E74C3C'; ctx.fillRect(x - 3, y - bs / 4 + 5, 6, 15); }
  }

  drawPixelIngredient(ctx, type, x, y, size) {
    if (type === IngredientType.KADAIF) {
      ctx.strokeStyle = '#D4A574'; ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const ox = (i - 2) * 4;
        ctx.beginPath(); ctx.moveTo(x + ox, y - size / 2);
        ctx.bezierCurveTo(x + ox + 3, y - size / 4, x + ox - 3, y + size / 4, x + ox, y + size / 2);
        ctx.stroke();
      }
    } else if (type === IngredientType.PISTACHIO) {
      ctx.fillStyle = '#7CB342'; ctx.beginPath(); ctx.ellipse(x, y, size / 2, size / 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = COLORS.border; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - size / 3); ctx.lineTo(x, y + size / 3); ctx.stroke();
    } else if (type === IngredientType.MARSHMALLOW) {
      ctx.fillStyle = '#FFEFD5';
      ctx.beginPath(); ctx.arc(x - size / 4, y, size / 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + size / 4, y, size / 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y - size / 4, size / 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = COLORS.border; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.stroke();
    } else if (type === IngredientType.COCOA) {
      ctx.fillStyle = '#5D4037'; ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = COLORS.border; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#3E2723';
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * size / 4, y + Math.sin(a) * size / 4, 2, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  renderEventNotification(ctx) {
    if (!this.eventNotification) return;
    const e = this.eventNotification, p = this.eventNotificationTimer / 4;
    let yo = 0;
    if (p > 0.9) yo = (1 - p) * 10 * -100;
    else if (p < 0.1) yo = (0.1 - p) * 10 * 100;
    const ny = 130 + yo, nw = this.config.width - 30, nh = 70, nx = 15;
    this.drawPixelBox(ctx, nx, ny, nw, nh, { fill: COLORS.warning, borderWidth: 3, shadow: true });
    const cn = e.name.replace(/[^\w가-힣\s]/g, '');
    this.drawText(ctx, `[EVENT] ${cn}!`, nx + 15, ny + 25, { font: PIXEL_FONT.large, color: COLORS.text });
    const cd = e.description.replace(/[^\w가-힣\s%+\-,]/g, '');
    this.drawText(ctx, cd, nx + 15, ny + 50, { font: PIXEL_FONT.small, color: COLORS.textLight });
  }

  renderDayEndModal(ctx, status) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, this.config.width, this.config.height);
    const mw = this.config.width - 60, mh = 350, mx = 30, my = (this.config.height - mh) / 2;
    this.drawPixelBox(ctx, mx, my, mw, mh, { fill: COLORS.cardBg, borderWidth: 4, shadow: true });
    this.drawText(ctx, '[ 하루 종료 ]', mx + mw / 2, my + 35, { font: PIXEL_FONT.title, color: COLORS.primary, align: 'center' });
    this.drawText(ctx, `${status.day}일차 - ${status.dayName}`, mx + mw / 2, my + 60, { font: PIXEL_FONT.small, color: COLORS.textLight, align: 'center' });
    ctx.fillStyle = COLORS.border; ctx.fillRect(mx + 20, my + 78, mw - 40, 3);
    const sum = this.dayEndSummary || timeManager.dailySummary;
    const stats = [
      { l: 'MADE', v: `${sum.cookiesMade}` },
      { l: 'SOLD', v: `${sum.cookiesSold}` },
      { l: 'CUSTOMERS', v: `${sum.customersServed}` },
      { l: 'REVENUE', v: `${sum.revenue.toLocaleString()}G`, h: true }
    ];
    const sy = my + 105, sg = 35;
    stats.forEach((s, i) => {
      const y = sy + i * sg;
      this.drawText(ctx, s.l, mx + 25, y, { font: PIXEL_FONT.small, color: COLORS.text });
      this.drawText(ctx, s.v, mx + mw - 30, y, { font: PIXEL_FONT.normal, color: s.h ? COLORS.accent : COLORS.text, align: 'right' });
    });
    const bw = 160, bh = 50, bx = mx + (mw - bw) / 2, by = my + mh - 70;
    this.drawPixelBox(ctx, bx, by, bw, bh, { fill: COLORS.success, borderWidth: 3, shadow: true });
    this.drawText(ctx, '>> 다음 날 >>', bx + bw / 2, by + bh / 2, { font: PIXEL_FONT.large, color: COLORS.textBright, align: 'center', baseline: 'middle' });
  }

  drawPixelBox(ctx, x, y, w, h, o = {}) {
    const { fill = COLORS.cardBg, border = COLORS.border, borderWidth = 3, shadow = true, shadowOffset = 4, pressed = false } = o;
    const ox = pressed ? 2 : 0, oy = pressed ? 2 : 0;
    if (shadow && !pressed) { ctx.fillStyle = COLORS.shadow; ctx.fillRect(x + shadowOffset, y + shadowOffset, w, h); }
    ctx.fillStyle = fill; ctx.fillRect(x + ox, y + oy, w, h);
    ctx.strokeStyle = border; ctx.lineWidth = borderWidth; ctx.strokeRect(x + ox, y + oy, w, h);
    if (!pressed) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(x + ox + borderWidth, y + oy + borderWidth, w - borderWidth * 2, 3);
      ctx.fillRect(x + ox + borderWidth, y + oy + borderWidth, 3, h - borderWidth * 2);
    }
  }

  drawPixelProgressBar(ctx, x, y, w, h, ratio, o = {}) {
    const { bgColor = '#3D3D3D', fillColor = COLORS.energyFull, segments = 10 } = o;
    const sw = (w - 4) / segments, fs = Math.floor(ratio * segments);
    this.drawPixelBox(ctx, x, y, w, h, { fill: bgColor, shadow: false, borderWidth: 2 });
    for (let i = 0; i < segments; i++) {
      const sx = x + 2 + i * sw, sy = y + 2, sh = h - 4, segW = sw - 1;
      if (i < fs) { ctx.fillStyle = fillColor; ctx.fillRect(sx, sy, segW, sh); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(sx, sy, segW, 2); }
      else { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(sx, sy, segW, sh); }
    }
  }

  drawPixelIcon(ctx, type, x, y, size = 24) {
    ctx.fillStyle = COLORS.text; ctx.strokeStyle = COLORS.border; ctx.lineWidth = 2;
    if (type === 'cookie') {
      ctx.fillStyle = '#D4A574'; ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#5D4037'; ctx.fillRect(x - 4, y - 2, 3, 3); ctx.fillRect(x + 2, y - 4, 3, 3); ctx.fillRect(x - 1, y + 2, 3, 3);
    } else if (type === 'money') {
      ctx.fillStyle = '#D4A574'; ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = COLORS.border; ctx.fillRect(x - 2, y - size / 3, 4, size * 2 / 3);
    } else if (type === 'energy') {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath(); ctx.moveTo(x, y - size / 2); ctx.lineTo(x - size / 3, y); ctx.lineTo(x, y);
      ctx.lineTo(x - size / 4, y + size / 2); ctx.lineTo(x + size / 4, y - size / 6); ctx.lineTo(x, y - size / 6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }

  drawText(ctx, text, x, y, o = {}) {
    const { font = PIXEL_FONT.normal, color = COLORS.text, align = 'left', baseline = 'top' } = o;
    ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = baseline;
    ctx.fillText(text, x, y);
  }

  renderToast(ctx) {
    if (!this.toast) return;
    const el = Date.now() - this.toast.startTime, p = el / this.toast.duration;
    let a = 1;
    if (p < 0.1) a = p / 0.1;
    else if (p > 0.8) a = (1 - p) / 0.2;
    const cols = { success: '#27ae60', error: '#e74c3c', warning: '#f39c12', info: '#3498db' };
    const bg = cols[this.toast.type] || cols.info;
    const tw = this.config.width - 40, th = 45, tx = 20, ty = this.config.height - 85;
    ctx.globalAlpha = a;
    ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 8); ctx.fill();
    this.drawText(ctx, this.toast.message, tx + tw / 2, ty + th / 2, { font: 'bold 14px DungGeunMo, sans-serif', color: '#FFFFFF', align: 'center', baseline: 'middle' });
    ctx.globalAlpha = 1;
  }
}
