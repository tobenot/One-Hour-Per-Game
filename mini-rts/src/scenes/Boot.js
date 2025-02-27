export default class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // 加载加载界面需要的资源
    this.load.image('loading-bar', 'assets/ui/loading-bar.png');
    this.load.image('loading-bg', 'assets/ui/loading-bg.png');
  }

  create() {
    this.scene.start('Preload');
  }
} 