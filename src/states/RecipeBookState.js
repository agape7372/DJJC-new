/**
 * RecipeBookState - 레시피북 화면
 * 레시피 목록 조회, 선택, 상세 정보 표시
 */

import { BaseState } from './BaseState.js';
import { recipeManager, RARITY_COLORS, RARITY_NAMES } from '../core/RecipeManager.js';

export class RecipeBookState extends BaseState {
  constructor(game) {
    super(game);

    // UI 상태
    this.selectedRecipe = null;
    this.scrollY = 0;
    this.targetScrollY = 0;
    this.maxScrollY = 0;
    this.showDetail = false;

    // 애니메이션
    this.enterAnim = 0;
    this.recipeAnims = [];
    this.detailAnim = 0;
    this.unlockAnim = null;

    // 터치/드래그
    this.isDragging = false;
    this.lastTouchY = 0;
    this.velocity = 0;

    // 레이아웃
    this.cardWidth = 340;
    this.cardHeight = 100;
    this.cardGap = 15;
    this.startY = 120;

    // 탭
    this.currentTab = 'all'; // 'all', 'unlocked', 'locked'
    this.tabs = [
      { id: 'all', name: '전체', icon: '📚' },
      { id: 'unlocked', name: '해금', icon: '✅' },
      { id: 'locked', name: '미해금', icon: '🔒' }
    ];

    // 새로 해금된 레시피 (팝업용)
    this.newUnlocks = [];

    // 돌아갈 상태
    this.returnTo = 'title';
  }

  enter(params = {}) {
    this.enterAnim = 0;
    this.scrollY = 0;
    this.targetScrollY = 0;
    this.selectedRecipe = null;
    this.showDetail = false;
    this.detailAnim = 0;

    // 돌아갈 상태 저장
    this.returnTo = params.returnTo || 'title';

    // 새로 해금된 레시피가 있다면 표시
    if (params.newUnlocks && params.newUnlocks.length > 0) {
      this.newUnlocks = params.newUnlocks;
      this.showUnlockPopup();
    }

    // 레시피 애니메이션 초기화
    this.initRecipeAnims();

    // 최대 스크롤 계산
    this.calculateMaxScroll();

    this.game.sound.playUIClick();
  }

  initRecipeAnims() {
    const recipes = this.getFilteredRecipes();
    this.recipeAnims = recipes.map((_, i) => ({
      scale: 0,
      delay: i * 0.05
    }));
  }

  getFilteredRecipes() {
    switch (this.currentTab) {
      case 'unlocked':
        return recipeManager.getUnlockedRecipes();
      case 'locked':
        return recipeManager.getLockedRecipes();
      default:
        return recipeManager.recipes;
    }
  }

  calculateMaxScroll() {
    const recipes = this.getFilteredRecipes();
    const totalHeight = recipes.length * (this.cardHeight + this.cardGap);
    const viewHeight = this.game.config.height - this.startY - 80;
    this.maxScrollY = Math.max(0, totalHeight - viewHeight);
  }

  showUnlockPopup() {
    this.unlockAnim = {
      phase: 'enter',
      timer: 0,
      recipes: this.newUnlocks,
      currentIndex: 0
    };
    this.game.sound.playFanfare();
  }

  exit() {
    // cleanup
  }

  update(dt) {
    // 입장 애니메이션
    if (this.enterAnim < 1) {
      this.enterAnim = Math.min(1, this.enterAnim + dt * 3);
    }

    // 레시피 카드 애니메이션
    for (const anim of this.recipeAnims) {
      if (this.enterAnim > anim.delay && anim.scale < 1) {
        anim.scale = Math.min(1, anim.scale + dt * 5);
      }
    }

    // 상세 패널 애니메이션
    if (this.showDetail && this.detailAnim < 1) {
      this.detailAnim = Math.min(1, this.detailAnim + dt * 5);
    } else if (!this.showDetail && this.detailAnim > 0) {
      this.detailAnim = Math.max(0, this.detailAnim - dt * 5);
    }

    // 스크롤 물리
    if (!this.isDragging) {
      // 관성
      this.targetScrollY += this.velocity;
      this.velocity *= 0.92;

      // 바운드 체크
      if (this.targetScrollY < 0) {
        this.targetScrollY = 0;
        this.velocity = 0;
      } else if (this.targetScrollY > this.maxScrollY) {
        this.targetScrollY = this.maxScrollY;
        this.velocity = 0;
      }
    }

    // 부드러운 스크롤
    this.scrollY += (this.targetScrollY - this.scrollY) * 0.2;

    // 해금 팝업 애니메이션
    if (this.unlockAnim) {
      this.updateUnlockAnim(dt);
    }

    // 입력 처리
    this.handleInput();
  }

