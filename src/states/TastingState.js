/**
 * TastingState - 품평회 연출
 * 드럼롤 -> NPC 반응 -> 점수 공개
 *
 * 사운드/파티클 효과 통합
 */

import { BaseState } from './BaseState.js';
import { GameState } from '../core/StateManager.js';
import { soundManager } from '../core/SoundManager.js';
import { particleSystem, COLORS } from '../core/ParticleSystem.js';
import { recipeManager } from '../core/RecipeManager.js';
import { inventoryManager, Cookie } from '../core/InventoryManager.js';
import { timeManager } from '../core/TimeManager.js';

export class TastingState extends BaseState {
  constructor(game) {
    super(game);

    this.phase = 0; // 0: 인트로, 1: 드럼롤, 2: 가족반응, 3: 친구반응, 4: 점수공개
    this.phaseTimer = 0;

    this.finalScore = 0;
    this.scoreBreakdown = {};
    this.displayedScore = 0; // 점수 카운팅 애니메이션용

    // NPC 반응
    this.reactions = {
      family: [],
      friend: []
    };
    this.currentFamilyReaction = '';
    this.currentFriendReaction = '';

    // 말풍선 애니메이션
    this.bubbleY = 0;
    this.bubbleScale = 0;

    // 화면 효과
    this.screenShake = 0;
    this.shakeIntensity = 0;
    this.flashAlpha = 0;

    // NPC 애니메이션
    this.npcBounce = { family: 0, friend: 0 };
    this.npcEmoji = { family: '👨‍👩‍👧', friend: '🧑‍🤝‍🧑' };

    // 점수판 애니메이션
    this.scoreRevealProgress = 0;
    this.gradeScale = 0;
    this.barAnimations = [0, 0, 0];

    // 드럼롤 타이밍
    this.drumrollPlayed = false;

    // 별 파티클 (배경)
    this.bgStars = [];

    // 레시피 관련
    this.currentRecipe = null;
    this.newUnlocks = [];
  }

  enter() {
    this.phase = 0;
    this.phaseTimer = 0;
    this.displayedScore = 0;
    this.bubbleScale = 0;
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.scoreRevealProgress = 0;
    this.gradeScale = 0;
    this.barAnimations = [0, 0, 0];
    this.drumrollPlayed = false;

    this.npcBounce = { family: 0, friend: 0 };

    // 배경 별 생성
    this.bgStars = [];
    for (let i = 0; i < 30; i++) {
      this.bgStars.push({
        x: Math.random() * this.config.width,
        y: Math.random() * this.config.height * 0.5,
        size: Math.random() * 2 + 1,
        twinkle: Math.random() * Math.PI * 2
      });
    }

    // 현재 레시피 가져오기
    this.currentRecipe = recipeManager.getCurrentRecipe();
    this.newUnlocks = [];

    // 레시피 보너스 적용
    const bonusStats = recipeManager.applyRecipeBonus(this.game.cookieStats);

    // 점수 계산 (보너스 적용)
    this.scoreBreakdown = {
      flavor: Math.min(bonusStats.flavor, 100),
      texture: Math.min(bonusStats.texture, 100),
      visual: Math.min((bonusStats.completion + bonusStats.visual) / 2, 100)
    };

    // 총점 계산
    const { flavor, texture, visual } = this.scoreBreakdown;
    const randomBonus = Math.floor(Math.random() * 21) - 10;
    this.finalScore = Math.max(0, Math.min(300, flavor + texture + visual + randomBonus));

    // 최고 점수 기록 및 레시피 해금 체크
    // scoreBreakdown을 사용하여 계산된 점수로 체크 (visual은 (completion+visual)/2)
    const statsForCheck = {
      flavor: this.scoreBreakdown.flavor,
      texture: this.scoreBreakdown.texture,
      visual: this.scoreBreakdown.visual,  // 이미 계산된 값 사용
      sweetness: bonusStats.sweetness,
      completion: bonusStats.completion
    };
    recipeManager.updateBestScores(statsForCheck, this.finalScore);

    const gameData = {
      cookieStats: statsForCheck,
      totalScore: this.finalScore
    };
    this.newUnlocks = recipeManager.checkUnlocks(gameData);

    // 반응 생성
    this.generateReactions();

    this.game.inputManager.onTap = (pos) => this.handleTap(pos);
  }

