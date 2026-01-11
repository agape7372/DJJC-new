/**
 * BakingState - 베이킹 (반죽 성형)
 * 원형 드래그로 반죽을 둥글게 만들고 스와이프로 다음 반죽으로
 *
 * 사운드/파티클 효과 통합
 */

import { BaseState } from './BaseState.js';
import { GameState } from '../core/StateManager.js';
import { soundManager } from '../core/SoundManager.js';
import { particleSystem, COLORS } from '../core/ParticleSystem.js';

export class BakingState extends BaseState {
  constructor(game) {
    super(game);

    this.doughProgress = 0; // 0~100
    this.doughState = 0; // 0: 납작, 1: 울퉁불퉁, 2: 동그란 공
    this.prevDoughState = -1; // 상태 변화 감지용
    this.completedCount = 0;
    this.targetCount = 3;

    this.rotation = 0;
    this.lastDragAngle = 0;
    this.spinSpeed = 0; // 회전 속도 (사운드용)

    this.isComplete = false;
    this.showResult = false;

    // 화면 효과
    this.screenShake = 0;
    this.shakeIntensity = 0;

    // 반죽 애니메이션
    this.doughScale = 1;
    this.doughSquish = { x: 1, y: 1 };
    this.doughBounce = 0;

    // 인트로 애니메이션
    this.showIntro = true;
    this.introTimer = 0;
    this.introDuration = 2.0;

    // 완료 이펙트
    this.completeFlash = 0;
    this.celebrationTimer = 0;

    // 반죽 색상
    this.doughColors = {
      base: '#f5e6d3',
      highlight: 'rgba(255, 255, 255, 0.4)',
      shadow: 'rgba(139, 69, 19, 0.3)',
      complete: '#ffeaa7'
    };

    // 손 위치 가이드
    this.handAngle = 0;
    this.showHandGuide = true;

    // 밀가루 파티클
    this.flourParticles = [];
  }

  enter() {
    this.doughProgress = 0;
    this.doughState = 0;
    this.prevDoughState = -1;
    this.completedCount = 0;
    this.isComplete = false;
    this.showResult = false;
    this.rotation = 0;
    this.lastDragAngle = 0;
    this.spinSpeed = 0;

    this.screenShake = 0;
    this.doughScale = 1;
    this.doughSquish = { x: 1, y: 1 };
    this.doughBounce = 0;

    this.showIntro = true;
    this.introTimer = 0;
    this.completeFlash = 0;
    this.celebrationTimer = 0;
    this.showHandGuide = true;
    this.flourParticles = [];

    this.game.inputManager.onDrag = (pos, dist, angle) => this.handleDrag(pos, dist, angle);
    this.game.inputManager.onSwipe = (dir) => this.handleSwipe(dir);
    this.game.inputManager.onTap = () => this.handleTap();
  }

  exit() {
    this.game.inputManager.onDrag = null;
    this.game.inputManager.onSwipe = null;
    this.game.inputManager.onTap = null;
  }

  handleDrag(pos, dist, angle) {
    if (this.showIntro || this.isComplete || this.showResult) return;

    this.showHandGuide = false;

    // 원형 드래그로 반죽 진행
    const deltaAngle = Math.abs(angle - this.lastDragAngle);
    this.lastDragAngle = angle;

    // 회전 속도 계산
    this.spinSpeed = deltaAngle * 60; // RPM 비슷하게

    const prevProgress = this.doughProgress;
    this.doughProgress = Math.min(100, this.doughProgress + deltaAngle * 12);
    this.rotation += deltaAngle;

    // 반죽 스퀴시 효과
    const squishAmount = Math.min(0.2, deltaAngle * 2);
    this.doughSquish = {
      x: 1 + squishAmount,
      y: 1 - squishAmount * 0.5
    };

    // 사운드 - 회전에 따른 반죽 소리
    if (deltaAngle > 0.02) {
      soundManager.playSpin(this.spinSpeed);

      // 밀가루 파티클
      if (Math.random() < 0.3) {
        this.emitFlour(pos.x, pos.y);
      }
    }

    // 상태 업데이트
    const prevState = this.doughState;
    if (this.doughProgress < 33) {
      this.doughState = 0;
    } else if (this.doughProgress < 66) {
      this.doughState = 1;
    } else {
      this.doughState = 2;
    }

    // 상태 변화 시 효과
    if (this.doughState !== prevState) {
      this.onStateChange(this.doughState);
    }

    // 100% 도달 시
    if (prevProgress < 100 && this.doughProgress >= 100) {
      this.onDoughComplete();
    }
  }

