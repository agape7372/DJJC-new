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

    // [Mobile Opt] 캐시된 캔버스 rect 및 스케일
    this._cachedRect = null;
    this._cachedScaleX = 1;
    this._cachedScaleY = 1;
    this._rectCacheDirty = true;

    // [Mobile Opt] 재사용 가능한 좌표 객체
    this._tempCoords = { x: 0, y: 0 };
    this._touchStartCoords = { x: 0, y: 0, time: 0 };
    this._touchEndCoords = { x: 0, y: 0, time: 0 };

    // [Mobile Opt] 바운드 함수 캐싱
    this._boundUpdateRect = this._updateCachedRect.bind(this);

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

    // [Mobile Opt] 리사이즈 시 rect 캐시 갱신
    window.addEventListener('resize', this._boundUpdateRect);
    window.addEventListener('orientationchange', this._boundUpdateRect);

    // 초기 rect 캐싱
    this._updateCachedRect();
  }

  /**
   * [Mobile Opt] 캐시된 rect 갱신
   */
  _updateCachedRect() {
    this._cachedRect = this.canvas.getBoundingClientRect();
    this._cachedScaleX = this.canvas.width / this._cachedRect.width;
    this._cachedScaleY = this.canvas.height / this._cachedRect.height;
    this._rectCacheDirty = false;
  }

  /**
   * 캔버스 좌표로 변환
   * [Mobile Opt] 캐시된 rect 사용 및 객체 재사용
   */
  getCanvasCoords(clientX, clientY, reuseObject = null) {
    // 캐시가 없거나 더티 상태면 갱신
    if (!this._cachedRect || this._rectCacheDirty) {
      this._updateCachedRect();
    }

    const target = reuseObject || this._tempCoords;
    target.x = (clientX - this._cachedRect.left) * this._cachedScaleX;
    target.y = (clientY - this._cachedRect.top) * this._cachedScaleY;
    return target;
  }

  handleTouchStart(e) {
    e.preventDefault();

    // 첫 터치 시 사운드 활성화
    if (!this.soundActivated) {
      soundManager.resume();
      this.soundActivated = true;
    }

    const touch = e.touches[0];
    // [Mobile Opt] 재사용 객체 패턴
    const coords = this.getCanvasCoords(touch.clientX, touch.clientY);

    this.isTouching = true;
    this.isDragging = true;
    // [Mobile Opt] 객체 재사용
    this._touchStartCoords.x = coords.x;
    this._touchStartCoords.y = coords.y;
    this._touchStartCoords.time = Date.now();
    this.touchStart = this._touchStartCoords;

    // [Mobile Opt] touches 배열 재사용
    this.touches.length = 0;
    this.touches.push({ x: coords.x, y: coords.y });
    this.dragDistance = 0;
    this.dragAngle = 0;

    // 터치 시작 시 즉시 드래그 콜백 호출 (첫 터치 위치에서 동작 시작)
    if (this.onDrag) {
      this.onDrag(coords, 0, 0);
    }
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

    // [Mobile Opt] touches 배열 크기 제한 - splice 대신 인플레이스 시프트
    if (this.touches.length >= 100) {
      // 앞쪽 50개 제거 (새 배열 생성 없이)
      this.touches.splice(0, 50);
    }
    this.touches.push({ x: coords.x, y: coords.y });

    // 드래그 콜백 호출
    if (this.onDrag) {
      this.onDrag(coords, this.dragDistance, this.dragAngle);
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();
    if (!this.isTouching) return;

    const coords = this.touches[this.touches.length - 1] || this.touchStart;
    // [Mobile Opt] 객체 재사용
    this._touchEndCoords.x = coords.x;
    this._touchEndCoords.y = coords.y;
    this._touchEndCoords.time = Date.now();
    this.touchEnd = this._touchEndCoords;

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
    // [Mobile Opt] 객체 재사용
    this._touchStartCoords.x = coords.x;
    this._touchStartCoords.y = coords.y;
    this._touchStartCoords.time = Date.now();
    this.touchStart = this._touchStartCoords;

    // [Mobile Opt] touches 배열 재사용
    this.touches.length = 0;
    this.touches.push({ x: coords.x, y: coords.y });
    this.dragDistance = 0;
    this.dragAngle = 0;

    // 클릭 시작 시 즉시 드래그 콜백 호출
    if (this.onDrag) {
      this.onDrag(coords, 0, 0);
    }
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

    // [Mobile Opt] touches 배열 크기 제한
    if (this.touches.length >= 100) {
      this.touches.splice(0, 50);
    }
    this.touches.push({ x: coords.x, y: coords.y });

    if (this.onDrag) {
      this.onDrag(coords, this.dragDistance, this.dragAngle);
    }
  }

  handleMouseUp(e) {
    if (!this.isTouching) return;

    const coords = this.touches[this.touches.length - 1] || this.touchStart;
    // [Mobile Opt] 객체 재사용
    this._touchEndCoords.x = coords.x;
    this._touchEndCoords.y = coords.y;
    this._touchEndCoords.time = Date.now();
    this.touchEnd = this._touchEndCoords;

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
    // [Mobile Opt] 배열 재사용 (새 배열 생성 방지)
    this.touches.length = 0;
  }

  /**
   * [Mobile Opt] rect 캐시 무효화 (외부에서 캔버스 크기 변경 시 호출)
   */
  invalidateRectCache() {
    this._rectCacheDirty = true;
  }

  update() {
    // 프레임별 입력 상태 업데이트
  }
}
