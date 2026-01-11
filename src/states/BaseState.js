/**
 * BaseState - 모든 게임 상태의 기본 클래스
 */

export class BaseState {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
    this.config = game.config;
  }

  /**
   * 상태 진입 시 호출
   */
  enter(params = {}) {}

  /**
   * 상태 종료 시 호출
   */
  exit() {}

  /**
   * 매 프레임 업데이트
   */
  update(dt) {}

  /**
   * 매 프레임 렌더링
   */
  render(ctx) {}

  /**
   * 텍스트 그리기 헬퍼
   */
  drawText(text, x, y, options = {}) {
    const {
      font = '16px DungGeunMo, sans-serif',
      color = '#fff',
      align = 'left',
      baseline = 'top',
      shadow = false
    } = options;

    this.ctx.font = font;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;

    if (shadow) {
      this.ctx.fillStyle = '#000';
      this.ctx.fillText(text, x + 2, y + 2);
    }

    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
  }

  /**
   * 버튼 그리기 헬퍼
   */
  drawButton(text, x, y, width, height, isHovered = false) {
    // 버튼 배경
    this.ctx.fillStyle = isHovered ? '#2ecc71' : '#27ae60';
    this.ctx.fillRect(x, y, width, height);

    // 버튼 테두리
    this.ctx.strokeStyle = '#1e8449';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x, y, width, height);

    // 버튼 텍스트
    this.drawText(text, x + width / 2, y + height / 2, {
      font: '20px DungGeunMo, sans-serif',
      align: 'center',
      baseline: 'middle',
      shadow: true
    });

    return { x, y, width, height };
  }

  /**
   * 점이 영역 안에 있는지 확인
   */
  isPointInRect(point, rect) {
    return point.x >= rect.x &&
           point.x <= rect.x + rect.width &&
           point.y >= rect.y &&
           point.y <= rect.y + rect.height;
  }
}
