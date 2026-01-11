/**
 * DecoState - 데코레이션
 * 코코아 파우더 스프레이 + 토핑 드래그 앤 드롭
 *
 * 사운드/파티클 효과 통합
 */

import { BaseState } from './BaseState.js';
import { GameState } from '../core/StateManager.js';
import { soundManager } from '../core/SoundManager.js';
import { particleSystem, COLORS } from '../core/ParticleSystem.js';

export class DecoState extends BaseState {
  constructor(game) {
    super(game);

    // 도구 선택
    this.selectedTool = 'cocoa'; // cocoa, strawberry, almond, pistachio, gold
    this.prevSelectedTool = null;

    // 코코아 파우더 점들
    this.cocoaDots = [];

    // 토핑 목록
    this.toppings = [];

    // 토핑 팔레트
    this.palette = [
      { id: 'cocoa', name: '코코아', icon: '🟤', color: '#5d4037', desc: '드래그로 뿌리기' },
      { id: 'strawberry', name: '딸기', icon: '🍓', color: '#e74c3c', desc: '탭하여 올리기' },
      { id: 'almond', name: '아몬드', icon: '🥜', color: '#d4a574', desc: '탭하여 올리기' },
      { id: 'pistachio', name: '피스타치오', icon: '🟢', color: '#7cb342', desc: '탭하여 올리기' },
      { id: 'gold', name: '금가루', icon: '✨', color: '#f1c40f', desc: '드래그로 뿌리기' }
    ];

    // 드래그 중인 토핑
    this.draggingTopping = null;
    this.dragPos = null;

    // 완료 버튼
    this.doneButton = null;

    // 인트로 애니메이션
    this.showIntro = true;
    this.introTimer = 0;
    this.introDuration = 2.0;

    // 화면 효과
    this.screenShake = 0;
    this.shakeIntensity = 0;

    // 쿠키 애니메이션
    this.cookieRotation = 0;
    this.cookiePulse = 0;

    // 토핑 애니메이션
    this.toppingAnimations = [];

    // 금가루 파티클
    this.goldParticles = [];

    // 스프레이 사운드 쿨다운
    this.spraySoundCooldown = 0;

    // 점수 표시
    this.scorePopups = [];

    // 완료 상태
    this.isCompleting = false;
    this.completeTimer = 0;
  }

  enter() {
    this.cocoaDots = [];
    this.toppings = [];
    this.selectedTool = 'cocoa';
    this.prevSelectedTool = null;
    this.draggingTopping = null;
    this.dragPos = null;

    this.showIntro = true;
    this.introTimer = 0;
    this.screenShake = 0;
    this.cookieRotation = 0;
    this.cookiePulse = 0;
    this.toppingAnimations = [];
    this.goldParticles = [];
    this.spraySoundCooldown = 0;
    this.scorePopups = [];
    this.isCompleting = false;
    this.completeTimer = 0;

    this.doneButton = {
      x: this.config.width - 100,
      y: 20,
      width: 80,
      height: 40
    };

    this.game.inputManager.onTap = (pos) => this.handleTap(pos);
    this.game.inputManager.onDrag = (pos) => this.handleDrag(pos);
    this.game.inputManager.onDragEnd = () => this.handleDragEnd();
  }

  exit() {
    this.game.inputManager.onTap = null;
    this.game.inputManager.onDrag = null;
    this.game.inputManager.onDragEnd = null;

    // 레시피 저장
    this.saveRecipe();
  }