  updateUnlockAnim(dt) {
    this.unlockAnim.timer += dt;

    if (this.unlockAnim.phase === 'enter' && this.unlockAnim.timer > 0.5) {
      this.unlockAnim.phase = 'show';
      this.unlockAnim.timer = 0;
    } else if (this.unlockAnim.phase === 'show' && this.unlockAnim.timer > 2) {
      this.unlockAnim.currentIndex++;
      if (this.unlockAnim.currentIndex >= this.unlockAnim.recipes.length) {
        this.unlockAnim.phase = 'exit';
      }
      this.unlockAnim.timer = 0;
    } else if (this.unlockAnim.phase === 'exit' && this.unlockAnim.timer > 0.3) {
      this.unlockAnim = null;
      this.newUnlocks = [];

      // 해금 팝업이 끝나면 자동으로 returnTo 상태로 이동
      if (this.returnTo && this.returnTo !== 'title') {
        this.game.stateManager.changeState(this.returnTo);
      }
    }
  }

  handleInput() {
    const input = this.game.inputManager;
    const { width, height } = this.game.config;

    // 해금 팝업이 있으면 터치로 스킵
    if (this.unlockAnim && input.isJustPressed()) {
      if (this.unlockAnim.phase === 'show') {
        this.unlockAnim.currentIndex++;
        if (this.unlockAnim.currentIndex >= this.unlockAnim.recipes.length) {
          this.unlockAnim.phase = 'exit';
        }
        this.unlockAnim.timer = 0;
      }
      return;
    }

    // 상세 패널 닫기
    if (this.showDetail && input.isJustPressed()) {
      const pos = input.getPosition();
      // 패널 바깥 클릭 시 닫기
      if (pos.y < 200 || pos.y > height - 100) {
        this.showDetail = false;
        this.game.sound.playUIClick();
        return;
      }

      // 선택 버튼 클릭
      if (this.selectedRecipe && this.selectedRecipe.unlocked) {
        const btnY = height - 180;
        if (pos.y >= btnY && pos.y <= btnY + 50) {
          this.selectRecipe(this.selectedRecipe);
          return;
        }
      }
    }

    // 뒤로가기 버튼
    if (input.isJustPressed()) {
      const pos = input.getPosition();

      // 뒤로가기 (좌상단)
      if (pos.x < 60 && pos.y < 80) {
        this.goBack();
        return;
      }

      // 탭 클릭
      if (pos.y >= 60 && pos.y <= 100) {
        const tabWidth = width / 3;
        const tabIndex = Math.floor(pos.x / tabWidth);
        if (tabIndex >= 0 && tabIndex < this.tabs.length) {
          this.switchTab(this.tabs[tabIndex].id);
          return;
        }
      }

      // 레시피 카드 클릭
      if (!this.showDetail && pos.y > this.startY) {
        this.handleCardClick(pos);
      }
    }

    // 드래그 스크롤
    if (input.isPressed() && !this.showDetail) {
      const pos = input.getPosition();

      if (!this.isDragging) {
        this.isDragging = true;
        this.lastTouchY = pos.y;
      } else {
        const deltaY = this.lastTouchY - pos.y;
        this.targetScrollY += deltaY;
        this.velocity = deltaY * 0.5;
        this.lastTouchY = pos.y;
      }
    } else {
      this.isDragging = false;
    }
  }

