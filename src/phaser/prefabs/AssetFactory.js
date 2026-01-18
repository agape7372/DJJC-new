/**
 * AssetFactory.js - 프로시저럴 텍스처 생성기
 * 두바이 초콜릿 쿠키 재료들을 Phaser Graphics로 그림
 *
 * 재료:
 * 1. 카다이프면 (Kadayif) - 얇은 튀김면 얽힘 질감
 * 2. 피스타치오 스프레드 - 울퉁불퉁한 짙은 초록 덩어리
 * 3. 쿠키 도우 - 초코칩이 박힌 연한 갈색 반죽
 * 4. 멜팅 초콜릿 - 흘러내리는 드립 효과
 */

import Phaser from 'phaser';

// 색상 팔레트
export const DUBAI_COOKIE_COLORS = {
  // 카다이프
  kadaif: {
    base: 0xE8D4A8,      // 베이지 바탕
    strand: 0xC9A86C,    // 골든 브라운 면발
    strandDark: 0x8B6914, // 진한 갈색 (튀긴 부분)
    highlight: 0xF5E6C8   // 하이라이트
  },
  // 피스타치오 스프레드
  pistachio: {
    base: 0x5D8827,       // 짙은 초록 (요청된 색상)
    dark: 0x3D5A1A,       // 더 진한 부분
    light: 0x7CAA3E,      // 밝은 부분
    chunk: 0x4A6B1F       // 피스타치오 조각
  },
  // 쿠키 도우
  dough: {
    raw: 0xE8C99B,        // 굽기 전 연한 갈색
    baked: 0xC4956A,      // 구운 후 노릇한 색
    bakedDark: 0xA67744,  // 테두리
    chocochip: 0x3D2314,  // 초코칩
    chocochipLight: 0x5D3A20
  },
  // 멜팅 초콜릿
  chocolate: {
    base: 0x3D2314,       // 다크 초콜릿
    dark: 0x2A1810,       // 그림자
    highlight: 0x5D3A20,  // 하이라이트
    drip: 0x4A2A18        // 드립 색상
  }
};

/**
 * AssetFactory - 재료 비주얼 생성 클래스
 */
export class AssetFactory {
  constructor(scene) {
    this.scene = scene;
  }

  // ============================================
  // 카다이프면 (Kadayif) - 튀긴 면발 질감
  // ============================================

  /**
   * 카다이프면 그리기 - 얇은 선들이 얽혀있는 튀김 질감
   * @param {number} x - 중심 X
   * @param {number} y - 중심 Y
   * @param {number} radius - 반지름
   * @param {object} options - 추가 옵션
   * @returns {Phaser.GameObjects.Container}
   */
  createKadaif(x, y, radius = 40, options = {}) {
    const container = this.scene.add.container(x, y);
    const colors = DUBAI_COOKIE_COLORS.kadaif;

    // 베이스 (베이지색 배경)
    const base = this.scene.add.ellipse(0, 0, radius * 2, radius * 1.8, colors.base);
    base.setStrokeStyle(2, colors.strand);
    container.add(base);

    // 면발 그리기 (Graphics)
    const strandGraphics = this.scene.add.graphics();
    const strandCount = options.density || 25;

    for (let i = 0; i < strandCount; i++) {
      // 랜덤 시작점
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (radius - 10);
      const startX = Math.cos(angle) * dist;
      const startY = Math.sin(angle) * dist * 0.9;

      // 곡선으로 면발 표현
      const curveLength = Phaser.Math.Between(15, 35);
      const curveAngle = Math.random() * Math.PI * 2;

      // 면발 색상 (튀긴 정도에 따라)
      const isFried = Math.random() > 0.6;
      const strokeColor = isFried ? colors.strandDark : colors.strand;
      const strokeWidth = Phaser.Math.FloatBetween(1, 2.5);

      strandGraphics.lineStyle(strokeWidth, strokeColor, 0.9);
      strandGraphics.beginPath();
      strandGraphics.moveTo(startX, startY);

      // 베지어 곡선으로 자연스러운 면발
      const cp1x = startX + Math.cos(curveAngle) * curveLength * 0.3;
      const cp1y = startY + Math.sin(curveAngle) * curveLength * 0.3;
      const cp2x = startX + Math.cos(curveAngle + 0.5) * curveLength * 0.6;
      const cp2y = startY + Math.sin(curveAngle + 0.5) * curveLength * 0.6;
      const endX = startX + Math.cos(curveAngle) * curveLength;
      const endY = startY + Math.sin(curveAngle) * curveLength * 0.9;

      // 타원 경계 내로 제한
      const clampedEndX = Phaser.Math.Clamp(endX, -radius + 5, radius - 5);
      const clampedEndY = Phaser.Math.Clamp(endY, -radius * 0.85, radius * 0.85);

      strandGraphics.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, clampedEndX, clampedEndY);
      strandGraphics.strokePath();
    }

