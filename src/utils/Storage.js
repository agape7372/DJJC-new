/**
 * Storage - localStorage 래퍼
 */

export class Storage {
  constructor(prefix = 'game') {
    this.prefix = prefix;
  }

  /**
   * 키 생성
   */
  getKey(key) {
    return `${this.prefix}_${key}`;
  }

  /**
   * 데이터 저장
   */
  save(data, key = 'data') {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('저장 실패:', e);
      return false;
    }
  }

  /**
   * 데이터 로드
   */
  load(key = 'data') {
    try {
      const data = localStorage.getItem(this.getKey(key));
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('로드 실패:', e);
      return null;
    }
  }

  /**
   * 데이터 삭제
   */
  remove(key = 'data') {
    localStorage.removeItem(this.getKey(key));
  }

  /**
   * 전체 삭제
   */
  clear() {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }
}
