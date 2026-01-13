/**
 * InputManager - 터치/마우스 입력 관리
 *
 * 탭/드래그/스와이프 감지 개선
 */

import { soundManager } from './SoundManager.js';

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.soundActivated = false;

    // 터치 상태
    this.touches = [];
    this.isTouching = false;
    this.touchStart = null;
    this.touchEnd = null;

    // 제스처 감지 - 임계값 완화
    this.swipeThreshold = 50;
    this.tapDistanceThreshold = 30;    // 탭으로 인식할 최대 이동 거리 (10 -> 30)
    this.tapDurationThreshold = 500;   // 탭으로 인식할 최대 시간 (200ms -> 500ms)
    this.swipeDirection = null;

    // 드래그 상태
    this.isDragging = false;
    this.dragDistance = 0;
    this.dragAngle = 0;

    // 이벤트 콜백
    this.onTap = null;
    this.onSwipe = null;
    this.onDrag = null;
    this.onDragEnd = null;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // 터치 이벤트
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });

    // 마우스 이벤트 (데스크톱 테스트용)
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
  }

  /**
   * 캔버스 좌표로 변환
   */
  getCanvasCoords(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  handleTouchStart(e) {
    e.preventDefault();

    // 첫 터치 시 사운드 활성화
    if (!this.soundActivated) {
      soundManager.resume();
      this.soundActivated = true;
    }

    const touch = e.touches[0];
    const coords = this.getCanvasCoords(touch.clientX, touch.clientY);

    this.isTouching = true;
    this.isDragging = true;
    this.touchStart = { ...coords, time: Date.now() };
    this.touches = [coords];
    this.dragDistance = 0;
    this.dragAngle = 0;
  }

  handleTouchMove(e) {
    e.preventDefault();
    if (!this.isTouching) return;

    const touch = e.touches[0];
    const coords = this.getCanvasCoords(touch.clientX, touch.clientY);

    // 드래그 거리 계산
    const lastTouch = this.touches[this.touches.length - 1];
    const dx = coords.x - lastTouch.x;
    const dy = coords.y - lastTouch.y;
    this.dragDistance += Math.sqrt(dx * dx + dy * dy);

    // 각도 계산 (원형 드래그용)
    if (this.touchStart) {
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      const angle1 = Math.atan2(lastTouch.y - centerY, lastTouch.x - centerX);
      const angle2 = Math.atan2(coords.y - centerY, coords.x - centerX);

      let deltaAngle = angle2 - angle1;
      if (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
      if (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;

      this.dragAngle += deltaAngle;
    }

    // touches 배열 크기 제한 (메모리 관리)
    if (this.touches.length > 100) {
      this.touches = this.touches.slice(-50);
    }
    this.touches.push(coords);

    // 드래그 콜백 호출
    if (this.onDrag) {
      this.onDrag(coords, this.dragDistance, this.dragAngle);
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();
    if (!this.isTouching) return;

    const coords = this.touches[this.touches.length - 1] || this.touchStart;
    this.touchEnd = { ...coords, time: Date.now() };

    // 스와이프/탭 감지
    if (this.touchStart && this.touchEnd) {
      const dx = this.touchEnd.x - this.touchStart.x;
      const dy = this.touchEnd.y - this.touchStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const duration = this.touchEnd.time - this.touchStart.time;

      if (distance > this.swipeThreshold && duration < 300) {
        // 스와이프
        if (Math.abs(dx) > Math.abs(dy)) {
          this.swipeDirection = dx > 0 ? 'right' : 'left';
        } else {
          this.swipeDirection = dy > 0 ? 'down' : 'up';
        }

        if (this.onSwipe) {
          this.onSwipe(this.swipeDirection, distance);
        }
      } else if (distance < this.tapDistanceThreshold && duration < this.tapDurationThreshold) {
        // 탭 (임계값 완화됨)
        if (this.onTap) {
          this.onTap(coords);
        }
      }
    }

    if (this.onDragEnd) {
      this.onDragEnd(this.dragDistance, this.dragAngle);
    }

    this.reset();
  }

  // 마우스 이벤트 (데스크톱)
  handleMouseDown(e) {
    // 첫 클릭 시 사운드 활성화
    if (!this.soundActivated) {
      soundManager.resume();
      this.soundActivated = true;
    }

    const coords = this.getCanvasCoords(e.clientX, e.clientY);
    this.isTouching = true;
    this.isDragging = true;
    this.touchStart = { ...coords, time: Date.now() };
    this.touches = [coords];
    this.dragDistance = 0;
    this.dragAngle = 0;
  }

  handleMouseMove(e) {
    if (!this.isTouching) return;
    const coords = this.getCanvasCoords(e.clientX, e.clientY);

    const lastTouch = this.touches[this.touches.length - 1];
    const dx = coords.x - lastTouch.x;
    const dy = coords.y - lastTouch.y;
    this.dragDistance += Math.sqrt(dx * dx + dy * dy);

    // 각도 계산 (원형 드래그용)
    if (this.touchStart) {
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      const angle1 = Math.atan2(lastTouch.y - centerY, lastTouch.x - centerX);
      const angle2 = Math.atan2(coords.y - centerY, coords.x - centerX);

      let deltaAngle = angle2 - angle1;
      if (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
      if (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;

      this.dragAngle += deltaAngle;
    }

    // touches 배열 크기 제한
    if (this.touches.length > 100) {
      this.touches = this.touches.slice(-50);
    }
    this.touches.push(coords);

    if (this.onDrag) {
      this.onDrag(coords, this.dragDistance, this.dragAngle);
    }
  }

  handleMouseUp(e) {
    if (!this.isTouching) return;

    const coords = this.touches[this.touches.length - 1] || this.touchStart;
    this.touchEnd = { ...coords, time: Date.now() };

    if (this.touchStart && this.touchEnd) {
      const dx = this.touchEnd.x - this.touchStart.x;
      const dy = this.touchEnd.y - this.touchStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const duration = this.touchEnd.time - this.touchStart.time;

      // 마우스에서도 탭 임계값 동일하게 적용
      if (distance < this.tapDistanceThreshold && duration < this.tapDurationThreshold) {
        if (this.onTap) {
          this.onTap(coords);
        }
      }
    }

    if (this.onDragEnd) {
      this.onDragEnd(this.dragDistance, this.dragAngle);
    }

    this.reset();
  }

  reset() {
    this.isTouching = false;
    this.isDragging = false;
    this.touchStart = null;
    this.touchEnd = null;
    this.swipeDirection = null;
    this.dragDistance = 0;
    this.dragAngle = 0;
    this.touches = [];
  }

  update() {
    // 프레임별 입력 상태 업데이트
  }
}
