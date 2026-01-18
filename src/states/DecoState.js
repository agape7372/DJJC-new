/**
 * DecoState - 데코레이션 (완전 재구현)
 *
 * 핵심: 단순하고 명확한 입력 처리
 * - 팔레트: 탭으로 도구 선택
 * - 쿠키 영역: 드래그로 스프레이, 탭으로 토핑 배치
 */

import { BaseState } from './BaseState.js';
import { GameState } from '../core/StateManager.js';
import { soundManager } from '../core/SoundManager.js';
import { particleSystem } from '../core/ParticleSystem.js';

export class DecoState extends BaseState {
  constructor(game) {
    super(game);
    this.reset();
  }

  reset() {
    // 도구 (cocoa, gold는 스프레이 / 나머지는 탭 배치)
    this.selectedTool = 'cocoa';

    // 스프레이 도트들
    this.cocoaDots = [];
    this.goldDots = [];

    // 토핑들
    this.toppings = [];

    // 팔레트 정의
    this.palette = [
      { id: 'cocoa', name: '코코아', icon: '🟤', color: '#5d4037', isSpray: true },
      { id: 'strawberry', name: '딸기', icon: '🍓', color: '#e74c3c', isSpray: false },
      { id: 'almond', name: '아몬드', icon: '🥜', color: '#d4a574', isSpray: false },
      { id: 'pistachio', name: '피스타치오', icon: '🟢', color: '#7cb342', isSpray: false },
      { id: 'gold', name: '금가루', icon: '✨', color: '#ffd700', isSpray: true }
    ];

    // UI 상태
    this.showIntro = true;
    this.introTimer = 0;
    this.isCompleting = false;
    this.completeTimer = 0;

    // 애니메이션
    this.cookiePulse = 0;
    this.toppingAnims = [];
    this.scorePopups = [];

    // 레이아웃 (enter에서 계산)
    this.layout = null;

    // 디버그
    this.lastInputPos = null;
    this.inputCount = 0;
  }

  enter() {
    this.reset();

    // 레이아웃 계산
    this.layout = {
      // 쿠키 영역
      cookie: {
        x: this.config.width / 2,
        y: this.config.height * 0.42,
        radius: 120,
        sprayRadius: 160  // 스프레이 허용 범위
      },
      // 팔레트 영역 (하단)
      palette: {
        y: this.config.height - 100,
        height: 100,
        itemWidth: this.config.width / this.palette.length
      },
      // 완료 버튼
      doneBtn: {
        x: this.config.width - 100,
        y: 20,
        width: 80,
        height: 40
      },
      // 스킵 버튼 (DEV)
      skipBtn: {
        x: 10,
        y: 60,
        width: 70,
        height: 35
      }
    };

    // 입력 핸들러 등록
    this.game.inputManager.onTap = (pos) => this.onInput(pos, 'tap');
    this.game.inputManager.onDrag = (pos) => this.onInput(pos, 'drag');
    this.game.inputManager.onDragEnd = () => this.onInputEnd();

    console.log('[DecoState] 입력 핸들러 등록 완료');
  }

  exit() {
    this.game.inputManager.onTap = null;
    this.game.inputManager.onDrag = null;
    this.game.inputManager.onDragEnd = null;
    this.saveRecipe();
    console.log('[DecoState] 종료');
  }

  /**
   * 통합 입력 처리
   */
  onInput(pos, type) {
    if (!pos) return;

    this.inputCount++;
    this.lastInputPos = pos;

    // 디버그 로그 (DEV 모드)
    if (this.config.devMode && this.inputCount % 10 === 1) {
      console.log(`[DecoState] ${type} at (${Math.round(pos.x)}, ${Math.round(pos.y)}) - intro:${this.showIntro}`);
    }

    // 인트로 중이면 터치로 종료
    if (this.showIntro) {
      this.showIntro = false;
      soundManager.playUIClick();
      console.log('[DecoState] 인트로 종료');
      return;
    }

    // 완료 중이면 무시
    if (this.isCompleting) return;

    // 영역별 처리
    const area = this.getInputArea(pos);

    switch (area) {
      case 'skip':
        if (this.config.devMode) {
          soundManager.playUIClick();
          this.game.stateManager.changeState(GameState.TASTING);
        }
        break;

      case 'done':
        this.complete();
        break;

      case 'palette':
        this.handlePaletteInput(pos);
        break;

      case 'cookie':
        this.handleCookieInput(pos, type);
        break;
    }
  }

