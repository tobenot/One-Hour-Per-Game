import Resource from './Resource';

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
    
    // 自动攻击相关属性
    this.detectionRange = props.detectionRange || this.attackRange * 1.5; // 默认检测范围比攻击范围大50%
    this.autoAttack = props.autoAttack !== undefined ? props.autoAttack : true; // 默认启用自动攻击
    this.priorityTarget = null; // 玩家手动指定的优先目标
    this.lastDetectionTime = 0; // 上次检测敌人的时间
    this.detectionInterval = 500; // 检测间隔（毫秒）
    
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
    
    // 更新挖矿图标位置（如果存在）
    if (this.harvestIcon && this.harvestIcon.visible) {
      this.harvestIcon.setPosition(this.x, this.y - 30);
    }
    
    // 处理移动
    if (this.moving && this.targetPosition) {
      const distance = Phaser.Math.Distance.Between(
        this.x, this.y, 
        this.targetPosition.x, this.targetPosition.y
      );
      
      if (distance < 5) {
        this.stopMoving();
        
        // 如果移动目标是资源点，并且工人类型是worker，则自动开始挖矿
        if (this.type === 'worker' && this.targetResource) {
          this.harvestResource(this.targetResource);
          this.targetResource = null;
        }
      }
    }
    
    // 处理攻击
    if (this.attacking && this.target) {
      // 检查目标是否还存在和在范围内
      if ((this.target.sprite && !this.target.sprite.active) || 
          (!this.target.sprite && !this.target.active) || 
          this.target.health <= 0) {
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
        if (now - this.lastAttackTime > 1000) { // 每1秒收集一次（从2秒改为1秒）
          this.harvest();
          this.lastAttackTime = now;
          
          // 如果收集动画存在，尝试播放收集动画
          if (this.sprite.anims.exists(`${this.type}-harvest`)) {
            this.sprite.anims.play(`${this.type}-harvest`, true);
          } else if (this.sprite.anims.exists(`${this.type}-attack`)) {
            // 没有专门的收集动画时，播放攻击动画
            this.sprite.anims.play(`${this.type}-attack`, true);
            
            // 动画完成后恢复idle状态
            this.sprite.once('animationcomplete', () => {
              if (this.harvesting) { // 如果还在收集状态
                this.sprite.anims.play(`${this.type}-idle`, true);
              }
            });
          }
        }
      } else {
        // 如果资源不在范围内，就向它移动
        this.moveTo(this.target.x, this.target.y);
      }
    }
    
    // 自动攻击检测逻辑
    if (this.autoAttack && !this.attacking && !this.harvesting && this.type !== 'worker') {
      const now = this.scene.time.now;
      // 定期检测敌人，避免每帧都检测影响性能
      if (now - this.lastDetectionTime > this.detectionInterval) {
        this.lastDetectionTime = now;
        this.detectAndAttackEnemies();
      }
    }
  }
  
  // 检测并攻击周围的敌人
  detectAndAttackEnemies() {
    // 如果已经在攻击中，不检测
    if (this.attacking) return;
    
    // 如果是worker且正在收集资源，不检测
    if (this.type === 'worker' && this.harvesting) return;
    
    // 获取敌对单位列表
    const enemyUnits = this.faction === 'player' ? this.scene.enemyUnits : this.scene.playerUnits;
    
    // 如果有优先目标，优先检查它
    if (this.priorityTarget && this.priorityTarget.health > 0) {
      const distance = Phaser.Math.Distance.Between(
        this.x, this.y,
        this.priorityTarget.x, this.priorityTarget.y
      );
      
      if (distance <= this.detectionRange) {
        this.attackTarget(this.priorityTarget);
        return;
      }
    }
    
    // 没有优先目标或优先目标不在范围内，检查其他敌人
    let closestEnemy = null;
    let closestDistance = this.detectionRange;
    
    for (const enemy of enemyUnits) {
      // 跳过已经死亡的敌人
      if (enemy.health <= 0) continue;
      
      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      
      if (distance < closestDistance) {
        closestEnemy = enemy;
        closestDistance = distance;
      }
    }
    
    // 如果找到敌人，攻击它
    if (closestEnemy) {
      // 如果正在移动，先完成移动
      if (this.moving) {
        // 记录这个敌人，但不立即攻击
        this.pendingAttackTarget = closestEnemy;
      } else {
        this.attackTarget(closestEnemy);
      }
    }
  }
  
  setSelected(selected) {
    this.selected = selected;
    this.selectionCircle.setVisible(selected);
  }
  
  moveTo(x, y, targetEntity = null) {
    // 停止当前的所有行为
    this.stopActions();
    
    // 设置新的移动目标
    this.moving = true;
    this.targetPosition = { x, y };
    
    // 保存目标实体引用（特别是对资源点）
    if (targetEntity instanceof Resource && this.type === 'worker') {
      this.targetResource = targetEntity;
    }
    
    // 计算方向
    const angle = Phaser.Math.Angle.Between(this.x, this.y, x, y);
    
    // 设置速度
    this.sprite.body.velocity.x = Math.cos(angle) * this.speed;
    this.sprite.body.velocity.y = Math.sin(angle) * this.speed;
    
    // 播放移动动画
    this.sprite.anims.play(`${this.type}-walk`, true);
    
    // 清除待攻击目标
    this.pendingAttackTarget = null;
  }
  
  stopMoving() {
    this.moving = false;
    this.targetPosition = null;
    this.sprite.body.reset(this.x, this.y);
    this.sprite.anims.play(`${this.type}-idle`, true);
    
    // 检查是否有待攻击的目标
    if (this.pendingAttackTarget && this.pendingAttackTarget.health > 0) {
      this.attackTarget(this.pendingAttackTarget);
      this.pendingAttackTarget = null;
    }
  }
  
  attackTarget(target) {
    // 设置为优先目标
    this.priorityTarget = target;
    
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
      // 添加一个小偏移量，以避免所有单位都挤在同一个点
      const offsetX = Math.random() * 20 - 10;
      const offsetY = Math.random() * 20 - 10;
      this.moveTo(target.x + offsetX, target.y + offsetY);
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
      
      // 动画完成后恢复idle状态，但保持攻击状态
      this.sprite.once('animationcomplete', () => {
        if (this.attacking) {
          this.sprite.anims.play(`${this.type}-idle`, true);
        }
      });
    }
    
    // 造成伤害
    this.target.takeDamage(this.damage);
    
    // 添加视觉反馈
    this.showAttackEffect();
    
    // 播放攻击音效
    try {
      if (this.scene.sound.get('battle')) {
        this.scene.sound.play('battle');
      }
    } catch (e) {
      console.log('音效播放失败');
    }
  }
  
  // 添加攻击视觉效果
  showAttackEffect() {
    // 创建一个从单位到目标的线，表示攻击
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(2, 0xff0000, 1);
    graphics.lineBetween(this.x, this.y, this.target.x, this.target.y);
    
    // 在目标位置添加一个爆炸效果
    const explosion = this.scene.add.circle(this.target.x, this.target.y, 10, 0xff0000, 0.7);
    
    // 动画效果
    this.scene.tweens.add({
      targets: explosion,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => {
        explosion.destroy();
      }
    });
    
    // 线在300毫秒后消失
    this.scene.time.delayedCall(300, () => {
      graphics.destroy();
    });
  }
  
  stopAttacking() {
    this.attacking = false;
    this.target = null;
    this.sprite.anims.play(`${this.type}-idle`, true);
    
    // 清除优先目标，如果当前目标是优先目标
    if (this.target === this.priorityTarget) {
      this.priorityTarget = null;
    }
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
      // 播放挖矿动画（如果有）
      if (this.sprite.anims.exists(`${this.type}-harvest`)) {
        this.sprite.anims.play(`${this.type}-harvest`, true);
      } else {
        // 没有专门的挖矿动画时使用攻击动画
        if (this.sprite.anims.exists(`${this.type}-attack`)) {
          this.sprite.anims.play(`${this.type}-attack`, true);
        }
      }
    } else {
      // 否则移动到资源附近，并指定目标资源
      this.moveTo(resource.x, resource.y, resource);
    }
    
    // 在头上显示挖矿图标
    if (!this.harvestIcon) {
      this.harvestIcon = this.scene.add.sprite(this.x, this.y - 30, 'mine');
      if (this.harvestIcon.width > 20) {
        this.harvestIcon.setScale(20 / this.harvestIcon.width);
      }
    } else {
      this.harvestIcon.setVisible(true);
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
    
    // 显示收集效果
    this.showHarvestEffect(amount);
    
    // 如果是玩家单位，则添加到玩家资源
    if (this.faction === 'player') {
      this.scene.addResources(amount);
    }
  }
  
  // 添加资源收集视觉效果
  showHarvestEffect(amount) {
    // 创建一个浮动文本显示收集的资源量
    const text = this.scene.add.text(this.x, this.y - 30, `+${amount}`, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    });
    text.setOrigin(0.5);
    
    // 创建浮动和消失动画
    this.scene.tweens.add({
      targets: text,
      y: this.y - 60,
      alpha: 0,
      duration: 1500,
      onComplete: () => {
        text.destroy();
      }
    });
    
    // 添加一条从资源到单位的线，表示资源正在被收集
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(2, 0xffff00, 1);
    graphics.lineBetween(this.x, this.y, this.target.x, this.target.y);
    
    // 线在500毫秒后消失
    this.scene.time.delayedCall(500, () => {
      graphics.destroy();
    });
  }
  
  stopHarvesting() {
    this.harvesting = false;
    this.target = null;
    this.sprite.anims.play(`${this.type}-idle`, true);
    
    // 隐藏挖矿图标
    if (this.harvestIcon) {
      this.harvestIcon.setVisible(false);
    }
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
    
    // 销毁挖矿图标
    if (this.harvestIcon) {
      this.harvestIcon.destroy();
    }
    
    // 销毁游戏对象
    this.selectionCircle.destroy();
    this.healthBar.destroy();
    this.healthBarBackground.destroy();
    this.sprite.destroy();
  }
} 