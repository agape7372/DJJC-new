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
  constructor() {
    // [Mobile Opt] 기본값으로 초기화 - reset()으로 재사용
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.gravity = 0;
    this.friction = 0.98;
    this.size = 5;
    this.sizeDecay = 0.95;
    this.color = '#fff';
    this.alpha = 1;
    this.alphaDecay = 0.02;
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.life = 1;
    this.maxLife = 1;
    this.shape = 'circle';
    this.trail = false;
    this.trailLength = 5;
    this.trailHistory = [];
    this.active = false; // [Mobile Opt] 활성 상태 플래그
  }

  /**
   * [Mobile Opt] 파티클 재사용을 위한 리셋 메서드
   */
  reset(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.vx = options.vx !== undefined ? options.vx : (Math.random() - 0.5) * 4;
    this.vy = options.vy !== undefined ? options.vy : (Math.random() - 0.5) * 4;
    this.gravity = options.gravity || 0;
    this.friction = options.friction || 0.98;
    this.size = options.size || 5;
    this.sizeDecay = options.sizeDecay || 0.95;
    this.color = options.color || '#fff';
    this.alpha = options.alpha !== undefined ? options.alpha : 1;
    this.alphaDecay = options.alphaDecay || 0.02;
    this.rotation = options.rotation || 0;
    this.rotationSpeed = options.rotationSpeed || 0;
    this.life = options.life || 1;
    this.maxLife = this.life;
    this.shape = options.shape || 'circle';
    this.trail = options.trail || false;
    this.trailLength = options.trailLength || 5;
    // [Mobile Opt] 트레일 히스토리 재사용 (배열 새로 생성 방지)
    this.trailHistory.length = 0;
    this.active = true;
    return this;
  }

  update(dt) {
    // [Mobile Opt] 비활성 파티클 스킵
    if (!this.active) return false;

    // 트레일 기록 - [Mobile Opt] 객체 재사용 패턴
    if (this.trail) {
      // shift() 대신 인덱스 기반 순환
      if (this.trailHistory.length >= this.trailLength) {
        // 첫 번째 요소 재사용
        const recycled = this.trailHistory.shift();
        recycled.x = this.x;
        recycled.y = this.y;
        recycled.alpha = this.alpha;
        this.trailHistory.push(recycled);
      } else {
        this.trailHistory.push({ x: this.x, y: this.y, alpha: this.alpha });
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

    // [Mobile Opt] active 플래그 업데이트
    this.active = this.life > 0 && this.alpha > 0 && this.size > 0.5;
    return this.active;
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
// [Mobile Opt] 풀링 상수
const POOL_INITIAL_SIZE = 200;  // 초기 풀 크기
const POOL_MAX_SIZE = 500;      // 최대 풀 크기

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.emitters = [];

    // [Mobile Opt] 객체 풀 초기화
    this._pool = [];
    this._activeCount = 0;
    this._initPool(POOL_INITIAL_SIZE);
  }

  /**
   * [Mobile Opt] 파티클 풀 초기화
   */
  _initPool(size) {
    for (let i = 0; i < size; i++) {
      this._pool.push(new Particle());
    }
  }

  /**
   * [Mobile Opt] 풀에서 파티클 획득
   */
  _getParticle(options) {
    let particle;

    if (this._pool.length > 0) {
      // 풀에서 재사용
      particle = this._pool.pop();
    } else if (this.particles.length < POOL_MAX_SIZE) {
      // 풀이 비었으면 새로 생성 (최대 크기 내에서)
      particle = new Particle();
    } else {
      // 최대 크기 초과 - 가장 오래된 파티클 재사용
      particle = this.particles.shift();
    }

    return particle.reset(options);
  }

  /**
   * [Mobile Opt] 파티클을 풀에 반환
   */
  _releaseParticle(particle) {
    particle.active = false;
    if (this._pool.length < POOL_MAX_SIZE) {
      this._pool.push(particle);
    }
  }

  update(dt) {
    // [Mobile Opt] 인플레이스 파티클 업데이트 (filter() 대신)
    let writeIndex = 0;
    for (let readIndex = 0; readIndex < this.particles.length; readIndex++) {
      const p = this.particles[readIndex];
      if (p.update(dt)) {
        // 살아있는 파티클은 유지
        if (writeIndex !== readIndex) {
          this.particles[writeIndex] = p;
        }
        writeIndex++;
      } else {
        // 죽은 파티클은 풀에 반환
        this._releaseParticle(p);
      }
    }
    // 배열 길이 조정 (새 배열 생성 없이)
    this.particles.length = writeIndex;
    this._activeCount = writeIndex;

    // [Mobile Opt] 이미터 업데이트 - 인플레이스
    let emitterWriteIndex = 0;
    for (let i = 0; i < this.emitters.length; i++) {
      const e = this.emitters[i];
      e.timer -= dt;
      if (e.timer <= 0) {
        e.timer = e.interval;
        e.emit(this);
        e.duration -= e.interval;
      }
      if (e.duration > 0) {
        if (emitterWriteIndex !== i) {
          this.emitters[emitterWriteIndex] = e;
        }
        emitterWriteIndex++;
      }
    }
    this.emitters.length = emitterWriteIndex;
  }

  render(ctx) {
    // [Mobile Opt] for 루프 사용 (forEach 콜백 오버헤드 방지)
    const len = this.particles.length;
    for (let i = 0; i < len; i++) {
      this.particles[i].render(ctx);
    }
  }

  clear() {
    // [Mobile Opt] 모든 파티클을 풀에 반환
    for (let i = 0; i < this.particles.length; i++) {
      this._releaseParticle(this.particles[i]);
    }
    this.particles.length = 0;
    this.emitters.length = 0;
    this._activeCount = 0;
  }

  /**
   * [Mobile Opt] 현재 활성 파티클 수 (디버그용)
   */
  getActiveCount() {
    return this._activeCount;
  }

  /**
   * [Mobile Opt] 풀 상태 (디버그용)
   */
  getPoolStats() {
    return {
      active: this._activeCount,
      pooled: this._pool.length,
      total: this._activeCount + this._pool.length
    };
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

      this.particles.push(this._getParticle({
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
      this.particles.push(this._getParticle({
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

      this.particles.push(this._getParticle({
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
    this.particles.push(this._getParticle({
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

      this.particles.push(this._getParticle({
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
      this.particles.push(this._getParticle({
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

      this.particles.push(this._getParticle({
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

      this.particles.push(this._getParticle({
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
    this.particles.push(this._getParticle({
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
      this.particles.push(this._getParticle({
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

      this.particles.push(this._getParticle({
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
    this.particles.push(this._getParticle({
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
      this.particles.push(this._getParticle({
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
      this.particles.push(this._getParticle({
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
      this.particles.push(this._getParticle({
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
    this.particles.push(this._getParticle({
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

  // ==================== 마시멜로우 녹이기 이펙트 ====================

  /**
   * 🔥 불꽃 이펙트 - 불 세기에 따른 불꽃
   * @param {number} x - 위치 X
   * @param {number} y - 위치 Y
   * @param {number} intensity - 불 세기 (0: 약불, 1: 중불, 2: 강불)
   */
  emitFlame(x, y, intensity = 1) {
    const flameColors = ['#FF6B35', '#FF8C42', '#FFD93D', '#FFF275'];
    const count = 2 + intensity * 2;

    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * (40 + intensity * 20);

      this.particles.push(this._getParticle({
        x: x + offsetX,
        y: y + Math.random() * 10,
        vx: (Math.random() - 0.5) * (1 + intensity),
        vy: -(2 + Math.random() * 3 + intensity * 2),
        gravity: -0.1,
        size: 6 + Math.random() * 6 + intensity * 3,
        sizeDecay: 0.92,
        color: flameColors[Math.floor(Math.random() * flameColors.length)],
        alpha: 0.8,
        alphaDecay: 0.05 + intensity * 0.01,
        shape: 'circle',
        life: 0.6
      }));
    }
  }

  /**
   * 💨 버블 이펙트 - 마시멜로우 녹는 기포
   * @param {number} x - 위치 X
   * @param {number} y - 위치 Y
   * @param {boolean} withCocoa - 코코아가 섞였는지
   */
  emitMeltBubble(x, y, withCocoa = false) {
    const baseColor = withCocoa ? COLORS.cocoa.light : COLORS.marshmallow.cream;

    for (let i = 0; i < 2; i++) {
      const offsetX = (Math.random() - 0.5) * 50;

      this.particles.push(this._getParticle({
        x: x + offsetX,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -1 - Math.random() * 2,
        gravity: -0.05,
        size: 4 + Math.random() * 6,
        sizeDecay: 0.96,
        color: baseColor,
        alpha: 0.7,
        alphaDecay: 0.03,
        shape: 'circle',
        life: 0.8
      }));
    }
  }

  /**
   * ⚡ 들러붙음 경고 이펙트
   * @param {number} x - 위치 X
   * @param {number} y - 위치 Y
   */
  emitStickWarning(x, y) {
    // 연기 효과
    for (let i = 0; i < 5; i++) {
      this.particles.push(this._getParticle({
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 2,
        vy: -2 - Math.random() * 3,
        gravity: -0.02,
        size: 15 + Math.random() * 15,
        sizeDecay: 0.98,
        color: '#555',
        alpha: 0.5,
        alphaDecay: 0.02,
        shape: 'circle',
        life: 1.2
      }));
    }

    // 찌직 스파크
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 4;

      this.particles.push(this._getParticle({
        x: x + (Math.random() - 0.5) * 40,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.2,
        size: 3 + Math.random() * 3,
        sizeDecay: 0.9,
        color: '#FFD93D',
        alpha: 1,
        alphaDecay: 0.08,
        shape: 'sparkle',
        trail: true,
        trailLength: 3,
        life: 0.4
      }));
    }
  }

  /**
   * 🍫 코코아 파우더 투입 이펙트
   * @param {number} x - 위치 X
   * @param {number} y - 위치 Y
   */
  emitCocoaPour(x, y) {
    // 코코아 파우더 입자
    for (let i = 0; i < 25; i++) {
      const offsetX = (Math.random() - 0.5) * 80;

      this.particles.push(this._getParticle({
        x: x + offsetX,
        y: y - 50 - Math.random() * 30,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 3,
        gravity: 0.15,
        size: 2 + Math.random() * 3,
        sizeDecay: 0.99,
        color: Math.random() > 0.3 ? COLORS.cocoa.main : COLORS.cocoa.light,
        alpha: 0.9,
        alphaDecay: 0.015,
        shape: 'circle',
        life: 1.5
      }));
    }

    // 반짝임 효과
    for (let i = 0; i < 5; i++) {
      this.particles.push(this._getParticle({
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 1,
        vy: -1 - Math.random(),
        gravity: 0,
        size: 8 + Math.random() * 6,
        sizeDecay: 0.93,
        color: COLORS.ui.gold,
        alpha: 0.8,
        alphaDecay: 0.04,
        shape: 'sparkle',
        life: 0.8
      }));
    }
  }

  /**
   * 👆 연타 성공 이펙트
   * @param {number} x - 위치 X
   * @param {number} y - 위치 Y
   */
  emitTapSuccess(x, y) {
    // 원형 파장
    this.particles.push(this._getParticle({
      x,
      y,
      size: 20,
      sizeDecay: 1.15, // 커지면서 사라짐
      color: COLORS.ui.green,
      alpha: 0.6,
      alphaDecay: 0.08,
      shape: 'circle',
      life: 0.3
    }));

    // 작은 파티클들
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;

      this.particles.push(this._getParticle({
        x,
        y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        gravity: 0,
        size: 4,
        sizeDecay: 0.9,
        color: COLORS.ui.green,
        alpha: 0.8,
        alphaDecay: 0.06,
        shape: 'circle',
        life: 0.4
      }));
    }
  }

  /**
   * ✨ 퍼펙트 타이밍 이펙트 (코코아 투입 성공)
   * @param {number} x - 위치 X
   * @param {number} y - 위치 Y
   */
  emitPerfectTiming(x, y) {
    // 큰 반짝임
    this.particles.push(this._getParticle({
      x,
      y,
      size: 50,
      sizeDecay: 0.88,
      color: COLORS.ui.gold,
      alpha: 0.9,
      alphaDecay: 0.06,
      shape: 'sparkle',
      life: 0.6
    }));

    // 별 폭발
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 4 + Math.random() * 3;

      this.particles.push(this._getParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.1,
        size: 6 + Math.random() * 4,
        sizeDecay: 0.94,
        color: [COLORS.ui.gold, COLORS.cocoa.light, '#fff'][Math.floor(Math.random() * 3)],
        alpha: 1,
        alphaDecay: 0.03,
        shape: 'star',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        life: 1
      }));
    }
  }

  // ==================== 시간 시스템 파티클 ====================

  /**
   * 🌅 시간대 변경 이펙트 - 그라데이션 전환 느낌
   * @param {number} centerX - 화면 중앙 X
   * @param {number} centerY - 화면 중앙 Y
   * @param {string} fromColor - 이전 시간대 색상
   * @param {string} toColor - 새 시간대 색상
   */
  emitTimePeriodChange(centerX, centerY, fromColor = '#FFD700', toColor = '#FF6B6B') {
    // 화면 전체에 부드러운 파티클 전환
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 200;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      this.particles.push(this._getParticle({
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 2 - 1,
        gravity: -0.02,
        friction: 0.99,
        size: 8 + Math.random() * 12,
        sizeDecay: 0.96,
        color: Math.random() > 0.5 ? fromColor : toColor,
        alpha: 0.7,
        alphaDecay: 0.015,
        shape: 'circle',
        life: 1.5
      }));
    }

    // 중앙 빛 버스트
    this.particles.push(this._getParticle({
      x: centerX,
      y: centerY,
      size: 100,
      sizeDecay: 0.9,
      color: toColor,
      alpha: 0.5,
      alphaDecay: 0.04,
      shape: 'circle',
      life: 0.8
    }));
  }

  /**
   * 🌙 하루 종료 이펙트 - 별과 달 파티클
   * @param {number} width - 화면 너비
   * @param {number} height - 화면 높이
   */
  emitDayEnd(width, height) {
    // 떨어지는 별들
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * width;
      const y = Math.random() * (height / 2);

      this.particles.push(this._getParticle({
        x,
        y,
        vx: (Math.random() - 0.5) * 1,
        vy: Math.random() * 1.5 + 0.5,
        gravity: 0.02,
        friction: 0.995,
        size: 4 + Math.random() * 6,
        sizeDecay: 0.98,
        color: ['#FFD700', '#FFFACD', '#FFF8DC', '#F0E68C'][Math.floor(Math.random() * 4)],
        alpha: 0.8,
        alphaDecay: 0.01,
        shape: 'star',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        trail: true,
        trailLength: 4,
        life: 2
      }));
    }

    // 달 글로우
    this.particles.push(this._getParticle({
      x: width * 0.8,
      y: height * 0.15,
      size: 80,
      sizeDecay: 0.995,
      color: '#FFFACD',
      alpha: 0.4,
      alphaDecay: 0.008,
      shape: 'circle',
      life: 2.5
    }));
  }

  /**
   * ☀️ 새 아침 이펙트 - 햇살 파티클
   * @param {number} width - 화면 너비
   * @param {number} height - 화면 높이
   */
  emitNewDay(width, height) {
    const sunX = width * 0.3;
    const sunY = height * 0.1;

    // 햇살 광선
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const speed = 3 + Math.random() * 2;

      this.particles.push(this._getParticle({
        x: sunX,
        y: sunY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0,
        friction: 0.98,
        size: 15 + Math.random() * 10,
        sizeDecay: 0.97,
        color: ['#FFD700', '#FFA500', '#FF8C00'][Math.floor(Math.random() * 3)],
        alpha: 0.8,
        alphaDecay: 0.02,
        shape: 'line',
        rotation: angle,
        life: 1.2
      }));
    }

    // 떠오르는 빛 입자들
    for (let i = 0; i < 20; i++) {
      this.particles.push(this._getParticle({
        x: Math.random() * width,
        y: height + 20,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 3 - 2,
        gravity: -0.02,
        size: 6 + Math.random() * 8,
        sizeDecay: 0.97,
        color: ['#FFE4B5', '#FFDAB9', '#FFD700'][Math.floor(Math.random() * 3)],
        alpha: 0.6,
        alphaDecay: 0.012,
        shape: 'circle',
        life: 2
      }));
    }
  }

  /**
   * 🎪 이벤트 시작 이펙트 - 화려한 알림
   * @param {number} x - 위치 X
   * @param {number} y - 위치 Y
   */
  emitEventStart(x, y) {
    // 폭죽 같은 효과
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const speed = 5 + Math.random() * 4;

      this.particles.push(this._getParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.15,
        friction: 0.96,
        size: 8 + Math.random() * 6,
        sizeDecay: 0.94,
        color: [COLORS.ui.gold, COLORS.ui.red, COLORS.ui.purple, '#FF69B4'][Math.floor(Math.random() * 4)],
        alpha: 1,
        alphaDecay: 0.025,
        shape: 'star',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.4,
        trail: true,
        trailLength: 3,
        life: 1.2
      }));
    }

    // 중앙 플래시
    this.particles.push(this._getParticle({
      x,
      y,
      size: 60,
      sizeDecay: 0.85,
      color: '#FFFFFF',
      alpha: 0.8,
      alphaDecay: 0.08,
      shape: 'circle',
      life: 0.5
    }));

    // 반짝이는 작은 별들
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 50;

      this.particles.push(this._getParticle({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 4 + Math.random() * 4,
        sizeDecay: 0.95,
        color: COLORS.ui.gold,
        alpha: 1,
        alphaDecay: 0.03,
        shape: 'sparkle',
        life: 0.8
      }));
    }
  }

  /**
   * ⚡ 에너지 변화 이펙트 - 소모/회복 시각화
   * @param {number} x - 에너지 바 위치 X
   * @param {number} y - 에너지 바 위치 Y
   * @param {number} amount - 변화량 (음수면 소모)
   * @param {boolean} isDrain - 소모인지 회복인지
   */
  emitEnergyChange(x, y, amount, isDrain = true) {
    const count = Math.min(Math.abs(amount) / 5, 15);
    const color = isDrain ? '#FF6B6B' : '#4ECDC4';
    const direction = isDrain ? 1 : -1;

    for (let i = 0; i < count; i++) {
      this.particles.push(this._getParticle({
        x: x + Math.random() * 100 - 50,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: direction * (Math.random() * 2 + 1),
        gravity: direction * 0.1,
        friction: 0.97,
        size: 6 + Math.random() * 6,
        sizeDecay: 0.95,
        color,
        alpha: 0.9,
        alphaDecay: 0.03,
        shape: isDrain ? 'circle' : 'sparkle',
        life: 0.8
      }));
    }
  }

  /**
   * ⚠️ 에너지 부족 경고 이펙트 - 깜박이는 경고
   * @param {number} x - 에너지 바 위치 X
   * @param {number} y - 에너지 바 위치 Y
   * @param {number} width - 에너지 바 너비
   */
  emitEnergyWarning(x, y, width) {
    // 경고 펄스
    this.particles.push(this._getParticle({
      x: x + width / 2,
      y,
      size: width,
      sizeDecay: 0.92,
      color: '#FF4444',
      alpha: 0.4,
      alphaDecay: 0.05,
      shape: 'circle',
      life: 0.5
    }));

    // 위험 스파크
    for (let i = 0; i < 8; i++) {
      this.particles.push(this._getParticle({
        x: x + Math.random() * width,
        y: y + Math.random() * 10 - 5,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        gravity: 0.05,
        size: 4 + Math.random() * 4,
        sizeDecay: 0.9,
        color: ['#FF4444', '#FF6B6B', '#FFD700'][Math.floor(Math.random() * 3)],
        alpha: 1,
        alphaDecay: 0.06,
        shape: 'sparkle',
        life: 0.5
      }));
    }
  }
}

// 전역 싱글톤
export const particleSystem = new ParticleSystem();
