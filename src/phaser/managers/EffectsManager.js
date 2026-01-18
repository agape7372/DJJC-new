/**
 * EffectsManager - 게임 연출 효과 유틸리티
 * Juiciness: 타격감, 생동감, 피드백을 담당
 *
 * 핵심 기법:
 * 1. Squash & Stretch - 젤리 같은 탄성 애니메이션
 * 2. Particle Explosions - 파티클 이펙트
 * 3. Camera Effects - 화면 흔들림, 플래시, 줌
 */

import { FONT_FAMILY } from '../config/GameConfig.js';

// 이펙트 색상 팔레트
export const FX_COLORS = {
  gold: [0xFFD700, 0xFFA500, 0xFFE135],
  success: [0x4CAF50, 0x8BC34A, 0xCDDC39],
  love: [0xFF6B6B, 0xFF8E8E, 0xFFB3B3],
  magic: [0x9C27B0, 0xE91E63, 0x673AB7],
  dust: [0xD4A574, 0xC9A86C, 0xE8C99B],
  chocolate: [0x4A3728, 0x5D4037, 0x6D4C41],
  pistachio: [0x7CB342, 0x8BC34A, 0x9CCC65],
  cream: [0xFFF5EE, 0xFFE4E1, 0xFFFAFA],
  sparkle: [0xFFFFFF, 0xFFF8DC, 0xFFFFE0]
};

export class EffectsManager {
  constructor(scene) {
    this.scene = scene;
    this.emitters = {};

    // [Fix] 추적용 배열들
    this._activeParticles = [];  // 활성 파티클 시스템 추적
    this._hoverTargets = [];     // 호버 효과가 적용된 타겟 추적
    this._delayedCalls = [];     // delayedCall 추적

    // 파티클 텍스처 생성
    this._createParticleTextures();
  }

  // ========================================
  // 파티클 텍스처 생성
  // ========================================

  _createParticleTextures() {
    const scene = this.scene;

    // 원형 파티클
    if (!scene.textures.exists('particle_circle')) {
      const circleGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
      circleGraphics.fillStyle(0xFFFFFF);
      circleGraphics.fillCircle(8, 8, 8);
      circleGraphics.generateTexture('particle_circle', 16, 16);
      circleGraphics.destroy();
    }

    // 하트 파티클
    if (!scene.textures.exists('particle_heart')) {
      const heartGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
      heartGraphics.fillStyle(0xFFFFFF);
      // 하트 모양 그리기
      heartGraphics.fillCircle(6, 6, 5);
      heartGraphics.fillCircle(14, 6, 5);
      heartGraphics.fillTriangle(1, 8, 10, 18, 19, 8);
      heartGraphics.generateTexture('particle_heart', 20, 20);
      heartGraphics.destroy();
    }

    // 별 파티클
    if (!scene.textures.exists('particle_star')) {
      const starGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
      starGraphics.fillStyle(0xFFFFFF);
      // 별 모양 (간단한 다이아몬드)
      starGraphics.fillTriangle(8, 0, 0, 8, 8, 16);
      starGraphics.fillTriangle(8, 0, 16, 8, 8, 16);
      starGraphics.generateTexture('particle_star', 16, 16);
      starGraphics.destroy();
    }

    // 먼지/가루 파티클
    if (!scene.textures.exists('particle_dust')) {
      const dustGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
      dustGraphics.fillStyle(0xFFFFFF);
      dustGraphics.fillCircle(3, 3, 3);
      dustGraphics.generateTexture('particle_dust', 6, 6);
      dustGraphics.destroy();
    }
  }

  // ========================================
  // SQUASH & STRETCH (탄성 애니메이션)
  // ========================================