  onStateChange(newState) {
    const centerX = this.config.width / 2;
    const centerY = this.config.height * 0.52;

    // 상태 변화 효과음
    soundManager.playClick(400 + newState * 200, 0.1, 0.3);

    // 스케일 펀치 효과
    this.doughScale = 1.2;

    // 파티클 효과
    particleSystem.emitSparkle(centerX, centerY, 8);

    // 화면 살짝 흔들림
    this.triggerShake(3, 0.1);
  }

  onDoughComplete() {
    const centerX = this.config.width / 2;
    const centerY = this.config.height * 0.52;

    // 완료 효과음
    soundManager.playSuccess();

    // 완료 플래시
    this.completeFlash = 1;

    // 대량 파티클
    particleSystem.emitSparkle(centerX, centerY, 20);
    particleSystem.emitCelebration(centerX, centerY - 50);

    // 화면 흔들림
    this.triggerShake(8, 0.3);

    // 반죽 바운스
    this.doughBounce = 1;
  }

  handleSwipe(direction) {
    if (this.showIntro) {
      this.showIntro = false;
      soundManager.playUIClick();
      return;
    }

    if (this.showResult) return;

    // 완성된 반죽만 스와이프 가능
    if (this.doughProgress >= 100 && !this.isComplete) {
      this.completeDough();
    }
  }

  handleTap() {
    if (this.showIntro) {
      this.showIntro = false;
      soundManager.playUIClick();
      return;
    }

    if (this.showResult) {
      soundManager.playUIClick();
      this.game.stateManager.changeState(GameState.DECO);
    }
  }

