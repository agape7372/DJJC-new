/**
 * PrepState - 재료 준비 단계 (고품질 리팩토링)
 * 3가지 미니게임: 카다이프 썰기, 피스타치오 분쇄, 마시멜로우 반죽
 *
 * 사운드 + 파티클 + 키치한 비주얼 적용
 */

import { BaseState } from './BaseState.js';
import { GameState } from '../core/StateManager.js';
import { COLORS } from '../core/ParticleSystem.js';
import { recipeManager } from '../core/RecipeManager.js';

export class PrepState extends BaseState {
  constructor(game) {
    super(game);

    // 미니게임 단계
    this.phase = 0; // 0: 카다이프, 1: 피스타치오, 2: 마시멜로우
    this.phaseNames = ['카다이프 썰기', '피스타치오 분쇄', '마시멜로우 반죽'];
    this.phaseIcons = ['🥖', '🥜', '🍡'];
    this.phaseDescriptions = [
      '날아오는 카다이프를 스와이프로 썰어라!',
      '피스타치오를 터치해서 으깨라!',
      '원을 그려 반죽을 쫀득하게!'
    ];

    // 공통 게임 상태
    this.score = 0;
    this.timeLeft = 30;
    this.isPlaying = false;
    this.showResult = false;
    this.showIntro = true;
    this.introTimer = 0;

    // 콤보 시스템
    this.combo = 0;
    this.maxCombo = 0;
    this.lastHitTime = 0;
    this.comboTimeout = 1000; // 1초 내 연속 히트

    // 스크린 셰이크
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;

    // 카다이프 게임
    this.kadaifs = [];
    this.sliceTrail = [];
    this.slicedPieces = []; // 잘린 조각들

    // 피스타치오 게임
    this.pistachios = [];
    this.feverGauge = 0;
    this.isFever = false;
    this.feverTimer = 0;

    // 마시멜로우 게임
    this.rpm = 0;
    this.targetRpm = 70;
    this.perfectZone = { min: 60, max: 80 };
    this.isOverheated = false;
    this.overheatedTimer = 0;
    this.doughPhase = 0; // 반죽 상태 0~1
    this.spinAngle = 0;
  }

  enter() {
    this.phase = 0;
    this.showIntro = true;
    this.introTimer = 0;

    this.game.inputManager.onTap = (pos) => this.handleTap(pos);
    this.game.inputManager.onDrag = (pos, dist, angle) => this.handleDrag(pos, dist, angle);
    this.game.inputManager.onDragEnd = () => this.handleDragEnd();

    // 파티클 초기화
    this.game.particles.clear();
  }

  exit() {
    this.game.inputManager.onTap = null;
    this.game.inputManager.onDrag = null;
    this.game.inputManager.onDragEnd = null;
  }

  startMiniGame() {
    this.score = 0;
    this.timeLeft = 30;
    this.isPlaying = true;
    this.showResult = false;
    this.showIntro = false;
    this.combo = 0;
    this.maxCombo = 0;

    if (this.phase === 0) {
      this.kadaifs = [];
      this.sliceTrail = [];
      this.slicedPieces = [];
    } else if (this.phase === 1) {
      this.pistachios = [];
      this.feverGauge = 0;
      this.isFever = false;
    } else if (this.phase === 2) {
      this.rpm = 0;
      this.isOverheated = false;
      this.doughPhase = 0;
      this.spinAngle = 0;
    }

    this.game.sound.playUIClick();
  }

  handleTap(pos) {
    if (this.showIntro) {
      this.startMiniGame();
      return;
    }

    if (this.showResult) {
      this.nextPhase();
      return;
    }

    // 피스타치오 게임 터치
    if (this.phase === 1 && this.isPlaying) {
      this.checkPistachioHit(pos);
    }
  }

  handleDrag(pos, dist, angle) {
    if (!this.isPlaying || this.showIntro) return;

    // 카다이프 게임 슬라이스
    if (this.phase === 0) {
      this.sliceTrail.push({ ...pos, time: Date.now() });
      this.checkKadaifSlice(pos);
    }

    // 마시멜로우 게임 회전
    if (this.phase === 2 && !this.isOverheated) {
      const rpmIncrease = Math.abs(angle) * 80;
      this.rpm = Math.min(100, this.rpm + rpmIncrease);
      this.spinAngle += angle;

      // 스핀 효과음 & 파티클
      if (rpmIncrease > 0.5) {
        this.game.sound.playSpin(this.rpm);

        const centerX = this.config.width / 2;
        const centerY = this.config.height * 0.5;
        this.game.particles.emitSpin(centerX, centerY, this.spinAngle, this.rpm / 100);
      }

      // 과열 체크
      if (this.rpm >= 100) {
        this.isOverheated = true;
        this.overheatedTimer = 1.5;
        this.game.sound.playFail();
        this.shakeIntensity = 10;
      }
    }
  }

