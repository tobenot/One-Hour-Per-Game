export default class MainMenu extends Phaser.Scene {
  constructor() {
    super('MainMenu');
    this.logDebug('MainMenu场景已构造');
  }

  // 调试日志辅助函数
  logDebug(message) {
    if (window.debugLog) {
      window.debugLog(`[MainMenu] ${message}`);
    } else {
      console.log(`[MainMenu] ${message}`);
    }
  }

  create() {
    this.logDebug('MainMenu场景create开始');
    
    try {
      // 获取游戏尺寸
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;
      this.logDebug(`屏幕尺寸: ${width}x${height}`);
      
      // 创建背景
      this.createBackground(width, height);
      this.logDebug('背景创建完成');
      
      // 添加游戏标题
      const titleText = this.add.text(width / 2, height * 0.2, '迷你RTS', {
        fontFamily: 'Arial',
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6
      });
      titleText.setOrigin(0.5);
      
      // 添加副标题
      const subtitleText = this.add.text(width / 2, height * 0.3, '一小时游戏挑战', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      });
      subtitleText.setOrigin(0.5);
      this.logDebug('标题创建完成');
      
      // 创建开始游戏按钮
      this.createButton(
        width / 2, 
        height * 0.6, 
        '开始游戏', 
        () => {
          this.logDebug('开始游戏按钮点击，准备加载Game场景');
          try {
            this.sound.play('click');
          } catch (e) {
            this.logDebug(`点击音效播放失败: ${e.message}`, 'warning');
          }
          this.scene.start('Game');
        }
      );
      this.logDebug('按钮创建完成');
      
      // 创建简单的装饰元素
      this.createDecorations(width, height);
      this.logDebug('装饰元素创建完成');
      
      this.logDebug('MainMenu场景创建完成', 'success');
    } catch (error) {
      this.logDebug(`MainMenu场景创建失败: ${error.message}`, 'error');
      console.error(error);
    }
  }
  
  createBackground(width, height) {
    this.logDebug('开始创建背景');
    
    try {
      // 创建背景 - 使用矩形代替渐变
      const bg = this.add.graphics();
      
      // 使用Phaser正确的渐变填充方法
      bg.fillStyle(0x0066aa, 1);
      bg.fillRect(0, 0, width, height);
      
      // 添加底部深色区域创造渐变感
      const bottomBg = this.add.graphics();
      bottomBg.fillStyle(0x003366, 1);
      bottomBg.fillRect(0, height/2, width, height/2);
      bottomBg.setAlpha(0.7);
      
      this.logDebug('创建了基本背景');
      
      // 添加简单的网格线
      const gridGraphics = this.add.graphics();
      gridGraphics.lineStyle(1, 0xffffff, 0.1);
      
      // 水平线
      for (let y = 0; y < height; y += 50) {
        gridGraphics.moveTo(0, y);
        gridGraphics.lineTo(width, y);
      }
      
      // 垂直线
      for (let x = 0; x < width; x += 50) {
        gridGraphics.moveTo(x, 0);
        gridGraphics.lineTo(x, height);
      }
      
      gridGraphics.strokePath();
      
      this.logDebug('背景创建成功');
    } catch (error) {
      this.logDebug(`背景创建失败: ${error.message}`, 'error');
      
      // 失败时尝试创建一个简单的背景作为备选
      try {
        const simpleBg = this.add.rectangle(0, 0, width, height, 0x0066aa);
        simpleBg.setOrigin(0, 0);
        this.logDebug('创建了备选简单背景', 'warning');
      } catch (e) {
        this.logDebug(`备选背景也创建失败: ${e.message}`, 'error');
      }
    }
  }
  
  createButton(x, y, label, callback) {
    this.logDebug(`创建按钮: ${label}`);
    
    try {
      // 创建按钮背景
      let button;
      try {
        button = this.add.sprite(x, y, 'button');
        if (!button) throw new Error("按钮精灵创建失败");
        this.logDebug('按钮精灵创建成功');
      } catch (error) {
        this.logDebug(`按钮精灵创建失败: ${error.message}`, 'warning');
        // 创建备用按钮
        const buttonGraphics = this.make.graphics();
        buttonGraphics.fillStyle(0x444444, 1);
        buttonGraphics.fillRect(0, 0, 200, 50);
        buttonGraphics.lineStyle(2, 0xffffff, 1);
        buttonGraphics.strokeRect(0, 0, 200, 50);
        buttonGraphics.generateTexture('button-backup', 200, 50);
        
        button = this.add.sprite(x, y, 'button-backup');
        this.logDebug('使用备用按钮纹理创建成功');
      }
      
      button.setScale(1.2, 1);
      
      // 创建按钮文本
      const buttonText = this.add.text(x, y, label, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff'
      });
      buttonText.setOrigin(0.5);
      
      // 使按钮可交互
      button.setInteractive({ useHandCursor: true });
      
      // 添加交互效果
      button.on('pointerover', () => {
        button.setTint(0xdddddd);
        buttonText.setScale(1.1);
      });
      
      button.on('pointerout', () => {
        button.clearTint();
        buttonText.setScale(1);
      });
      
      button.on('pointerdown', () => {
        button.setTint(0xaaaaaa);
        buttonText.setScale(0.9);
      });
      
      button.on('pointerup', () => {
        button.clearTint();
        buttonText.setScale(1);
        
        // 播放点击声音
        try {
          if (this.sound.get('click')) {
            this.sound.play('click');
            this.logDebug('播放点击音效');
          } else {
            this.logDebug('点击音效不存在', 'warning');
          }
        } catch (e) {
          this.logDebug(`音效播放失败: ${e.message}`, 'warning');
        }
        
        try {
          callback();
        } catch (error) {
          this.logDebug(`按钮回调执行失败: ${error.message}`, 'error');
        }
      });
      
      this.logDebug(`按钮 ${label} 创建成功`);
      return button;
    } catch (error) {
      this.logDebug(`按钮创建失败: ${error.message}`, 'error');
      return null;
    }
  }
  
  createDecorations(width, height) {
    this.logDebug('开始创建装饰元素');
    
    try {
      // 添加一些装饰图形
      let soldier, base;
      
      // 士兵图标
      try {
        soldier = this.add.sprite(width * 0.25, height * 0.45, 'soldier');
        soldier.setScale(2);
        this.logDebug('士兵图标创建成功');
      } catch (error) {
        this.logDebug(`士兵图标创建失败: ${error.message}`, 'warning');
        // 创建备用图形
        const soldierGraphics = this.add.graphics();
        soldierGraphics.fillStyle(0xcc0000, 1);
        soldierGraphics.fillCircle(width * 0.25, height * 0.45, 20);
        soldier = soldierGraphics;
        this.logDebug('创建了备用士兵图形');
      }
      
      // 基地图标
      try {
        base = this.add.sprite(width * 0.75, height * 0.45, 'base');
        base.setScale(1.2);
        this.logDebug('基地图标创建成功');
      } catch (error) {
        this.logDebug(`基地图标创建失败: ${error.message}`, 'warning');
        // 创建备用图形
        const baseGraphics = this.add.graphics();
        baseGraphics.fillStyle(0x0000cc, 1);
        baseGraphics.fillRect(width * 0.75 - 30, height * 0.45 - 30, 60, 60);
        base = baseGraphics;
        this.logDebug('创建了备用基地图形');
      }
      
      // 简单动画 - 只有在两个对象都是精灵时才创建动画
      if (soldier instanceof Phaser.GameObjects.Sprite && base instanceof Phaser.GameObjects.Sprite) {
        try {
          this.tweens.add({
            targets: [soldier, base],
            y: '+=10',
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
          this.logDebug('装饰元素动画创建成功');
        } catch (error) {
          this.logDebug(`装饰元素动画创建失败: ${error.message}`, 'warning');
        }
      } else {
        this.logDebug('跳过动画创建，因为不是所有元素都是精灵');
      }
      
      this.logDebug('装饰元素创建完成');
    } catch (error) {
      this.logDebug(`装饰元素创建失败: ${error.message}`, 'error');
    }
  }
} 