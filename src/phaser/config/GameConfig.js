/**
 * 게임 설정 상수
 * Good Pizza, Great Pizza 스타일의 모바일 타이쿤 게임
 */

// 게임 해상도 (9:16 모바일 세로 비율)
export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

// 색상 팔레트 (프리미엄 베이커리 테마)
export const COLORS = {
  // 배경 (그라데이션용)
  background: 0xF5E6CA,
  bgGradientTop: 0xFFF8F0,
  bgGradientBottom: 0xE8D5B7,

  // 카운터/주방
  counterWood: 0x6D4C41,
  counterWoodLight: 0x8D6E63,
  counterWoodDark: 0x4E342E,
  counterTop: 0xE8D4B8,
  counterTopHighlight: 0xFFF3E0,
  wall: 0xFFFBF5,
  wallAccent: 0xF5EDE3,

  // 타일/바닥
  tileLight: 0xECE0D1,
  tileDark: 0xD7CCC8,
  tileShadow: 0xBCAAA4,

  // UI 버튼 (그라데이션 스타일)
  primary: 0x6D4C41,
  primaryLight: 0x8D6E63,
  primaryDark: 0x4E342E,

  secondary: 0xA1887F,
  secondaryLight: 0xBCAAA4,
  secondaryDark: 0x8D6E63,

  accent: 0xFFB74D,
  accentLight: 0xFFCC80,
  accentDark: 0xFFA726,

  success: 0x66BB6A,
  successLight: 0x81C784,
  successDark: 0x4CAF50,

  danger: 0xEF5350,
  dangerLight: 0xE57373,
  dangerDark: 0xF44336,

  warning: 0xFFCA28,
  warningLight: 0xFFD54F,
  warningDark: 0xFFC107,

  // 텍스트
  textDark: 0x3E2723,
  textMedium: 0x5D4037,
  textLight: 0xFFFDE7,
  textGold: 0xFFD54F,
  textMuted: 0xA1887F,

  // 오버레이/모달
  overlay: 0x1A1A1A,
  cardBg: 0xFFFBF5,
  cardBorder: 0xD7CCC8,
  modalShadow: 0x3E2723,

  // 글로우/이펙트
  glowGold: 0xFFD700,
  glowSuccess: 0x69F0AE,
  glowDanger: 0xFF5252,
  glowMagic: 0xE040FB,

  // 진행 바
  progressBg: 0x4E342E,
  progressFill: 0xFFB74D,
  progressGlow: 0xFFE082,

  // 손님 타입별 색상 (더 선명하게)
  customer: {
    student: 0x42A5F5,
    hipster: 0xAB47BC,
    tourist: 0xFFD54F,
    grandma: 0xFF8A65,
    businessman: 0x546E7A
  }
};

// 그라데이션 프리셋
export const GRADIENTS = {
  warmBg: [0xFFF8F0, 0xF5E6CA],
  coolBg: [0xE3F2FD, 0xBBDEFB],
  goldShine: [0xFFE082, 0xFFB74D, 0xFF8F00],
  woodGrain: [0x8D6E63, 0x6D4C41, 0x4E342E],
  sunset: [0xFFCC80, 0xFFAB91, 0xFFAB40]
};

// 그림자 설정
export const SHADOWS = {
  button: { offsetX: 3, offsetY: 3, color: 0x000000, alpha: 0.25 },
  card: { offsetX: 0, offsetY: 4, color: 0x000000, alpha: 0.15 },
  float: { offsetX: 0, offsetY: 8, color: 0x000000, alpha: 0.2 },
  inset: { offsetX: 0, offsetY: -2, color: 0x000000, alpha: 0.1 }
};

// 손님 정보
export const CUSTOMER_TYPES = {
  STUDENT: {
    key: 'student',
    name: '학생',
    color: COLORS.customer.student,
    patience: 1.0,
    tipMultiplier: 0.8,
    orderQuantity: [1, 2]
  },
  HIPSTER: {
    key: 'hipster',
    name: '힙스터',
    color: COLORS.customer.hipster,
    patience: 0.7,
    tipMultiplier: 1.2,
    orderQuantity: [1, 1]
  },
  TOURIST: {
    key: 'tourist',
    name: '관광객',
    color: COLORS.customer.tourist,
    patience: 0.9,
    tipMultiplier: 2.0,
    orderQuantity: [2, 4]
  },
  GRANDMA: {
    key: 'grandma',
    name: '할머니',
    color: COLORS.customer.grandma,
    patience: 1.5,
    tipMultiplier: 1.0,
    orderQuantity: [1, 3]
  },
  BUSINESSMAN: {
    key: 'businessman',
    name: '직장인',
    color: COLORS.customer.businessman,
    patience: 0.5,
    tipMultiplier: 1.5,
    orderQuantity: [1, 2]
  }
};

// 레시피 정보
export const RECIPES = {
  CLASSIC: {
    key: 'classic',
    name: '클래식 두쫀쿠',
    basePrice: 5000,
    ingredients: ['kadaif', 'pistachio', 'marshmallow', 'cocoa']
  },
  GOLDEN: {
    key: 'golden',
    name: '골든 럭셔리',
    basePrice: 8000,
    ingredients: ['kadaif', 'pistachio', 'marshmallow', 'cocoa', 'gold']
  }
};

