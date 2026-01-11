/**
 * ParticleSystem - 화려한 파티클 효과 시스템
 * 카다이프 가루, 반짝임, 폭발 등 시각적 피드백
 */

// ==================== 색상 팔레트 (두바이 쿠키 테마) ====================
export const COLORS = {
  // 피스타치오 계열
  pistachio: {
    light: '#A5D6A7',
    main: '#7CB342',
    dark: '#558B2F',
    glow: 'rgba(124, 179, 66, 0.6)'
  },
  // 카다이프 계열 (황금빛)
  kadaif: {
    light: '#FFE082',
    main: '#D4A574',
    dark: '#A67C52',
    golden: '#FFD700'
  },
  // 코코아 계열
  cocoa: {
    light: '#8D6E63',
    main: '#5D4037',
    dark: '#3E2723'
  },
  // 마시멜로우 계열
  marshmallow: {
    white: '#FFFAF0',
    pink: '#FFE4E1',
    cream: '#FFF8E1'
  },
  // UI 컬러
  ui: {
    gold: '#F1C40F',
    red: '#E74C3C',
    blue: '#3498DB',
    green: '#2ECC71',
    purple: '#9B59B6'
  }
};

// ==================== 파티클 클래스 ====================
class Particle {
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.vx = options.vx || (Math.random() - 0.5) * 4;
    this.vy = options.vy || (Math.random() - 0.5) * 4;
    this.gravity = options.gravity || 0;
    this.friction = options.friction || 0.98;
    this.size = options.size || 5;
    this.sizeDecay = options.sizeDecay || 0.95;
    this.color = options.color || '#fff';
    this.alpha = options.alpha || 1;
    this.alphaDecay = options.alphaDecay || 0.02;
    this.rotation = options.rotation || 0;
    this.rotationSpeed = options.rotationSpeed || 0;
    this.life = options.life || 1;
    this.maxLife = this.life;
    this.shape = options.shape || 'circle'; // circle, square, line, star, sparkle
    this.trail = options.trail || false;
    this.trailLength = options.trailLength || 5;
    this.trailHistory = [];
  }

  update(dt) {
    // 트레일 기록
    if (this.trail) {
      this.trailHistory.push({ x: this.x, y: this.y, alpha: this.alpha });
      if (this.trailHistory.length > this.trailLength) {
        this.trailHistory.shift();
      }
    }

    // 물리
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;

    // 감쇠
    this.size *= this.sizeDecay;
    this.alpha -= this.alphaDecay;
    this.rotation += this.rotationSpeed;
    this.life -= dt;

    return this.life > 0 && this.alpha > 0 && this.size > 0.5;
  }

  render(ctx) {
    // 트레일 렌더링
    if (this.trail && this.trailHistory.length > 0) {
      this.trailHistory.forEach((point, i) => {
        const trailAlpha = (i / this.trailHistory.length) * this.alpha * 0.5;
        ctx.globalAlpha = trailAlpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    switch (this.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'square':
        ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
        break;

      case 'line':
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(this.size, 0);
        ctx.stroke();
        break;

      case 'star':
        this.drawStar(ctx, 0, 0, 5, this.size, this.size * 0.5);
        break;

      case 'sparkle':
        this.drawSparkle(ctx, this.size);
        break;

      case 'crumb':
        // 불규칙한 부스러기 모양
        ctx.beginPath();
        const points = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const radius = this.size * (0.5 + Math.random() * 0.5);
          const px = Math.cos(angle) * radius;
          const py = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        break;
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
      rot += step;
    }

    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }

  drawSparkle(ctx, size) {
    ctx.lineWidth = 2;
    ctx.beginPath();
    // 십자 반짝임
    ctx.moveTo(0, -size);
    ctx.lineTo(0, size);
    ctx.moveTo(-size, 0);
    ctx.lineTo(size, 0);
    // 대각선
    const diag = size * 0.6;
    ctx.moveTo(-diag, -diag);
    ctx.lineTo(diag, diag);
    ctx.moveTo(diag, -diag);
    ctx.lineTo(-diag, diag);
    ctx.stroke();
  }
}

// ==================== 파티클 시스템 ====================
export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.emitters = [];
  }

  update(dt) {
    // 파티클 업데이트
    this.particles = this.particles.filter(p => p.update(dt));

    // 이미터 업데이트
    this.emitters = this.emitters.filter(e => {
      e.timer -= dt;
      if (e.timer <= 0) {
        e.timer = e.interval;
        e.emit(this);
        e.duration -= e.interval;
      }
      return e.duration > 0;
    });
  }

  render(ctx) {
    this.particles.forEach(p => p.render(ctx));
  }

  clear() {
    this.particles = [];
    this.emitters = [];
  }

  // ==================== 프리셋 이펙트들 ====================

  /**
   * 🔪 카다이프 슬라이스 - 가루 튀김 효과
   */
  emitSlice(x, y, angle = 0) {
    const count = 15 + Math.floor(Math.random() * 10);

    for (let i = 0; i < count; i++) {
      // 슬라이스 방향으로 가루 분산
      const spreadAngle = angle + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 3 + Math.random() * 6;

      this.particles.push(new Particle({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(spreadAngle) * speed,
        vy: Math.sin(spreadAngle) * speed - 2,
        gravity: 0.3,
        size: 2 + Math.random() * 4,
        sizeDecay: 0.97,
        color: Math.random() > 0.3 ? COLORS.kadaif.main : COLORS.kadaif.light,
        alpha: 0.9,
        alphaDecay: 0.025,
        shape: 'crumb',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        life: 1.5
      }));
    }

    // 황금빛 반짝임 추가
    for (let i = 0; i < 5; i++) {
      this.particles.push(new Particle({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 2,
        vy: -1 - Math.random() * 2,
        gravity: 0.05,
        size: 8 + Math.random() * 6,
        sizeDecay: 0.92,
        color: COLORS.kadaif.golden,
        alpha: 0.8,
        alphaDecay: 0.04,
        shape: 'sparkle',
        life: 0.8
      }));
    }
  }

  /**
   * 💥 콤보 폭발 - 대량 슬라이스
   */
  emitComboExplosion(x, y, comboCount = 3) {
    const baseCount = 20 + comboCount * 10;

    for (let i = 0; i < baseCount; i++) {
      const angle = (i / baseCount) * Math.PI * 2;
      const speed = 4 + Math.random() * 8;

      this.particles.push(new Particle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.2,
        friction: 0.96,
        size: 3 + Math.random() * 5,
        sizeDecay: 0.96,
        color: [COLORS.kadaif.golden, COLORS.ui.gold, COLORS.kadaif.light][Math.floor(Math.random() * 3)],
        alpha: 1,
        alphaDecay: 0.02,
        shape: Math.random() > 0.5 ? 'crumb' : 'star',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.5,
        trail: true,
        trailLength: 3,
        life: 2
      }));
    }

    // 중앙 플래시
    this.particles.push(new Particle({
      x,
      y,
      size: 60,
      sizeDecay: 0.85,
      color: '#fff',
      alpha: 0.8,
      alphaDecay: 0.1,
      shape: 'circle',
      life: 0.3
    }));
  }

  /**
   * 🥜 피스타치오 크러시 - 파편 + 분말
   */
  emitCrush(x, y) {
    // 큰 파편
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;

      this.particles.push(new Particle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        gravity: 0.4,
        size: 5 + Math.random() * 8,
        sizeDecay: 0.98,
        color: Math.random() > 0.5 ? COLORS.pistachio.main : COLORS.pistachio.dark,
        alpha: 1,
        alphaDecay: 0.02,
        shape: 'crumb',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.4,
        life: 1.5
      }));
    }

    // 미세 분말
    for (let i = 0; i < 15; i++) {
      this.particles.push(new Particle({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 4,
        gravity: 0.1,
        size: 2 + Math.random() * 3,
        sizeDecay: 0.95,
        color: COLORS.pistachio.light,
        alpha: 0.7,
        alphaDecay: 0.03,
        shape: 'circle',
        life: 1
      }));
    }
  }

  /**
   * 🌀 스핀 효과 - 회전 궤적
   */
  emitSpin(x, y, angle, intensity = 1) {
    const count = Math.floor(3 * intensity);

    for (let i = 0; i < count; i++) {
      const dist = 40 + Math.random() * 30;
      const px = x + Math.cos(angle + i * 0.3) * dist;
      const py = y + Math.sin(angle + i * 0.3) * dist;

      this.particles.push(new Particle({
        x: px,
        y: py,
        vx: Math.cos(angle + Math.PI / 2) * 2,
        vy: Math.sin(angle + Math.PI / 2) * 2,
        size: 4 + Math.random() * 4,
        sizeDecay: 0.9,
        color: COLORS.marshmallow.cream,
        alpha: 0.6,
        alphaDecay: 0.05,
        shape: 'circle',
        trail: true,
        trailLength: 4,
        life: 0.5
      }));
    }
  }

  /**
   * ✨ 스페셜 아이템 반짝임
   */
  emitSparkle(x, y, color = COLORS.ui.gold) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;

      this.particles.push(new Particle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: -0.05,
        size: 6 + Math.random() * 8,
        sizeDecay: 0.93,
        color,
        alpha: 1,
        alphaDecay: 0.03,
        shape: 'sparkle',
        life: 1.2
      }));
    }

    // 중앙 글로우
    this.particles.push(new Particle({
      x,
      y,
      size: 40,
      sizeDecay: 0.9,
      color,
      alpha: 0.5,
      alphaDecay: 0.08,
      shape: 'circle',
      life: 0.5
    }));
  }

  /**
   * 🔥 피버 모드 - 지속적 불꽃
   */
  emitFeverFlame(x, y) {
    for (let i = 0; i < 3; i++) {
      this.particles.push(new Particle({
        x: x + (Math.random() - 0.5) * 40,
        y: y + Math.random() * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: -3 - Math.random() * 4,
        gravity: -0.1,
        size: 8 + Math.random() * 12,
        sizeDecay: 0.92,
        color: [COLORS.ui.red, COLORS.ui.gold, '#FF6B35'][Math.floor(Math.random() * 3)],
        alpha: 0.9,
        alphaDecay: 0.04,
        shape: 'circle',
        life: 0.8
      }));
    }
  }

  /**
   * 💰 코인/판매 효과
   */
  emitCoin(x, y) {
    // 코인 반짝임
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;

      this.particles.push(new Particle({
        x,
        y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3 - 2,
        gravity: 0.15,
        size: 10,
        sizeDecay: 0.95,
        color: COLORS.ui.gold,
        alpha: 1,
        alphaDecay: 0.03,
        shape: 'star',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: 0.1,
        life: 1
      }));
    }

    // 상승 텍스트용 파티클 (원 형태로 표현)
    this.particles.push(new Particle({
      x,
      y,
      vy: -3,
      gravity: 0,
      size: 20,
      sizeDecay: 1,
      color: COLORS.ui.green,
      alpha: 1,
      alphaDecay: 0.025,
      shape: 'circle',
      life: 1.5
    }));
  }

  /**
   * 📈 가격 상승 효과
   */
  emitPriceUp(x, y) {
    for (let i = 0; i < 5; i++) {
      this.particles.push(new Particle({
        x: x + (Math.random() - 0.5) * 30,
        y: y + Math.random() * 10,
        vx: (Math.random() - 0.5) * 2,
        vy: -4 - Math.random() * 3,
        gravity: 0,
        size: 8,
        sizeDecay: 0.97,
        color: COLORS.ui.red,
        alpha: 0.9,
        alphaDecay: 0.03,
        shape: 'star',
        life: 1
      }));
    }
  }

  /**
   * 📉 가격 하락 효과
   */
  emitPriceDown(x, y) {
    for (let i = 0; i < 5; i++) {
      this.particles.push(new Particle({
        x: x + (Math.random() - 0.5) * 30,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 3,
        gravity: 0.1,
        size: 8,
        sizeDecay: 0.97,
        color: COLORS.ui.blue,
        alpha: 0.9,
        alphaDecay: 0.03,
        shape: 'star',
        life: 1
      }));
    }
  }

  /**
   * 🎊 점수 공개 축하
   */
  emitCelebration(centerX, centerY, width, height) {
    const colors = [COLORS.ui.gold, COLORS.ui.red, COLORS.ui.green, COLORS.ui.purple, COLORS.pistachio.main];

    for (let i = 0; i < 50; i++) {
      this.particles.push(new Particle({
        x: centerX + (Math.random() - 0.5) * width,
        y: centerY - height / 2,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 5 + 2,
        gravity: 0.15,
        friction: 0.99,
        size: 6 + Math.random() * 6,
        sizeDecay: 0.995,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        alphaDecay: 0.008,
        shape: Math.random() > 0.5 ? 'square' : 'circle',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        life: 4
      }));
    }
  }

  /**
   * 스크린 플래시 효과
   */
  emitScreenFlash(width, height, color = '#fff') {
    this.particles.push(new Particle({
      x: width / 2,
      y: height / 2,
      size: Math.max(width, height),
      sizeDecay: 1,
      color,
      alpha: 0.4,
      alphaDecay: 0.08,
      shape: 'circle',
      life: 0.3
    }));
  }
}

// 전역 싱글톤
export const particleSystem = new ParticleSystem();
