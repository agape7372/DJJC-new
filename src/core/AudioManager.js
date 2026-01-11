/**
 * AudioManager - 오디오/BGM 관리
 */

export class AudioManager {
  constructor() {
    this.bgm = null;
    this.sfx = new Map();
    this.bgmVolume = 0.5;
    this.sfxVolume = 0.7;
    this.isMuted = false;
  }

  /**
   * BGM 재생
   */
  playBGM(audio, loop = true) {
    this.stopBGM();
    this.bgm = audio.cloneNode();
    this.bgm.volume = this.isMuted ? 0 : this.bgmVolume;
    this.bgm.loop = loop;
    this.bgm.play().catch(() => {});
  }

  /**
   * BGM 정지
   */
  stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
      this.bgm = null;
    }
  }

  /**
   * 효과음 재생
   */
  playSFX(audio) {
    if (this.isMuted) return;

    const sfx = audio.cloneNode();
    sfx.volume = this.sfxVolume;
    sfx.play().catch(() => {});
  }

  /**
   * 음소거 토글
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.bgm) {
      this.bgm.volume = this.isMuted ? 0 : this.bgmVolume;
    }
    return this.isMuted;
  }

  /**
   * BGM 볼륨 설정
   */
  setBGMVolume(volume) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.bgm && !this.isMuted) {
      this.bgm.volume = this.bgmVolume;
    }
  }

  /**
   * SFX 볼륨 설정
   */
  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }
}
