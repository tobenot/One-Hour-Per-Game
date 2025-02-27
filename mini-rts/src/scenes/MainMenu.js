export default class MainMenu extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // 添加标题
    const title = this.add.text(width/2, height/3, '迷你RTS', {
      fontSize: '64px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 2, stroke: true, fill: true }
    });
    title.setOrigin(0.5);
    
    // 添加开始按钮
    const startButton = this.add.image(width/2, height/2 + 50, 'button');
    const startText = this.add.text(width/2, height/2 + 50, '开始游戏', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff'
    });
    startText.setOrigin(0.5);
    
    // 让按钮可交互
    startButton.setInteractive({ useHandCursor: true });
    
    // 按钮的悬停和点击效果
    startButton.on('pointerover', () => {
      startButton.setTint(0xcccccc);
    });
    
    startButton.on('pointerout', () => {
      startButton.clearTint();
    });
    
    startButton.on('pointerdown', () => {
      this.sound.play('click');
      this.scene.start('Game');
    });
    
    // 添加游戏说明
    const instructions = this.add.text(width/2, height - 100, 
      '收集资源，建造基地，训练部队，征服地图！\n\n电脑：鼠标点击选择和移动  |  手机：触摸选择和移动', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: width - 100 }
    });
    instructions.setOrigin(0.5);
  }
} 