  handleDragEnd() {
    if (this.phase === 0) {
      this.sliceTrail = [];
    }
  }

  nextPhase() {
    // 점수를 쿠키 스탯에 반영
    this.applyScore();

    this.phase++;
    if (this.phase >= 3) {
      // 재료 준비 완료 -> 베이킹으로
      this.game.sound.playSuccess();
      this.game.stateManager.changeState(GameState.BAKING);
    } else {
      this.showIntro = true;
      this.introTimer = 0;
      this.game.sound.playUIClick();
    }
  }

  applyScore() {
    const bonus = Math.floor(this.score / 10);

    switch (this.phase) {
      case 0: // 카다이프 -> 식감
        this.game.cookieStats.texture += bonus;
        break;
      case 1: // 피스타치오 -> 풍미, 비주얼
        this.game.cookieStats.flavor += bonus;
        this.game.cookieStats.visual += Math.floor(bonus / 2);
        break;
      case 2: // 마시멜로우 -> 완성도, 달콤함
        this.game.cookieStats.completion += bonus;
        this.game.cookieStats.sweetness += Math.floor(bonus / 2);
        break;
    }
  }

  // 콤보 증가
  addCombo() {
    const now = Date.now();
    if (now - this.lastHitTime < this.comboTimeout) {
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);

      if (this.combo >= 3) {
        this.game.sound.playCrunch();
        this.game.particles.emitComboExplosion(
          this.config.width / 2,
          this.config.height / 2,
          this.combo
        );
        this.shakeIntensity = Math.min(15, this.combo * 2);
      }
    } else {
      this.combo = 1;
    }
    this.lastHitTime = now;
  }

  update(dt) {
    // 인트로 타이머
    if (this.showIntro) {
      this.introTimer += dt;
      return;
    }

    if (!this.isPlaying) return;

    // 타이머
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.isPlaying = false;
      this.showResult = true;
      this.game.sound.playSuccess();
      this.game.particles.emitCelebration(
        this.config.width / 2,
        this.config.height / 2,
        this.config.width,
        this.config.height
      );

      // 퍼펙트 기록 (80점 이상 달성 시)
      const PERFECT_THRESHOLD = 80;
      if (this.score >= PERFECT_THRESHOLD) {
        const perfectTypes = ['kadaif', 'pistachio', 'marshmallow'];
        recipeManager.recordPerfect(perfectTypes[this.phase]);
      }

      return;
    }

    // 스크린 셰이크 감쇠
    this.shakeIntensity *= this.shakeDecay;

    // 미니게임별 업데이트
    if (this.phase === 0) this.updateKadaif(dt);
    else if (this.phase === 1) this.updatePistachio(dt);
    else if (this.phase === 2) this.updateMarshmallow(dt);
  }

  // ========== 카다이프 썰기 ==========
  updateKadaif(dt) {
    // 새 카다이프 생성
    if (Math.random() < dt * 2.5) {
      this.spawnKadaif();
    }

    // 카다이프 이동
    this.kadaifs.forEach(k => {
      k.y += k.vy * dt;
      k.vy += 350 * dt; // 중력
      k.rotation += k.rotSpeed * dt;
    });

    // 잘린 조각 업데이트
    this.slicedPieces = this.slicedPieces.filter(p => {
      p.y += p.vy * dt;
      p.x += p.vx * dt;
      p.vy += 400 * dt;
      p.rotation += p.rotSpeed * dt;
      p.alpha -= dt * 0.8;
      return p.alpha > 0 && p.y < this.config.height + 100;
    });

    // 화면 밖 카다이프 제거
    this.kadaifs = this.kadaifs.filter(k => k.y < this.config.height + 50 && !k.sliced);

    // 슬라이스 트레일 페이드
    const now = Date.now();
    this.sliceTrail = this.sliceTrail.filter(p => now - p.time < 80);
  }

  spawnKadaif() {
    // 스페셜 타입 확률
    const rand = Math.random();
    let type = 'normal';
    if (rand < 0.05) type = 'super';
    else if (rand < 0.12) type = 'golden';
    else if (rand < 0.20) type = 'premium';

    const fromLeft = Math.random() > 0.5;
    const x = fromLeft ? -30 : this.config.width + 30;
    const targetX = this.config.width / 2 + (Math.random() - 0.5) * 200;

    this.kadaifs.push({
      x,
      y: this.config.height + 30,
      vx: (targetX - x) * 0.015,
      vy: -450 - Math.random() * 150,
      size: 45 + Math.random() * 15,
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 6,
      type,
      sliced: false
    });

    // 스페셜 등장 사운드
    if (type !== 'normal') {
      this.game.sound.playSpecial();
    }
  }

  checkKadaifSlice(pos) {
    if (this.sliceTrail.length < 2) return;

    const prevPos = this.sliceTrail[this.sliceTrail.length - 2];
    const sliceAngle = Math.atan2(pos.y - prevPos.y, pos.x - prevPos.x);

    this.kadaifs.forEach(k => {
      if (k.sliced) return;

      const dx = pos.x - k.x;
      const dy = pos.y - k.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < k.size * 0.8) {
        k.sliced = true;

        // 점수 계산
        let points = 10;
        let particleColor = COLORS.kadaif.main;

        switch (k.type) {
          case 'premium':
            points = 15;
            particleColor = COLORS.kadaif.light;
            break;
          case 'golden':
            points = 20;
            particleColor = COLORS.kadaif.golden;
            break;
          case 'super':
            points = 30;
            particleColor = COLORS.ui.purple;
            break;
        }

        this.score += points;
        this.addCombo();

        // 사운드
        this.game.sound.playSlice();

        // 파티클 (슬라이스 방향으로)
        this.game.particles.emitSlice(k.x, k.y, sliceAngle);

        // 잘린 조각 생성
        this.createSlicedPieces(k, sliceAngle);

        // 스페셜 아이템 추가 효과
        if (k.type !== 'normal') {
          this.game.particles.emitSparkle(k.x, k.y, particleColor);
          this.shakeIntensity = 8;
        }
      }
    });
  }

  createSlicedPieces(kadaif, angle) {
    // 두 조각으로 분리
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;
      const perpAngle = angle + Math.PI / 2;

      this.slicedPieces.push({
        x: kadaif.x + Math.cos(perpAngle) * side * 10,
        y: kadaif.y + Math.sin(perpAngle) * side * 10,
        vx: Math.cos(perpAngle) * side * 80 + kadaif.vx,
        vy: kadaif.vy * 0.5 - 50,
        size: kadaif.size * 0.6,
        rotation: kadaif.rotation,
        rotSpeed: kadaif.rotSpeed * 2 + side * 3,
        type: kadaif.type,
        alpha: 1,
        half: i // 0: 왼쪽, 1: 오른쪽
      });
    }
  }

  // ========== 피스타치오 분쇄 ==========
  updatePistachio(dt) {
    // 피버 모드 타이머
    if (this.isFever) {
      this.feverTimer -= dt;
      this.feverGauge = (this.feverTimer / 3) * 100;

      // 피버 중 파티클
      this.game.particles.emitFeverFlame(
        this.config.width / 2,
        this.config.height * 0.6
      );

      if (this.feverTimer <= 0) {
        this.isFever = false;
        this.feverGauge = 0;
      }

      // 자동 분쇄
      this.pistachios.forEach(p => {
        if (!p.crushed && p.type !== 'bad') {
          p.crushed = true;
          this.score += 5;
          this.game.particles.emitCrush(p.x, p.y);
        }
      });
    }

    // 새 피스타치오 생성
    const spawnRate = this.isFever ? 5 : 3;
    if (Math.random() < dt * spawnRate) {
      this.spawnPistachio();
    }

    // 피스타치오 애니메이션
    this.pistachios.forEach(p => {
      if (!p.crushed) {
        p.bouncePhase += dt * 8;
        p.y = p.baseY + Math.sin(p.bouncePhase) * 8;
        p.scale = 1 + Math.sin(p.bouncePhase * 2) * 0.05;
      } else {
        p.fadeTimer -= dt;
      }
    });

    // 오래된 것 제거
    this.pistachios = this.pistachios.filter(p => !p.crushed || p.fadeTimer > 0);
  }

  spawnPistachio() {
    const rand = Math.random();
    let type = 'normal';
    if (rand < 0.08) type = 'emerald';
    else if (rand < 0.15) type = 'roasted';
    else if (rand < 0.22) type = 'bad';

    const pistachio = {
      x: 60 + Math.random() * (this.config.width - 120),
      baseY: this.config.height * 0.45 + Math.random() * 120,
      y: 0,
      size: 35 + Math.random() * 10,
      type,
      crushed: false,
      bouncePhase: Math.random() * Math.PI * 2,
      fadeTimer: 0.4,
      scale: 1
    };
    pistachio.y = pistachio.baseY;

    this.pistachios.push(pistachio);

    if (type === 'emerald' || type === 'roasted') {
      this.game.sound.playSpecial();
    }
  }

  checkPistachioHit(pos) {
    let hit = false;

    this.pistachios.forEach(p => {
      if (p.crushed) return;

      const dx = pos.x - p.x;
      const dy = pos.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < p.size) {
        p.crushed = true;
        hit = true;

        if (p.type === 'bad') {
          // 패널티
          this.score = Math.max(0, this.score - 10);
          this.timeLeft = Math.max(0, this.timeLeft - 1);
          this.combo = 0;
          this.game.sound.playFail();
          this.shakeIntensity = 12;
          this.game.particles.emitScreenFlash(this.config.width, this.config.height, '#ff0000');
        } else {
          // 점수
          let points = 10;
          if (p.type === 'emerald') points = 30;
          else if (p.type === 'roasted') points = 20;

          this.score += points;
          this.addCombo();

          // 피버 게이지
          if (!this.isFever) {
            this.feverGauge = Math.min(100, this.feverGauge + (p.type === 'roasted' ? 25 : 15));

            if (this.feverGauge >= 100) {
              this.isFever = true;
              this.feverTimer = 3;
              this.game.sound.playFever();
              this.game.particles.emitScreenFlash(this.config.width, this.config.height, COLORS.ui.red);
            }
          }

          this.game.sound.playCrush();
          this.game.particles.emitCrush(p.x, p.y);

          if (p.type !== 'normal') {
            this.game.particles.emitSparkle(p.x, p.y,
              p.type === 'emerald' ? COLORS.pistachio.light : COLORS.kadaif.main);
          }
        }
      }
    });
  }

  // ========== 마시멜로우 반죽 ==========
  updateMarshmallow(dt) {
    // 과열 타이머
    if (this.isOverheated) {
      this.overheatedTimer -= dt;
      if (this.overheatedTimer <= 0) {
        this.isOverheated = false;
        this.rpm = 50; // 리셋
      }
    }

    // RPM 자연 감소
    if (!this.game.inputManager.isDragging && !this.isOverheated) {
      this.rpm = Math.max(0, this.rpm - dt * 25);
    }

    // Perfect Zone 체크
    const inPerfectZone = this.rpm >= this.perfectZone.min && this.rpm <= this.perfectZone.max;
    if (inPerfectZone && !this.isOverheated) {
      this.score += dt * 35;
      this.doughPhase = Math.min(1, this.doughPhase + dt * 0.15);

      // 쫀득쫀득 효과
      if (Math.random() < dt * 3) {
        const centerX = this.config.width / 2;
        const centerY = this.config.height * 0.5;
        this.game.particles.emitSparkle(
          centerX + (Math.random() - 0.5) * 80,
          centerY + (Math.random() - 0.5) * 80,
          COLORS.marshmallow.cream
        );
      }
    }
  }

  render(ctx) {
    // 스크린 셰이크 적용
    ctx.save();
    if (this.shakeIntensity > 0.5) {
      ctx.translate(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity
      );
    }

    // 배경 (미니게임별 색상)
    this.renderBackground(ctx);

    if (this.showIntro) {
      this.renderIntro(ctx);
    } else {
      // 상단 UI
      this.renderUI(ctx);

      // 미니게임별 렌더링
      if (this.phase === 0) this.renderKadaif(ctx);
      else if (this.phase === 1) this.renderPistachio(ctx);
      else if (this.phase === 2) this.renderMarshmallow(ctx);

      // 콤보 표시
      if (this.combo >= 3) {
        this.renderCombo(ctx);
      }

      // 결과 화면
      if (this.showResult) {
        this.renderResult(ctx);
      }
    }

    ctx.restore();
  }

  renderBackground(ctx) {
    // 그라데이션 배경
    const gradient = ctx.createLinearGradient(0, 0, 0, this.config.height);

    if (this.phase === 0) {
      // 카다이프: 따뜻한 베이지 톤
      gradient.addColorStop(0, '#2D1F14');
      gradient.addColorStop(1, '#1A120B');
    } else if (this.phase === 1) {
      // 피스타치오: 시원한 그린 톤
      gradient.addColorStop(0, '#1B2E1B');
      gradient.addColorStop(1, '#0F1A0F');
    } else {
      // 마시멜로우: 따뜻한 핑크 톤
      gradient.addColorStop(0, '#2D1F24');
      gradient.addColorStop(1, '#1A1015');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    // 피버 모드 배경 효과
    if (this.isFever) {
      ctx.fillStyle = `rgba(231, 76, 60, ${0.1 + Math.sin(Date.now() / 100) * 0.05})`;
      ctx.fillRect(0, 0, this.config.width, this.config.height);
    }
  }

  renderIntro(ctx) {
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;

    // 아이콘
    ctx.font = '100px sans-serif';
    ctx.textAlign = 'center';
    const bounce = Math.sin(this.introTimer * 4) * 10;
    ctx.fillText(this.phaseIcons[this.phase], centerX, centerY - 60 + bounce);

    // 제목
    ctx.font = 'bold 28px DungGeunMo, sans-serif';
    ctx.fillStyle = COLORS.ui.gold;
    ctx.fillText(this.phaseNames[this.phase], centerX, centerY + 40);

    // 설명
    ctx.font = '16px DungGeunMo, sans-serif';
    ctx.fillStyle = '#ccc';
    ctx.fillText(this.phaseDescriptions[this.phase], centerX, centerY + 80);

    // 시작 안내 (깜빡임)
    if (Math.floor(this.introTimer * 2) % 2 === 0) {
      ctx.font = '18px DungGeunMo, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('터치하여 시작!', centerX, centerY + 150);
    }

    // 단계 표시
    this.renderPhaseIndicator(ctx);
  }

  renderPhaseIndicator(ctx) {
    const centerX = this.config.width / 2;
    const y = 50;
    const spacing = 80;
    const startX = centerX - spacing;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * spacing;
      const isCurrent = i === this.phase;
      const isCompleted = i < this.phase;

      // 원
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fillStyle = isCompleted ? COLORS.ui.green : (isCurrent ? COLORS.ui.gold : '#333');
      ctx.fill();

      // 번호/체크
      ctx.font = 'bold 14px DungGeunMo, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(isCompleted ? '✓' : (i + 1).toString(), x, y + 5);

      // 연결선
      if (i < 2) {
        ctx.strokeStyle = i < this.phase ? COLORS.ui.green : '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 20, y);
        ctx.lineTo(x + spacing - 20, y);
        ctx.stroke();
      }
    }
  }

  renderUI(ctx) {
    // 게임 이름
    ctx.font = 'bold 22px DungGeunMo, sans-serif';
    ctx.fillStyle = COLORS.ui.gold;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.phaseIcons[this.phase]} ${this.phaseNames[this.phase]}`, this.config.width / 2, 35);

    // 타이머 (원형)
    this.renderTimer(ctx);

    // 점수
    ctx.font = 'bold 24px DungGeunMo, sans-serif';
    ctx.fillStyle = COLORS.ui.green;
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(this.score)}`, this.config.width - 20, 85);
    ctx.font = '12px DungGeunMo, sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText('점수', this.config.width - 20, 100);

    // 단계 표시
    this.renderPhaseIndicator(ctx);
  }

  renderTimer(ctx) {
    const x = 50;
    const y = 85;
    const radius = 25;
    const progress = this.timeLeft / 30;

    // 배경 원
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.fill();

    // 진행 호
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.strokeStyle = this.timeLeft < 10 ? COLORS.ui.red : COLORS.ui.green;
    ctx.lineWidth = 5;
    ctx.stroke();

    // 시간 텍스트
    ctx.font = 'bold 16px DungGeunMo, sans-serif';
    ctx.fillStyle = this.timeLeft < 10 ? COLORS.ui.red : '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(Math.ceil(this.timeLeft).toString(), x, y + 6);
  }

  renderCombo(ctx) {
    const centerX = this.config.width / 2;
    const y = 150;

    ctx.font = 'bold 32px DungGeunMo, sans-serif';
    ctx.fillStyle = COLORS.ui.gold;
    ctx.textAlign = 'center';

    const scale = 1 + Math.sin(Date.now() / 50) * 0.1;
    ctx.save();
    ctx.translate(centerX, y);
    ctx.scale(scale, scale);
    ctx.fillText(`${this.combo} COMBO!`, 0, 0);
    ctx.restore();
  }

  renderKadaif(ctx) {
    // 슬라이스 트레일 (검 자국)
    if (this.sliceTrail.length > 1) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(this.sliceTrail[0].x, this.sliceTrail[0].y);
      this.sliceTrail.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();

      ctx.shadowBlur = 0;
    }

    // 카다이프 렌더링
    this.kadaifs.forEach(k => {
      this.renderSingleKadaif(ctx, k);
    });

    // 잘린 조각들
    this.slicedPieces.forEach(p => {
      this.renderSlicedPiece(ctx, p);
    });
  }

  renderSingleKadaif(ctx, k) {
    ctx.save();
    ctx.translate(k.x, k.y);
    ctx.rotate(k.rotation);

    // 타입별 색상
    let mainColor, lightColor, hasGlow = false;
    switch (k.type) {
      case 'golden':
        mainColor = COLORS.kadaif.golden;
        lightColor = '#FFE082';
        hasGlow = true;
        break;
      case 'super':
        mainColor = COLORS.ui.purple;
        lightColor = '#CE93D8';
        hasGlow = true;
        break;
      case 'premium':
        mainColor = COLORS.kadaif.light;
        lightColor = '#FFF8E1';
        break;
      default:
        mainColor = COLORS.kadaif.main;
        lightColor = COLORS.kadaif.light;
    }

    // 글로우 효과
    if (hasGlow) {
      ctx.shadowColor = mainColor;
      ctx.shadowBlur = 20;
    }

    // 카다이프 본체 (면발 느낌)
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, k.size / 2, k.size / 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 면발 텍스처
    ctx.strokeStyle = lightColor;
    ctx.lineWidth = 1.5;
    for (let i = -4; i <= 4; i++) {
      const yOffset = i * 4;
      ctx.beginPath();
      ctx.moveTo(-k.size / 2 + 5, yOffset);
      // 웨이브 라인
      for (let x = -k.size / 2 + 5; x < k.size / 2 - 5; x += 8) {
        ctx.lineTo(x + 4, yOffset + (Math.sin(x * 0.5) * 2));
      }
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  renderSlicedPiece(ctx, p) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    const mainColor = p.type === 'golden' ? COLORS.kadaif.golden :
                     p.type === 'super' ? COLORS.ui.purple :
                     COLORS.kadaif.main;

    // 반쪽 카다이프
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    if (p.half === 0) {
      ctx.arc(0, 0, p.size / 2, Math.PI / 2, -Math.PI / 2);
    } else {
      ctx.arc(0, 0, p.size / 2, -Math.PI / 2, Math.PI / 2);
    }
    ctx.fill();

    ctx.restore();
  }

  renderPistachio(ctx) {
    // 절구통 배경
    const mortarX = this.config.width / 2;
    const mortarY = this.config.height * 0.55;

    // 그림자
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(mortarX, mortarY + 90, 160, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // 절구통 몸체
    const gradient = ctx.createRadialGradient(mortarX - 30, mortarY - 30, 0, mortarX, mortarY, 150);
    gradient.addColorStop(0, '#6D4C41');
    gradient.addColorStop(1, '#3E2723');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(mortarX, mortarY, 150, 85, 0, 0, Math.PI * 2);
    ctx.fill();

    // 내부
    ctx.fillStyle = '#2D1F14';
    ctx.beginPath();
    ctx.ellipse(mortarX, mortarY - 10, 120, 60, 0, 0, Math.PI * 2);
    ctx.fill();

    // 피스타치오 렌더링
    this.pistachios.forEach(p => {
      this.renderSinglePistachio(ctx, p);
    });

    // 피버 게이지
    this.renderFeverGauge(ctx);
  }

  renderSinglePistachio(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.scale, p.scale);

    if (p.crushed) {
      ctx.globalAlpha = p.fadeTimer;
    }

    // 색상
    let mainColor, innerColor, hasGlow = false;
    switch (p.type) {
      case 'emerald':
        mainColor = '#00BCD4';
        innerColor = '#E0F7FA';
        hasGlow = true;
        break;
      case 'roasted':
        mainColor = '#8D6E63';
        innerColor = COLORS.pistachio.main;
        hasGlow = true;
        break;
      case 'bad':
        mainColor = '#4E342E';
        innerColor = '#3E2723';
        break;
      default:
        mainColor = COLORS.pistachio.main;
        innerColor = COLORS.pistachio.light;
    }

    if (hasGlow) {
      ctx.shadowColor = mainColor;
      ctx.shadowBlur = 15;
    }

    // 껍질
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size / 2, p.size / 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 갈라진 틈 (나쁜 것 제외)
    if (p.type !== 'bad') {
      ctx.fillStyle = innerColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size / 4, p.size / 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 나쁜 것 표시
    if (p.type === 'bad') {
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💀', 0, 5);
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  renderFeverGauge(ctx) {
    const gaugeWidth = 220;
    const gaugeX = (this.config.width - gaugeWidth) / 2;
    const gaugeY = this.config.height - 90;

    // 라벨
    ctx.font = '12px DungGeunMo, sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('FEVER 게이지', this.config.width / 2, gaugeY - 8);

    // 배경
    ctx.fillStyle = '#222';
    ctx.fillRect(gaugeX, gaugeY, gaugeWidth, 20);

    // 게이지
    const gaugeColor = this.isFever ? COLORS.ui.red : COLORS.ui.gold;
    ctx.fillStyle = gaugeColor;
    ctx.fillRect(gaugeX, gaugeY, gaugeWidth * (this.feverGauge / 100), 20);

    // 테두리
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.strokeRect(gaugeX, gaugeY, gaugeWidth, 20);

    // 피버 텍스트
    if (this.isFever) {
      ctx.font = 'bold 18px DungGeunMo, sans-serif';
      ctx.fillStyle = COLORS.ui.red;
      const flicker = Math.sin(Date.now() / 50) > 0;
      if (flicker) {
        ctx.fillText('🔥 FEVER MODE! 🔥', this.config.width / 2, gaugeY + 50);
      }
    }
  }

  renderMarshmallow(ctx) {
    const centerX = this.config.width / 2;
    const centerY = this.config.height * 0.5;

    // 회전 가이드
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 화살표 가이드
    if (this.rpm < 20) {
      ctx.font = '24px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'center';
      const arrowAngle = Date.now() / 500;
      const arrowX = centerX + Math.cos(arrowAngle) * 80;
      const arrowY = centerY + Math.sin(arrowAngle) * 80;
      ctx.fillText('↻', arrowX, arrowY);
    }

    // 반죽
    this.renderDough(ctx, centerX, centerY);

    // RPM 게이지
    this.renderRPMGauge(ctx);

    // 상태 텍스트
    ctx.font = '16px DungGeunMo, sans-serif';
    ctx.textAlign = 'center';

    if (this.isOverheated) {
      ctx.fillStyle = COLORS.ui.red;
      ctx.fillText('과열! 잠시 기다리세요...', centerX, this.config.height - 60);
    } else if (this.rpm >= this.perfectZone.min && this.rpm <= this.perfectZone.max) {
      ctx.fillStyle = COLORS.ui.green;
      ctx.fillText('✨ 쫀득쫀득~ Perfect! ✨', centerX, this.config.height - 60);
    } else {
      ctx.fillStyle = '#888';
      ctx.fillText('원을 그리며 돌려주세요!', centerX, this.config.height - 60);
    }
  }

  renderDough(ctx, centerX, centerY) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(this.spinAngle * 0.1);

    // 반죽 크기 (rpm에 따라)
    const baseSize = 50;
    const maxSize = 80;
    const size = baseSize + (maxSize - baseSize) * this.doughPhase;

    // 색상 (익을수록 변화)
    const r = Math.floor(255 - this.doughPhase * 20);
    const g = Math.floor(240 - this.doughPhase * 30);
    const b = Math.floor(230 - this.doughPhase * 40);
    const doughColor = `rgb(${r},${g},${b})`;

    // 그림자
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 10;

    // 반죽 본체
    ctx.fillStyle = doughColor;
    ctx.beginPath();

    if (this.doughPhase < 0.3) {
      // 납작
      ctx.ellipse(0, 0, size * 1.3, size * 0.5, 0, 0, Math.PI * 2);
    } else if (this.doughPhase < 0.7) {
      // 울퉁불퉁
      const wobble = Math.sin(Date.now() / 100) * 5;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const r = size * (0.8 + Math.sin(i * 2 + wobble) * 0.2);
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r * 0.7;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    } else {
      // 동그랗게
      ctx.arc(0, 0, size, 0, Math.PI * 2);
    }
    ctx.fill();

    // 하이라이트
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(-size * 0.3, -size * 0.3, size * 0.25, size * 0.2, -0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  renderRPMGauge(ctx) {
    const gaugeY = this.config.height - 130;
    const gaugeWidth = this.config.width - 80;
    const gaugeX = 40;
    const gaugeHeight = 25;

    // 라벨
    ctx.font = '12px DungGeunMo, sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('속도 조절', this.config.width / 2, gaugeY - 8);

    // 배경
    ctx.fillStyle = '#222';
    ctx.fillRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);

    // Perfect Zone 표시
    const zoneStart = gaugeX + gaugeWidth * (this.perfectZone.min / 100);
    const zoneWidth = gaugeWidth * ((this.perfectZone.max - this.perfectZone.min) / 100);
    ctx.fillStyle = 'rgba(46, 204, 113, 0.4)';
    ctx.fillRect(zoneStart, gaugeY, zoneWidth, gaugeHeight);

    // Perfect Zone 라벨
    ctx.font = '10px DungGeunMo, sans-serif';
    ctx.fillStyle = COLORS.ui.green;
    ctx.fillText('PERFECT', zoneStart + zoneWidth / 2, gaugeY + 16);

    // 현재 RPM 인디케이터
    const rpmX = gaugeX + gaugeWidth * (Math.min(this.rpm, 100) / 100);
    ctx.fillStyle = this.isOverheated ? COLORS.ui.red : COLORS.ui.gold;
    ctx.beginPath();
    ctx.moveTo(rpmX, gaugeY - 5);
    ctx.lineTo(rpmX - 8, gaugeY + gaugeHeight + 5);
    ctx.lineTo(rpmX + 8, gaugeY + gaugeHeight + 5);
    ctx.closePath();
    ctx.fill();

    // 테두리
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.strokeRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);
  }

  renderResult(ctx) {
    // 반투명 배경
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;

    // 결과 박스
    const boxWidth = 320;
    const boxHeight = 280;
    const boxX = (this.config.width - boxWidth) / 2;
    const boxY = (this.config.height - boxHeight) / 2;

    // 박스 배경
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // 박스 테두리 (글로우)
    ctx.shadowColor = COLORS.ui.gold;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = COLORS.ui.gold;
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    ctx.shadowBlur = 0;

    // 아이콘
    ctx.font = '50px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.phaseIcons[this.phase], centerX, boxY + 60);

    // 제목
    ctx.font = 'bold 26px DungGeunMo, sans-serif';
    ctx.fillStyle = COLORS.ui.gold;
    ctx.fillText('완료!', centerX, boxY + 100);

    // 점수
    ctx.font = 'bold 48px DungGeunMo, sans-serif';
    ctx.fillStyle = COLORS.ui.green;
    ctx.fillText(`${Math.floor(this.score)}점`, centerX, boxY + 160);

    // 최대 콤보
    if (this.maxCombo >= 3) {
      ctx.font = '16px DungGeunMo, sans-serif';
      ctx.fillStyle = COLORS.ui.gold;
      ctx.fillText(`최대 콤보: ${this.maxCombo}x`, centerX, boxY + 195);
    }

    // 다음 안내
    ctx.font = '14px DungGeunMo, sans-serif';
    ctx.fillStyle = '#888';
    const nextText = this.phase < 2 ?
      `다음: ${this.phaseNames[this.phase + 1]}` :
      '다음: 베이킹';
    ctx.fillText(nextText, centerX, boxY + 230);

    // 터치 안내 (깜빡임)
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.fillStyle = '#fff';
      ctx.fillText('터치하여 계속', centerX, boxY + 260);
    }
  }
}