  onInputEnd() {
    // 드래그 종료 시 처리 (필요하면 추가)
  }

  /**
   * 입력 영역 판별
   */
  getInputArea(pos) {
    const { layout } = this;

    // DEV 스킵 버튼
    if (this.config.devMode) {
      const skip = layout.skipBtn;
      if (pos.x >= skip.x && pos.x <= skip.x + skip.width &&
          pos.y >= skip.y && pos.y <= skip.y + skip.height) {
        return 'skip';
      }
    }

    // 완료 버튼
    const done = layout.doneBtn;
    if (pos.x >= done.x && pos.x <= done.x + done.width &&
        pos.y >= done.y && pos.y <= done.y + done.height) {
      return 'done';
    }

    // 팔레트 (하단)
    if (pos.y >= layout.palette.y) {
      return 'palette';
    }

    // 쿠키 영역
    const cookie = layout.cookie;
    const dist = Math.sqrt(
      Math.pow(pos.x - cookie.x, 2) +
      Math.pow(pos.y - cookie.y, 2)
    );
    if (dist <= cookie.sprayRadius) {
      return 'cookie';
    }

    return 'none';
  }

  /**
   * 팔레트 입력 처리
   */
  handlePaletteInput(pos) {
    const { palette } = this.layout;
    const index = Math.floor(pos.x / palette.itemWidth);

    if (index >= 0 && index < this.palette.length) {
      const tool = this.palette[index];
      if (this.selectedTool !== tool.id) {
        this.selectedTool = tool.id;
        soundManager.playUIClick();

        // 선택 파티클
        const x = (index + 0.5) * palette.itemWidth;
        particleSystem.emitSparkle(x, palette.y + 50, 5);

        console.log(`[DecoState] 도구 선택: ${tool.name}`);
      }
    }
  }

  /**
   * 쿠키 영역 입력 처리
   */
  handleCookieInput(pos, type) {
    const tool = this.palette.find(p => p.id === this.selectedTool);
    if (!tool) return;

    if (tool.isSpray) {
      // 스프레이 도구 (코코아, 금가루)
      this.doSpray(pos, tool);
    } else if (type === 'tap') {
      // 토핑 배치 (탭만)
      this.placeTopping(pos, tool);
    }
  }

  /**
   * 스프레이 (코코아/금가루)
   */
  doSpray(pos, tool) {
    const count = tool.id === 'cocoa' ? 5 : 3;
    const spread = tool.id === 'cocoa' ? 30 : 20;

    for (let i = 0; i < count; i++) {
      const dot = {
        x: pos.x + (Math.random() - 0.5) * spread,
        y: pos.y + (Math.random() - 0.5) * spread,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.4 + 0.5,
        scale: 0,
        targetScale: 1
      };

      if (tool.id === 'cocoa') {
        this.cocoaDots.push(dot);
      } else {
        this.goldDots.push(dot);
      }
    }

    // 사운드 (간헐적)
    if (Math.random() < 0.3) {
      const freq = tool.id === 'cocoa' ? 200 : 1500;
      soundManager.playClick(freq + Math.random() * 100, 0.04, 0.15);
    }

    // 파티클
    if (Math.random() < 0.2) {
      particleSystem.emitSparkle(pos.x, pos.y, 2);
    }

    this.cookiePulse = 0.1;
  }

  /**
   * 토핑 배치
   */
  placeTopping(pos, tool) {
    // 쿠키 반경 내에만 배치
    const cookie = this.layout.cookie;
    const dist = Math.sqrt(
      Math.pow(pos.x - cookie.x, 2) +
      Math.pow(pos.y - cookie.y, 2)
    );
    if (dist > cookie.radius) return;

    const topping = {
      type: tool.id,
      icon: tool.icon,
      color: tool.color,
      x: pos.x,
      y: pos.y,
      scale: 0,
      rotation: (Math.random() - 0.5) * 0.5
    };
    this.toppings.push(topping);

    // 애니메이션
    this.toppingAnims.push({ topping, time: 0 });

    // 효과
    soundManager.playClick(800 + Math.random() * 400, 0.08, 0.3);
    particleSystem.emitSparkle(pos.x, pos.y, 8);

    // 점수 팝업
    this.scorePopups.push({
      x: pos.x,
      y: pos.y,
      value: 5,
      life: 1,
      vy: -50
    });

    this.cookiePulse = 0.15;
    console.log(`[DecoState] 토핑 배치: ${tool.name}`);
  }