  handleTap(pos) {
    if (this.showIntro) {
      this.showIntro = false;
      soundManager.playUIClick();
      return;
    }

    if (this.isCompleting) return;

    // 완료 버튼 체크
    if (this.isPointInRect(pos, this.doneButton)) {
      this.complete();
      return;
    }

    // 팔레트 체크
    const paletteY = this.config.height - 100;
    const paletteItemWidth = this.config.width / this.palette.length;

    if (pos.y > paletteY) {
      const index = Math.floor(pos.x / paletteItemWidth);
      if (index >= 0 && index < this.palette.length) {
        this.selectTool(this.palette[index].id);
      }
      return;
    }

    // 쿠키 영역에 토핑 놓기 (코코아/금가루 제외)
    if (this.selectedTool !== 'cocoa' && this.selectedTool !== 'gold') {
      const cookieCenter = { x: this.config.width / 2, y: this.config.height * 0.42 };
      const cookieRadius = 120;
      const dist = Math.sqrt(
        Math.pow(pos.x - cookieCenter.x, 2) +
        Math.pow(pos.y - cookieCenter.y, 2)
      );

      if (dist <= cookieRadius) {
        this.placeTopping(pos);
      }
    }
  }

  selectTool(toolId) {
    if (this.selectedTool !== toolId) {
      this.selectedTool = toolId;
      soundManager.playUIClick();

      // 선택 효과
      const tool = this.palette.find(p => p.id === toolId);
      if (tool) {
        // 파티클
        const paletteY = this.config.height - 50;
        const index = this.palette.findIndex(p => p.id === toolId);
        const x = (index + 0.5) * (this.config.width / this.palette.length);
        particleSystem.emitSparkle(x, paletteY, 5);
      }
    }
  }

  placeTopping(pos) {
    const tool = this.palette.find(p => p.id === this.selectedTool);
    if (!tool) return;

    // 토핑 추가
    const topping = {
      type: tool.id,
      icon: tool.icon,
      color: tool.color,
      x: pos.x,
      y: pos.y,
      scale: 0,
      rotation: (Math.random() - 0.5) * 0.5,
      targetScale: 1
    };
    this.toppings.push(topping);

    // 애니메이션 추가
    this.toppingAnimations.push({
      topping,
      time: 0
    });

    // 사운드
    soundManager.playClick(800 + Math.random() * 400, 0.08, 0.3);

    // 파티클
    particleSystem.emitSparkle(pos.x, pos.y, 8);

    // 점수 팝업
    this.scorePopups.push({
      x: pos.x,
      y: pos.y,
      value: 5,
      life: 1,
      vy: -50
    });

    // 쿠키 펄스
    this.cookiePulse = 0.15;
  }

  handleDrag(pos) {
    if (this.showIntro || this.isCompleting) return;

    this.dragPos = pos;

    // 쿠키 영역 체크
    const cookieCenter = { x: this.config.width / 2, y: this.config.height * 0.42 };
    const cookieRadius = 120;
    const dist = Math.sqrt(
      Math.pow(pos.x - cookieCenter.x, 2) +
      Math.pow(pos.y - cookieCenter.y, 2)
    );

    if (dist > cookieRadius) return;

    if (this.selectedTool === 'cocoa') {
      // 코코아 파우더 스프레이
      for (let i = 0; i < 4; i++) {
        const dot = {
          x: pos.x + (Math.random() - 0.5) * 40,
          y: pos.y + (Math.random() - 0.5) * 40,
          size: Math.random() * 4 + 1,
          alpha: Math.random() * 0.5 + 0.4,
          scale: 0,
          targetScale: 1
        };
        this.cocoaDots.push(dot);
      }

      // 스프레이 사운드 (쿨다운)
      if (this.spraySoundCooldown <= 0) {
        soundManager.playClick(200 + Math.random() * 100, 0.05, 0.15);
        this.spraySoundCooldown = 0.05;
      }

      // 파티클
      if (Math.random() < 0.2) {
        this.emitCocoaParticle(pos.x, pos.y);
      }

    } else if (this.selectedTool === 'gold') {
      // 금가루 스프레이
      for (let i = 0; i < 2; i++) {
        this.goldParticles.push({
          x: pos.x + (Math.random() - 0.5) * 30,
          y: pos.y + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 20,
          vy: Math.random() * 10 + 5,
          size: Math.random() * 3 + 1,
          life: 1,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 5
        });
      }

      // 반짝이 사운드
      if (this.spraySoundCooldown <= 0) {
        soundManager.playClick(1500 + Math.random() * 500, 0.03, 0.2);
        this.spraySoundCooldown = 0.08;
      }

      // 파티클 시스템 스파클
      if (Math.random() < 0.15) {
        particleSystem.emitSparkle(pos.x, pos.y, 3);
      }
    }
  }

