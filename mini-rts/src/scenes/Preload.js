export default class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    // 创建加载进度条
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const bgBar = this.add.image(width/2, height/2, 'loading-bg');
    const progressBar = this.add.image(width/2, height/2, 'loading-bar');
    
    const progressMask = this.make.graphics();
    progressMask.fillRect(
      progressBar.x - progressBar.width / 2, 
      progressBar.y - progressBar.height / 2,
      0,
      progressBar.height
    );
    
    progressBar.setMask(new Phaser.Display.Masks.GeometryMask(this, progressMask));
    
    // 更新进度条
    this.load.on('progress', (value) => {
      progressMask.clear();
      progressMask.fillRect(
        progressBar.x - progressBar.width / 2, 
        progressBar.y - progressBar.height / 2,
        progressBar.width * value,
        progressBar.height
      );
    });
    
    // 加载游戏资源
    
    // 地图和环境
    this.load.image('tileset', 'assets/sprites/tileset.png');
    this.load.image('grass', 'assets/sprites/grass.png');
    this.load.image('tree', 'assets/sprites/tree.png');
    this.load.image('rock', 'assets/sprites/rock.png');
    
    // 建筑
    this.load.image('base', 'assets/sprites/base.png');
    this.load.image('barracks', 'assets/sprites/barracks.png');
    this.load.image('mine', 'assets/sprites/mine.png');
    
    // 单位
    this.load.spritesheet('worker', 'assets/sprites/worker.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('soldier', 'assets/sprites/soldier.png', { frameWidth: 32, frameHeight: 32 });
    
    // UI元素
    this.load.image('button', 'assets/ui/button.png');
    this.load.image('panel', 'assets/ui/panel.png');
    this.load.image('resource-icon', 'assets/ui/resource-icon.png');
    
    // 音效
    this.load.audio('click', 'assets/audio/click.mp3');
    this.load.audio('build', 'assets/audio/build.mp3');
    this.load.audio('battle', 'assets/audio/battle.mp3');
  }

  create() {
    // 创建动画
    this.createAnimations();
    
    // 进入主菜单
    this.scene.start('MainMenu');
  }
  
  createAnimations() {
    // 工人动画
    this.anims.create({
      key: 'worker-idle',
      frames: this.anims.generateFrameNumbers('worker', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    
    this.anims.create({
      key: 'worker-walk',
      frames: this.anims.generateFrameNumbers('worker', { start: 4, end: 7 }),
      frameRate: 12,
      repeat: -1
    });
    
    // 士兵动画
    this.anims.create({
      key: 'soldier-idle',
      frames: this.anims.generateFrameNumbers('soldier', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    
    this.anims.create({
      key: 'soldier-walk',
      frames: this.anims.generateFrameNumbers('soldier', { start: 4, end: 7 }),
      frameRate: 12,
      repeat: -1
    });
    
    this.anims.create({
      key: 'soldier-attack',
      frames: this.anims.generateFrameNumbers('soldier', { start: 8, end: 11 }),
      frameRate: 15,
      repeat: 0
    });
  }
} 