  /**
   * 완료
   */
  complete() {
    if (this.isCompleting) return;

    this.isCompleting = true;
    this.completeTimer = 0;

    soundManager.playSuccess();

    // 축하 파티클
    const { cookie } = this.layout;
    particleSystem.emitCelebration(cookie.x, cookie.y);
    particleSystem.emitSparkle(cookie.x, cookie.y, 30);

    // 점수 계산
    const decoScore = Math.min(100,
      this.cocoaDots.length / 10 +
      this.toppings.length * 8 +
      this.goldDots.length / 5
    );
    this.game.cookieStats.visual += Math.floor(decoScore);

    console.log(`[DecoState] 완료! 점수: ${Math.floor(decoScore)}`);

    // 다음 상태로
    setTimeout(() => {
      soundManager.playFanfare();
      setTimeout(() => {
        this.game.stateManager.changeState(GameState.TASTING);
      }, 800);
    }, 500);
  }

  /**
   * 레시피 저장
   */
  saveRecipe() {
    try {
      const recipe = {
        cocoaDots: this.cocoaDots.length,
        goldDots: this.goldDots.length,
        toppings: this.toppings.map(t => t.type),
        timestamp: Date.now()
      };

      const recipes = JSON.parse(localStorage.getItem('djjc_recipes') || '[]');
      recipes.push(recipe);
      if (recipes.length > 10) recipes.shift();
      localStorage.setItem('djjc_recipes', JSON.stringify(recipes));
    } catch (e) {
      console.error('레시피 저장 실패:', e);
    }
  }

  update(dt) {
    // 인트로
    if (this.showIntro) {
      this.introTimer += dt;
      if (this.introTimer >= 2.0) {
        this.showIntro = false;
      }
      return;
    }

    // 완료 타이머
    if (this.isCompleting) {
      this.completeTimer += dt;
    }

    // 쿠키 펄스
    if (this.cookiePulse > 0) {
      this.cookiePulse -= dt * 0.5;
    }

    // 스프레이 도트 애니메이션
    [...this.cocoaDots, ...this.goldDots].forEach(dot => {
      if (dot.scale < dot.targetScale) {
        dot.scale += dt * 10;
        if (dot.scale > dot.targetScale) dot.scale = dot.targetScale;
      }
    });

    // 토핑 애니메이션
    this.toppingAnims.forEach(anim => {
      anim.time += dt;
      const t = Math.min(1, anim.time / 0.3);
      anim.topping.scale = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    });
    this.toppingAnims = this.toppingAnims.filter(a => a.time < 0.3);

    // 점수 팝업
    this.scorePopups.forEach(p => {
      p.y += p.vy * dt;
      p.vy += 50 * dt;
      p.life -= dt * 2;
    });
    this.scorePopups = this.scorePopups.filter(p => p.life > 0);
  }

  render(ctx) {
    // 배경
    this.renderBackground(ctx);

    // 쿠키
    this.renderCookie(ctx);

    // 스프레이
    this.renderSpray(ctx);

    // 토핑
    this.renderToppings(ctx);

    // 점수 팝업
    this.renderScorePopups(ctx);

    // UI (인트로 아닐 때만)
    if (!this.showIntro) {
      this.renderUI(ctx);
      this.renderPalette(ctx);
      this.renderDoneButton(ctx);

      if (this.config.devMode) {
        this.renderDevUI(ctx);
      }
    }

    // 인트로 오버레이
    if (this.showIntro) {
      this.renderIntro(ctx);
    }

    // 완료 오버레이
    if (this.isCompleting) {
      this.renderComplete(ctx);
    }
  }

