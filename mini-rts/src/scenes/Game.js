import Unit from '../entities/Unit';
import Building from '../entities/Building';
import Resource from '../entities/Resource';
import UI from '../ui/UI';

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
    
    // 游戏状态
    this.resources = 50; // 初始资源
    this.selectedEntities = []; // 当前选中的实体
    this.playerUnits = []; // 玩家单位
    this.enemyUnits = []; // 敌人单位
    this.buildings = []; // 建筑
    this.resourceNodes = []; // 资源点
    
    // 建造状态
    this.buildMode = false;
    this.buildingToPlace = null;
  }

  create() {
    // 创建地图
    this.createMap();
    
    // 创建资源点
    this.createResources();
    
    // 创建玩家的初始基地和单位
    this.createPlayerBase();
    
    // 创建敌人基地和单位
    this.createEnemyBase();
    
    // 创建UI
    this.ui = new UI(this);
    
    // 设置相机控制
    this.setupCamera();
    
    // 设置输入处理
    this.setupInput();
    
    // 游戏逻辑更新事件
    this.time.addEvent({
      delay: 1000, // 每秒更新一次
      callback: this.updateGameLogic,
      callbackScope: this,
      loop: true
    });
  }
  
  update() {
    // 更新所有单位
    [...this.playerUnits, ...this.enemyUnits].forEach(unit => {
      unit.update();
    });
    
    // 更新建筑
    this.buildings.forEach(building => {
      building.update();
    });
    
    // 更新UI
    this.ui.update();
    
    // 处理建筑放置模式
    if (this.buildMode && this.buildingToPlace) {
      // 让建筑跟随鼠标/触摸
      const pointer = this.input.activePointer;
      this.buildingToPlace.x = pointer.worldX;
      this.buildingToPlace.y = pointer.worldY;
    }
  }
  
  createMap() {
    // 创建简单的地形
    this.map = this.add.tileSprite(0, 0, 2000, 2000, 'grass');
    this.map.setOrigin(0, 0);
    
    // 添加一些随机的装饰物(树木、岩石等)
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(50, 1950);
      const y = Phaser.Math.Between(50, 1950);
      
      // 避免在基地附近生成障碍物
      if ((x < 300 && y < 300) || (x > 1700 && y > 1700)) {
        continue;
      }
      
      const decorType = Math.random() > 0.5 ? 'tree' : 'rock';
      const decoration = this.physics.add.image(x, y, decorType);
      decoration.setImmovable(true);
    }
  }
  
  createResources() {
    // 创建几个资源节点
    const positions = [
      { x: 400, y: 400 },
      { x: 1600, y: 400 },
      { x: 400, y: 1600 },
      { x: 1600, y: 1600 },
      { x: 1000, y: 1000 }
    ];
    
    positions.forEach(pos => {
      const resource = new Resource(this, pos.x, pos.y, 'mine', 500);
      this.resourceNodes.push(resource);
    });
  }
  
  createPlayerBase() {
    // 创建玩家基地
    const base = new Building(this, 200, 200, 'base', 'player', {
      health: 500,
      buildTime: 0,
      cost: 0,
      canProduce: ['worker']
    });
    
    this.buildings.push(base);
    
    // 创建初始工人
    for (let i = 0; i < 5; i++) {
      const worker = new Unit(this, 250 + i * 30, 250, 'worker', 'player', {
        health: 50,
        speed: 100,
        damage: 5,
        attackRange: 20,
        attackSpeed: 1,
        harvestAmount: 10
      });
      
      this.playerUnits.push(worker);
    }
  }
  
  createEnemyBase() {
    // 创建敌人基地
    const base = new Building(this, 1800, 1800, 'base', 'enemy', {
      health: 500,
      buildTime: 0,
      cost: 0,
      canProduce: ['worker']
    });
    
    this.buildings.push(base);
    
    // 创建初始敌人单位
    for (let i = 0; i < 5; i++) {
      const worker = new Unit(this, 1750 - i * 30, 1750, 'worker', 'enemy', {
        health: 50,
        speed: 100,
        damage: 5,
        attackRange: 20,
        attackSpeed: 1,
        harvestAmount: 10
      });
      
      this.enemyUnits.push(worker);
    }
    
    // 设置简单的敌人AI
    this.setupEnemyAI();
  }
  
  setupCamera() {
    // 让相机可移动
    this.cameras.main.setBounds(0, 0, 2000, 2000);
    
    // 将相机设置在玩家基地位置
    this.cameras.main.scrollX = 100;
    this.cameras.main.scrollY = 100;
  }
  
  setupInput() {
    // 设置选择区域
    this.selectionRect = this.add.rectangle(0, 0, 0, 0, 0x0000ff, 0.3);
    this.selectionRect.setVisible(false);
    this.selectionRect.setOrigin(0, 0);
    
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    
    // 按键控制
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // 建筑快捷键
    this.input.keyboard.on('keydown-B', () => {
      this.startBuildMode('barracks');
    });
    
    this.input.keyboard.on('keydown-ESC', () => {
      this.cancelBuildMode();
    });
  }
  
  handlePointerDown(pointer) {
    // 如果在建造模式，则放置建筑
    if (this.buildMode && this.buildingToPlace) {
      this.placeBuilding(pointer.worldX, pointer.worldY);
      return;
    }
    
    // 开始框选
    this.selectionStart = { x: pointer.worldX, y: pointer.worldY };
    this.selectionRect.x = pointer.worldX;
    this.selectionRect.y = pointer.worldY;
    this.selectionRect.width = 0;
    this.selectionRect.height = 0;
    this.selectionRect.setVisible(true);
  }
  
  handlePointerMove(pointer) {
    // 更新框选区域
    if (this.selectionStart) {
      const width = pointer.worldX - this.selectionStart.x;
      const height = pointer.worldY - this.selectionStart.y;
      
      if (width < 0) {
        this.selectionRect.x = pointer.worldX;
        this.selectionRect.width = Math.abs(width);
      } else {
        this.selectionRect.width = width;
      }
      
      if (height < 0) {
        this.selectionRect.y = pointer.worldY;
        this.selectionRect.height = Math.abs(height);
      } else {
        this.selectionRect.height = height;
      }
    }
    
    // 如果在移动相机模式
    if (this.isMovingCamera) {
      this.cameras.main.scrollX -= pointer.movementX;
      this.cameras.main.scrollY -= pointer.movementY;
    }
  }
  
  handlePointerUp(pointer) {
    // 在建造模式中不处理
    if (this.buildMode) return;
    
    // 如果框选区域很小，视为点击
    if (
      this.selectionRect.width < 5 && 
      this.selectionRect.height < 5 && 
      this.selectionStart
    ) {
      // 清除之前的选择
      this.clearSelection();
      
      // 检查是否点击了实体
      const clickedEntity = this.getEntityAtPosition(pointer.worldX, pointer.worldY);
      
      if (clickedEntity) {
        // 如果点击了敌人单位或建筑，并且已选择了玩家单位，则发起攻击
        if (
          (clickedEntity.faction === 'enemy') && 
          this.selectedEntities.length > 0 && 
          this.selectedEntities[0].faction === 'player'
        ) {
          this.attackTarget(clickedEntity);
        }
        // 如果点击了资源，并且选择了工人，则收集资源
        else if (
          clickedEntity instanceof Resource && 
          this.selectedEntities.length > 0 && 
          this.selectedEntities[0].type === 'worker'
        ) {
          this.harvestResource(clickedEntity);
        }
        // 否则选择该实体
        else if (clickedEntity.faction === 'player') {
          this.selectEntity(clickedEntity);
        }
      } else {
        // 如果选中了单位，则移动到点击位置
        if (
          this.selectedEntities.length > 0 && 
          this.selectedEntities[0] instanceof Unit
        ) {
          this.moveSelectedUnits(pointer.worldX, pointer.worldY);
        }
      }
    } else {
      // 处理区域选择
      this.handleAreaSelection();
    }
    
    // 清理选择状态
    this.selectionStart = null;
    this.selectionRect.setVisible(false);
  }
  
  getEntityAtPosition(x, y) {
    // 检查点击位置是否有实体
    // 先检查玩家单位
    for (const unit of this.playerUnits) {
      if (
        Math.abs(unit.x - x) < 20 && 
        Math.abs(unit.y - y) < 20
      ) {
        return unit;
      }
    }
    
    // 检查敌人单位
    for (const unit of this.enemyUnits) {
      if (
        Math.abs(unit.x - x) < 20 && 
        Math.abs(unit.y - y) < 20
      ) {
        return unit;
      }
    }
    
    // 检查建筑
    for (const building of this.buildings) {
      if (
        Math.abs(building.x - x) < 40 && 
        Math.abs(building.y - y) < 40
      ) {
        return building;
      }
    }
    
    // 检查资源
    for (const resource of this.resourceNodes) {
      if (
        Math.abs(resource.x - x) < 30 && 
        Math.abs(resource.y - y) < 30
      ) {
        return resource;
      }
    }
    
    return null;
  }
  
  handleAreaSelection() {
    // 清除之前的选择
    this.clearSelection();
    
    // 选择区域内的所有玩家单位
    this.playerUnits.forEach(unit => {
      if (
        unit.x >= this.selectionRect.x &&
        unit.x <= this.selectionRect.x + this.selectionRect.width &&
        unit.y >= this.selectionRect.y &&
        unit.y <= this.selectionRect.y + this.selectionRect.height
      ) {
        this.selectEntity(unit, true); // true表示添加到选择，不清除之前的选择
      }
    });
  }
  
  clearSelection() {
    // 清除所有选择
    this.selectedEntities.forEach(entity => {
      entity.setSelected(false);
    });
    
    this.selectedEntities = [];
    this.ui.updateSelection(null);
  }
  
  selectEntity(entity, addToSelection = false) {
    if (!addToSelection) {
      this.clearSelection();
    }
    
    this.selectedEntities.push(entity);
    entity.setSelected(true);
    
    // 更新UI
    this.ui.updateSelection(entity);
  }
  
  moveSelectedUnits(x, y) {
    this.selectedEntities.forEach(entity => {
      if (entity instanceof Unit) {
        entity.moveTo(x, y);
      }
    });
  }
  
  attackTarget(target) {
    this.selectedEntities.forEach(entity => {
      if (entity instanceof Unit) {
        entity.attackTarget(target);
      }
    });
  }
  
  harvestResource(resource) {
    this.selectedEntities.forEach(entity => {
      if (entity instanceof Unit && entity.type === 'worker') {
        entity.harvestResource(resource);
      }
    });
  }
  
  startBuildMode(buildingType) {
    // 检查资源是否足够
    const costs = {
      'barracks': 100
    };
    
    if (this.resources < costs[buildingType]) {
      this.ui.showMessage('资源不足');
      return;
    }
    
    this.buildMode = true;
    
    // 创建临时建筑用于放置
    this.buildingToPlace = this.add.image(
      this.input.activePointer.worldX,
      this.input.activePointer.worldY,
      buildingType
    );
    
    this.buildingToPlace.setAlpha(0.7);
    this.buildingToPlace.setData('type', buildingType);
  }
  
  cancelBuildMode() {
    if (this.buildMode && this.buildingToPlace) {
      this.buildingToPlace.destroy();
      this.buildingToPlace = null;
      this.buildMode = false;
    }
  }
  
  placeBuilding(x, y) {
    // 检查是否可以放置（不与其他建筑重叠等）
    if (this.canPlaceBuilding(x, y)) {
      const buildingType = this.buildingToPlace.getData('type');
      const costs = {
        'barracks': 100
      };
      
      // 扣除资源
      this.resources -= costs[buildingType];
      
      // 创建实际建筑
      const buildingProps = {
        'barracks': {
          health: 300,
          buildTime: 15,
          cost: costs[buildingType],
          canProduce: ['soldier']
        }
      }[buildingType];
      
      const building = new Building(this, x, y, buildingType, 'player', buildingProps);
      this.buildings.push(building);
      
      // 清除建造模式
      this.cancelBuildMode();
      
      // 播放建造音效
      this.sound.play('build');
    } else {
      this.ui.showMessage('无法在此处建造');
    }
  }
  
  canPlaceBuilding(x, y) {
    // 检查是否与其他建筑、单位或障碍物重叠
    // 这里使用简单的距离检查
    
    // 检查是否靠近其他建筑
    for (const building of this.buildings) {
      if (
        Math.abs(building.x - x) < 80 && 
        Math.abs(building.y - y) < 80
      ) {
        return false;
      }
    }
    
    // 检查是否在边界内
    if (x < 50 || x > 1950 || y < 50 || y > 1950) {
      return false;
    }
    
    return true;
  }
  
  updateGameLogic() {
    // AI行为更新
    this.updateEnemyAI();
    
    // 资源生产
    this.buildings.forEach(building => {
      if (building.faction === 'player' && building.type === 'base') {
        this.resources += 5; // 每秒基础产出
      }
    });
    
    // 更新UI中的资源显示
    this.ui.updateResources(this.resources);
  }
  
  setupEnemyAI() {
    // 简单AI，每隔一段时间派出部队攻击玩家
    this.time.addEvent({
      delay: 30000, // 30秒一次进攻
      callback: this.enemyAttack,
      callbackScope: this,
      loop: true
    });
    
    // 敌人建造和生产
    this.time.addEvent({
      delay: 15000, // 15秒一次建造/生产
      callback: this.enemyBuild,
      callbackScope: this,
      loop: true
    });
  }
  
  enemyAttack() {
    // 随机选择10%到50%的敌人单位进行攻击
    const attackForce = Math.floor(this.enemyUnits.length * Phaser.Math.FloatBetween(0.1, 0.5));
    
    if (attackForce > 0) {
      const attackUnits = Phaser.Utils.Array.Shuffle(this.enemyUnits).slice(0, attackForce);
      
      // 查找玩家基地或随机单位作为攻击目标
      let target = null;
      
      // 优先攻击基地
      for (const building of this.buildings) {
        if (building.faction === 'player' && building.type === 'base') {
          target = building;
          break;
        }
      }
      
      // 如果没有找到基地，随机选择一个玩家单位
      if (!target && this.playerUnits.length > 0) {
        target = Phaser.Utils.Array.GetRandom(this.playerUnits);
      }
      
      // 发起攻击
      if (target) {
        attackUnits.forEach(unit => {
          unit.attackTarget(target);
        });
      }
    }
  }
  
  enemyBuild() {
    // 简单的敌人建造和生产逻辑
    // 随机决定是否生产新单位
    const shouldProduceUnit = Math.random() > 0.5;
    
    if (shouldProduceUnit) {
      // 随机选择一个可以生产单位的建筑
      const productionBuildings = this.buildings.filter(
        b => b.faction === 'enemy' && b.canProduce && b.canProduce.length > 0
      );
      
      if (productionBuildings.length > 0) {
        const building = Phaser.Utils.Array.GetRandom(productionBuildings);
        
        // 为敌人创建一个新单位
        if (building.type === 'base') {
          // 创建工人
          const worker = new Unit(
            this, 
            building.x + Phaser.Math.Between(-30, 30), 
            building.y + Phaser.Math.Between(-30, 30), 
            'worker', 
            'enemy', 
            {
              health: 50,
              speed: 100,
              damage: 5,
              attackRange: 20,
              attackSpeed: 1,
              harvestAmount: 10
            }
          );
          
          this.enemyUnits.push(worker);
        } else if (building.type === 'barracks') {
          // 创建士兵
          const soldier = new Unit(
            this, 
            building.x + Phaser.Math.Between(-30, 30), 
            building.y + Phaser.Math.Between(-30, 30), 
            'soldier', 
            'enemy', 
            {
              health: 100,
              speed: 80,
              damage: 20,
              attackRange: 50,
              attackSpeed: 1.5
            }
          );
          
          this.enemyUnits.push(soldier);
        }
      }
    }
  }
  
  updateEnemyAI() {
    // 简单AI行为 - 工人收集资源
    this.enemyUnits.forEach(unit => {
      if (unit.type === 'worker' && !unit.target) {
        // 50%的机会去收集资源
        if (Math.random() > 0.5 && this.resourceNodes.length > 0) {
          const resource = Phaser.Utils.Array.GetRandom(this.resourceNodes);
          unit.harvestResource(resource);
        } else {
          // 随机移动
          const x = Phaser.Math.Between(1600, 1950);
          const y = Phaser.Math.Between(1600, 1950);
          unit.moveTo(x, y);
        }
      }
    });
  }
  
  addResources(amount) {
    this.resources += amount;
    this.ui.updateResources(this.resources);
  }
  
  createUnit(type, faction, x, y) {
    const unitProps = {
      'worker': {
        health: 50,
        speed: 100,
        damage: 5,
        attackRange: 20,
        attackSpeed: 1,
        harvestAmount: 10,
        cost: 50
      },
      'soldier': {
        health: 100,
        speed: 80,
        damage: 20,
        attackRange: 50,
        attackSpeed: 1.5,
        cost: 80
      }
    }[type];
    
    // 检查资源是否足够
    if (faction === 'player' && this.resources < unitProps.cost) {
      this.ui.showMessage('资源不足');
      return null;
    }
    
    // 扣除资源
    if (faction === 'player') {
      this.resources -= unitProps.cost;
      this.ui.updateResources(this.resources);
    }
    
    // 创建单位
    const unit = new Unit(this, x, y, type, faction, unitProps);
    
    if (faction === 'player') {
      this.playerUnits.push(unit);
    } else {
      this.enemyUnits.push(unit);
    }
    
    return unit;
  }
} 