  /**
   * 버튼 누르기 효과 (찌그러졌다 펴짐)
   */
  buttonPress(target, callback = null) {
    this.scene.tweens.add({
      targets: target,
      scaleX: 0.85,
      scaleY: 1.15,
      duration: 50,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        this.scene.tweens.add({
          targets: target,
          scaleX: 1.05,
          scaleY: 0.95,
          duration: 50,
          ease: 'Power2',
          yoyo: true,
          onComplete: callback
        });
      }
    });
  }

  /**
   * 아이템 집기 효과 (살짝 커졌다 원래대로)
   */
  pickUp(target) {
    this.scene.tweens.add({
      targets: target,
      scaleX: 1.2,
      scaleY: 0.8,
      duration: 80,
      ease: 'Back.easeOut',
      yoyo: true
    });
  }

  /**
   * 아이템 놓기 효과 (바운스)
   */
  drop(target) {
    this.scene.tweens.add({
      targets: target,
      scaleX: 0.8,
      scaleY: 1.3,
      duration: 60,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        this.scene.tweens.add({
          targets: target,
          scaleX: 1.1,
          scaleY: 0.9,
          duration: 80,
          ease: 'Power2',
          yoyo: true
        });
      }
    });
  }

  /**
   * 등장 바운스 (팝인)
   */
  popIn(target, delay = 0, scale = 1) {
    target.setScale(0);
    return this.scene.tweens.add({
      targets: target,
      scale: scale,
      duration: 300,
      delay: delay,
      ease: 'Back.easeOut'
    });
  }

  /**
   * 사라짐 바운스 (팝아웃)
   */
  popOut(target, callback = null) {
    return this.scene.tweens.add({
      targets: target,
      scale: 0,
      duration: 200,
      ease: 'Back.easeIn',
      onComplete: callback
    });
  }

  /**
   * 펄스 효과 (주기적으로 커졌다 작아짐)
   */
  pulse(target, intensity = 0.1, duration = 500) {
    return this.scene.tweens.add({
      targets: target,
      scaleX: { from: 1 - intensity, to: 1 + intensity },
      scaleY: { from: 1 + intensity, to: 1 - intensity },
      duration: duration,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  /**
   * 젤리 흔들림 (좌우)
   */
  jelly(target, intensity = 10) {
    return this.scene.tweens.add({
      targets: target,
      x: { from: target.x - intensity, to: target.x + intensity },
      scaleX: { from: 0.95, to: 1.05 },
      duration: 50,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 2
    });
  }

  /**
   * 오브젝트 흔들기 (에러 피드백)
   */
  shakeObject(target, intensity = 5) {
    const originalX = target.x;
    return this.scene.tweens.add({
      targets: target,
      x: [originalX - intensity, originalX + intensity, originalX - intensity * 0.5, originalX + intensity * 0.5, originalX],
      duration: 300,
      ease: 'Power2'
    });
  }

  /**
   * 점프 효과
   */
  jump(target, height = 30) {
    const originalY = target.y;
    return this.scene.tweens.add({
      targets: target,
      y: originalY - height,
      scaleX: 0.9,
      scaleY: 1.1,
      duration: 150,
      ease: 'Power2.easeOut',
      yoyo: true,
      onComplete: () => {
        this.drop(target);
      }
    });
  }

  // ========================================
  // PARTICLE EXPLOSIONS (파티클 이펙트)
  // ========================================

  /**
   * 재료 드롭 시 튀는 효과
   */
  ingredientSplash(x, y, colorPalette = 'dust') {
    const colors = FX_COLORS[colorPalette] || FX_COLORS.dust;

    // 메인 스플래시
    const particles = this.scene.add.particles(x, y, 'particle_dust', {
      speed: { min: 80, max: 180 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      gravityY: 200,
      tint: colors,
      quantity: 12,
      emitting: false
    });

    particles.explode();
    this._scheduleParticleCleanup(particles, 500);

    // 작은 먼지 추가
    const dustParticles = this.scene.add.particles(x, y, 'particle_circle', {
      speed: { min: 30, max: 80 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 600,
      gravityY: 50,
      tint: colors[0],
      quantity: 6,
      emitting: false
    });

    dustParticles.explode();
    this._scheduleParticleCleanup(dustParticles, 700);
  }

  /**
   * 하트 파티클 (손님 만족)
   */
  heartBurst(x, y, count = 8) {
    const colors = FX_COLORS.love;

    const particles = this.scene.add.particles(x, y, 'particle_heart', {
      speed: { min: 100, max: 200 },
      angle: { min: 220, max: 320 },
      scale: { start: 0.8, end: 0.2 },
      alpha: { start: 1, end: 0 },
      lifespan: 800,
      gravityY: -50,
      tint: colors,
      quantity: count,
      rotate: { min: -30, max: 30 },
      emitting: false
    });

    particles.explode();
    this._scheduleParticleCleanup(particles, 1000);
  }

  /**
   * 별 파티클 (성공/완성)
   */
  starBurst(x, y, count = 15) {
    const colors = FX_COLORS.gold;

    const particles = this.scene.add.particles(x, y, 'particle_star', {
      speed: { min: 150, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      rotate: { min: 0, max: 360 },
      tint: colors,
      quantity: count,
      emitting: false
    });

    particles.explode();
    this._scheduleParticleCleanup(particles, 800);
  }

  /**
   * 코인 획득 효과
   */
  coinShower(x, y, amount = 10) {
    const colors = FX_COLORS.gold;

    for (let i = 0; i < amount; i++) {
      const coin = this.scene.add.circle(
        x + Phaser.Math.Between(-30, 30),
        y,
        Phaser.Math.Between(4, 8),
        colors[i % colors.length]
      );
      coin.setStrokeStyle(1, 0xB8860B);

      this.scene.tweens.add({
        targets: coin,
        y: y - Phaser.Math.Between(60, 120),
        x: coin.x + Phaser.Math.Between(-50, 50),
        alpha: 0,
        scale: 0,
        duration: 600,
        delay: i * 30,
        ease: 'Power2.easeOut',
        onComplete: () => coin.destroy()
      });
    }
  }

  /**
   * 마법 스파클 (특별한 순간)
   */
  sparkle(x, y, duration = 1000) {
    const colors = FX_COLORS.sparkle;

    const particles = this.scene.add.particles(x, y, 'particle_circle', {
      speed: { min: 20, max: 60 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      frequency: 50,
      tint: colors,
      blendMode: 'ADD'
    });

    this._activeParticles.push(particles);
    this._trackedDelayedCall(duration, () => {
      particles.stop();
      this._scheduleParticleCleanup(particles, 500);
    });

    return particles;
  }

  /**
   * 폭발 링 효과
   */
  explosionRing(x, y, color = 0xFFD700) {
    const ring = this.scene.add.circle(x, y, 10, color, 0);
    ring.setStrokeStyle(4, color);

    this.scene.tweens.add({
      targets: ring,
      radius: 80,
      alpha: 0,
      duration: 300,
      ease: 'Power2.easeOut',
      onUpdate: () => {
        ring.setStrokeStyle(4 * (1 - ring.alpha), color);
      },
      onComplete: () => ring.destroy()
    });
  }

  /**
   * 텍스트 팝업 (점수, 보너스 등)
   */
  floatingText(x, y, text, color = '#FFD700', size = 24) {
    const floatText = this.scene.add.text(x, y, text, {
      fontFamily: FONT_FAMILY,
      fontSize: `${size}px`,
      color: color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    floatText.setDepth(1000);

    // 팝인
    floatText.setScale(0);
    this.scene.tweens.add({
      targets: floatText,
      scale: 1.2,
      duration: 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: floatText,
          scale: 1,
          duration: 100,
          ease: 'Power2'
        });
      }
    });

    // 위로 떠오르며 사라짐
    this.scene.tweens.add({
      targets: floatText,
      y: y - 80,
      alpha: 0,
      duration: 1000,
      delay: 300,
      ease: 'Power2.easeOut',
      onComplete: () => floatText.destroy()
    });

    return floatText;
  }

  // ========================================
  // CAMERA EFFECTS (카메라 효과)
  // ========================================

  /**
   * 미세한 흔들림 (타격감)
   */
  microShake(intensity = 0.005, duration = 100) {
    this.scene.cameras.main.shake(duration, intensity);
  }

  /**
   * 중간 흔들림 (충격)
   */
  mediumShake(intensity = 0.01, duration = 150) {
    this.scene.cameras.main.shake(duration, intensity);
  }

  /**
   * 큰 흔들림 (대충격)
   */
  bigShake(intensity = 0.02, duration = 200) {
    this.scene.cameras.main.shake(duration, intensity);
  }

  /**
   * 성공 플래시 (녹색)
   */
  successFlash(duration = 100) {
    this.scene.cameras.main.flash(duration, 100, 200, 100, false);
  }

  /**
   * 획득 플래시 (골드)
   */
  goldFlash(duration = 100) {
    this.scene.cameras.main.flash(duration, 255, 215, 0, false);
  }

  /**
   * 실패 플래시 (빨강)
   */
  failFlash(duration = 100) {
    this.scene.cameras.main.flash(duration, 255, 100, 100, false);
  }

  /**
   * 줌 펀치 (줌인 후 빠르게 복귀)
   */
  zoomPunch(intensity = 0.05, duration = 100) {
    const camera = this.scene.cameras.main;
    const originalZoom = camera.zoom;

    this.scene.tweens.add({
      targets: camera,
      zoom: originalZoom + intensity,
      duration: duration * 0.3,
      ease: 'Power2.easeOut',
      yoyo: true,
      onComplete: () => {
        camera.zoom = originalZoom;
      }
    });
  }

  /**
   * 슬로우모션 효과
   */
  slowMotion(duration = 500, timeScale = 0.3) {
    this.scene.time.timeScale = timeScale;

    this._trackedDelayedCall(duration * timeScale, () => {
      if (this.scene && this.scene.tweens) {
        this.scene.tweens.add({
          targets: this.scene.time,
          timeScale: 1,
          duration: 200,
          ease: 'Power2'
        });
      }
    });
  }

  // ========================================
  // COMBO EFFECTS (콤보/연출)
  // ========================================

  /**
   * 콤보 달성 효과
   */
  comboHit(x, y, comboCount) {
    // 줌 펀치
    this.zoomPunch(0.03);

    // 흔들림
    this.microShake(0.008);

    // 폭발 링
    this.explosionRing(x, y, 0xFFD700);

    // 콤보 텍스트
    const size = Math.min(32, 20 + comboCount * 2);
    this.floatingText(x, y - 30, `${comboCount} COMBO!`, '#FFD700', size);

    // 별 파티클
    this.starBurst(x, y, Math.min(20, 5 + comboCount * 2));
  }

  /**
   * 돈 획득 효과
   */
  moneyGain(x, y, amount) {
    // 플래시
    this.goldFlash(80);

    // 흔들림
    this.microShake(0.005);

    // 코인 샤워
    this.coinShower(x, y, Math.min(15, Math.ceil(amount / 100)));

    // 금액 텍스트
    this.floatingText(x, y, `+${amount}G`, '#FFD700', 28);
  }

  /**
   * 완성 축하 효과
   */
  celebrate(x, y) {
    // 큰 흔들림
    this.mediumShake(0.015);

    // 성공 플래시
    this.successFlash(150);

    // 별 폭발
    this.starBurst(x, y, 25);

    // 스파클
    this.sparkle(x, y, 1500);

    // 폭발 링 여러 개
    const colors = [0xFFD700, 0x4CAF50, 0xFF6B6B];
    for (let i = 0; i < 3; i++) {
      this._trackedDelayedCall(i * 100, () => {
        this.explosionRing(x, y, colors[i]);
      });
    }
  }

  /**
   * 실패 효과
   */
  fail(x, y) {
    // 흔들림
    this.bigShake(0.02);

    // 빨간 플래시
    this.failFlash(150);

    // X 표시 텍스트
    this.floatingText(x, y, 'X', '#FF6B6B', 48);
  }

  /**
   * 손님 만족 효과
   */
  customerHappy(x, y) {
    // 하트 버스트
    this.heartBurst(x, y, 10);

    // 작은 흔들림
    this.microShake(0.003);

    // 스파클
    this.sparkle(x, y, 800);
  }

  /**
   * 손님 불만족 효과
   */
  customerAngry(x, y) {
    // 흔들림
    this.mediumShake(0.012);

    // 빨간 플래시
    this.failFlash(100);

    // 연기 같은 효과
    const particles = this.scene.add.particles(x, y, 'particle_circle', {
      speed: { min: 30, max: 80 },
      angle: { min: 240, max: 300 },
      scale: { start: 0.8, end: 0.2 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 500,
      tint: [0x666666, 0x888888],
      quantity: 8,
      emitting: false
    });

    particles.explode();
    this._scheduleParticleCleanup(particles, 600);
  }

  // ========================================
  // 유틸리티
  // ========================================

  /**
   * 오브젝트에 호버 효과 추가
   * [Fix] 리스너 추적하여 나중에 제거 가능하게
   */
  addHoverEffect(target, scaleUp = 1.1) {
    const originalScale = target.scale;

    const onOver = () => {
      this.scene.tweens.add({
        targets: target,
        scale: originalScale * scaleUp,
        duration: 100,
        ease: 'Back.easeOut'
      });
    };

    const onOut = () => {
      this.scene.tweens.add({
        targets: target,
        scale: originalScale,
        duration: 100,
        ease: 'Power2'
      });
    };

    target.on('pointerover', onOver);
    target.on('pointerout', onOut);

    // [Fix] 추적 저장
    this._hoverTargets.push({ target, onOver, onOut });
  }

  /**
   * 오브젝트에 클릭 효과 추가
   */
  addClickEffect(target, callback = null) {
    target.on('pointerdown', () => {
      this.buttonPress(target, callback);
    });
  }

  /**
   * delayedCall을 추적하며 생성 (DRY)
   */
  _trackedDelayedCall(delay, callback) {
    if (!this.scene?.time) return null;

    const timer = this.scene.time.delayedCall(delay, () => {
      this._removeFromArray(this._delayedCalls, timer);
      callback();
    });
    this._delayedCalls.push(timer);
    return timer;
  }

  /**
   * 파티클 생성 후 자동 정리 예약 (DRY)
   */
  _scheduleParticleCleanup(particles, delay) {
    this._activeParticles.push(particles);
    this._trackedDelayedCall(delay, () => {
      this._removeFromArray(this._activeParticles, particles);
      particles?.destroy?.();
    });
  }

  /**
   * 배열에서 요소 제거 헬퍼 (DRY)
   */
  _removeFromArray(arr, item) {
    const idx = arr.indexOf(item);
    if (idx > -1) arr.splice(idx, 1);
  }

  /**
   * 정리 - Scene 종료 또는 sleep 시 호출
   * [Fix] 모든 추적된 리소스 정리
   */
  destroy() {
    // 1. 호버 타겟 리스너 제거
    this._hoverTargets.forEach(({ target, onOver, onOut }) => {
      if (target && target.off) {
        target.off('pointerover', onOver);
        target.off('pointerout', onOut);
      }
    });
    this._hoverTargets = [];

    // 2. 활성 파티클 정리
    this._activeParticles.forEach(particles => {
      if (particles && particles.destroy) {
        particles.destroy();
      }
    });
    this._activeParticles = [];

    // 3. 대기 중인 delayedCall 취소
    this._delayedCalls.forEach(timer => {
      if (timer && timer.remove) {
        timer.remove(false);
      }
    });
    this._delayedCalls = [];

    // 4. 기존 emitters 정리
    Object.values(this.emitters).forEach(emitter => {
      if (emitter && emitter.destroy) {
        emitter.destroy();
      }
    });
    this.emitters = {};

    // 5. Scene 참조 해제
    this.scene = null;
  }
}

export default EffectsManager;