  handleCardClick(pos) {
    const recipes = this.getFilteredRecipes();
    const cardX = (this.game.config.width - this.cardWidth) / 2;

    for (let i = 0; i < recipes.length; i++) {
      const cardY = this.startY + i * (this.cardHeight + this.cardGap) - this.scrollY;

      if (pos.x >= cardX && pos.x <= cardX + this.cardWidth &&
          pos.y >= cardY && pos.y <= cardY + this.cardHeight) {
        this.openDetail(recipes[i]);
        break;
      }
    }
  }

  switchTab(tabId) {
    if (this.currentTab !== tabId) {
      this.currentTab = tabId;
      this.scrollY = 0;
      this.targetScrollY = 0;
      this.initRecipeAnims();
      this.calculateMaxScroll();
      this.game.sound.playUIClick();
    }
  }

  openDetail(recipe) {
    this.selectedRecipe = recipe;
    this.showDetail = true;
    this.detailAnim = 0;
    this.game.sound.playUIClick();
  }

  selectRecipe(recipe) {
    if (recipeManager.selectRecipe(recipe.id)) {
      this.game.sound.playSuccess();
      this.game.particles.emitCelebration(
        this.game.config.width / 2,
        this.game.config.height / 2
      );
      this.showDetail = false;
    }
  }

  goBack() {
    this.game.sound.playUIClick();
    this.game.stateManager.changeState(this.returnTo);
  }

  render(ctx) {
    const { width, height } = this.game.config;

    // 배경
    this.renderBackground(ctx, width, height);

    // 헤더
    this.renderHeader(ctx, width);

    // 탭
    this.renderTabs(ctx, width);

    // 레시피 목록
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, this.startY, width, height - this.startY - 20);
    ctx.clip();

    this.renderRecipeList(ctx, width);

    ctx.restore();

    // 스크롤 인디케이터
    if (this.maxScrollY > 0) {
      this.renderScrollIndicator(ctx, width, height);
    }

    // 상세 패널
    if (this.detailAnim > 0) {
      this.renderDetailPanel(ctx, width, height);
    }