  emitCocoaParticle(x, y) {
    for (let i = 0; i < 3; i++) {
      particleSystem.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 30,
        vy: -Math.random() * 20 - 10,
        life: 0.5,
        maxLife: 0.5,
        size: Math.random() * 4 + 2,
        color: '#5d4037',
        gravity: 80,
        friction: 0.98
      });
    }
  }

  handleDragEnd() {
    this.dragPos = null;
  }

  complete() {
    if (this.isCompleting) return;

    this.isCompleting = true;
    this.completeTimer = 0;

    // 완료 효과
    soundManager.playSuccess();
    this.triggerShake(5, 0.2);

    // 축하 파티클
    const centerX = this.config.width / 2;
    const centerY = this.config.height * 0.42;
    particleSystem.emitCelebration(centerX, centerY);
    particleSystem.emitSparkle(centerX, centerY, 30);

    // 지연 후 다음 상태로
    setTimeout(() => {
      // 데코 점수 반영
      const decoScore = Math.min(100, this.cocoaDots.length / 8 + this.toppings.length * 8 + this.goldParticles.length / 5);
      this.game.cookieStats.visual += Math.floor(decoScore);

      soundManager.playFanfare();

      setTimeout(() => {
        this.game.stateManager.changeState(GameState.TASTING);
      }, 800);
    }, 500);
  }

  triggerShake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.screenShake = duration;
  }

  saveRecipe() {
    const recipe = {
      cocoaDots: this.cocoaDots.map(d => ({ x: d.x, y: d.y, size: d.size })),
      toppings: this.toppings.map(t => ({ type: t.type, x: t.x, y: t.y })),
      goldCount: this.goldParticles.length,
      timestamp: Date.now()
    };

    try {
      const recipes = JSON.parse(localStorage.getItem('djjc_recipes') || '[]');
      recipes.push(recipe);
      if (recipes.length > 10) recipes.shift();
      localStorage.setItem('djjc_recipes', JSON.stringify(recipes));
    } catch (e) {
      console.error('레시피 저장 실패:', e);
    }
  }

  update(dt) {
    // 인트로 타이머
    if (this.showIntro) {
      this.introTimer += dt;
      if (this.introTimer >= this.introDuration) {
        this.showIntro = false;
      }
      return;
    }

    // 스프레이 쿨다운
    if (this.spraySoundCooldown > 0) {
      this.spraySoundCooldown -= dt;
    }

    // 화면 흔들림
    if (this.screenShake > 0) {
      this.screenShake -= dt;
    }

    // 쿠키 회전 (미세하게)
    this.cookieRotation += dt * 0.1;

    // 쿠키 펄스
    if (this.cookiePulse > 0) {
      this.cookiePulse -= dt * 0.5;
    }

    // 코코아 도트 애니메이션
    this.cocoaDots.forEach(dot => {
      if (dot.scale < dot.targetScale) {
        dot.scale += dt * 10;
        if (dot.scale > dot.targetScale) dot.scale = dot.targetScale;
      }
    });

    // 토핑 애니메이션
    this.toppingAnimations.forEach(anim => {
      anim.time += dt;
      const t = Math.min(1, anim.time / 0.3);
      // 바운스 이징
      const bounce = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      anim.topping.scale = bounce * anim.topping.targetScale;
    });
    this.toppingAnimations = this.toppingAnimations.filter(a => a.time < 0.3);

    // 금가루 파티클 업데이트
    this.goldParticles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 30 * dt;
      p.rotation += p.rotationSpeed * dt;
      p.life -= dt * 0.5;
    });
    this.goldParticles = this.goldParticles.filter(p => p.life > 0);

    // 점수 팝업 업데이트
    this.scorePopups.forEach(popup => {
      popup.y += popup.vy * dt;
      popup.vy += 50 * dt;
      popup.life -= dt * 2;
    });
    this.scorePopups = this.scorePopups.filter(p => p.life > 0);

    // 완료 타이머
    if (this.isCompleting) {
      this.completeTimer += dt;
    }
  }

  render(ctx) {
    // 화면 흔들림 적용
    ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(shakeX, shakeY);
    }

    // 배경
    this.renderBackground(ctx);

    // 작업대
    this.renderWorkbench(ctx);

    // 쿠키
    this.renderCookie(ctx);

    // 코코아 파우더
    this.renderCocoa(ctx);

    // 금가루
    this.renderGoldParticles(ctx);

    // 토핑
    this.renderToppings(ctx);

    // 점수 팝업
    this.renderScorePopups(ctx);

    // UI
    if (!this.showIntro) {
      this.renderUI(ctx);
      this.renderPalette(ctx);
      this.renderDoneButton(ctx);
    }

    ctx.restore();

    // 인트로
    if (this.showIntro) {
      this.renderIntro(ctx);
    }

    // 완료 오버레이
    if (this.isCompleting) {
      this.renderCompleteOverlay(ctx);
    }
  }

  renderBackground(ctx) {
    // 그라데이션 배경
    const gradient = ctx.createLinearGradient(0, 0, 0, this.config.height);
    gradient.addColorStop(0, '#2d3436');
    gradient.addColorStop(0.5, '#1e272e');
    gradient.addColorStop(1, '#0d1117');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    // 스포트라이트 효과
    const spotX = this.config.width / 2;
    const spotY = this.config.height * 0.35;
    const spotlight = ctx.createRadialGradient(spotX, spotY - 100, 0, spotX, spotY, 300);
    spotlight.addColorStop(0, 'rgba(255, 220, 180, 0.2)');
    spotlight.addColorStop(0.5, 'rgba(255, 200, 150, 0.1)');
    spotlight.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spotlight;
    ctx.fillRect(0, 0, this.config.width, this.config.height);
  }

  renderWorkbench(ctx) {
    const benchY = this.config.height * 0.65;
    const benchHeight = 20;

    // 작업대 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(20, benchY + 5, this.config.width - 40, benchHeight);

    // 작업대
    const benchGradient = ctx.createLinearGradient(0, benchY, 0, benchY + benchHeight);
    benchGradient.addColorStop(0, '#8b7355');
    benchGradient.addColorStop(1, '#6b5344');
    ctx.fillStyle = benchGradient;
    ctx.fillRect(20, benchY, this.config.width - 40, benchHeight);
  }

  renderCookie(ctx) {
    const centerX = this.config.width / 2;
    const centerY = this.config.height * 0.42;
    const baseRadius = 120;
    const pulseRadius = baseRadius + this.cookiePulse * 10;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(Math.sin(this.cookieRotation) * 0.02);

    // 쿠키 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(5, 10, pulseRadius, pulseRadius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 쿠키 베이스 (카다이프)
    const cookieGradient = ctx.createRadialGradient(-30, -30, 0, 0, 0, pulseRadius);
    cookieGradient.addColorStop(0, '#e8d4b8');
    cookieGradient.addColorStop(0.6, '#d4a574');
    cookieGradient.addColorStop(1, '#b8956e');
    ctx.fillStyle = cookieGradient;
    ctx.beginPath();
    ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
    ctx.fill();

    // 카다이프 텍스처 (동심원)
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.2)';
    ctx.lineWidth = 1;
    for (let r = 20; r < pulseRadius; r += 15) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 카다이프 실 텍스처
    ctx.strokeStyle = 'rgba(180, 140, 100, 0.3)';
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * pulseRadius, Math.sin(angle) * pulseRadius);
      ctx.stroke();
    }

    // 피스타치오 필링 (중앙)
    const fillingGradient = ctx.createRadialGradient(-10, -10, 0, 0, 0, 65);
    fillingGradient.addColorStop(0, '#a8d875');
    fillingGradient.addColorStop(0.7, '#7cb342');
    fillingGradient.addColorStop(1, '#558b2f');
    ctx.fillStyle = fillingGradient;
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.fill();

    // 필링 하이라이트
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(-15, -15, 20, 15, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // 쿠키 테두리 (바삭한 가장자리)
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, pulseRadius - 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  renderCocoa(ctx) {
    this.cocoaDots.forEach(dot => {
      const size = dot.size * dot.scale;
      if (size <= 0) return;

      ctx.globalAlpha = dot.alpha;
      ctx.fillStyle = '#5d4037';
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  renderGoldParticles(ctx) {
    this.goldParticles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.life;

      // 금가루 반짝임
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
      gradient.addColorStop(0, '#fff9c4');
      gradient.addColorStop(0.5, '#ffd700');
      gradient.addColorStop(1, '#b8860b');
      ctx.fillStyle = gradient;

      // 별 모양
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const x = Math.cos(angle) * p.size;
        const y = Math.sin(angle) * p.size;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        const midAngle = angle + Math.PI / 4;
        const midX = Math.cos(midAngle) * p.size * 0.4;
        const midY = Math.sin(midAngle) * p.size * 0.4;
        ctx.lineTo(midX, midY);
      }
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }

  renderToppings(ctx) {
    this.toppings.forEach(topping => {
      if (topping.scale <= 0) return;

      ctx.save();
      ctx.translate(topping.x, topping.y);
      ctx.rotate(topping.rotation);
      ctx.scale(topping.scale, topping.scale);

      // 그림자
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(2, 4, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // 토핑 아이콘
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(topping.icon, 0, 0);

      ctx.restore();
    });
  }

  renderScorePopups(ctx) {
    this.scorePopups.forEach(popup => {
      ctx.globalAlpha = popup.life;
      ctx.font = 'bold 16px DungGeunMo, sans-serif';
      ctx.fillStyle = '#2ecc71';
      ctx.textAlign = 'center';
      ctx.fillText(`+${popup.value}`, popup.x, popup.y);
    });
    ctx.globalAlpha = 1;
  }

  renderUI(ctx) {
    // 제목 배경
    const titleGradient = ctx.createLinearGradient(0, 0, this.config.width, 0);
    titleGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    titleGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
    titleGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = titleGradient;
    ctx.fillRect(0, 15, this.config.width, 40);

    // 제목
    ctx.font = 'bold 22px DungGeunMo, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#e91e63';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#e91e63';
    ctx.fillText('🎨 데코레이션', this.config.width / 2, 42);
    ctx.shadowBlur = 0;

    // 선택된 도구 표시
    const tool = this.palette.find(p => p.id === this.selectedTool);
    if (tool) {
      ctx.font = '14px DungGeunMo, sans-serif';
      ctx.fillStyle = '#888';
      ctx.fillText(`${tool.icon} ${tool.name} - ${tool.desc}`, this.config.width / 2, 70);
    }

    // 데코 점수 미리보기
    const previewScore = Math.min(100, Math.floor(this.cocoaDots.length / 8 + this.toppings.length * 8));
    ctx.font = '14px DungGeunMo, sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'right';
    ctx.fillText(`비주얼 예상: ${previewScore}점`, this.config.width - 20, 75);
  }

  renderPalette(ctx) {
    const paletteY = this.config.height - 100;
    const itemWidth = this.config.width / this.palette.length;
    const paletteHeight = 100;

    // 배경
    const paletteBg = ctx.createLinearGradient(0, paletteY, 0, paletteY + paletteHeight);
    paletteBg.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
    paletteBg.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
    ctx.fillStyle = paletteBg;
    ctx.fillRect(0, paletteY, this.config.width, paletteHeight);

    // 상단 라인
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, paletteY);
    ctx.lineTo(this.config.width, paletteY);
    ctx.stroke();

    // 아이템들
    this.palette.forEach((item, i) => {
      const x = i * itemWidth + itemWidth / 2;
      const y = paletteY + 45;

      // 선택 표시
      if (this.selectedTool === item.id) {
        // 글로우 배경
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 40);
        glowGradient.addColorStop(0, `${item.color}40`);
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(i * itemWidth, paletteY, itemWidth, paletteHeight);

        // 선택 표시 바
        ctx.fillStyle = item.color;
        ctx.fillRect(i * itemWidth, paletteY, itemWidth, 3);
      }

      // 아이콘 (선택 시 크게)
      const iconSize = this.selectedTool === item.id ? 36 : 28;
      const iconY = this.selectedTool === item.id ? y - 5 : y;
      ctx.font = `${iconSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(item.icon, x, iconY);

      // 이름
      ctx.font = '11px DungGeunMo, sans-serif';
      ctx.fillStyle = this.selectedTool === item.id ? item.color : '#888';
      ctx.fillText(item.name, x, y + 30);
    });
  }

  renderDoneButton(ctx) {
    const btn = this.doneButton;

    // 버튼 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.roundRect(btn.x + 2, btn.y + 2, btn.width, btn.height, 8);
    ctx.fill();

    // 버튼 배경
    const btnGradient = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
    btnGradient.addColorStop(0, '#2ecc71');
    btnGradient.addColorStop(1, '#27ae60');
    ctx.fillStyle = btnGradient;
    ctx.beginPath();
    ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 8);
    ctx.fill();

    // 버튼 텍스트
    ctx.font = 'bold 16px DungGeunMo, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('완료 ✓', btn.x + btn.width / 2, btn.y + 26);
  }

  renderIntro(ctx) {
    const progress = Math.min(1, this.introTimer / this.introDuration);

    // 어두운 오버레이
    const overlayAlpha = 1 - progress;
    ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha * 0.8})`;
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    // 중앙 텍스트
    const slideOffset = (1 - progress) * 50;

    ctx.save();
    ctx.translate(0, slideOffset);

    // 단계 표시
    ctx.font = 'bold 20px DungGeunMo, sans-serif';
    ctx.fillStyle = '#e91e63';
    ctx.textAlign = 'center';
    ctx.fillText('STEP 5', this.config.width / 2, this.config.height * 0.35);

    // 제목
    ctx.font = 'bold 36px DungGeunMo, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('데코레이션', this.config.width / 2, this.config.height * 0.43);

    // 설명
    ctx.font = '16px DungGeunMo, sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('쿠키를 예쁘게 꾸며보세요!', this.config.width / 2, this.config.height * 0.52);

    // 이모지 애니메이션
    const emojiScale = 1 + Math.sin(this.introTimer * 5) * 0.1;
    ctx.font = `${60 * emojiScale}px sans-serif`;
    ctx.fillText('🎨', this.config.width / 2, this.config.height * 0.68);

    ctx.restore();

    // 터치 안내
    if (progress > 0.5) {
      const blinkAlpha = 0.5 + Math.sin(this.introTimer * 8) * 0.3;
      ctx.font = '14px DungGeunMo, sans-serif';
      ctx.fillStyle = `rgba(255, 255, 255, ${blinkAlpha})`;
      ctx.textAlign = 'center';
      ctx.fillText('터치하여 시작', this.config.width / 2, this.config.height * 0.85);
    }
  }

  renderCompleteOverlay(ctx) {
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
