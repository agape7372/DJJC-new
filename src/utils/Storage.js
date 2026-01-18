/**
 * Storage - localStorage 래퍼
 * [Mobile Opt] 데이터 무결성 및 안정성 강화
 */

// 데이터 스키마 버전 (마이그레이션용)
const SCHEMA_VERSION = 1;

export class Storage {
  constructor(prefix = 'game') {
    this.prefix = prefix;
    this._backupSuffix = '_backup';
    this._versionKey = '_version';

    // [Mobile Opt] 저장 쓰로틀링
    this._lastSaveTime = 0;
    this._saveThrottleMs = 1000; // 최소 1초 간격
    this._pendingSave = null;
  }

  /**
   * 키 생성
   */
  getKey(key) {
    return `${this.prefix}_${key}`;
  }

  /**
   * [Mobile Opt] 간단한 체크섬 생성 (데이터 무결성 검증용)
   */
  _generateChecksum(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    return hash.toString(16);
  }

  /**
   * [Mobile Opt] 데이터 검증
   */
  _validateData(data) {
    // 기본 타입 체크
    if (data === null || data === undefined) {
      return false;
    }

    // 객체인 경우 필수 필드 체크
    if (typeof data === 'object' && data !== null) {
      // playerData 검증 (있을 경우)
      if (data.playerData) {
        const pd = data.playerData;
        // 숫자 필드 검증
        if (typeof pd.money !== 'undefined' && (typeof pd.money !== 'number' || isNaN(pd.money) || pd.money < 0)) {
          console.warn('[Storage] Invalid money value:', pd.money);
          pd.money = 0; // 복구
        }
        if (typeof pd.day !== 'undefined' && (typeof pd.day !== 'number' || isNaN(pd.day) || pd.day < 1)) {
          console.warn('[Storage] Invalid day value:', pd.day);
          pd.day = 1; // 복구
        }
        if (typeof pd.reputation !== 'undefined' && (typeof pd.reputation !== 'number' || isNaN(pd.reputation))) {
          console.warn('[Storage] Invalid reputation value:', pd.reputation);
          pd.reputation = 0; // 복구
        }
      }
    }

    return true;
  }

  /**
   * [Mobile Opt] 백업 생성
   */
  _createBackup(key = 'data') {
    try {
      const currentData = localStorage.getItem(this.getKey(key));
      if (currentData) {
        localStorage.setItem(this.getKey(key) + this._backupSuffix, currentData);
      }
    } catch (e) {
      console.warn('[Storage] 백업 생성 실패:', e.message);
    }
  }