    // 해금 팝업
    if (this.unlockAnim) {
      this.renderUnlockPopup(ctx, width, height);
    }
  }

  renderBackground(ctx, width, height) {
    // 그라디언트 배경
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 패턴 (쿠키 아이콘)
    ctx.globalAlpha = 0.03;
    ctx.font = '40px serif';
    for (let y = 0; y < height; y += 80) {
      for (let x = 0; x < width; x += 80) {
        ctx.fillText('🍪', x + (y % 160 === 0 ? 0 : 40), y);
      }
    }
    ctx.globalAlpha = 1;
  }

  renderHeader(ctx, width) {
    const progress = recipeManager.getUnlockProgress();

    // 뒤로가기 버튼
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.fillText('←', 20, 40);

    // 타이틀
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📖 레시피북', width / 2, 40);

    // 진행도
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`${progress.unlocked}/${progress.total} (${progress.percentage}%)`, width / 2, 55);

    ctx.textAlign = 'left';
  }

  renderTabs(ctx, width) {
    const tabWidth = width / 3;
    const tabY = 70;

    for (let i = 0; i < this.tabs.length; i++) {
      const tab = this.tabs[i];
      const tabX = i * tabWidth;
      const isActive = this.currentTab === tab.id;

      // 탭 배경
      ctx.fillStyle = isActive ? 'rgba(255,255,255,0.1)' : 'transparent';
      ctx.fillRect(tabX, tabY, tabWidth, 40);

      // 탭 텍스트
      ctx.fillStyle = isActive ? '#fff' : '#888';
      ctx.font = isActive ? 'bold 14px sans-serif' : '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${tab.icon} ${tab.name}`, tabX + tabWidth / 2, tabY + 25);

      // 활성 인디케이터
      if (isActive) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(tabX + 10, tabY + 38, tabWidth - 20, 2);
      }
    }

    ctx.textAlign = 'left';
  }

  renderRecipeList(ctx, width) {
    const recipes = this.getFilteredRecipes();
    const cardX = (width - this.cardWidth) / 2;
    const currentRecipe = recipeManager.getCurrentRecipe();

    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i];
      const cardY = this.startY + i * (this.cardHeight + this.cardGap) - this.scrollY;

      // 화면 밖이면 스킵
      if (cardY < this.startY - this.cardHeight || cardY > this.game.config.height) {
        continue;
      }

      const anim = this.recipeAnims[i] || { scale: 1 };
      const scale = this.easeOutBack(anim.scale);

      ctx.save();
      ctx.translate(cardX + this.cardWidth / 2, cardY + this.cardHeight / 2);
      ctx.scale(scale, scale);
      ctx.translate(-this.cardWidth / 2, -this.cardHeight / 2);

      // 카드 배경
      const isSelected = currentRecipe && currentRecipe.id === recipe.id;
      const rarityColor = RARITY_COLORS[recipe.rarity];

      // 선택된 레시피 글로우
      if (isSelected) {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;
      }

      // 카드 본체
      ctx.fillStyle = recipe.unlocked ?
        'rgba(255,255,255,0.1)' :
        'rgba(0,0,0,0.3)';
      this.roundRect(ctx, 0, 0, this.cardWidth, this.cardHeight, 12);
      ctx.fill();

      ctx.shadowBlur = 0;

      // 희귀도 테두리
      ctx.strokeStyle = recipe.unlocked ? rarityColor : '#444';
      ctx.lineWidth = 2;
      this.roundRect(ctx, 0, 0, this.cardWidth, this.cardHeight, 12);
      ctx.stroke();

      // 아이콘
      ctx.font = '40px serif';
      ctx.fillText(recipe.unlocked ? recipe.icon : '❓', 15, 55);

      // 이름
      ctx.fillStyle = recipe.unlocked ? '#fff' : '#666';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(recipe.unlocked ? recipe.name : '???', 70, 35);

      // 희귀도
      ctx.fillStyle = rarityColor;
      ctx.font = '12px sans-serif';
      ctx.fillText(RARITY_NAMES[recipe.rarity], 70, 52);

      // 설명 또는 해금 조건
      ctx.fillStyle = '#aaa';
      ctx.font = '12px sans-serif';
      const desc = recipe.unlocked ?
        recipe.description.substring(0, 30) + '...' :
        `🔒 ${recipe.requirements?.description || ''}`;
      ctx.fillText(desc, 70, 72);

      // 현재 선택 표시
      if (isSelected) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('✓ 선택됨', this.cardWidth - 15, 30);
        ctx.textAlign = 'left';
      }

      // 보너스 미리보기 (해금된 경우)
      if (recipe.unlocked && recipe.bonuses) {
        this.renderBonusPreview(ctx, recipe.bonuses, this.cardWidth - 15, 55);
      }

      ctx.restore();
    }
  }

  renderBonusPreview(ctx, bonuses, x, y) {
    ctx.textAlign = 'right';
    ctx.font = '11px sans-serif';

    const items = [];
    if (bonuses.flavor > 0) items.push(`풍미+${bonuses.flavor}`);
    if (bonuses.texture > 0) items.push(`식감+${bonuses.texture}`);
    if (bonuses.visual > 0) items.push(`비주얼+${bonuses.visual}`);
    if (bonuses.priceMultiplier > 1) items.push(`가격x${bonuses.priceMultiplier}`);

    ctx.fillStyle = '#4caf50';
    ctx.fillText(items.slice(0, 2).join(' '), x, y);

    ctx.textAlign = 'left';
  }

  renderScrollIndicator(ctx, width, height) {
    const indicatorHeight = 60;
    const indicatorY = this.startY + 10 +
      (this.scrollY / this.maxScrollY) * (height - this.startY - indicatorHeight - 40);

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    this.roundRect(ctx, width - 8, indicatorY, 4, indicatorHeight, 2);
    ctx.fill();
  }

  renderDetailPanel(ctx, width, height) {
    const recipe = this.selectedRecipe;
    if (!recipe) return;

    const panelHeight = 500;
    const panelY = height - panelHeight * this.easeOutQuad(this.detailAnim);

    // 오버레이
    ctx.fillStyle = `rgba(0,0,0,${0.7 * this.detailAnim})`;
    ctx.fillRect(0, 0, width, height);

    // 패널 배경
    ctx.fillStyle = '#1a1a2e';
    this.roundRect(ctx, 0, panelY, width, panelHeight + 50, 20);
    ctx.fill();

    // 희귀도 테두리
    ctx.strokeStyle = recipe.unlocked ? RARITY_COLORS[recipe.rarity] : '#444';
    ctx.lineWidth = 3;
    this.roundRect(ctx, 0, panelY, width, panelHeight + 50, 20);
    ctx.stroke();

    // 드래그 핸들
    ctx.fillStyle = '#444';
    this.roundRect(ctx, width / 2 - 30, panelY + 10, 60, 4, 2);
    ctx.fill();

    // 아이콘
    ctx.font = '60px serif';
    ctx.textAlign = 'center';
    ctx.fillText(recipe.unlocked ? recipe.icon : '❓', width / 2, panelY + 80);

    // 이름
    ctx.fillStyle = recipe.unlocked ? '#fff' : '#666';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(recipe.unlocked ? recipe.name : '???', width / 2, panelY + 120);

    // 희귀도 배지
    ctx.fillStyle = RARITY_COLORS[recipe.rarity];
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(RARITY_NAMES[recipe.rarity], width / 2, panelY + 145);

    // 설명
    ctx.fillStyle = '#ccc';
    ctx.font = '14px sans-serif';
    if (recipe.unlocked) {
      this.wrapText(ctx, recipe.description, width / 2, panelY + 175, width - 60, 20);
    } else {
      ctx.fillStyle = '#888';
      ctx.fillText('레시피가 잠겨있습니다', width / 2, panelY + 175);
      ctx.fillText(`해금 조건: ${recipe.requirements?.description}`, width / 2, panelY + 200);
    }

    // 보너스 섹션 (해금된 경우)
    if (recipe.unlocked) {
      this.renderBonusSection(ctx, recipe, width, panelY + 230);
    }

    // 팁
    if (recipe.unlocked && recipe.tips) {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'italic 13px sans-serif';
      ctx.fillText(`💡 ${recipe.tips}`, width / 2, panelY + 380);
    }

    // 선택 버튼
    if (recipe.unlocked) {
      const isCurrentRecipe = recipeManager.getCurrentRecipe()?.id === recipe.id;
      const btnY = panelY + 420;

      ctx.fillStyle = isCurrentRecipe ? '#444' : '#ffd700';
      this.roundRect(ctx, width / 2 - 80, btnY, 160, 45, 10);
      ctx.fill();

      ctx.fillStyle = isCurrentRecipe ? '#888' : '#1a1a2e';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(isCurrentRecipe ? '선택됨' : '이 레시피 사용', width / 2, btnY + 28);
    }

    ctx.textAlign = 'left';
  }

  renderBonusSection(ctx, recipe, width, startY) {
    const bonuses = recipe.bonuses;
    if (!bonuses) return;

    ctx.fillStyle = '#888';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('보너스 효과', width / 2, startY);

    const items = [];
    if (bonuses.flavor !== 0) items.push({ label: '풍미', value: bonuses.flavor, color: bonuses.flavor > 0 ? '#4caf50' : '#f44336' });
    if (bonuses.texture !== 0) items.push({ label: '식감', value: bonuses.texture, color: bonuses.texture > 0 ? '#4caf50' : '#f44336' });
    if (bonuses.visual !== 0) items.push({ label: '비주얼', value: bonuses.visual, color: bonuses.visual > 0 ? '#4caf50' : '#f44336' });
    if (bonuses.priceMultiplier !== 1) items.push({ label: '판매가', value: `x${bonuses.priceMultiplier}`, color: bonuses.priceMultiplier > 1 ? '#4caf50' : '#f44336' });
    if (bonuses.speedBonus) items.push({ label: '제작속도', value: `x${bonuses.speedBonus}`, color: '#2196f3' });
    if (bonuses.customerAttraction) items.push({ label: '손님 유치', value: `x${bonuses.customerAttraction}`, color: '#9c27b0' });

    ctx.font = '14px sans-serif';
    let y = startY + 25;
    const colWidth = 120;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const col = i % 2;
      const row = Math.floor(i / 2);

      const x = width / 2 - colWidth + col * colWidth;
      const itemY = y + row * 25;

      ctx.fillStyle = '#aaa';
      ctx.textAlign = col === 0 ? 'right' : 'left';
      ctx.fillText(item.label, x - (col === 0 ? 5 : -40), itemY);

      ctx.fillStyle = item.color;
      const sign = typeof item.value === 'number' && item.value > 0 ? '+' : '';
      ctx.fillText(`${sign}${item.value}`, x + (col === 0 ? 5 : 50), itemY);
    }

    ctx.textAlign = 'center';

    // 재료 정보
    if (recipe.ingredients) {
      const ingY = startY + 100;
      ctx.fillStyle = '#888';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('특수 재료', width / 2, ingY);

      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#aaa';
      const ingItems = [];
      if (recipe.ingredients.goldFlake) ingItems.push('✨ 금박');
      if (recipe.ingredients.saffron) ingItems.push('🌸 사프란');

      if (ingItems.length > 0) {
        ctx.fillText(ingItems.join('  '), width / 2, ingY + 25);
      } else {
        ctx.fillText('기본 재료 사용', width / 2, ingY + 25);
      }
    }
  }

  renderUnlockPopup(ctx, width, height) {
    const recipe = this.unlockAnim.recipes[this.unlockAnim.currentIndex];
    if (!recipe) return;

    // 페이드 인/아웃
    let alpha = 1;
    if (this.unlockAnim.phase === 'enter') {
      alpha = this.unlockAnim.timer / 0.5;
    } else if (this.unlockAnim.phase === 'exit') {
      alpha = 1 - this.unlockAnim.timer / 0.3;
    }

    // 오버레이
    ctx.fillStyle = `rgba(0,0,0,${0.85 * alpha})`;
    ctx.fillRect(0, 0, width, height);

    // 카드
    const cardWidth = 280;
    const cardHeight = 350;
    const cardX = (width - cardWidth) / 2;
    const cardY = (height - cardHeight) / 2;

    // 글로우 효과
    ctx.shadowColor = RARITY_COLORS[recipe.rarity];
    ctx.shadowBlur = 30 * alpha;

    // 카드 배경
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#1a1a2e';
    this.roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 20);
    ctx.fill();

    ctx.strokeStyle = RARITY_COLORS[recipe.rarity];
    ctx.lineWidth = 3;
    this.roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 20);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // NEW! 배지
    ctx.fillStyle = '#ff4757';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 NEW RECIPE!', width / 2, cardY + 30);

    // 아이콘 (회전 애니메이션)
    const iconScale = 1 + Math.sin(this.unlockAnim.timer * 5) * 0.1;
    ctx.font = `${80 * iconScale}px serif`;
    ctx.fillText(recipe.icon, width / 2, cardY + 130);

    // 이름
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(recipe.name, width / 2, cardY + 180);

    // 희귀도
    ctx.fillStyle = RARITY_COLORS[recipe.rarity];
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(RARITY_NAMES[recipe.rarity], width / 2, cardY + 210);

    // 설명
    ctx.fillStyle = '#ccc';
    ctx.font = '14px sans-serif';
    this.wrapText(ctx, recipe.description, width / 2, cardY + 250, cardWidth - 40, 20);

    // 탭하여 계속
    ctx.fillStyle = '#888';
    ctx.font = '12px sans-serif';
    ctx.fillText('탭하여 계속', width / 2, cardY + cardHeight - 20);

    // 진행 인디케이터
    const dotY = cardY + cardHeight - 50;
    for (let i = 0; i < this.unlockAnim.recipes.length; i++) {
      const dotX = width / 2 - (this.unlockAnim.recipes.length - 1) * 10 + i * 20;
      ctx.fillStyle = i === this.unlockAnim.currentIndex ? '#ffd700' : '#444';
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  // 유틸리티 메서드
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split('');
    let line = '';

    for (const char of words) {
      const testLine = line + char;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, x, y);
        line = char;
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
  }
}