  renderBackground(ctx) {
    // 그라데이션
    const gradient = ctx.createLinearGradient(0, 0, 0, this.config.height);
    gradient.addColorStop(0, '#2d3436');
    gradient.addColorStop(1, '#0d1117');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    // 스포트라이트
    const { cookie } = this.layout;
    const spot = ctx.createRadialGradient(cookie.x, cookie.y - 100, 0, cookie.x, cookie.y, 300);
    spot.addColorStop(0, 'rgba(255, 220, 180, 0.15)');
    spot.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, this.config.width, this.config.height);
  }

  renderCookie(ctx) {
    const { cookie } = this.layout;
    const pulse = this.cookiePulse * 10;
    const r = cookie.radius + pulse;

    ctx.save();
    ctx.translate(cookie.x, cookie.y);

    // 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(5, 10, r, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 쿠키 베이스
    const grad = ctx.createRadialGradient(-30, -30, 0, 0, 0, r);
    grad.addColorStop(0, '#e8d4b8');
    grad.addColorStop(0.6, '#d4a574');
    grad.addColorStop(1, '#b8956e');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // 텍스처
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 20; i < r; i += 15) {
      ctx.beginPath();
      ctx.arc(0, 0, i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 피스타치오 필링
    const fill = ctx.createRadialGradient(-10, -10, 0, 0, 0, 65);
    fill.addColorStop(0, '#a8d875');
    fill.addColorStop(0.7, '#7cb342');
    fill.addColorStop(1, '#558b2f');
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.fill();

    // 하이라이트
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(-15, -15, 20, 15, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // 테두리
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, r - 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  renderSpray(ctx) {
    // 코코아
    ctx.fillStyle = '#5d4037';
    this.cocoaDots.forEach(dot => {
      if (dot.scale <= 0) return;
      ctx.globalAlpha = dot.alpha;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.size * dot.scale, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 금가루
    this.goldDots.forEach(dot => {
      if (dot.scale <= 0) return;
      ctx.save();
      ctx.translate(dot.x, dot.y);
      ctx.globalAlpha = dot.alpha;

      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, dot.size * dot.scale);
      g.addColorStop(0, '#fff9c4');
      g.addColorStop(0.5, '#ffd700');
      g.addColorStop(1, '#b8860b');
      ctx.fillStyle = g;

      ctx.beginPath();
      ctx.arc(0, 0, dot.size * dot.scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }

  renderToppings(ctx) {
    this.toppings.forEach(t => {
      if (t.scale <= 0) return;

      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.rotation);
      ctx.scale(t.scale, t.scale);

      // 그림자
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(2, 4, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // 아이콘
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.icon, 0, 0);

      ctx.restore();
    });
  }

  renderScorePopups(ctx) {
    this.scorePopups.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.font = 'bold 16px DungGeunMo, sans-serif';
      ctx.fillStyle = '#2ecc71';
      ctx.textAlign = 'center';
      ctx.fillText(`+${p.value}`, p.x, p.y);
    });
    ctx.globalAlpha = 1;
  }

  renderUI(ctx) {
    // 제목 배경
    const titleBg = ctx.createLinearGradient(0, 0, this.config.width, 0);
    titleBg.addColorStop(0, 'rgba(0, 0, 0, 0)');
    titleBg.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
    titleBg.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = titleBg;
    ctx.fillRect(0, 15, this.config.width, 40);

    // 제목
    ctx.font = 'bold 22px DungGeunMo, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#e91e63';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#e91e63';
    ctx.fillText('🎨 데코레이션', this.config.width / 2, 42);
    ctx.shadowBlur = 0;

    // 선택된 도구
    const tool = this.palette.find(p => p.id === this.selectedTool);
    if (tool) {
      const desc = tool.isSpray ? '드래그로 뿌리기' : '탭하여 올리기';
      ctx.font = '14px DungGeunMo, sans-serif';
      ctx.fillStyle = '#888';
      ctx.fillText(`${tool.icon} ${tool.name} - ${desc}`, this.config.width / 2, 70);
    }
  }

  renderPalette(ctx) {
    const { palette } = this.layout;
    const itemWidth = palette.itemWidth;

    // 배경
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, palette.y, this.config.width, palette.height);

    // 상단 라인
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, palette.y);
    ctx.lineTo(this.config.width, palette.y);
    ctx.stroke();

    // 아이템
    this.palette.forEach((item, i) => {
      const x = i * itemWidth + itemWidth / 2;
      const y = palette.y + 45;
      const selected = this.selectedTool === item.id;

      // 선택 효과
      if (selected) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 40);
        glow.addColorStop(0, `${item.color}40`);
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(i * itemWidth, palette.y, itemWidth, palette.height);

        ctx.fillStyle = item.color;
        ctx.fillRect(i * itemWidth, palette.y, itemWidth, 3);
      }

      // 아이콘
      const size = selected ? 36 : 28;
      ctx.font = `${size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(item.icon, x, selected ? y - 5 : y);

      // 이름
      ctx.font = '11px DungGeunMo, sans-serif';
      ctx.fillStyle = selected ? item.color : '#888';
      ctx.fillText(item.name, x, y + 30);
    });
  }

  renderDoneButton(ctx) {
    const btn = this.layout.doneBtn;

    // 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.roundRect(btn.x + 2, btn.y + 2, btn.width, btn.height, 8);
    ctx.fill();

    // 배경
    const grad = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
    grad.addColorStop(0, '#2ecc71');
    grad.addColorStop(1, '#27ae60');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 8);
    ctx.fill();

    // 텍스트
    ctx.font = 'bold 16px DungGeunMo, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('완료 ✓', btn.x + btn.width / 2, btn.y + 26);
  }

  renderDevUI(ctx) {
    const btn = this.layout.skipBtn;

    // 스킵 버튼
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 5);
    ctx.fill();

    ctx.font = 'bold 11px DungGeunMo, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('SKIP →', btn.x + btn.width / 2, btn.y + 22);

    // 입력 디버그 표시
    if (this.lastInputPos) {
      ctx.font = '10px monospace';
      ctx.fillStyle = '#0f0';
      ctx.textAlign = 'left';
      ctx.fillText(
        `입력: (${Math.round(this.lastInputPos.x)}, ${Math.round(this.lastInputPos.y)}) #${this.inputCount}`,
        10, this.config.height - 110
      );
    }
  }

  renderIntro(ctx) {
    const progress = Math.min(1, this.introTimer / 2.0);

    // 오버레이
    ctx.fillStyle = `rgba(0, 0, 0, ${(1 - progress) * 0.8})`;
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    ctx.save();
    ctx.translate(0, (1 - progress) * 50);

    // 단계
    ctx.font = 'bold 20px DungGeunMo, sans-serif';
    ctx.fillStyle = '#e91e63';
    ctx.textAlign = 'center';
    ctx.fillText('단계 5', this.config.width / 2, this.config.height * 0.35);

    // 제목
    ctx.font = 'bold 36px DungGeunMo, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('데코레이션', this.config.width / 2, this.config.height * 0.43);

    // 설명
    ctx.font = '16px DungGeunMo, sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('쿠키를 예쁘게 꾸며보세요!', this.config.width / 2, this.config.height * 0.52);

    // 이모지
    const scale = 1 + Math.sin(this.introTimer * 5) * 0.1;
    ctx.font = `${60 * scale}px sans-serif`;
    ctx.fillText('🎨', this.config.width / 2, this.config.height * 0.68);

    ctx.restore();

    // 터치 안내
    if (progress > 0.5) {
      const blink = 0.5 + Math.sin(this.introTimer * 8) * 0.3;
      ctx.font = '14px DungGeunMo, sans-serif';
      ctx.fillStyle = `rgba(255, 255, 255, ${blink})`;
      ctx.textAlign = 'center';
      ctx.fillText('터치하여 시작', this.config.width / 2, this.config.height * 0.85);
    }
  }

  renderComplete(ctx) {
    const alpha = Math.min(1, this.completeTimer * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    if (this.completeTimer > 0.3) {
      ctx.font = 'bold 36px DungGeunMo, sans-serif';
      ctx.fillStyle = '#2ecc71';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#2ecc71';
      ctx.shadowBlur = 20;
      ctx.fillText('완성!', this.config.width / 2, this.config.height * 0.5);
      ctx.shadowBlur = 0;
    }
  }
}