    container.add(strandGraphics);

    // 하이라이트 점들 (바삭한 느낌)
    const highlightGraphics = this.scene.add.graphics();
    highlightGraphics.fillStyle(colors.highlight, 0.4);
    for (let i = 0; i < 8; i++) {
      const hx = Phaser.Math.Between(-radius + 10, radius - 10);
      const hy = Phaser.Math.Between(-radius * 0.7, radius * 0.7);
      highlightGraphics.fillCircle(hx, hy, Phaser.Math.Between(2, 4));
    }
    container.add(highlightGraphics);

    container.assetType = 'kadaif';
    return container;
  }

  // ============================================
  // 피스타치오 스프레드 - 꾸덕한 초록 덩어리
  // ============================================

  /**
   * 피스타치오 스프레드 그리기 - 울퉁불퉁한 질감
   * @param {number} x - 중심 X
   * @param {number} y - 중심 Y
   * @param {number} radius - 반지름
   * @param {object} options - 추가 옵션
   * @returns {Phaser.GameObjects.Container}
   */
  createPistachioSpread(x, y, radius = 35, options = {}) {
    const container = this.scene.add.container(x, y);
    const colors = DUBAI_COOKIE_COLORS.pistachio;

    // 울퉁불퉁한 외곽선을 위한 Graphics
    const spreadGraphics = this.scene.add.graphics();

    // 베이스 불규칙한 형태 (다각형으로 표현)
    const points = [];
    const segments = 12;

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      // 불규칙한 반지름으로 울퉁불퉁 효과
      const variation = Phaser.Math.FloatBetween(0.75, 1.1);
      const r = radius * variation;
      points.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r * 0.85
      });
    }

    // 메인 스프레드 (짙은 초록)
    spreadGraphics.fillStyle(colors.base);
    spreadGraphics.beginPath();
    spreadGraphics.moveTo(points[0].x, points[0].y);

    for (let i = 1; i <= segments; i++) {
      const curr = points[i % segments];
      const prev = points[(i - 1) % segments];
      const cpX = (prev.x + curr.x) / 2 + Phaser.Math.Between(-5, 5);
      const cpY = (prev.y + curr.y) / 2 + Phaser.Math.Between(-5, 5);
      spreadGraphics.quadraticBezierTo(cpX, cpY, curr.x, curr.y);
    }
    spreadGraphics.closePath();
    spreadGraphics.fillPath();

    // 테두리
    spreadGraphics.lineStyle(2, colors.dark);
    spreadGraphics.strokePath();

    container.add(spreadGraphics);

    // 질감 - 어두운 부분 (그림자)
    const textureGraphics = this.scene.add.graphics();
    for (let i = 0; i < 6; i++) {
      const tx = Phaser.Math.Between(-radius + 8, radius - 8);
      const ty = Phaser.Math.Between(-radius * 0.6, radius * 0.6);
      const tSize = Phaser.Math.Between(8, 15);

      textureGraphics.fillStyle(colors.dark, 0.4);
      textureGraphics.fillEllipse(tx, ty, tSize, tSize * 0.7);
    }
    container.add(textureGraphics);

    // 피스타치오 조각들 (밝은 점)
    const chunkGraphics = this.scene.add.graphics();
    for (let i = 0; i < 5; i++) {
      const cx = Phaser.Math.Between(-radius + 10, radius - 10);
      const cy = Phaser.Math.Between(-radius * 0.5, radius * 0.5);

      chunkGraphics.fillStyle(colors.light, 0.7);
      chunkGraphics.fillEllipse(cx, cy, 4, 3);
    }
    container.add(chunkGraphics);

    // 하이라이트 (꾸덕한 광택)
    const highlightGraphics = this.scene.add.graphics();
    highlightGraphics.fillStyle(0xFFFFFF, 0.15);
    highlightGraphics.fillEllipse(-radius * 0.3, -radius * 0.3, radius * 0.5, radius * 0.3);
    container.add(highlightGraphics);

    container.assetType = 'pistachio';
    return container;
  }

  // ============================================
  // 쿠키 도우 - 초코칩이 박힌 반죽
  // ============================================

  /**
   * 쿠키 도우 그리기 - 초코칩 포함
   * @param {number} x - 중심 X
   * @param {number} y - 중심 Y
   * @param {number} radius - 반지름
   * @param {object} options - { bakeProgress: 0~1 }
   * @returns {Phaser.GameObjects.Container}
   */
  createCookieDough(x, y, radius = 100, options = {}) {
    const container = this.scene.add.container(x, y);
    const colors = DUBAI_COOKIE_COLORS.dough;
    const bakeProgress = options.bakeProgress || 0;

    // 굽기 진행도에 따른 색상 보간
    const currentColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(colors.raw),
      Phaser.Display.Color.IntegerToColor(colors.baked),
      100,
      bakeProgress * 100
    );
    const fillColor = Phaser.Display.Color.GetColor(currentColor.r, currentColor.g, currentColor.b);

    const currentBorderColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(colors.raw),
      Phaser.Display.Color.IntegerToColor(colors.bakedDark),
      100,
      bakeProgress * 100
    );
    const borderColor = Phaser.Display.Color.GetColor(currentBorderColor.r, currentBorderColor.g, currentBorderColor.b);

    // 그림자
    const shadow = this.scene.add.ellipse(6, 6, radius * 2, radius * 1.9, 0x000000, 0.25);
    container.add(shadow);

    // 반죽 본체
    const dough = this.scene.add.ellipse(0, 0, radius * 2, radius * 1.9, fillColor);
    dough.setStrokeStyle(4, borderColor);
    container.add(dough);
    container.doughBody = dough;

    // 반죽 질감 (부드러운 굴곡)
    const textureGraphics = this.scene.add.graphics();
    textureGraphics.fillStyle(borderColor, 0.15);
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (radius - 25);
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist * 0.95;
      textureGraphics.fillEllipse(tx, ty, 15, 12);
    }
    container.add(textureGraphics);

    // 초코칩들
    const chipCount = options.chipCount || 7;
    for (let i = 0; i < chipCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (radius - 20);
      const cx = Math.cos(angle) * dist;
      const cy = Math.sin(angle) * dist * 0.95;

      // 초코칩 (삼각형 + 원형 조합)
      const chipGraphics = this.scene.add.graphics();
      const chipSize = Phaser.Math.Between(6, 10);

      // 베이스 색상
      chipGraphics.fillStyle(colors.chocochip);
      chipGraphics.fillEllipse(cx, cy, chipSize, chipSize * 0.8);

      // 하이라이트
      chipGraphics.fillStyle(colors.chocochipLight, 0.5);
      chipGraphics.fillEllipse(cx - 1, cy - 1, chipSize * 0.4, chipSize * 0.3);

      container.add(chipGraphics);
    }

    // 하이라이트 (광택)
    const highlight = this.scene.add.ellipse(-radius * 0.25, -radius * 0.3, radius * 0.5, radius * 0.35, 0xFFFFFF, 0.12);
    container.add(highlight);

    container.assetType = 'dough';
    container.bakeProgress = bakeProgress;
    return container;
  }

  // ============================================
  // 멜팅 초콜릿 - 흘러내리는 드립 효과
  // ============================================

  /**
   * 멜팅 초콜릿 코팅 그리기
   * @param {number} x - 중심 X
   * @param {number} y - 중심 Y
   * @param {number} radius - 쿠키 반지름
   * @param {object} options - { coverage: 0~1 }
   * @returns {Phaser.GameObjects.Container}
   */
  createChocolateCoating(x, y, radius = 100, options = {}) {
    const container = this.scene.add.container(x, y);
    const colors = DUBAI_COOKIE_COLORS.chocolate;
    const coverage = options.coverage || 0.7;

    const coatingGraphics = this.scene.add.graphics();

    // 상단 초콜릿 코팅 (타원)
    const coatingRadius = radius * coverage;
    coatingGraphics.fillStyle(colors.base);
    coatingGraphics.fillEllipse(0, -radius * 0.1, coatingRadius * 1.8, coatingRadius * 1.4);

    // 드립 효과 (아래로 흘러내림)
    const dripCount = Phaser.Math.Between(5, 8);
    for (let i = 0; i < dripCount; i++) {
      const dripX = Phaser.Math.Between(-coatingRadius * 0.8, coatingRadius * 0.8);
      const dripLength = Phaser.Math.Between(20, 50);
      const dripWidth = Phaser.Math.Between(8, 15);

      // 드립 본체
      coatingGraphics.fillStyle(colors.drip);

      // 드립 형태 (위가 넓고 아래가 좁음)
      coatingGraphics.beginPath();
      coatingGraphics.moveTo(dripX - dripWidth / 2, radius * 0.3);
      coatingGraphics.lineTo(dripX + dripWidth / 2, radius * 0.3);
      coatingGraphics.quadraticBezierTo(
        dripX + dripWidth / 3, radius * 0.3 + dripLength * 0.7,
        dripX, radius * 0.3 + dripLength
      );
      coatingGraphics.quadraticBezierTo(
        dripX - dripWidth / 3, radius * 0.3 + dripLength * 0.7,
        dripX - dripWidth / 2, radius * 0.3
      );
      coatingGraphics.closePath();
      coatingGraphics.fillPath();

      // 드립 끝 (물방울)
      coatingGraphics.fillStyle(colors.base);
      coatingGraphics.fillCircle(dripX, radius * 0.3 + dripLength, dripWidth / 3);
    }

    container.add(coatingGraphics);

    // 초콜릿 광택
    const shineGraphics = this.scene.add.graphics();
    shineGraphics.fillStyle(colors.highlight, 0.3);
    shineGraphics.fillEllipse(-coatingRadius * 0.3, -radius * 0.3, coatingRadius * 0.5, coatingRadius * 0.25);
    container.add(shineGraphics);

    // 작은 광택 점들
    for (let i = 0; i < 4; i++) {
      const sx = Phaser.Math.Between(-coatingRadius * 0.5, coatingRadius * 0.3);
      const sy = Phaser.Math.Between(-radius * 0.4, 0);
      const shine = this.scene.add.ellipse(sx, sy, 4, 3, 0xFFFFFF, 0.25);
      container.add(shine);
    }

    container.assetType = 'chocolate';
    return container;
  }

  // ============================================
  // 트레이용 미니 아이콘
  // ============================================

  /**
   * 트레이에 표시할 미니 재료 아이콘
   */
  createIngredientIcon(x, y, type, size = 50) {
    switch (type) {
      case 'kadaif':
        return this.createKadaif(x, y, size / 2, { density: 15 });
      case 'pistachio':
        return this.createPistachioSpread(x, y, size / 2);
      case 'dough':
        return this.createCookieDough(x, y, size / 2, { chipCount: 4 });
      case 'chocolate':
        return this.createChocolateCoating(x, y, size / 2, { coverage: 0.5 });
      default:
        // 기본 원형
        const container = this.scene.add.container(x, y);
        container.add(this.scene.add.circle(0, 0, size / 2, 0xCCCCCC));
        return container;
    }
  }

  // ============================================
  // 필링 효과 (반죽 안에 차오르는 모습)
  // ============================================

  /**
   * 반죽 중앙에 속재료가 차오르는 효과
   * @param {Phaser.GameObjects.Container} doughContainer - 반죽 컨테이너
   * @param {string} fillingType - 'kadaif' | 'pistachio'
   * @param {number} fillLevel - 0~1
   */
  createFillingEffect(doughContainer, fillingType, fillLevel) {
    const container = this.scene.add.container(0, 0);
    const maxRadius = 60 * fillLevel;

    if (fillingType === 'kadaif') {
      const colors = DUBAI_COOKIE_COLORS.kadaif;
      const graphics = this.scene.add.graphics();

      // 베이스
      graphics.fillStyle(colors.base, 0.9);
      graphics.fillEllipse(0, 0, maxRadius * 2, maxRadius * 1.6);

      // 면발
      graphics.lineStyle(1.5, colors.strandDark, 0.8);
      const strandCount = Math.floor(15 * fillLevel);
      for (let i = 0; i < strandCount; i++) {
        const startX = Phaser.Math.Between(-maxRadius + 5, maxRadius - 5);
        const startY = Phaser.Math.Between(-maxRadius * 0.7, maxRadius * 0.7);
        const endX = startX + Phaser.Math.Between(-10, 10);
        const endY = startY + Phaser.Math.Between(-10, 10);

        graphics.lineBetween(startX, startY, endX, endY);
      }

      container.add(graphics);
    } else if (fillingType === 'pistachio') {
      const colors = DUBAI_COOKIE_COLORS.pistachio;
      const graphics = this.scene.add.graphics();

      // 불규칙한 덩어리
      graphics.fillStyle(colors.base, 0.95);
      const points = [];
      const segments = 8;

      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const r = maxRadius * Phaser.Math.FloatBetween(0.8, 1.1);
        points.push({
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r * 0.8
        });
      }

      graphics.beginPath();
      graphics.moveTo(points[0].x, points[0].y);
      for (let i = 1; i <= segments; i++) {
        const p = points[i % segments];
        graphics.lineTo(p.x, p.y);
      }
      graphics.closePath();
      graphics.fillPath();
      graphics.lineStyle(2, colors.dark);
      graphics.strokePath();

      container.add(graphics);
    }

    doughContainer.add(container);
    container.setDepth(5);

    // 등장 애니메이션
    container.setScale(0);
    this.scene.tweens.add({
      targets: container,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });

    return container;
  }
}

export default AssetFactory;