  /**
   * [Mobile Opt] 백업에서 복구
   */
  _restoreFromBackup(key = 'data') {
    try {
      const backupData = localStorage.getItem(this.getKey(key) + this._backupSuffix);
      if (backupData) {
        const parsed = JSON.parse(backupData);
        if (this._validateData(parsed)) {
          console.log('[Storage] 백업에서 복구 성공');
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[Storage] 백업 복구 실패:', e.message);
    }
    return null;
  }

  /**
   * 데이터 저장
   * [Mobile Opt] 백업, 검증, 쓰로틀링 추가
   */
  save(data, key = 'data') {
    try {
      // 데이터 검증
      if (!this._validateData(data)) {
        console.error('[Storage] 유효하지 않은 데이터, 저장 취소');
        return false;
      }

      // 스키마 버전 추가
      const dataWithVersion = {
        ...data,
        _schemaVersion: SCHEMA_VERSION,
        _savedAt: Date.now()
      };

      const jsonStr = JSON.stringify(dataWithVersion);

      // 체크섬 추가
      const checksum = this._generateChecksum(jsonStr);
      const fullKey = this.getKey(key);

      // 기존 데이터 백업 (저장 전)
      this._createBackup(key);

      // 저장 시도
      localStorage.setItem(fullKey, jsonStr);
      localStorage.setItem(fullKey + '_checksum', checksum);

      return true;
    } catch (e) {
      // QuotaExceededError 처리
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.error('[Storage] 저장 공간 부족! 오래된 데이터 정리 시도...');
        this._handleQuotaExceeded();

        // 재시도
        try {
          const jsonStr = JSON.stringify(data);
          localStorage.setItem(this.getKey(key), jsonStr);
          return true;
        } catch (retryError) {
          console.error('[Storage] 재시도 실패:', retryError.message);
          return false;
        }
      }

      console.error('[Storage] 저장 실패:', e.message);
      return false;
    }
  }

  /**
   * [Mobile Opt] 쓰로틀된 저장 (자주 호출되는 상황용)
   */
  saveThrottled(data, key = 'data') {
    const now = Date.now();

    if (now - this._lastSaveTime >= this._saveThrottleMs) {
      this._lastSaveTime = now;
      return this.save(data, key);
    }

    // 대기 중인 저장이 없으면 예약
    if (!this._pendingSave) {
      this._pendingSave = setTimeout(() => {
        this._pendingSave = null;
        this._lastSaveTime = Date.now();
        this.save(data, key);
      }, this._saveThrottleMs - (now - this._lastSaveTime));
    }

    return true; // 예약됨
  }

  /**
   * 데이터 로드
   * [Mobile Opt] 무결성 검증 및 백업 복구 추가
   */
  load(key = 'data') {
    try {
      const fullKey = this.getKey(key);
      const data = localStorage.getItem(fullKey);

      if (!data) {
        return null;
      }

      // 체크섬 검증
      const savedChecksum = localStorage.getItem(fullKey + '_checksum');
      if (savedChecksum) {
        const currentChecksum = this._generateChecksum(data);
        if (savedChecksum !== currentChecksum) {
          console.warn('[Storage] 체크섬 불일치! 데이터 손상 가능. 백업에서 복구 시도...');
          const backupData = this._restoreFromBackup(key);
          if (backupData) {
            return backupData;
          }
          // 백업도 실패하면 그래도 파싱 시도
        }
      }

      const parsed = JSON.parse(data);

      // 데이터 검증
      if (!this._validateData(parsed)) {
        console.warn('[Storage] 로드된 데이터 검증 실패, 백업에서 복구 시도...');
        const backupData = this._restoreFromBackup(key);
        if (backupData) {
          return backupData;
        }
      }

      // 스키마 마이그레이션 체크
      if (parsed._schemaVersion && parsed._schemaVersion < SCHEMA_VERSION) {
        console.log(`[Storage] 스키마 마이그레이션 필요: v${parsed._schemaVersion} → v${SCHEMA_VERSION}`);
        return this._migrateData(parsed);
      }

      return parsed;
    } catch (e) {
      console.error('[Storage] 로드 실패:', e.message);

      // JSON 파싱 오류 시 백업에서 복구 시도
      if (e instanceof SyntaxError) {
        console.log('[Storage] JSON 파싱 오류, 백업에서 복구 시도...');
        const backupData = this._restoreFromBackup(key);
        if (backupData) {
          return backupData;
        }
      }

      return null;
    }
  }

  /**
   * [Mobile Opt] 데이터 마이그레이션
   */
  _migrateData(data) {
    let migrated = { ...data };
    const fromVersion = data._schemaVersion || 0;

    // 버전별 마이그레이션 로직
    // 예: v0 → v1
    if (fromVersion < 1) {
      // 필요한 마이그레이션 수행
      // migrated.newField = defaultValue;
      console.log('[Storage] v0 → v1 마이그레이션 완료');
    }

    // 버전 업데이트
    migrated._schemaVersion = SCHEMA_VERSION;

    // 마이그레이션된 데이터 저장
    this.save(migrated);

    return migrated;
  }

  /**
   * [Mobile Opt] 저장 공간 부족 시 처리
   */
  _handleQuotaExceeded() {
    // 백업 데이터 삭제
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix) && key.endsWith(this._backupSuffix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`[Storage] 공간 확보: ${key} 삭제`);
    });
  }

  /**
   * 데이터 삭제
   */
  remove(key = 'data') {
    const fullKey = this.getKey(key);
    localStorage.removeItem(fullKey);
    localStorage.removeItem(fullKey + '_checksum');
    localStorage.removeItem(fullKey + this._backupSuffix);
  }

  /**
   * 전체 삭제
   */
  clear() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * [Mobile Opt] 저장소 상태 확인 (디버그용)
   */
  getStorageStats() {
    let totalSize = 0;
    let itemCount = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        const value = localStorage.getItem(key);
        totalSize += (key.length + (value ? value.length : 0)) * 2; // UTF-16
        itemCount++;
      }
    }

    return {
      prefix: this.prefix,
      itemCount,
      sizeBytes: totalSize,
      sizeKB: (totalSize / 1024).toFixed(2)
    };
  }

  /**
   * [Mobile Opt] 데이터 내보내기 (백업용)
   */
  exportData(key = 'data') {
    const data = this.load(key);
    if (!data) return null;

    return {
      data,
      exportedAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION
    };
  }

  /**
   * [Mobile Opt] 데이터 가져오기 (복원용)
   */
  importData(exportedData, key = 'data') {
    try {
      if (!exportedData || !exportedData.data) {
        console.error('[Storage] 가져올 데이터가 없습니다');
        return false;
      }

      // 버전 호환성 체크
      if (exportedData.schemaVersion > SCHEMA_VERSION) {
        console.error('[Storage] 더 높은 버전의 데이터는 가져올 수 없습니다');
        return false;
      }

      return this.save(exportedData.data, key);
    } catch (e) {
      console.error('[Storage] 데이터 가져오기 실패:', e.message);
      return false;
    }
  }
}
