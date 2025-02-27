export default class Resource {
  constructor(scene, x, y, type, amount) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.type = type;
    this.amount = amount || 500;
    this.maxAmount = this.amount;
    
    // 创建精灵
    this.sprite = scene.physics.add.sprite(x, y, type);
    this.sprite.setData('entity', this);
    this.sprite.setImmovable(true);
    
    // 添加资源量显示
    this.resourceText = scene.add.text(x, y - 30, `${this.amount}`, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.resourceText.setOrigin(0.5);
    
    // 添加资源量进度条
    this.resourceBar = scene.add.rectangle(x, y + 30, 50, 5, 0xffff00);
    this.resourceBarBackground = scene.add.rectangle(x, y + 30, 50, 5, 0x000000);
    this.resourceBarBackground.setStrokeStyle(1, 0xffffff);
    
    // 初始化物理
    this.scene.physics.world.enable(this.sprite);
    this.sprite.body.setImmovable(true);
  }
  
  update() {
    // 更新资源量显示
    this.resourceText.setText(`${this.amount}`);
    
    // 更新资源量进度条
    const percent = this.amount / this.maxAmount;
    this.resourceBar.width = 50 * percent;
    this.resourceBar.setPosition(this.x - 25 + (50 * percent) / 2, this.y + 30);
  }
  
  removeAmount(amount) {
    this.amount = Math.max(0, this.amount - amount);
    
    // 如果资源耗尽，更新显示
    if (this.amount <= 0) {
      this.resourceText.setText('0');
      this.resourceBar.width = 0;
      this.sprite.setAlpha(0.3);
    }
  }
  
  destroy() {
    // 从资源列表中移除
    const index = this.scene.resourceNodes.indexOf(this);
    if (index > -1) {
      this.scene.resourceNodes.splice(index, 1);
    }
    
    // 销毁游戏对象
    this.resourceText.destroy();
    this.resourceBar.destroy();
    this.resourceBarBackground.destroy();
    this.sprite.destroy();
  }
} 