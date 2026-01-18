/**
 * EventEmitter - 이벤트 발행/구독 시스템
 * 게임 매니저들 간의 느슨한 결합을 위한 유틸리티
 */

export class EventEmitter {
  constructor() {
    this._events = {};
  }

  /**
   * 이벤트 리스너 등록
   * @param {string} event - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   * @returns {Function} 구독 해제 함수
   */
  on(event, callback) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(callback);

    // 구독 해제 함수 반환
    return () => this.off(event, callback);
  }

  /**
   * 일회성 이벤트 리스너 등록
   * @param {string} event - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   */
  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  /**
   * 이벤트 리스너 제거
   * @param {string} event - 이벤트 이름
   * @param {Function} callback - 제거할 콜백 함수
   */
  off(event, callback) {
    if (!this._events[event]) return;

    this._events[event] = this._events[event].filter(cb => cb !== callback);

    if (this._events[event].length === 0) {
      delete this._events[event];
    }
  }

  /**
   * 이벤트 발행
   * @param {string} event - 이벤트 이름
   * @param {...any} args - 전달할 인자들
   */
  emit(event, ...args) {
    if (!this._events[event]) return;

    this._events[event].forEach(callback => {
      try {
        callback(...args);
      } catch (e) {
        console.error(`[EventEmitter] Error in ${event} handler:`, e);
      }
    });
  }

  /**
   * 모든 리스너 제거
   * @param {string} [event] - 특정 이벤트만 제거 (미지정시 전체)
   */
  removeAllListeners(event) {
    if (event) {
      delete this._events[event];
    } else {
      this._events = {};
    }
  }

  /**
   * 이벤트 리스너 개수 반환
   * @param {string} event - 이벤트 이름
   * @returns {number}
   */
  listenerCount(event) {
    return this._events[event]?.length || 0;
  }
}

export default EventEmitter;
