/**
 * SoundManager - Web Audio API 기반 사운드 효과 시스템
 * 실제 오디오 파일 없이 프로시저럴 사운드 생성
 */

export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.enabled = true;
    this.volume = 0.5;

    this.init();
  }

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.volume;
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
      this.enabled = false;
    }
  }

  /**
   * AudioContext 활성화 (사용자 인터랙션 후 호출 필요)
   */
  resume() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * 볼륨 설정
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  /**
   * 음소거 토글
   */
  toggleMute() {
    this.enabled = !this.enabled;
    if (this.masterGain) {
      this.masterGain.gain.value = this.enabled ? this.volume : 0;
    }
    return this.enabled;
  }

  // ==================== 사운드 효과들 ====================

  /**
   * 🔪 슬라이스 사운드 - 카다이프 자르기
   * 바삭한 ASMR 느낌의 "까작" 소리
   */
  playSlice() {
    if (!this.enabled || !this.audioContext) return;

    const duration = 0.15;
    const now = this.audioContext.currentTime;

    // 노이즈 버스트 (바삭 소리)
    const noiseBuffer = this.createNoiseBuffer(duration);
    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // 필터 (고주파 강조)
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    filter.Q.value = 2;

    // 엔벨로프
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialDecayTo(0.01, now + duration);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start(now);
    noiseSource.stop(now + duration);

    // 추가: 날카로운 클릭음
    this.playClick(800, 0.05, 0.3);
  }

  /**
   * 💥 크런치 사운드 - 강한 베기 (콤보)
   */
  playCrunch() {
    if (!this.enabled || !this.audioContext) return;

    const duration = 0.25;
    const now = this.audioContext.currentTime;

    // 다층 노이즈
    for (let i = 0; i < 3; i++) {
      const delay = i * 0.03;
      const noiseBuffer = this.createNoiseBuffer(duration - delay);
      const noiseSource = this.audioContext.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1500 + i * 500;
      filter.Q.value = 1;

      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0.5, now + delay);
      gain.gain.exponentialDecayTo(0.01, now + duration);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noiseSource.start(now + delay);
      noiseSource.stop(now + duration);
    }
  }

  /**
   * 🥜 크러시 사운드 - 피스타치오 으깨기
   */
  playCrush() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    // 짧은 임팩트
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialDecayTo(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.1);

    // 파편 소리
    setTimeout(() => this.playClick(400, 0.05, 0.2), 30);
    setTimeout(() => this.playClick(600, 0.04, 0.15), 50);
  }

  /**
   * 🌀 스핀 사운드 - 마시멜로우 반죽 돌리기
   */
  playSpin(rpm = 50) {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const frequency = 100 + rpm * 3;

    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;

    const gain = this.audioContext.createGain();
    gain.gain.value = 0.15;

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * ✨ 스페셜 아이템 등장
   */
  playSpecial() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    // 반짝이는 차임 사운드
    const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6

    frequencies.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0.3, now + i * 0.08);
      gain.gain.exponentialDecayTo(0.01, now + i * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.3);
    });
  }

  /**
   * 🔥 피버 모드 시작
   */
  playFever() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    // 상승하는 스윕 사운드
    const osc = this.audioContext.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(3000, now + 0.3);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  /**
   * ✅ 성공/완료 사운드
   */
  playSuccess() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const notes = [523, 659, 784]; // C5, E5, G5 (메이저 코드)

    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0.25, now + i * 0.1);
      gain.gain.exponentialDecayTo(0.01, now + i * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.4);
    });
  }

  /**
   * ❌ 실패/페널티 사운드
   */
  playFail() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * 🖱️ UI 클릭 사운드
   */
  playUIClick() {
    this.playClick(1000, 0.03, 0.2);
  }

  /**
   * 💰 판매/코인 사운드
   */
  playCoin() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.setValueAtTime(1800, now + 0.05);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialDecayTo(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * 📰 뉴스 알림 사운드
   */
  playNews(isPositive = true) {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const baseFreq = isPositive ? 600 : 300;

    const osc = this.audioContext.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.setValueAtTime(baseFreq * 1.5, now + 0.1);
    osc.frequency.setValueAtTime(baseFreq, now + 0.2);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * 🥁 드럼롤 (품평회)
   */
  playDrumroll(duration = 2) {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const interval = 0.05;
    const hits = Math.floor(duration / interval);

    for (let i = 0; i < hits; i++) {
      const time = now + i * interval;
      const intensity = 0.2 + (i / hits) * 0.3;

      setTimeout(() => {
        this.playClick(100 + Math.random() * 50, 0.02, intensity);
      }, i * interval * 1000);
    }
  }

  /**
   * 🎉 점수 공개 팡파레
   */
  playFanfare() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const melody = [
      { freq: 523, time: 0, dur: 0.15 },
      { freq: 659, time: 0.15, dur: 0.15 },
      { freq: 784, time: 0.3, dur: 0.15 },
      { freq: 1047, time: 0.45, dur: 0.4 }
    ];

    melody.forEach(note => {
      const osc = this.audioContext.createOscillator();
      osc.type = 'square';
      osc.frequency.value = note.freq;

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;

      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0.2, now + note.time);
      gain.gain.exponentialDecayTo(0.01, now + note.time + note.dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.dur);
    });
  }

  // ==================== 유틸리티 ====================

  /**
   * 간단한 클릭/톡 사운드
   */
  playClick(frequency = 1000, duration = 0.03, volume = 0.2) {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialDecayTo(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * 화이트 노이즈 버퍼 생성
   */
  createNoiseBuffer(duration) {
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }
}

// GainNode에 exponentialDecayTo 헬퍼 추가
if (typeof GainNode !== 'undefined') {
  GainNode.prototype.gain.exponentialDecayTo = function(value, endTime) {
    this.exponentialRampToValueAtTime(Math.max(0.001, value), endTime);
  };
}

// 전역 싱글톤 인스턴스
export const soundManager = new SoundManager();
