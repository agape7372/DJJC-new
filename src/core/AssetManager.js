/**
 * AssetManager - 이미지, 사운드 등 에셋 관리
 */

export class AssetManager {
  constructor() {
    this.images = new Map();
    this.sounds = new Map();
    this.loadingProgress = 0;
  }

  /**
   * 이미지 로드
   */
  async loadImage(key, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(key, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * 여러 이미지 로드
   */
  async loadImages(imageList) {
    const total = imageList.length;
    let loaded = 0;

    const promises = imageList.map(async ({ key, src }) => {
      await this.loadImage(key, src);
      loaded++;
      this.loadingProgress = loaded / total;
    });

    await Promise.all(promises);
  }

  /**
   * 이미지 가져오기
   */
  getImage(key) {
    return this.images.get(key);
  }

  /**
   * 사운드 로드
   */
  async loadSound(key, src) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => {
        this.sounds.set(key, audio);
        resolve(audio);
      };
      audio.onerror = reject;
      audio.src = src;
    });
  }

  /**
   * 사운드 가져오기
   */
  getSound(key) {
    return this.sounds.get(key);
  }
}
