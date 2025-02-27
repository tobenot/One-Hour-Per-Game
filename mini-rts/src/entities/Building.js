export default class Building {
  constructor(scene, x, y, type, faction, props) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.type = type;
    this.faction = faction; // player 或 enemy
    
    // 建筑属性
    this.health = props.health || 300;
    this.maxHealth = this.health;
    this.buildTime = props.buildTime || 0;
    this.buildProgress = 0;
    this.built = this.buildTime === 0;
    this.cost = props.cost || 0;
    this.canProduce = props.canProduce || [];
    
    // 当前生产状态
    this.producing = false;
    this.productionType = null;
    this.productionProgress = 0;
    this.productionTime = 0;
    
    // 状态
    this.selected = false;
    
    // 创建精灵
    this.sprite = scene.physics.add.sprite(x, y, type);
    this.sprite.setData('entity', this);
    this.sprite.setImmovable(true);
    
    // 设置尺寸
    this.sprite.setScale(1.5);
    
    // 如果建筑未完成，将其设置为半透明
    if (!this.built) {
      this.sprite.setAlpha(0.5);
    }
    
    // 根据阵营设置颜色
    if (faction === 'player') {
      this.sprite.setTint(0x00ff00); // 绿色
    } else {
      this.sprite.setTint(0xff0000); // 红色
    }
    
    // 添加选择指示器
    this.selectionCircle = scene.add.circle(x, y, 40, 0xffff00, 0.3);
    this.selectionCircle.setVisible(false);
    
    // 添加血条
    this.healthBar = scene.add.rectangle(x, y - 40, 60, 8, 0xff0000);
    this.healthBarBackground = scene.add.rectangle(x, y - 40, 60, 8, 0x000000);
    this.healthBarBackground.setStrokeStyle(1, 0xffffff);
    
    // 添加建造/生产进度条
    this.progressBar = scene.add.rectangle(x, y + 40, 0, 8, 0x0000ff);
    this.progressBarBackground = scene.add.rectangle(x, y + 40, 60, 8, 0x000000);
    this.progressBarBackground.setStrokeStyle(1, 0xffffff);
    this.progressBar.setVisible(false);
    this.progressBarBackground.setVisible(false);
    
    // 初始化物理
    this.scene.physics.world.enable(this.sprite);
    this.sprite.body.setImmovable(true);
  }
  
  update() {
    // 更新血条
    const healthPercent = this.health / this.maxHealth;
    this.healthBar.width = 60 * healthPercent;
    this.healthBar.setPosition(this.x - 30 + (60 * healthPercent) / 2, this.y - 40);
    
    // 如果建筑未完成，更新建造进度
    if (!this.built) {
      this.buildProgress += this.scene.time.deltaMS / 1000; // 增加经过的时间（秒）
      
      // 更新进度条
      const progressPercent = this.buildProgress / this.buildTime;
      this.progressBar.width = 60 * progressPercent;
      this.progressBar.setPosition(this.x - 30 + (60 * progressPercent) / 2, this.y + 40);
      
      this.progressBar.setVisible(true);
      this.progressBarBackground.setVisible(true);
      
      // 检查是否建造完成
      if (this.buildProgress >= this.buildTime) {
        this.built = true;
        this.sprite.setAlpha(1);
        this.progressBar.setVisible(false);
        this.progressBarBackground.setVisible(false);
        
        // 播放建造完成音效
        this.scene.sound.play('build');
      }
    }
    
    // 如果正在生产单位
    if (this.producing && this.built) {
      this.productionProgress += this.scene.time.deltaMS / 1000;
      
      // 更新进度条
      const progressPercent = this.productionProgress / this.productionTime;
      this.progressBar.width = 60 * progressPercent;
      this.progressBar.setPosition(this.x - 30 + (60 * progressPercent) / 2, this.y + 40);
      
      this.progressBar.setVisible(true);
      this.progressBarBackground.setVisible(true);
      
      // 检查是否生产完成
      if (this.productionProgress >= this.productionTime) {
        this.completeProduction();
      }
    }
  }
  
  setSelected(selected) {
    this.selected = selected;
    this.selectionCircle.setVisible(selected);
  }
  
  startProduction(unitType) {
    if (!this.built || this.producing) return false;
    
    // 检查是否可以生产该类型
    if (!this.canProduce.includes(unitType)) return false;
    
    // 检查资源是否足够
    const unitCosts = {
      'worker': 50,
      'soldier': 80
    };
    
    if (this.faction === 'player' && this.scene.resources < unitCosts[unitType]) {
      this.scene.ui.showMessage('资源不足');
      return false;
    }
    
    // 设置生产参数
    this.producing = true;
    this.productionType = unitType;
    this.productionProgress = 0;
    this.productionTime = unitType === 'worker' ? 10 : 15; // 工人10秒，士兵15秒
    
    // 扣除资源
    if (this.faction === 'player') {
      this.scene.resources -= unitCosts[unitType];
      this.scene.ui.updateResources(this.scene.resources);
    }
    
    // 显示进度条
    this.progressBar.setFillStyle(0x0000ff); // 蓝色表示生产
    this.progressBar.setVisible(true);
    this.progressBarBackground.setVisible(true);
    
    return true;
  }
  
  completeProduction() {
    if (!this.producing) return;
    
    // 创建单位
    const spawnOffsetX = this.faction === 'player' ? 60 : -60;
    const unit = this.scene.createUnit(
      this.productionType,
      this.faction,
      this.x + spawnOffsetX,
      this.y + 30
    );
    
    // 重置生产状态
    this.producing = false;
    this.productionType = null;
    this.productionProgress = 0;
    
    // 隐藏进度条
    this.progressBar.setVisible(false);
    this.progressBarBackground.setVisible(false);
  }
  
  takeDamage(amount) {
    this.health -= amount;
    
    // 如果建筑被摧毁
    if (this.health <= 0) {
      this.destroy();
    }
  }
  
  destroy() {
    // 从建筑列表中移除
    const index = this.scene.buildings.indexOf(this);
    if (index > -1) {
      this.scene.buildings.splice(index, 1);
    }
    
    // 销毁游戏对象
    this.selectionCircle.destroy();
    this.healthBar.destroy();
    this.healthBarBackground.destroy();
    this.progressBar.destroy();
    this.progressBarBackground.destroy();
    this.sprite.destroy();
  }
} 