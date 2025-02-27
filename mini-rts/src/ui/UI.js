export default class UI {
  constructor(scene) {
    this.scene = scene;
    
    // 获取游戏视口尺寸
    this.width = scene.cameras.main.width;
    this.height = scene.cameras.main.height;
    
    // 创建UI面板
    this.panel = scene.add.rectangle(this.width / 2, this.height - 40, this.width, 80, 0x333333, 0.8);
    this.panel.setScrollFactor(0); // 固定在屏幕上
    
    // 创建资源显示
    this.resourceIcon = scene.add.image(20, 20, 'resource-icon');
    this.resourceIcon.setScrollFactor(0);
    this.resourceIcon.setScale(0.5);
    
    this.resourceText = scene.add.text(40, 20, '50', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff'
    });
    this.resourceText.setScrollFactor(0);
    
    // 创建信息显示
    this.infoText = scene.add.text(this.width / 2, 20, '', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      align: 'center'
    });
    this.infoText.setScrollFactor(0);
    this.infoText.setOrigin(0.5, 0);
    
    // 创建消息显示
    this.messageText = scene.add.text(this.width / 2, this.height - 150, '', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    this.messageText.setScrollFactor(0);
    this.messageText.setOrigin(0.5);
    this.messageText.setVisible(false);
    
    // 创建按钮
    this.createButtons();
    
    // 消息计时器
    this.messageTimer = null;
  }
  
  update() {
    // 更新UI元素位置（如果需要）
  }
  
  updateResources(amount) {
    this.resourceText.setText(`${amount}`);
  }
  
  updateSelection(entity) {
    // 清除之前的选择按钮
    this.clearActionButtons();
    
    // 如果没有选择任何实体，只显示基础信息
    if (!entity) {
      this.infoText.setText('没有选择单位');
      return;
    }
    
    // 根据选择的实体类型更新信息和操作按钮
    if (entity.faction === 'player') {
      // 显示实体信息
      let info = `${entity.type === 'worker' ? '工人' : entity.type === 'soldier' ? '士兵' : entity.type === 'base' ? '基地' : entity.type === 'barracks' ? '兵营' : entity.type}`;
      info += ` - 生命值: ${Math.floor(entity.health)}/${entity.maxHealth}`;
      
      if (entity.type === 'worker') {
        info += ` | 收集效率: ${entity.harvestAmount}`;
        
        // 为工人添加建造按钮
        this.addActionButton('建造兵营', () => {
          this.scene.startBuildMode('barracks');
        });
      } else if (entity.type === 'soldier') {
        info += ` | 攻击力: ${entity.damage}`;
      } else if (entity.type === 'base') {
        // 为基地添加生产工人按钮
        this.addActionButton('生产工人', () => {
          entity.startProduction('worker');
        });
      } else if (entity.type === 'barracks') {
        // 为兵营添加生产士兵按钮
        this.addActionButton('生产士兵', () => {
          entity.startProduction('soldier');
        });
      }
      
      this.infoText.setText(info);
    } else {
      // 显示敌人信息
      this.infoText.setText(`敌方 ${entity.type} - 生命值: ${Math.floor(entity.health)}/${entity.maxHealth}`);
    }
  }
  
  createButtons() {
    // 创建操作按钮容器
    this.actionButtons = [];
    this.actionButtonCallbacks = [];
  }
  
  addActionButton(text, callback) {
    const buttonIndex = this.actionButtons.length;
    const buttonX = this.width / 2 - 100 + buttonIndex * 150;
    const buttonY = this.height - 40;
    
    // 创建按钮背景
    const button = this.scene.add.rectangle(buttonX, buttonY, 130, 40, 0x666666);
    button.setScrollFactor(0);
    button.setInteractive({ useHandCursor: true });
    
    // 创建按钮文本
    const buttonText = this.scene.add.text(buttonX, buttonY, text, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff'
    });
    buttonText.setScrollFactor(0);
    buttonText.setOrigin(0.5);
    
    // 添加点击效果
    button.on('pointerover', () => {
      button.setFillStyle(0x888888);
    });
    
    button.on('pointerout', () => {
      button.setFillStyle(0x666666);
    });
    
    button.on('pointerdown', () => {
      this.scene.sound.play('click');
      callback();
    });
    
    // 存储按钮引用
    this.actionButtons.push({ background: button, text: buttonText });
    this.actionButtonCallbacks.push(callback);
  }
  
  clearActionButtons() {
    // 清除所有操作按钮
    this.actionButtons.forEach(button => {
      button.background.destroy();
      button.text.destroy();
    });
    
    this.actionButtons = [];
    this.actionButtonCallbacks = [];
  }
  
  showMessage(text, duration = 3000) {
    // 显示消息
    this.messageText.setText(text);
    this.messageText.setVisible(true);
    
    // 清除之前的计时器
    if (this.messageTimer) {
      this.messageTimer.remove();
    }
    
    // 设置新计时器
    this.messageTimer = this.scene.time.delayedCall(duration, () => {
      this.messageText.setVisible(false);
    });
  }
} 