  completeDough() {
    this.completedCount++;

    // 스와이프 효과음
    soundManager.playSlice();

    // 반죽 날아가는 효과
    const centerX = this.config.width / 2;
    const centerY = this.config.height * 0.52;
    particleSystem.emitSlice(centerX, centerY, 0);

    // 점수 반영
    const bonus = Math.floor(this.doughProgress / 10);
    this.game.cookieStats.texture += bonus;

    if (this.completedCount >= this.targetCount) {
      this.isComplete = true;

      // 팡파레!
      setTimeout(() => {
        soundManager.playFanfare();
        this.showResult = true;
        this.celebrationTimer = 2;

        // 대규모 축하 파티클
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            particleSystem.emitCelebration(
              this.config.width * 0.3 + Math.random() * this.config.width * 0.4,
              this.config.height * 0.4
            );
          }, i * 200);
        }
      }, 300);
    } else {
      // 다음 반죽
      this.doughProgress = 0;
      this.doughState = 0;
      this.prevDoughState = -1;
      this.lastDragAngle = 0;
      this.rotation = 0;
      this.showHandGuide = true;
    }
  }

  triggerShake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.screenShake = duration;
  }

  emitFlour(x, y) {
    // 밀가루 입자 생성
    for (let i = 0; i < 3; i++) {
      this.flourParticles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 50,
        vy: -Math.random() * 30 - 10,
        life: 1,
        size: Math.random() * 3 + 1
      });
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

    // 반죽 진행도 자연 감소
    if (!this.game.inputManager.isDragging && this.doughProgress > 0 && !this.isComplete) {
      this.doughProgress = Math.max(0, this.doughProgress - dt * 5);

      // 상태 업데이트
      if (this.doughProgress < 33) {
        this.doughState = 0;
      } else if (this.doughProgress < 66) {
        this.doughState = 1;
      }
    }

    // 회전 속도 감소
    this.spinSpeed *= 0.95;

    // 스퀴시 복원
    this.doughSquish.x += (1 - this.doughSquish.x) * 0.1;
    this.doughSquish.y += (1 - this.doughSquish.y) * 0.1;

    // 스케일 복원
    this.doughScale += (1 - this.doughScale) * 0.15;

    // 바운스 감소
    if (this.doughBounce > 0) {
      this.doughBounce -= dt * 3;
    }

    // 플래시 감소
    if (this.completeFlash > 0) {
      this.completeFlash -= dt * 3;
    }

    // 화면 흔들림 감소
    if (this.screenShake > 0) {
      this.screenShake -= dt;
    }

    // 축하 타이머
    if (this.celebrationTimer > 0) {
      this.celebrationTimer -= dt;
    }

    // 밀가루 파티클 업데이트
    this.flourParticles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 50 * dt; // 중력
      p.life -= dt * 2;
    });
    this.flourParticles = this.flourParticles.filter(p => p.life > 0);

    // 손 가이드 애니메이션
    this.handAngle += dt * 2;
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

    // 도마
    this.renderCuttingBoard(ctx);

    // 밀가루 파티클
    this.renderFlourParticles(ctx);

    // UI
    this.renderUI(ctx);

    // 반죽
    this.renderDough(ctx);

    // 안내
    if (!this.showIntro) {
      this.renderGuide(ctx);
    }

    // 완료 플래시
    if (this.completeFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.completeFlash * 0.5})`;
      ctx.fillRect(0, 0, this.config.width, this.config.height);
    }

    ctx.restore();

    // 인트로 (흔들림 영향 X)
    if (this.showIntro) {
      this.renderIntro(ctx);
    }

    // 결과
    if (this.showResult) {
      this.renderResult(ctx);
    }
  }

  renderBackground(ctx) {
    // 따뜻한 그라데이션 배경
    const gradient = ctx.createLinearGradient(0, 0, 0, this.config.height);
    gradient.addColorStop(0, '#4a2c2a');
    gradient.addColorStop(0.5, '#3d2314');
    gradient.addColorStop(1, '#2c1810');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    // 조명 효과 (상단에서 비추는 느낌)
    const lightGradient = ctx.createRadialGradient(
      this.config.width / 2, 100, 0,
      this.config.width / 2, 100, 400
    );
    lightGradient.addColorStop(0, 'rgba(255, 200, 150, 0.15)');
    lightGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = lightGradient;
    ctx.fillRect(0, 0, this.config.width, this.config.height);
  }

  renderCuttingBoard(ctx) {
    const boardX = 30;
    const boardY = this.config.height * 0.3;
    const boardW = this.config.width - 60;
    const boardH = this.config.height * 0.45;

    // 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(boardX + 5, boardY + 8, boardW, boardH, 10);
    ctx.fill();

    // 나무 도마 (그라데이션)
    const boardGradient = ctx.createLinearGradient(boardX, boardY, boardX, boardY + boardH);
    boardGradient.addColorStop(0, '#c9a66b');
    boardGradient.addColorStop(0.5, '#a67c52');
    boardGradient.addColorStop(1, '#8b5a2b');
    ctx.fillStyle = boardGradient;
    ctx.beginPath();
    ctx.roundRect(boardX, boardY, boardW, boardH, 10);
    ctx.fill();

    // 테두리
    ctx.strokeStyle = '#6b4226';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(boardX, boardY, boardW, boardH, 10);
    ctx.stroke();

    // 나무 결
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 15; i++) {
      const y = boardY + 20 + i * (boardH - 40) / 15;
      ctx.beginPath();
      ctx.moveTo(boardX + 10, y);
      // 살짝 구불구불한 선
      for (let x = boardX + 10; x < boardX + boardW - 10; x += 20) {
        ctx.lineTo(x + 20, y + (Math.sin(x * 0.05 + i) * 2));
      }
      ctx.stroke();
    }

    // 밀가루 흔적
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 20; i++) {
      const x = boardX + 30 + Math.random() * (boardW - 60);
      const y = boardY + 30 + Math.random() * (boardH - 60);
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 15 + 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderFlourParticles(ctx) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.flourParticles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
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

    // 글로우 효과
    ctx.shadowColor = '#f39c12';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#f39c12';
    ctx.fillText('🍞 반죽 성형', this.config.width / 2, 42);
    ctx.shadowBlur = 0;

    // 카운터 (완료된 반죽 수)
    const counterY = 75;
    ctx.font = '18px DungGeunMo, sans-serif';
    ctx.fillStyle = '#fff';

    for (let i = 0; i < this.targetCount; i++) {
      const x = this.config.width / 2 + (i - 1) * 50;
      if (i < this.completedCount) {
        // 완료된 반죽
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(x, counterY, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '14px DungGeunMo, sans-serif';
        ctx.fillText('✓', x, counterY + 5);
      } else if (i === this.completedCount) {
        // 현재 반죽
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, counterY, 15, 0, Math.PI * 2);
        ctx.stroke();

        // 진행도 원형
        const progress = this.doughProgress / 100;
        ctx.strokeStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(x, counterY, 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.stroke();
      } else {
        // 대기 중
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, counterY, 15, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 진행 바 (하단)
    const barWidth = 280;
    const barX = (this.config.width - barWidth) / 2;
    const barY = 105;
    const barHeight = 12;

    // 바 배경
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 6);
    ctx.fill();

    // 진행도
    const progressGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    if (this.doughProgress >= 100) {
      progressGradient.addColorStop(0, '#2ecc71');
      progressGradient.addColorStop(1, '#27ae60');
    } else {
      progressGradient.addColorStop(0, '#f39c12');
      progressGradient.addColorStop(1, '#e67e22');
    }
    ctx.fillStyle = progressGradient;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * (this.doughProgress / 100), barHeight, 6);
    ctx.fill();

    // 바 테두리
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 6);
    ctx.stroke();
  }

  renderDough(ctx) {
    const centerX = this.config.width / 2;
    const centerY = this.config.height * 0.52;

    // 바운스 오프셋
    const bounceOffset = Math.sin(this.doughBounce * Math.PI * 4) * this.doughBounce * 10;

    ctx.save();
    ctx.translate(centerX, centerY - bounceOffset);
    ctx.rotate(this.rotation);
    ctx.scale(this.doughScale * this.doughSquish.x, this.doughScale * this.doughSquish.y);

    // 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    if (this.doughState === 0) {
      ctx.ellipse(5, 10, 82, 32, 0, 0, Math.PI * 2);
    } else if (this.doughState === 1) {
      ctx.ellipse(5, 10, 55, 40, 0, 0, Math.PI * 2);
    } else {
      ctx.arc(5, 10, 62, 0, Math.PI * 2);
    }
    ctx.fill();

    // 반죽 본체
    const doughGradient = ctx.createRadialGradient(-20, -20, 0, 0, 0, 80);

    if (this.doughProgress >= 100) {
      // 완성 시 황금빛
      doughGradient.addColorStop(0, '#fff8e7');
      doughGradient.addColorStop(0.7, '#ffeaa7');
      doughGradient.addColorStop(1, '#daa520');
    } else {
      doughGradient.addColorStop(0, '#fff8f0');
      doughGradient.addColorStop(0.7, '#f5e6d3');
      doughGradient.addColorStop(1, '#d4a574');
    }
    ctx.fillStyle = doughGradient;

    if (this.doughState === 0) {
      // 납작한 반죽
      ctx.beginPath();
      ctx.ellipse(0, 0, 80, 30, 0, 0, Math.PI * 2);
      ctx.fill();

      // 불규칙한 가장자리
      ctx.strokeStyle = 'rgba(139, 69, 19, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

    } else if (this.doughState === 1) {
      // 울퉁불퉁
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const noise = Math.sin(i * 2.5 + this.rotation * 2) * 12;
        const radius = 50 + noise;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.75;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // 울퉁불퉁 디테일
      ctx.fillStyle = 'rgba(139, 69, 19, 0.15)';
      for (let i = 0; i < 5; i++) {
        const bumpAngle = (i / 5) * Math.PI * 2 + this.rotation;
        const bumpX = Math.cos(bumpAngle) * 25;
        const bumpY = Math.sin(bumpAngle) * 20;
        ctx.beginPath();
        ctx.arc(bumpX, bumpY, 12, 0, Math.PI * 2);
        ctx.fill();
      }

    } else {
      // 완벽한 구
      ctx.beginPath();
      ctx.arc(0, 0, 60, 0, Math.PI * 2);
      ctx.fill();

      // 하이라이트
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.ellipse(-18, -18, 22, 18, -0.5, 0, Math.PI * 2);
      ctx.fill();

      // 부드러운 음영
      ctx.fillStyle = 'rgba(139, 69, 19, 0.15)';
      ctx.beginPath();
      ctx.ellipse(15, 20, 30, 25, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // 완료 표시
    if (this.doughProgress >= 100 && !this.isComplete) {
      // 글로우 효과
      ctx.shadowColor = '#2ecc71';
      ctx.shadowBlur = 20;

      ctx.font = 'bold 28px DungGeunMo, sans-serif';
      ctx.fillStyle = '#2ecc71';
      ctx.textAlign = 'center';
      ctx.fillText('✨ 완성! ✨', centerX, centerY + 110);

      ctx.shadowBlur = 0;

      ctx.font = '16px DungGeunMo, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('↓ 스와이프하여 다음 ↓', centerX, centerY + 140);
    }
  }

  renderGuide(ctx) {
    if (this.doughProgress >= 100 || this.isComplete || !this.showHandGuide) return;

    const centerX = this.config.width / 2;
    const centerY = this.config.height * 0.52;

    // 원형 가이드
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 움직이는 손 아이콘
    const handX = centerX + Math.cos(this.handAngle) * 100;
    const handY = centerY + Math.sin(this.handAngle) * 100;

    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👆', handX, handY);

    // 화살표 가이드
    ctx.font = '14px DungGeunMo, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('↻ 원을 그리며 반죽하세요', centerX, this.config.height - 60);
  }

  renderIntro(ctx) {
    const progress = Math.min(1, this.introTimer / this.introDuration);

    // 어두운 오버레이 (페이드아웃)
    const overlayAlpha = 1 - progress;
    ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha * 0.7})`;
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    // 중앙 텍스트 (슬라이드 인)
    const slideOffset = (1 - progress) * 50;

    ctx.save();
    ctx.translate(0, slideOffset);

    // 단계 표시
    ctx.font = 'bold 20px DungGeunMo, sans-serif';
    ctx.fillStyle = '#f39c12';
    ctx.textAlign = 'center';
    ctx.fillText('STEP 4', this.config.width / 2, this.config.height * 0.35);

    // 제목
    ctx.font = 'bold 36px DungGeunMo, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('반죽 성형', this.config.width / 2, this.config.height * 0.43);

    // 설명
    ctx.font = '16px DungGeunMo, sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('원을 그리며 반죽을 동그랗게!', this.config.width / 2, this.config.height * 0.52);

    // 반죽 이모지 애니메이션
    const emojiScale = 1 + Math.sin(this.introTimer * 5) * 0.1;
    ctx.font = `${60 * emojiScale}px sans-serif`;
    ctx.fillText('🍞', this.config.width / 2, this.config.height * 0.68);

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

  renderResult(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    const boxWidth = 320;
    const boxHeight = 280;
    const boxX = (this.config.width - boxWidth) / 2;
    const boxY = (this.config.height - boxHeight) / 2;

    // 결과 박스 배경
    const boxGradient = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxHeight);
    boxGradient.addColorStop(0, '#2d3436');
    boxGradient.addColorStop(1, '#1e272e');
    ctx.fillStyle = boxGradient;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
    ctx.fill();

    // 박스 테두리 (글로우)
    ctx.shadowColor = '#f39c12';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 완료 아이콘
    ctx.font = '50px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🍪', this.config.width / 2, boxY + 60);

    // 제목
    ctx.font = 'bold 28px DungGeunMo, sans-serif';
    ctx.fillStyle = '#f39c12';
    ctx.fillText('베이킹 완료!', this.config.width / 2, boxY + 110);

    // 완성 개수
    ctx.font = '22px DungGeunMo, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${this.completedCount}개 반죽 완성!`, this.config.width / 2, boxY + 155);

    // 점수
    const textureBonus = this.game.cookieStats.texture;
    ctx.font = '18px DungGeunMo, sans-serif';
    ctx.fillStyle = '#2ecc71';
    ctx.fillText(`식감 +${textureBonus}`, this.config.width / 2, boxY + 195);

    // 다음 단계 안내
    const blinkAlpha = 0.5 + Math.sin(Date.now() * 0.008) * 0.3;
    ctx.font = '16px DungGeunMo, sans-serif';
    ctx.fillStyle = `rgba(255, 255, 255, ${blinkAlpha})`;
    ctx.fillText('터치하여 데코레이션으로 →', this.config.width / 2, boxY + 250);
  }
}