// 재료 정보
export const INGREDIENTS = {
  KADAIF: { key: 'kadaif', name: '카다이프', color: 0xD4A574 },
  PISTACHIO: { key: 'pistachio', name: '피스타치오', color: 0x7CB342 },
  MARSHMALLOW: { key: 'marshmallow', name: '마시멜로', color: 0xFFEFD5 },
  COCOA: { key: 'cocoa', name: '코코아', color: 0x5D4037 },
  GOLD: { key: 'gold', name: '금가루', color: 0xFFD700 }
};

// 애니메이션 설정
export const ANIM = {
  customerEnterDuration: 800,
  customerExitDuration: 600,
  bubblePopDuration: 300,
  buttonPressDuration: 100
};

// 폰트 패밀리 (Premium)
export const FONT_FAMILY = 'DungGeunMo, Galmuri11, monospace';

// 타이포그래피 설정 (Premium Quality)
export const TYPOGRAPHY = {
  // 자간 설정
  letterSpacing: {
    tight: -1,
    normal: 1,
    wide: 2
  },
  // 행간 설정 (Phaser는 lineSpacing 사용)
  lineSpacing: {
    tight: 2,
    normal: 6,
    relaxed: 10
  }
};

// 폰트 설정 (사전 구성된 스타일) - Premium
export const FONTS = {
  // 타이틀 (대형)
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: '36px',
    stroke: '#3E2723',
    strokeThickness: 4,
    shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
  },
  // 서브타이틀
  subtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: '28px',
    stroke: '#3E2723',
    strokeThickness: 3
  },
  // 대형 텍스트
  large: {
    fontFamily: FONT_FAMILY,
    fontSize: '24px',
    stroke: '#000000',
    strokeThickness: 2
  },
  // 일반 텍스트
  normal: {
    fontFamily: FONT_FAMILY,
    fontSize: '18px',
    stroke: '#000000',
    strokeThickness: 1
  },
  // 작은 텍스트
  small: {
    fontFamily: FONT_FAMILY,
    fontSize: '14px'
  },
  // 아주 작은 텍스트
  tiny: {
    fontFamily: FONT_FAMILY,
    fontSize: '12px'
  },
  // UI 버튼용
  button: {
    fontFamily: FONT_FAMILY,
    fontSize: '18px',
    stroke: '#2D2016',
    strokeThickness: 2,
    shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true }
  },
  // 점수/숫자 표시용
  score: {
    fontFamily: FONT_FAMILY,
    fontSize: '32px',
    stroke: '#000000',
    strokeThickness: 4,
    shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 0, fill: true }
  },
  // 팝업 텍스트
  popup: {
    fontFamily: FONT_FAMILY,
    fontSize: '22px',
    stroke: '#000000',
    strokeThickness: 3
  }
};

// ========================================
// 유틸리티 함수
// ========================================

/**
 * 16진수 색상을 CSS 문자열로 변환
 * @param {number} hex - 0xRRGGBB 형식
 * @returns {string} '#RRGGBB' 형식
 */
export const hexToString = (hex) => '#' + hex.toString(16).padStart(6, '0');

/**
 * 텍스트 스타일 생성 헬퍼 (Premium)
 * @param {string} size - '14px' 등
 * @param {string} color - '#FFFFFF' 등
 * @param {Object} extras - 추가 옵션
 */
export const textStyle = (size, color = '#FFF8E7', extras = {}) => ({
  fontFamily: FONT_FAMILY,
  fontSize: size,
  color,
  lineSpacing: TYPOGRAPHY.lineSpacing.normal,
  ...extras
});

/**
 * 프리미엄 텍스트 스타일 생성
 * @param {string} preset - 'title', 'large', 'normal', 'small', 'button', 'score'
 * @param {string} color - '#FFFFFF' 등
 * @param {Object} extras - 추가 옵션
 */
export const premiumTextStyle = (preset, color = '#FFF8E7', extras = {}) => ({
  ...FONTS[preset],
  color,
  lineSpacing: TYPOGRAPHY.lineSpacing.normal,
  ...extras
});

/**
 * 그림자 있는 텍스트 스타일
 */
export const shadowTextStyle = (size, color = '#FFF8E7', shadowColor = '#000000') => ({
  fontFamily: FONT_FAMILY,
  fontSize: size,
  color,
  stroke: shadowColor,
  strokeThickness: Math.max(1, parseInt(size) / 12),
  shadow: {
    offsetX: 2,
    offsetY: 2,
    color: shadowColor,
    blur: 2,
    fill: true
  }
});

/**
 * Phaser Scene에 픽셀 스타일 버튼 생성
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} color - 버튼 색상 (hex)
 * @param {string} text - 버튼 텍스트
 * @param {Object} options - { depth, strokeColor, fontSize, onClick }
 * @returns {{ btn: Phaser.GameObjects.Rectangle, label: Phaser.GameObjects.Text }}
 */
export const createPixelButton = (scene, x, y, width, height, color, text, options = {}) => {
  const {
    depth = 200,
    strokeColor = 0x2D2016,
    fontSize = '16px',
    onClick = null
  } = options;

  // 그림자
  scene.add.rectangle(x + 3, y + 3, width, height, 0x000000, 0.3)
    .setDepth(depth);

  // 버튼 본체
  const btn = scene.add.rectangle(x, y, width, height, color)
    .setStrokeStyle(3, strokeColor)
    .setDepth(depth)
    .setInteractive({ useHandCursor: true });

  // 텍스트
  const label = scene.add.text(x, y, text, {
    fontFamily: FONT_FAMILY,
    fontSize,
    color: '#FFF8E7'
  }).setOrigin(0.5).setDepth(depth);

  // 클릭 핸들러
  if (onClick) {
    btn.on('pointerdown', onClick);
  }

  return { btn, label };
};
