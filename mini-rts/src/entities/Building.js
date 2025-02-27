export default class Building extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, type, faction, props) {
    super(scene, x, y, `${faction}-${type}`);
    
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.type = type;
    this.faction = faction; // player 或 enemy
    
    // 添加到场景
    scene.add.existing(this);
    
    // 添加物理属性
    scene.physics.add.existing(this, true); // true表示是静态物体
    
    // 设置属性
    this.health = props.health || 100;
    this.maxHealth = props.health || 100;
    this.buildTime = props.buildTime || 0;
    this.cost = props.cost || 0;
    this.canProduce = props.canProduce || [];
    
    // 建筑状态
    this.isBuilding = this.buildTime > 0;
    this.buildProgress = 0;
    this.isProducing = false;
    this.productionType = null;
    this.productionProgress = 0;
    this.productionTime = 0;
    
    // 设置选择效果
    this.isSelected = false;
    this.selectionCircle = scene.add.circle(x, y, 40, 0xffff00, 0.3);
    this.selectionCircle.setVisible(false);
    
    // 如果是在建造中，显示半透明
    if (this.isBuilding) {
      this.setAlpha(0.6);
    }
    
    // 健康条
    this.healthBar = scene.add.rectangle(x, y - 30, 50, 5, 0x00ff00);
    this.healthBar.setDepth(1);
    
    // 生产进度条（初始不可见）
    this.progressBar = scene.add.rectangle(x, y + 30, 0, 5, 0x0000ff);
    this.progressBar.setDepth(1);
    this.progressBar.setVisible(false);
    
    // 根据阵营设置颜色
    if (faction === 'player') {
      this.setTint(0x00ff00); // 绿色
    } else {
      this.setTint(0xff0000); // 红色
    }
  }
  
  setSelected(selected) {
    this.isSelected = selected;
    this.selectionCircle.setVisible(selected);
  }
  
  takeDamage(amount) {
    this.health -= amount;
    
    // 更新健康条
    this.healthBar.width = (this.health / this.maxHealth) * 50;
    
    // 如果健康值低于一半，改变健康条颜色
    if (this.health < this.maxHealth / 2) {
      this.healthBar.fillColor = 0xff0000;
    }
    
    // 如果建筑被摧毁
    if (this.health <= 0) {
      this.destroy();
    }
  }
  
  update(time, delta) {
    // 更新健康条位置
    this.healthBar.x = this.x;
    this.healthBar.y = this.y - 30;
    
    // 更新选择圈位置
    this.selectionCircle.x = this.x;
    this.selectionCircle.y = this.y;
    
    // 如果在建造中
    if (this.isBuilding) {
      // 更新建造进度
      this.buildProgress += delta / 1000; // 增加经过的秒数
      
      if (this.buildProgress >= this.buildTime) {
        // 建造完成
        this.isBuilding = false;
        this.setAlpha(1); // 恢复完全不透明
        
        // 播放完成音效
        try {
          this.scene.sound.play('build-complete');
        } catch (e) {
          console.log('音效播放失败');
        }
        
        // 显示消息
        if (this.scene.ui) {
          this.scene.ui.showMessage(`${this.type === 'barracks' ? '兵营' : this.type} 建造完成`);
        } else if (this.scene.showMessage) {
          this.scene.showMessage(`${this.type === 'barracks' ? '兵营' : this.type} 建造完成`);
        }
      }
    }
    
    // 如果在生产单位
    if (this.isProducing) {
      // 更新进度条位置
      this.progressBar.x = this.x;
      this.progressBar.y = this.y + 30;
      
      // 更新生产进度
      this.productionProgress += delta / 1000; // 增加经过的秒数
      this.progressBar.width = (this.productionProgress / this.productionTime) * 50;
      
      // 如果生产完成
      if (this.productionProgress >= this.productionTime) {
        // 创建单位
        this.createUnit();
        
        // 重置生产状态
        this.isProducing = false;
        this.productionType = null;
        this.productionProgress = 0;
        this.progressBar.setVisible(false);
      }
    }
  }
  
  startProduction(unitType) {
    // 检查是否可以生产该类型单位
    if (!this.canProduce.includes(unitType)) {
      // 显示错误消息
      if (this.scene.ui) {
        this.scene.ui.showMessage(`此建筑无法生产 ${unitType}`);
      } else if (this.scene.showMessage) {
        this.scene.showMessage(`此建筑无法生产 ${unitType}`);
      }
      return;
    }
    
    // 检查是否已经在生产
    if (this.isProducing) {
      // 显示错误消息
      if (this.scene.ui) {
        this.scene.ui.showMessage('已在生产中');
      } else if (this.scene.showMessage) {
        this.scene.showMessage('已在生产中');
      }
      return;
    }
    
    // 设置生产参数
    const productionTimes = {
      'worker': 10,
      'soldier': 15
    };
    
    // 检查玩家资源是否足够
    const unitCosts = {
      'worker': 50,
      'soldier': 80
    };
    
    if (this.faction === 'player' && this.scene.resources < unitCosts[unitType]) {
      // 显示错误消息
      if (this.scene.ui) {
        this.scene.ui.showMessage('资源不足');
      } else if (this.scene.showMessage) {
        this.scene.showMessage('资源不足');
      }
      return;
    }
    
    // 扣除资源
    if (this.faction === 'player') {
      this.scene.resources -= unitCosts[unitType];
      
      // 更新资源显示
      if (this.scene.updateResources) {
        this.scene.updateResources();
      }
    }
    
    // 开始生产
    this.isProducing = true;
    this.productionType = unitType;
    this.productionProgress = 0;
    this.productionTime = productionTimes[unitType];
    
    // 显示进度条
    this.progressBar.setVisible(true);
    this.progressBar.width = 0;
    
    // 显示消息
    if (this.scene.ui) {
      this.scene.ui.showMessage(`开始生产 ${unitType === 'worker' ? '工人' : unitType === 'soldier' ? '士兵' : unitType}`);
    } else if (this.scene.showMessage) {
      this.scene.showMessage(`开始生产 ${unitType === 'worker' ? '工人' : unitType === 'soldier' ? '士兵' : unitType}`);
    }
  }
  
  createUnit() {
    // 计算单位的生成位置（建筑周围）
    const offset = 60;
    const spawnPoints = [
      { x: this.x + offset, y: this.y },
      { x: this.x - offset, y: this.y },
      { x: this.x, y: this.y + offset },
      { x: this.x, y: this.y - offset }
    ];
    
    // 尝试找到一个没有被占用的位置
    let spawnPosition = null;
    for (const point of spawnPoints) {
      // 简单检查，后续可以改进为使用物理引擎检测
      if (!this.scene.getEntityAtPosition(point.x, point.y)) {
        spawnPosition = point;
        break;
      }
    }
    
    // 如果所有位置都被占用，则使用随机偏移
    if (!spawnPosition) {
      spawnPosition = {
        x: this.x + Phaser.Math.Between(-offset, offset),
        y: this.y + Phaser.Math.Between(-offset, offset)
      };
    }
    
    // 创建单位
    const unit = this.scene.createUnit(
      this.productionType,
      this.faction,
      spawnPosition.x,
      spawnPosition.y
    );
    
    // 显示消息
    if (unit && this.faction === 'player') {
      if (this.scene.ui) {
        this.scene.ui.showMessage(`${this.productionType === 'worker' ? '工人' : this.productionType === 'soldier' ? '士兵' : this.productionType} 已生产完成`);
      } else if (this.scene.showMessage) {
        this.scene.showMessage(`${this.productionType === 'worker' ? '工人' : this.productionType === 'soldier' ? '士兵' : this.productionType} 已生产完成`);
      }
    }
  }
  
  destroy() {
    // 清理所有子元素
    this.selectionCircle.destroy();
    this.healthBar.destroy();
    this.progressBar.destroy();
    
    // 从场景的建筑列表中移除
    if (this.scene.buildings) {
      const index = this.scene.buildings.indexOf(this);
      if (index !== -1) {
        this.scene.buildings.splice(index, 1);
      }
    }
    
    // 调用父类的销毁方法
    super.destroy();
  }
} 