  exit() {
    this.game.inputManager.onTap = null;
  }

  generateReactions() {
    const isSuccess = this.finalScore >= 200;
    const isGreat = this.finalScore >= 250;

    const familyGreat = [
      '세상에!!! 이게 뭐야?!',
      '우리 아들 천재였어!!!',
      '당장 가게 차려야 해!',
      '엄마 눈물 나와...'
    ];
    const familyGood = [
      '음... 이 식감은?!',
      '맛있다!!! 아들 천재야!',
      '이게 요즘 유행이라며?',
      '한 개 더 줘!'
    ];
    const familyBad = [
      '음... 뭔가 아쉬운데?',
      '좀 더 연습해봐...',
      '그래도 노력했네'
    ];

    const friendGreat = [
      '야!!! 이거 미쳤다!!!',
      '이건 진짜 대박이야!',
      '바로 인스타 올린다!',
      '나 이거 10개 살게!'
    ];
    const friendGood = [
      '야, 이거 줄 서서 사 먹을 맛인데?',
      '나한테 먼저 팔아!',
      '대박... 진짜 맛있어!',
      'SNS에 올려도 돼?'
    ];
    const friendBad = [
      '음... 뭐 나쁘진 않아',
      '좀 더 분발해야겠는데?',
      '다음엔 더 잘 만들 수 있을 거야'
    ];

    if (isGreat) {
      this.reactions.family = familyGreat;
      this.reactions.friend = friendGreat;
      this.npcEmoji.family = '🤩';
      this.npcEmoji.friend = '🤯';
    } else if (isSuccess) {
      this.reactions.family = familyGood;
      this.reactions.friend = friendGood;
      this.npcEmoji.family = '😋';
      this.npcEmoji.friend = '😍';
    } else {
      this.reactions.family = familyBad;
      this.reactions.friend = friendBad;
      this.npcEmoji.family = '😐';
      this.npcEmoji.friend = '🤔';
    }

    // 반응 텍스트 미리 선택 (랜덤 깜빡임 방지)
    this.currentFamilyReaction = this.reactions.family[Math.floor(Math.random() * this.reactions.family.length)];
    this.currentFriendReaction = this.reactions.friend[Math.floor(Math.random() * this.reactions.friend.length)];
  }

  handleTap(pos) {
    // DEV 모드 스킵 버튼 체크
    if (this.config.devMode && pos) {
      const skipBtn = { x: this.config.width - 80, y: 10, width: 70, height: 35 };
      if (this.isPointInRect(pos, skipBtn)) {
        soundManager.playUIClick();
        this.game.stateManager.changeState(GameState.SHOP);
        return;
      }
    }

    if (this.phase === 0) {
      // 인트로 스킵
      this.phase = 1;
      this.phaseTimer = 0;
      soundManager.playUIClick();
      return;
    }

    // 탭하면 다음 페이즈로
    this.advancePhase();
  }

