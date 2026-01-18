/**
 * SoundManager - Web Audio API 기반 사운드 효과 시스템
 * 실제 오디오 파일 없이 프로시저럴 사운드 생성
 */

export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.enabled = true;
    this.volume = 0.5;
    this.sfxVolume = 0.5;
    this.bgmVolume = 0.3;

    // BGM 상태
    this.currentBGM = null;
    this.bgmNodes = [];
    this.bgmInterval = null;
    this.bgmBeatIndex = 0;

    this.init();
  }

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // 마스터 게인
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.volume;

      // SFX 게인 (마스터에 연결)
      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.connect(this.masterGain);
      this.sfxGain.gain.value = this.sfxVolume;

      // BGM 게인 (마스터에 연결)
      this.bgmGain = this.audioContext.createGain();
      this.bgmGain.connect(this.masterGain);
      this.bgmGain.gain.value = this.bgmVolume;
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
   * 마스터 볼륨 설정
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  /**
   * SFX 볼륨 설정
   */
  setSFXVolume(value) {
    this.sfxVolume = Math.max(0, Math.min(1, value));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
  }

  /**
   * BGM 볼륨 설정
   */
  setBGMVolume(value) {
    this.bgmVolume = Math.max(0, Math.min(1, value));
    if (this.bgmGain) {
      this.bgmGain.gain.value = this.bgmVolume;
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
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

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
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

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
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

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
   * 🔥 지글지글 - 마시멜로우 녹이기 불 소리
   * @param {number} intensity - 불 세기 (0~1)
   */
  playSizzle(intensity = 0.5) {
    if (!this.enabled || !this.audioContext) return;

    const duration = 0.1;
    const now = this.audioContext.currentTime;

    // 노이즈 기반 지글거림
    const noiseBuffer = this.createNoiseBuffer(duration);
    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // 밴드패스 필터 (지글거리는 주파수 대역)
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000 + intensity * 2000;
    filter.Q.value = 1.5;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.15 + intensity * 0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start(now);
    noiseSource.stop(now + duration);
  }

  /**
   * ⚡ 찌직 - 들러붙음 경고음
   */
  playStick() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    // 날카로운 찌직 소리
    const osc = this.audioContext.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 500;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);

    // 추가 크래클 노이즈
    const noiseBuffer = this.createNoiseBuffer(0.08);
    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    noiseSource.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseSource.start(now);
    noiseSource.stop(now + 0.08);
  }

  /**
   * 💨 버블/보글보글 - 마시멜로우 녹는 소리
   */
  playBubble() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const baseFreq = 150 + Math.random() * 100;

    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.1);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * 🍫 코코아 투입 - 뿌리는 소리
   */
  playCocoaPour() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    // 부드러운 분말 소리
    const noiseBuffer = this.createNoiseBuffer(0.4);
    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.linearRampToValueAtTime(800, now + 0.4);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.3);
    gain.gain.linearRampToValueAtTime(0, now + 0.4);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start(now);
    noiseSource.stop(now + 0.4);

    // 보너스 차임 (적절한 타이밍)
    setTimeout(() => this.playClick(800, 0.05, 0.15), 200);
  }

  /**
   * 👆 연타 성공 - 짧은 팝 사운드
   */
  playTap() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600 + Math.random() * 200, now);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

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
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.3);

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
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);

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
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

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
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.dur);
    });
  }

  // ==================== 시간 시스템 사운드 ====================

  /**
   * 🌙 하루 종료 사운드 - 평온한 종소리 + 멜로디
   */
  playDayEnd() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    // 깊은 종소리 (첫 번째)
    const bell1 = this.audioContext.createOscillator();
    bell1.type = 'sine';
    bell1.frequency.setValueAtTime(330, now);
    bell1.frequency.exponentialRampToValueAtTime(329, now + 0.8);

    const bell1Gain = this.audioContext.createGain();
    bell1Gain.gain.setValueAtTime(0.3, now);
    bell1Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    bell1.connect(bell1Gain);
    bell1Gain.connect(this.masterGain);
    bell1.start(now);
    bell1.stop(now + 0.8);

    // 두 번째 종소리 (더 높은 음)
    const bell2 = this.audioContext.createOscillator();
    bell2.type = 'sine';
    bell2.frequency.value = 440;

    const bell2Gain = this.audioContext.createGain();
    bell2Gain.gain.setValueAtTime(0, now);
    bell2Gain.gain.setValueAtTime(0.25, now + 0.3);
    bell2Gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    bell2.connect(bell2Gain);
    bell2Gain.connect(this.masterGain);
    bell2.start(now + 0.3);
    bell2.stop(now + 1.2);

    // 하모닉 오버톤
    const overtone = this.audioContext.createOscillator();
    overtone.type = 'triangle';
    overtone.frequency.value = 660;

    const overtoneGain = this.audioContext.createGain();
    overtoneGain.gain.setValueAtTime(0, now);
    overtoneGain.gain.setValueAtTime(0.1, now + 0.5);
    overtoneGain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

    overtone.connect(overtoneGain);
    overtoneGain.connect(this.masterGain);
    overtone.start(now + 0.5);
    overtone.stop(now + 1.5);
  }

  /**
   * 🎪 이벤트 시작 사운드 - 화려한 알림음
   */
  playEventStart() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    // 상승하는 아르페지오
    const notes = [523, 659, 784, 880, 1047];
    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 3000;

      const gain = this.audioContext.createGain();
      const startTime = now + i * 0.06;
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });

    // 마무리 반짝임 효과
    setTimeout(() => {
      this.playClick(1200, 0.1, 0.2);
      setTimeout(() => this.playClick(1400, 0.08, 0.15), 50);
    }, 350);
  }

  /**
   * 🌅 시간대 변경 사운드 - 부드러운 전환음
   */
  playTimePeriodChange() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    // 스위프 사운드 (상승)
    const sweep = this.audioContext.createOscillator();
    sweep.type = 'sine';
    sweep.frequency.setValueAtTime(200, now);
    sweep.frequency.exponentialRampToValueAtTime(600, now + 0.3);
    sweep.frequency.exponentialRampToValueAtTime(400, now + 0.5);

    const sweepGain = this.audioContext.createGain();
    sweepGain.gain.setValueAtTime(0.15, now);
    sweepGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    sweep.connect(sweepGain);
    sweepGain.connect(this.masterGain);
    sweep.start(now);
    sweep.stop(now + 0.5);

    // 차임 톤
    const chime = this.audioContext.createOscillator();
    chime.type = 'triangle';
    chime.frequency.value = 880;

    const chimeGain = this.audioContext.createGain();
    chimeGain.gain.setValueAtTime(0, now);
    chimeGain.gain.setValueAtTime(0.2, now + 0.2);
    chimeGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    chime.connect(chimeGain);
    chimeGain.connect(this.masterGain);
    chime.start(now + 0.2);
    chime.stop(now + 0.6);
  }

  /**
   * ❌ 부저/실패 사운드 - 에러 알림
   */
  playBuzzer() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    // 불협화음 조합
    const freqs = [150, 180];
    freqs.forEach(freq => {
      const osc = this.audioContext.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;

      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.setValueAtTime(0.15, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.25);
    });
  }

  /**
   * ⚡ 에너지 소모 사운드 - 가벼운 감소음
   */
  playEnergyDrain() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * ⚠️ 에너지 부족 경고 사운드
   */
  playEnergyWarning() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    // 두 번의 짧은 비프
    [0, 0.15].forEach(delay => {
      const osc = this.audioContext.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 440;

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;

      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0.12, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + delay);
      osc.stop(now + delay + 0.08);
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
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

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

  // ==================== BGM 시스템 ====================

  /**
   * BGM 정의 - 프로시저럴 음악 패턴
   */
  getBGMConfig(type) {
    const configs = {
      // 카운터 BGM - 밝고 경쾌한 분위기
      counter: {
        bpm: 100,
        key: 'C',
        // 코드 진행: C - Am - F - G (팝 진행)
        chords: [
          [261.63, 329.63, 392.00],  // C (C4, E4, G4)
          [220.00, 261.63, 329.63],  // Am (A3, C4, E4)
          [174.61, 220.00, 261.63],  // F (F3, A3, C4)
          [196.00, 246.94, 293.66]   // G (G3, B3, D4)
        ],
        bass: [130.81, 110.00, 87.31, 98.00],  // C3, A2, F2, G2
        melody: [
          523.25, 587.33, 659.25, 587.33,  // C5, D5, E5, D5
          523.25, 493.88, 440.00, 493.88,  // C5, B4, A4, B4
          440.00, 392.00, 349.23, 392.00,  // A4, G4, F4, G4
          392.00, 440.00, 493.88, 523.25   // G4, A4, B4, C5
        ],
        style: 'cheerful'
      },

      // 주방 BGM - 집중적이고 리드미컬한 분위기
      kitchen: {
        bpm: 120,
        key: 'Am',
        // 코드 진행: Am - Dm - E - Am (마이너 진행)
        chords: [
          [220.00, 261.63, 329.63],  // Am
          [146.83, 174.61, 220.00],  // Dm (D3, F3, A3)
          [164.81, 207.65, 246.94],  // E (E3, G#3, B3)
          [220.00, 261.63, 329.63]   // Am
        ],
        bass: [110.00, 73.42, 82.41, 110.00],  // A2, D2, E2, A2
        melody: [
          440.00, 493.88, 523.25, 493.88,
          440.00, 392.00, 329.63, 349.23,
          329.63, 349.23, 392.00, 329.63,
          440.00, 392.00, 349.23, 329.63
        ],
        style: 'focused'
      },

      // 미니게임 BGM - 긴장감 있는 분위기
      minigame: {
        bpm: 140,
        key: 'Em',
        // 코드 진행: Em - C - D - Em (드라마틱)
        chords: [
          [164.81, 196.00, 246.94],  // Em (E3, G3, B3)
          [130.81, 164.81, 196.00],  // C (C3, E3, G3)
          [146.83, 185.00, 220.00],  // D (D3, F#3, A3)
          [164.81, 196.00, 246.94]   // Em
        ],
        bass: [82.41, 65.41, 73.42, 82.41],  // E2, C2, D2, E2
        melody: [
          659.25, 587.33, 523.25, 587.33,
          523.25, 493.88, 440.00, 392.00,
          440.00, 493.88, 523.25, 587.33,
          659.25, 587.33, 523.25, 493.88
        ],
        style: 'tense'
      },

      // 메뉴/타이틀 BGM - 차분하고 편안한 분위기
      menu: {
        bpm: 75,
        key: 'F',
        chords: [
          [174.61, 220.00, 261.63],  // F (F3, A3, C4)
          [196.00, 246.94, 293.66],  // G (G3, B3, D4)
          [220.00, 261.63, 329.63],  // Am
          [174.61, 220.00, 261.63]   // F
        ],
        bass: [87.31, 98.00, 110.00, 87.31],
        melody: [
          349.23, 392.00, 440.00, 392.00,
          440.00, 493.88, 523.25, 493.88,
          440.00, 392.00, 349.23, 329.63,
          349.23, 329.63, 293.66, 329.63
        ],
        style: 'calm'
      }
    };

    return configs[type] || configs.menu;
  }

  /**
   * BGM 시작
   * @param {string} type - 'counter', 'kitchen', 'minigame', 'menu'
   * @param {boolean} fadeIn - 페이드 인 여부
   */
  startBGM(type, fadeIn = true) {
    if (!this.enabled || !this.audioContext) return;

    // 이미 같은 BGM이 재생 중이면 무시
    if (this.currentBGM === type) return;

    // 기존 BGM 정지
    this.stopBGM(fadeIn);

    this.currentBGM = type;
    const config = this.getBGMConfig(type);

    // BPM에서 비트 간격 계산 (ms)
    const beatInterval = (60 / config.bpm) * 1000;

    // 페이드 인
    if (fadeIn && this.bgmGain) {
      this.bgmGain.gain.setValueAtTime(0, this.audioContext.currentTime);
      this.bgmGain.gain.linearRampToValueAtTime(
        this.bgmVolume,
        this.audioContext.currentTime + 1
      );
    }

    this.bgmBeatIndex = 0;

    // 비트 루프 시작
    this.bgmInterval = setInterval(() => {
      this._playBGMBeat(config);
    }, beatInterval);

    // 첫 비트 즉시 재생
    this._playBGMBeat(config);
  }

  /**
   * BGM 비트 재생
   */
  _playBGMBeat(config) {
    if (!this.enabled || !this.audioContext || !this.currentBGM) return;

    const now = this.audioContext.currentTime;
    const chordIndex = Math.floor(this.bgmBeatIndex / 4) % config.chords.length;
    const beatInMeasure = this.bgmBeatIndex % 4;
    const melodyIndex = this.bgmBeatIndex % config.melody.length;

    // 코드 패드 (첫 비트에만)
    if (beatInMeasure === 0) {
      this._playChordPad(config.chords[chordIndex], config.style, now);
    }

    // 베이스 (1, 3 비트)
    if (beatInMeasure === 0 || beatInMeasure === 2) {
      this._playBassNote(config.bass[chordIndex], config.style, now);
    }

    // 멜로디 (스타일에 따라 다름)
    if (config.style === 'cheerful' || config.style === 'focused') {
      // 모든 비트에 멜로디
      this._playMelodyNote(config.melody[melodyIndex], config.style, now);
    } else if (config.style === 'tense') {
      // 빠른 아르페지오
      this._playMelodyNote(config.melody[melodyIndex], config.style, now);
    } else if (config.style === 'calm') {
      // 느린 멜로디 (2비트마다)
      if (beatInMeasure % 2 === 0) {
        this._playMelodyNote(config.melody[melodyIndex], config.style, now);
      }
    }

    // 퍼커션 (킥)
    if (beatInMeasure === 0 || beatInMeasure === 2) {
      this._playKick(config.style, now);
    }

    // 하이햇 (오프비트)
    if (config.style !== 'calm') {
      this._playHiHat(config.style, now);
    }

    this.bgmBeatIndex++;
  }

  /**
   * 코드 패드 재생
   */
  _playChordPad(frequencies, style, startTime) {
    const duration = style === 'calm' ? 2 : 1;
    const volume = style === 'calm' ? 0.08 : 0.06;

    frequencies.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      osc.type = style === 'tense' ? 'sawtooth' : 'triangle';
      osc.frequency.value = freq;

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = style === 'calm' ? 800 : 1200;
      filter.Q.value = 0.5;

      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.1);
      gain.gain.setValueAtTime(volume, startTime + duration - 0.2);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  /**
   * 베이스 노트 재생
   */
  _playBassNote(freq, style, startTime) {
    const duration = 0.3;
    const volume = 0.12;

    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    // 서브 오실레이터 (옥타브 아래)
    const subOsc = this.audioContext.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.value = freq / 2;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    const subGain = this.audioContext.createGain();
    subGain.gain.setValueAtTime(volume * 0.5, startTime);
    subGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    osc.connect(gain);
    subOsc.connect(subGain);
    gain.connect(this.bgmGain);
    subGain.connect(this.bgmGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
    subOsc.start(startTime);
    subOsc.stop(startTime + duration);
  }

  /**
   * 멜로디 노트 재생
   */
  _playMelodyNote(freq, style, startTime) {
    const duration = style === 'calm' ? 0.5 : 0.2;
    const volume = style === 'calm' ? 0.1 : 0.08;

    const osc = this.audioContext.createOscillator();
    osc.type = style === 'tense' ? 'square' : 'sine';
    osc.frequency.value = freq;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = style === 'tense' ? 2000 : 3000;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /**
   * 킥 드럼 재생
   */
  _playKick(style, startTime) {
    const volume = style === 'calm' ? 0.08 : 0.15;

    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, startTime);
    osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.1);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(startTime);
    osc.stop(startTime + 0.15);
  }

  /**
   * 하이햇 재생
   */
  _playHiHat(style, startTime) {
    const duration = style === 'tense' ? 0.03 : 0.05;
    const volume = style === 'tense' ? 0.06 : 0.04;

    const noiseBuffer = this.createNoiseBuffer(duration);
    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    noiseSource.start(startTime);
    noiseSource.stop(startTime + duration);
  }

  /**
   * BGM 정지
   * @param {boolean} fadeOut - 페이드 아웃 여부
   */
  stopBGM(fadeOut = true) {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }

    if (fadeOut && this.bgmGain && this.audioContext) {
      const now = this.audioContext.currentTime;
      this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
      this.bgmGain.gain.linearRampToValueAtTime(0, now + 0.5);

      // 페이드 아웃 후 볼륨 복원
      setTimeout(() => {
        if (this.bgmGain) {
          this.bgmGain.gain.value = this.bgmVolume;
        }
      }, 600);
    }

    this.currentBGM = null;
    this.bgmBeatIndex = 0;
  }

  /**
   * BGM 일시정지
   */
  pauseBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    // currentBGM은 유지 (resume용)
  }

  /**
   * BGM 재개
   */
  resumeBGM() {
    if (this.currentBGM && !this.bgmInterval) {
      const config = this.getBGMConfig(this.currentBGM);
      const beatInterval = (60 / config.bpm) * 1000;

      this.bgmInterval = setInterval(() => {
        this._playBGMBeat(config);
      }, beatInterval);
    }
  }

  /**
   * BGM 전환 (크로스페이드)
   */
  switchBGM(newType, crossfadeDuration = 1) {
    if (!this.enabled || !this.audioContext) return;
    if (this.currentBGM === newType) return;

    // 현재 BGM 페이드 아웃
    if (this.bgmGain) {
      const now = this.audioContext.currentTime;
      this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
      this.bgmGain.gain.linearRampToValueAtTime(0, now + crossfadeDuration / 2);
    }

    // 새 BGM 시작 (딜레이 후)
    setTimeout(() => {
      if (this.bgmInterval) {
        clearInterval(this.bgmInterval);
        this.bgmInterval = null;
      }
      this.currentBGM = null;
      this.startBGM(newType, true);
    }, (crossfadeDuration / 2) * 1000);
  }
}

// 전역 싱글톤 인스턴스
export const soundManager = new SoundManager();
