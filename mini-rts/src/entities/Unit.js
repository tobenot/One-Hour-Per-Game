export default class Unit {
  constructor(scene, x, y, type, faction, props) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.type = type;
    this.faction = faction; // player 或 enemy
    
    // 单位属性
    this.health = props.health || 100;
    this.maxHealth = this.health;
    this.speed = props.speed || 100;
    this.damage = props.damage || 10;
    this.attackRange = props.attackRange || 50;
    this.attackSpeed = props.attackSpeed || 1;
    this.harvestAmount = props.harvestAmount || 0;
    
    // 状态
    this.selected = false;
    this.moving = false;
    this.attacking = false;
    this.harvesting = false;
    this.target = null;
    this.targetPosition = null;
    this.lastAttackTime = 0;
    
    // 创建精灵
    this.sprite = scene.physics.add.sprite(x, y, type);
    this.sprite.setData('entity', this);
    
    // 根据阵营设置颜色
    if (faction === 'player') {
      this.sprite.setTint(0x00ff00); // 绿色
    } else {
      this.sprite.setTint(0xff0000); // 红色
    }
    
    // 设置动画
    this.sprite.anims.play(`${type}-idle`, true);
    
    // 添加选择指示器
    this.selectionCircle = scene.add.circle(x, y, 20, 0xffff00, 0.5);
    this.selectionCircle.setVisible(false);
    
    // 添加血条
    this.healthBar = scene.add.rectangle(x, y - 20, 30, 5, 0xff0000);
    this.healthBarBackground = scene.add.rectangle(x, y - 20, 30, 5, 0x000000);
    this.healthBarBackground.setStrokeStyle(1, 0xffffff);
    
    // 初始化物理
    this.scene.physics.world.enable(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);
  }
  
  update() {
    // 更新位置引用
    this.x = this.sprite.x;
    this.y = this.sprite.y;
    
    // 更新选择指示器位置
    this.selectionCircle.setPosition(this.x, this.y);
    
    // 更新血条位置和宽度
    const healthPercent = this.health / this.maxHealth;
    this.healthBarBackground.setPosition(this.x, this.y - 20);
    this.healthBar.setPosition(this.x - 15 + (30 * healthPercent) / 2, this.y - 20);
    this.healthBar.width = 30 * healthPercent;
    
    // 处理移动
    if (this.moving && this.targetPosition) {
      const distance = Phaser.Math.Distance.Between(
        this.x, this.y, 
        this.targetPosition.x, this.targetPosition.y
      );
      
      if (distance < 5) {
        this.stopMoving();
      }
    }
    
    // 处理攻击
    if (this.attacking && this.target) {
      // 检查目标是否还存在和在范围内
      if (!this.target.sprite || this.target.health <= 0) {
        this.stopAttacking();
        return;
      }
      
      const distance = Phaser.Math.Distance.Between(
        this.x, this.y,
        this.target.x, this.target.y
      );
      
      if (distance <= this.attackRange) {
        // 停止移动并面向目标
        this.sprite.body.reset(this.x, this.y);
        
        // 按攻击速度发起攻击
        const now = this.scene.time.now;
        if (now - this.lastAttackTime > 1000 / this.attackSpeed) {
          this.attack();
          this.lastAttackTime = now;
        }
      } else {
        // 如果目标不在范围内，就向它移动
        this.moveTo(this.target.x, this.target.y);
      }
    }
    
    // 处理资源收集
    if (this.harvesting && this.target) {
      // 检查资源是否还存在
      if (this.target.amount <= 0) {
        this.stopHarvesting();
        return;
      }
      
      const distance = Phaser.Math.Distance.Between(
        this.x, this.y,
        this.target.x, this.target.y
      );
      
      if (distance <= 30) {
        // 停止移动
        this.sprite.body.reset(this.x, this.y);
        
        // 按收集速度收集资源
        const now = this.scene.time.now;
        if (now - this.lastAttackTime > 2000) { // 每2秒收集一次
          this.harvest();
          this.lastAttackTime = now;
        }
      } else {
        // 如果资源不在范围内，就向它移动
        this.moveTo(this.target.x, this.target.y);
      }
    }
  }
  
  setSelected(selected) {
    this.selected = selected;
    this.selectionCircle.setVisible(selected);
  }
  
  moveTo(x, y) {
    // 停止当前的所有行为
    this.stopActions();
    
    // 设置新的移动目标
    this.moving = true;
    this.targetPosition = { x, y };
    
    // 计算方向
    const angle = Phaser.Math.Angle.Between(this.x, this.y, x, y);
    
    // 设置速度
    this.sprite.body.velocity.x = Math.cos(angle) * this.speed;
    this.sprite.body.velocity.y = Math.sin(angle) * this.speed;
    
    // 播放移动动画
    this.sprite.anims.play(`${this.type}-walk`, true);
  }
  
  stopMoving() {
    this.moving = false;
    this.targetPosition = null;
    this.sprite.body.reset(this.x, this.y);
    this.sprite.anims.play(`${this.type}-idle`, true);
  }
  
  attackTarget(target) {
    // 停止当前的所有行为
    this.stopActions();
    
    // 设置攻击目标
    this.attacking = true;
    this.target = target;
    
    // 如果目标在范围内，立即攻击
    const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    if (distance <= this.attackRange) {
      this.attack();
    } else {
      // 否则移动到目标附近
      this.moveTo(target.x, target.y);
    }
  }
  
  attack() {
    if (!this.target || this.target.health <= 0) {
      this.stopAttacking();
      return;
    }
    
    // 播放攻击动画
    if (this.sprite.anims.exists(`${this.type}-attack`)) {
      this.sprite.anims.play(`${this.type}-attack`, true);
      
      // 动画完成后恢复idle状态
      this.sprite.on('animationcomplete', () => {
        this.sprite.anims.play(`${this.type}-idle`, true);
      }, this);
    }
    
    // 造成伤害
    this.target.takeDamage(this.damage);
    
    // 播放攻击音效
    this.scene.sound.play('battle');
  }
  
  stopAttacking() {
    this.attacking = false;
    this.target = null;
    this.sprite.anims.play(`${this.type}-idle`, true);
  }
  
  harvestResource(resource) {
    // 停止当前的所有行为
    this.stopActions();
    
    // 设置收集目标
    this.harvesting = true;
    this.target = resource;
    
    // 如果资源在范围内，立即收集
    const distance = Phaser.Math.Distance.Between(this.x, this.y, resource.x, resource.y);
    if (distance <= 30) {
      this.harvest();
    } else {
      // 否则移动到资源附近
      this.moveTo(resource.x, resource.y);
    }
  }
  
  harvest() {
    if (!this.target || this.target.amount <= 0) {
      this.stopHarvesting();
      return;
    }
    
    // 从资源中收集
    const amount = Math.min(this.harvestAmount, this.target.amount);
    this.target.removeAmount(amount);
    
    // 如果是玩家单位，则添加到玩家资源
    if (this.faction === 'player') {
      this.scene.addResources(amount);
    }
  }
  
  stopHarvesting() {
    this.harvesting = false;
    this.target = null;
    this.sprite.anims.play(`${this.type}-idle`, true);
  }
  
  takeDamage(amount) {
    this.health -= amount;
    
    // 如果死亡，移除单位
    if (this.health <= 0) {
      this.destroy();
    }
  }
  
  stopActions() {
    this.stopMoving();
    this.stopAttacking();
    this.stopHarvesting();
  }
  
  destroy() {
    // 从相应的单位列表中移除
    if (this.faction === 'player') {
      const index = this.scene.playerUnits.indexOf(this);
      if (index > -1) {
        this.scene.playerUnits.splice(index, 1);
      }
    } else {
      const index = this.scene.enemyUnits.indexOf(this);
      if (index > -1) {
        this.scene.enemyUnits.splice(index, 1);
      }
    }
    
    // 销毁游戏对象
    this.selectionCircle.destroy();
    this.healthBar.destroy();
    this.healthBarBackground.destroy();
    this.sprite.destroy();
  }
} 