  advancePhase() {
    this.phase++;
    this.phaseTimer = 0;

    if (this.phase === 2) {
      // 가족 반응
      soundManager.playSuccess();
      this.npcBounce.family = 1;
      this.bubbleScale = 0;

      // 파티클
      particleSystem.emitSparkle(80, this.config.height * 0.35, 10);

    } else if (this.phase === 3) {
      // 친구 반응
      soundManager.playSuccess();
      this.npcBounce.friend = 1;
      this.bubbleScale = 0;

      // 파티클
      particleSystem.emitSparkle(this.config.width - 80, this.config.height * 0.35, 10);

    } else if (this.phase === 4) {
      // 점수 공개
      soundManager.playFanfare();
      this.triggerShake(10, 0.5);
      this.flashAlpha = 1;

      // 점수에 따른 축하 파티클
      if (this.finalScore >= 250) {
        // S랭크 - 대규모 축하
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            particleSystem.emitCelebration(
              Math.random() * this.config.width,
              this.config.height * 0.3
            );
          }, i * 200);
        }
      } else if (this.finalScore >= 200) {
        // A/B랭크
        particleSystem.emitCelebration(this.config.width / 2, this.config.height * 0.4);
      }

    } else if (this.phase > 4) {
      soundManager.playUIClick();

      // 완성된 쿠키를 재고에 추가
      const recipeName = this.currentRecipe ? this.currentRecipe.name : '클래식 두쫀쿠';
      const cookie = new Cookie(this.scoreBreakdown, this.finalScore, recipeName);
      const added = inventoryManager.addCookie(cookie);

      if (added) {
        // 시간 시스템에 쿠키 제작 기록
        timeManager.recordCookieMade();
      } else {
        console.warn('재고가 가득 차서 쿠키를 추가할 수 없습니다!');
      }

      // 새로 해금된 레시피가 있으면 레시피북으로 이동
      if (this.newUnlocks.length > 0) {
        this.game.stateManager.changeState(GameState.RECIPE_BOOK, {
          newUnlocks: this.newUnlocks,
          returnTo: GameState.SHOP
        });
      } else {
        // 가게 허브로 돌아가기
        this.game.stateManager.changeState(GameState.SHOP);
      }
    }
  }

  triggerShake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.screenShake = duration;
  }

  update(dt) {
    this.phaseTimer += dt;

    // 배경 별 반짝임
    this.bgStars.forEach(star => {
      star.twinkle += dt * 3;
    });

    // 화면 흔들림
    if (this.screenShake > 0) {
      this.screenShake -= dt;
    }

    // 플래시 감소
    if (this.flashAlpha > 0) {
      this.flashAlpha -= dt * 2;
    }

    // NPC 바운스 감소
    if (this.npcBounce.family > 0) {
      this.npcBounce.family -= dt * 3;
    }
    if (this.npcBounce.friend > 0) {
      this.npcBounce.friend -= dt * 3;
    }

    // 말풍선 스케일 애니메이션
    if (this.phase >= 2 && this.phase <= 3) {
      this.bubbleScale += (1 - this.bubbleScale) * 0.15;
      this.bubbleY = Math.sin(this.phaseTimer * 3) * 5;
    }

    // 드럼롤 사운드
    if (this.phase === 1 && !this.drumrollPlayed) {
      soundManager.playDrumroll(2);
      this.drumrollPlayed = true;
    }

    // 자동 페이즈 진행 (드럼롤 → 가족반응)
    if (this.phase === 1 && this.phaseTimer > 2.5) {
      this.advancePhase();
    }

    // 점수판 애니메이션
    if (this.phase === 4) {
      // 점수 카운팅
      if (this.displayedScore < this.finalScore) {
        this.displayedScore += dt * 200;
        if (this.displayedScore > this.finalScore) {
          this.displayedScore = this.finalScore;
        }
      }

      // 점수바 애니메이션
      const barDelay = [0, 0.3, 0.6];
      for (let i = 0; i < 3; i++) {
        if (this.phaseTimer > barDelay[i] && this.barAnimations[i] < 1) {
          this.barAnimations[i] += dt * 2;
          if (this.barAnimations[i] > 1) this.barAnimations[i] = 1;
        }
      }

      // 점수 공개 진행도
      this.scoreRevealProgress = Math.min(1, this.phaseTimer / 1.5);

      // 등급 스케일 (점수 공개 후)
      if (this.phaseTimer > 1.5 && this.gradeScale < 1) {
        this.gradeScale += dt * 3;
        if (this.gradeScale > 1) {
          this.gradeScale = 1;
          // 등급 공개 시 추가 효과
          if (this.finalScore >= 250) {
            soundManager.playSpecial();
            particleSystem.emitSparkle(this.config.width / 2, this.config.height * 0.72, 30);
          }
        }
      }
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

    // 점수판이 아닐 때만 테이블/쿠키/NPC 렌더링
    if (this.phase < 4) {
      // 테이블
      this.renderTable(ctx);

      // 쿠키
      this.renderCookie(ctx);

      // NPC들
      this.renderNPCs(ctx);

      // 페이즈별 연출
      switch (this.phase) {
        case 0:
          this.renderIntro(ctx);
          break;
        case 1:
          this.renderDrumroll(ctx);
          break;
        case 2:
          this.renderFamilyReaction(ctx);
          break;
        case 3:
          this.renderFriendReaction(ctx);
          break;
      }

      // 터치 안내
      if (this.phase >= 2) {
        const blinkAlpha = 0.5 + Math.sin(this.phaseTimer * 5) * 0.3;
        ctx.font = '14px DungGeunMo, sans-serif';
        ctx.fillStyle = `rgba(255, 255, 255, ${blinkAlpha})`;
        ctx.textAlign = 'center';
        ctx.fillText('터치하여 계속', this.config.width / 2, this.config.height - 30);
      }
    } else {
      // 점수판
      this.renderScoreboard(ctx);
    }

    // 플래시 효과
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha * 0.5})`;
      ctx.fillRect(0, 0, this.config.width, this.config.height);
    }

    // DEV 스킵 버튼
    if (this.config.devMode) {
      this.renderDevSkipButton(ctx);
    }

    ctx.restore();
  }

  renderDevSkipButton(ctx) {
    const btn = { x: this.config.width - 80, y: 10, width: 70, height: 35 };

    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 5);
    ctx.fill();

    ctx.font = 'bold 11px DungGeunMo, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('SKIP →', btn.x + btn.width / 2, btn.y + 22);
  }

  renderBackground(ctx) {
    // 그라데이션 배경
    const gradient = ctx.createLinearGradient(0, 0, 0, this.config.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f0f23');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    // 배경 별
    this.bgStars.forEach(star => {
      const alpha = 0.3 + Math.sin(star.twinkle) * 0.3;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 스포트라이트
    if (this.phase < 4) {
      const spotGradient = ctx.createRadialGradient(
        this.config.width / 2, this.config.height * 0.5, 0,
        this.config.width / 2, this.config.height * 0.5, 200
      );
      spotGradient.addColorStop(0, 'rgba(255, 220, 180, 0.15)');
      spotGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = spotGradient;
      ctx.fillRect(0, 0, this.config.width, this.config.height);
    }
  }

  renderTable(ctx) {
    const tableY = this.config.height * 0.55;
    const tableHeight = 100;

    // 테이블 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(25, tableY + 8, this.config.width - 50, tableHeight, 5);
    ctx.fill();

    // 테이블 상판
    const tableGradient = ctx.createLinearGradient(0, tableY, 0, tableY + tableHeight);
    tableGradient.addColorStop(0, '#8b6914');
    tableGradient.addColorStop(0.3, '#6d4c0a');
    tableGradient.addColorStop(1, '#5d4037');
    ctx.fillStyle = tableGradient;
    ctx.beginPath();
    ctx.roundRect(20, tableY, this.config.width - 40, tableHeight, 5);
    ctx.fill();

    // 테이블 무늬
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const y = tableY + 15 + i * 12;
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(this.config.width - 30, y);
      ctx.stroke();
    }

    // 테이블 다리
    ctx.fillStyle = '#4a3728';
    ctx.fillRect(40, tableY + tableHeight, 25, 80);
    ctx.fillRect(this.config.width - 65, tableY + tableHeight, 25, 80);
  }

  renderCookie(ctx) {
    const x = this.config.width / 2;
    const y = this.config.height * 0.48;

    // 접시 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x + 3, y + 28, 82, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // 접시
    const plateGradient = ctx.createRadialGradient(x - 20, y, 0, x, y + 20, 90);
    plateGradient.addColorStop(0, '#ffffff');
    plateGradient.addColorStop(0.7, '#ecf0f1');
    plateGradient.addColorStop(1, '#bdc3c7');
    ctx.fillStyle = plateGradient;
    ctx.beginPath();
    ctx.ellipse(x, y + 25, 85, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // 접시 테두리
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y + 25, 85, 25, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 쿠키 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(x + 3, y + 8, 52, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // 쿠키 본체
    const cookieGradient = ctx.createRadialGradient(x - 15, y - 15, 0, x, y, 55);
    cookieGradient.addColorStop(0, '#e8d4b8');
    cookieGradient.addColorStop(0.6, '#d4a574');
    cookieGradient.addColorStop(1, '#b8956e');
    ctx.fillStyle = cookieGradient;
    ctx.beginPath();
    ctx.arc(x, y, 55, 0, Math.PI * 2);
    ctx.fill();

    // 카다이프 텍스처
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.15)';
    ctx.lineWidth = 1;
    for (let r = 10; r < 55; r += 8) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 피스타치오 필링
    const fillingGradient = ctx.createRadialGradient(x - 8, y - 8, 0, x, y, 30);
    fillingGradient.addColorStop(0, '#a8d875');
    fillingGradient.addColorStop(0.7, '#7cb342');
    fillingGradient.addColorStop(1, '#558b2f');
    ctx.fillStyle = fillingGradient;
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();

    // 필링 하이라이트
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x - 8, y - 8, 12, 8, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // 쿠키 빛나는 효과 (드럼롤/점수 공개 시)
    if (this.phase === 1 || this.phase === 4) {
      const glowAlpha = 0.3 + Math.sin(this.phaseTimer * 5) * 0.2;
      const glowGradient = ctx.createRadialGradient(x, y, 30, x, y, 80);
      glowGradient.addColorStop(0, `rgba(255, 215, 0, ${glowAlpha})`);
      glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(x, y, 80, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderNPCs(ctx) {
    // 가족 NPC (왼쪽)
    const familyY = this.config.height * 0.38;
    const familyBounceOffset = Math.sin(this.npcBounce.family * Math.PI * 3) * this.npcBounce.family * 20;

    ctx.save();
    ctx.translate(80, familyY - familyBounceOffset);

    // NPC 배경 원
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(0, 0, 45, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '45px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.phase >= 2 ? this.npcEmoji.family : '👨‍👩‍👧', 0, 0);
    ctx.restore();

    // 가족 라벨
    ctx.font = '12px DungGeunMo, sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('가족', 80, familyY + 55);

    // 친구 NPC (오른쪽)
    const friendY = this.config.height * 0.38;
    const friendBounceOffset = Math.sin(this.npcBounce.friend * Math.PI * 3) * this.npcBounce.friend * 20;

    ctx.save();
    ctx.translate(this.config.width - 80, friendY - friendBounceOffset);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(0, 0, 45, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '45px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.phase >= 3 ? this.npcEmoji.friend : '🧑‍🤝‍🧑', 0, 0);
    ctx.restore();

    // 친구 라벨
    ctx.font = '12px DungGeunMo, sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('친구', this.config.width - 80, friendY + 55);
  }

  renderIntro(ctx) {
    const progress = Math.min(1, this.phaseTimer / 2);

    // 오버레이
    const overlayAlpha = 1 - progress;
    ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha * 0.7})`;
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    const slideOffset = (1 - progress) * 50;

    ctx.save();
    ctx.translate(0, slideOffset);

    ctx.font = 'bold 20px DungGeunMo, sans-serif';
    ctx.fillStyle = '#f39c12';
    ctx.textAlign = 'center';
    ctx.fillText('단계 6', this.config.width / 2, this.config.height * 0.35);

    ctx.font = 'bold 36px DungGeunMo, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('품평회', this.config.width / 2, this.config.height * 0.43);

    ctx.font = '16px DungGeunMo, sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('가족과 친구의 평가를 받아보세요!', this.config.width / 2, this.config.height * 0.52);

    const emojiScale = 1 + Math.sin(this.phaseTimer * 5) * 0.1;
    ctx.font = `${60 * emojiScale}px sans-serif`;
    ctx.fillText('👨‍👩‍👧‍👦', this.config.width / 2, this.config.height * 0.68);

    ctx.restore();

    if (progress > 0.5) {
      const blinkAlpha = 0.5 + Math.sin(this.phaseTimer * 8) * 0.3;
      ctx.font = '14px DungGeunMo, sans-serif';
      ctx.fillStyle = `rgba(255, 255, 255, ${blinkAlpha})`;
      ctx.textAlign = 'center';
      ctx.fillText('터치하여 시작', this.config.width / 2, this.config.height * 0.85);
    }
  }

  renderDrumroll(ctx) {
    // 두구두구 효과
    const alpha = 0.5 + Math.abs(Math.sin(this.phaseTimer * 10)) * 0.5;
    const scale = 1 + Math.sin(this.phaseTimer * 15) * 0.05;

    ctx.save();
    ctx.translate(this.config.width / 2, 100);
    ctx.scale(scale, scale);

    ctx.font = 'bold 36px DungGeunMo, sans-serif';
    ctx.shadowColor = '#f39c12';
    ctx.shadowBlur = 20;
    ctx.fillStyle = `rgba(243, 156, 18, ${alpha})`;
    ctx.textAlign = 'center';
    ctx.fillText('두구두구...', 0, 0);
    ctx.shadowBlur = 0;

    ctx.restore();

    // 드럼롤 파티클
    if (Math.random() < 0.1) {
      particleSystem.emitSparkle(
        Math.random() * this.config.width,
        Math.random() * this.config.height * 0.3,
        2
      );
    }
  }

  renderFamilyReaction(ctx) {
    this.renderBubble(ctx, 80, this.config.height * 0.18, this.currentFamilyReaction, true);
  }

  renderFriendReaction(ctx) {
    // 가족 반응도 유지
    this.renderBubble(ctx, 80, this.config.height * 0.18, this.currentFamilyReaction, false);
    // 친구 반응
    this.renderBubble(ctx, this.config.width - 80, this.config.height * 0.18, this.currentFriendReaction, true);
  }

  renderBubble(ctx, x, y, text, animate) {
    const scale = animate ? this.bubbleScale : 1;
    const yOffset = animate ? this.bubbleY : 0;

    if (scale <= 0) return;

    const padding = 15;
    ctx.font = '14px DungGeunMo, sans-serif';
    const textWidth = ctx.measureText(text).width;
    const bubbleWidth = Math.min(textWidth + padding * 2, 180);
    const bubbleHeight = 45;

    const bubbleX = x - bubbleWidth / 2;
    const bubbleY = y + yOffset;

    ctx.save();
    ctx.translate(x, bubbleY + bubbleHeight / 2);
    ctx.scale(scale, scale);
    ctx.translate(-x, -(bubbleY + bubbleHeight / 2));

    // 말풍선 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.roundRect(bubbleX + 3, bubbleY + 3, bubbleWidth, bubbleHeight, 12);
    ctx.fill();

    // 말풍선 배경
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 12);
    ctx.fill();

    // 말풍선 꼬리
    ctx.beginPath();
    ctx.moveTo(x - 10, bubbleY + bubbleHeight);
    ctx.lineTo(x, bubbleY + bubbleHeight + 12);
    ctx.lineTo(x + 10, bubbleY + bubbleHeight);
    ctx.fill();

    // 텍스트
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, bubbleY + 28);

    ctx.restore();
  }

  renderScoreboard(ctx) {
    // 점수판 배경
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    // 배경 별도 렌더
    this.bgStars.forEach(star => {
      const alpha = 0.2 + Math.sin(star.twinkle) * 0.2;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });

    const centerX = this.config.width / 2;

    // 제목
    ctx.font = 'bold 32px DungGeunMo, sans-serif';
    ctx.shadowColor = '#f39c12';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#f39c12';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 품평 결과', centerX, 60);
    ctx.shadowBlur = 0;

    // 현재 레시피 표시
    if (this.currentRecipe) {
      ctx.font = '14px DungGeunMo, sans-serif';
      ctx.fillStyle = '#888';
      ctx.fillText(`${this.currentRecipe.icon} ${this.currentRecipe.name}`, centerX, 85);
    }

    // 세부 점수
    const categories = [
      { name: '풍미', score: this.scoreBreakdown.flavor, icon: '👃', color: '#e74c3c' },
      { name: '식감', score: this.scoreBreakdown.texture, icon: '🦷', color: '#3498db' },
      { name: '비주얼', score: this.scoreBreakdown.visual, icon: '👀', color: '#9b59b6' }
    ];

    ctx.font = '18px DungGeunMo, sans-serif';
    categories.forEach((cat, i) => {
      const y = 130 + i * 70;
      const barProgress = this.barAnimations[i];

      // 아이콘 및 이름
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.fillText(`${cat.icon} ${cat.name}`, 40, y);

      // 점수 바 배경
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(130, y - 18, 170, 24, 5);
      ctx.fill();

      // 점수 바
      const barGradient = ctx.createLinearGradient(130, 0, 300, 0);
      barGradient.addColorStop(0, cat.color);
      barGradient.addColorStop(1, cat.color + '88');
      ctx.fillStyle = barGradient;
      ctx.beginPath();
      ctx.roundRect(130, y - 18, 170 * (cat.score / 100) * barProgress, 24, 5);
      ctx.fill();

      // 점수 텍스트
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      const displayScore = Math.floor(cat.score * barProgress);
      ctx.fillText(`${displayScore}점`, this.config.width - 40, y);
    });

    // 구분선
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 330);
    ctx.lineTo(this.config.width - 40, 330);
    ctx.stroke();

    // 총점
    if (this.scoreRevealProgress > 0.5) {
      const scoreAlpha = (this.scoreRevealProgress - 0.5) * 2;

      ctx.globalAlpha = scoreAlpha;
      ctx.font = 'bold 56px DungGeunMo, sans-serif';
      ctx.textAlign = 'center';

      // 점수에 따른 색상
      let scoreColor = '#e74c3c';
      if (this.finalScore >= 200) scoreColor = '#f39c12';
      if (this.finalScore >= 250) scoreColor = '#2ecc71';

      ctx.shadowColor = scoreColor;
      ctx.shadowBlur = 20;
      ctx.fillStyle = scoreColor;
      ctx.fillText(`${Math.floor(this.displayedScore)}점`, centerX, 400);
      ctx.shadowBlur = 0;

      ctx.font = '18px DungGeunMo, sans-serif';
      ctx.fillStyle = '#888';
      ctx.fillText('/ 300점', centerX, 435);
      ctx.globalAlpha = 1;
    }

    // 등급
    if (this.gradeScale > 0) {
      let grade = 'C';
      let gradeColor = '#e74c3c';
      if (this.finalScore >= 250) { grade = 'S'; gradeColor = '#ffd700'; }
      else if (this.finalScore >= 220) { grade = 'A'; gradeColor = '#2ecc71'; }
      else if (this.finalScore >= 180) { grade = 'B'; gradeColor = '#f39c12'; }

      ctx.save();
      ctx.translate(centerX, this.config.height * 0.72);

      // 바운스 스케일
      const bounceScale = this.gradeScale < 1
        ? 1 + Math.sin(this.gradeScale * Math.PI) * 0.3
        : 1;
      ctx.scale(bounceScale, bounceScale);

      // 등급 배경 원
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(0, 0, 70, 0, Math.PI * 2);
      ctx.fill();

      // 등급 글로우
      ctx.shadowColor = gradeColor;
      ctx.shadowBlur = 30;
      ctx.font = 'bold 90px DungGeunMo, sans-serif';
      ctx.fillStyle = gradeColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(grade, 0, 0);
      ctx.shadowBlur = 0;

      ctx.restore();

      // S랭크 특별 효과
      if (grade === 'S' && this.gradeScale >= 1) {
        const sparkleAlpha = 0.5 + Math.sin(this.phaseTimer * 8) * 0.3;
        ctx.fillStyle = `rgba(255, 215, 0, ${sparkleAlpha})`;
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✨', centerX - 60, this.config.height * 0.68);
        ctx.fillText('✨', centerX + 60, this.config.height * 0.68);
        ctx.fillText('⭐', centerX, this.config.height * 0.60);
      }
    }

    // 다음 버튼
    if (this.scoreRevealProgress >= 1) {
      const blinkAlpha = 0.5 + Math.sin(this.phaseTimer * 5) * 0.3;
      ctx.font = '16px DungGeunMo, sans-serif';
      ctx.fillStyle = `rgba(255, 255, 255, ${blinkAlpha})`;
      ctx.textAlign = 'center';
      ctx.fillText('터치하여 가게로 돌아가기 →', centerX, this.config.height - 40);
    }
  }
}
