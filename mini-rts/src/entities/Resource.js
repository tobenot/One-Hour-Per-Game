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
    
    // 添加资源被挖掘的视觉效果
    this.showHarvestEffect();
    
    // 如果资源耗尽，更新显示
    if (this.amount <= 0) {
      this.resourceText.setText('0');
      this.resourceBar.width = 0;
      this.sprite.setAlpha(0.3);
    }
  }
  
  // 添加资源被挖掘的视觉效果
  showHarvestEffect() {
    // 闪烁效果
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.7,
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.sprite.setAlpha(1);
      }
    });
    
    // 粒子效果 (如果可能)
    try {
      const particles = this.scene.add.particles(this.x, this.y, 'mine', {
        speed: 50,
        scale: { start: 0.2, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 500,
        blendMode: 'ADD',
        quantity: 3
      });
      
      // 短暂显示后销毁
      this.scene.time.delayedCall(500, () => {
        particles.destroy();
      });
    } catch (error) {
      // 如果粒子效果失败，忽略错误
      console.log('粒子效果创建失败，跳过');
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