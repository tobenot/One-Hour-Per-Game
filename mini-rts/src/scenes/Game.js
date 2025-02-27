import Unit from '../entities/Unit';
import Building from '../entities/Building';
import Resource from '../entities/Resource';

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
    
    // 添加调试日志
    this.logDebug('Game场景已构造');
    
    // 游戏状态
    this.resources = 100; // 初始资源从50增加到100
    this.selectedEntities = []; // 当前选中的实体
    this.playerUnits = []; // 玩家单位
    this.enemyUnits = []; // 敌人单位
    this.buildings = []; // 建筑
    this.resourceNodes = []; // 资源点
    
    // 建造状态
    this.buildMode = false;
    this.buildingToPlace = null;

    // 输入模式
    this.inputMode = 'select'; // 'select', 'move', 'attack', 'build', 'camera'
  }

  // 调试日志辅助函数
  logDebug(message, type = 'info') {
    if (window.debugLog) {
      window.debugLog(`[Game] ${message}`, type);
    } else {
      console.log(`[Game] ${message}`);
    }
  }

  create() {
    this.logDebug('Game场景create开始');
    
    try {
      // 记录游戏画布尺寸
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;
      this.logDebug(`游戏画布尺寸: ${width}x${height}`);
      
      // 创建地图
      this.createMap();
      this.logDebug('游戏地图已创建');
      
      // 创建资源点
      this.createResources();
      this.logDebug(`已创建${this.resourceNodes.length}个资源点`);
      
      // 创建玩家的初始基地和单位
      this.createPlayerBase();
      this.logDebug(`已创建玩家基地和${this.playerUnits.length}个单位`);
      
      // 创建敌人基地和单位
      this.createEnemyBase();
      this.logDebug(`已创建敌人基地和${this.enemyUnits.length}个单位`);
      
      // 设置相机控制
      this.setupCamera();
      this.logDebug('相机控制已设置');
      
      // 设置输入处理
      this.setupInput();
      this.logDebug('输入处理已设置');
      
      // 创建游戏主UI
      this.createGameUI();
      this.logDebug('游戏UI已创建');
      
      // 游戏逻辑更新事件
      this.time.addEvent({
        delay: 1000, // 每秒更新一次
        callback: this.updateGameLogic,
        callbackScope: this,
        loop: true
      });
      this.logDebug('游戏逻辑更新定时器已设置');
      
      // 禁用浏览器右键菜单
      this.input.mouse.disableContextMenu();
      this.logDebug('已禁用浏览器右键菜单');
      
      this.logDebug('Game场景创建完成', 'success');
    } catch (error) {
      this.logDebug(`Game场景创建失败: ${error.message}`, 'error');
      console.error(error);
    }
    
    // 添加FPS显示
    this.fpsText = this.add.text(10, 10, 'FPS: 0', { 
      fontSize: '16px', 
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 5, y: 2 }
    });
    this.fpsText.setScrollFactor(0);
    this.fpsText.setDepth(999);
    
    // 添加调试按钮测试 - 直接在Game场景中添加一个固定按钮
    this.debugButton = this.add.rectangle(100, this.cameras.main.height - 50, 120, 80, 0xff00ff);
    this.debugButton.setScrollFactor(0);
    this.debugButton.setDepth(999);
    this.debugButton.setInteractive({ useHandCursor: true });
    
    this.debugButtonText = this.add.text(100, this.cameras.main.height - 50, '调试按钮', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.debugButtonText.setScrollFactor(0);
    this.debugButtonText.setOrigin(0.5);
    this.debugButtonText.setDepth(1000);
    
    this.debugButton.on('pointerdown', () => {
      console.log('调试按钮被点击');
      this.showMessage('调试按钮被点击');
    });
    
    console.log('调试按钮已创建，位置:', 100, this.cameras.main.height - 50);
  }
  
  update(time, delta) {
    // 更新FPS显示
    if (this.fpsText) {
      this.fpsText.setText(`FPS: ${Math.round(1000 / delta)}`);
    }
    
    // 记录第一次帧渲染
    if (!this.hasLoggedFirstFrame) {
      this.hasLoggedFirstFrame = true;
      this.logDebug('第一帧已渲染', 'success');
      
      // 获取渲染器类型
      let rendererType = '未知';
      if (this.game.renderer instanceof Phaser.Renderer.Canvas.CanvasRenderer) {
        rendererType = 'Canvas';
      } else if (this.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
        rendererType = 'WebGL';
      }
      this.logDebug(`使用渲染器: ${rendererType}`);
      
      // 记录渲染器详情
      if (this.game.renderer.gl) {
        const gl = this.game.renderer.gl;
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          this.logDebug(`WebGL信息: ${vendor} - ${renderer}`);
        }
      }
    }
    
    // 如果存在更新方法，调用更新方法
    
    // 更新玩家单位
    this.playerUnits.forEach(unit => {
      if (unit.update) unit.update(time, delta);
    });
    
    // 更新敌人单位
    this.enemyUnits.forEach(unit => {
      if (unit.update) unit.update(time, delta);
    });
    
    // 更新建筑
    this.buildings.forEach(building => {
      if (building.update) building.update(time, delta);
    });
    
    // 如果在建造模式，更新建筑位置跟随鼠标
    if (this.buildMode && this.buildingToPlace) {
      const pointer = this.input.activePointer;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.buildingToPlace.x = worldPoint.x;
      this.buildingToPlace.y = worldPoint.y;
    }
  }
  
  createMap() {
    // 创建简单的地形 - 使用图像而不是tileSprite
    try {
      this.logDebug("开始创建地图");
      
      // 检查grass纹理是否存在
      if (this.textures.exists('grass')) {
        this.logDebug("grass纹理存在");
      } else {
        this.logDebug("错误：grass纹理不存在！", "error");
        // 尝试重新创建grass纹理
        const grassGraphics = this.make.graphics();
        grassGraphics.fillStyle(0x3fa150, 1);
        grassGraphics.fillRect(0, 0, 64, 64);
        grassGraphics.generateTexture('grass', 64, 64);
        this.logDebug("已重新创建grass纹理");
      }
      
      // 创建多个草地图块以覆盖整个地图
      this.mapTiles = [];
      const tileSize = 64; // 草地纹理的尺寸
      const mapWidth = 2000;
      const mapHeight = 2000;
      
      for (let x = 0; x < mapWidth; x += tileSize) {
        for (let y = 0; y < mapHeight; y += tileSize) {
          const tile = this.add.image(x, y, 'grass');
          tile.setOrigin(0, 0);
          this.mapTiles.push(tile);
        }
      }
      
      this.logDebug(`创建了 ${this.mapTiles.length} 个地图瓦片`);
      
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

      this.logDebug("地图创建完成");
    } catch (error) {
      this.logDebug(`地图创建失败: ${error.message}`);
      console.error("地图创建错误:", error);
      
      // 创建备用地图
      try {
        const backupMap = this.add.rectangle(0, 0, 2000, 2000, 0x3fa150);
        backupMap.setOrigin(0, 0);
        this.logDebug("创建了备用纯色地图");
      } catch (backupError) {
        this.logDebug(`备用地图创建也失败了: ${backupError.message}`);
      }
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
        harvestAmount: 20
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
        harvestAmount: 20
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
    
    // 调整相机边界以避开底部控制面板
    const controlPanelHeight = this.controlPanelHeight || 100;
    
    // 注意：不要使用setViewport，这会影响UI渲染
    // 而是使用setBounds来限制相机的移动范围
    this.logDebug(`设置相机视口，保留底部${controlPanelHeight}像素空间`);
    
    // 创建专门的UI相机，确保UI元素固定显示
    this.uiCamera = this.cameras.add(0, 0, this.cameras.main.width, this.cameras.main.height);
    this.uiCamera.setScroll(0, 0);
    this.uiCamera.setName('uiCamera');
    this.uiCamera.setBackgroundColor(0x000000);
    this.uiCamera.transparent = true;
    this.uiCamera.scrollX = 0;
    this.uiCamera.scrollY = 0;
    
    // 让UI相机忽略地图元素
    if (this.mapTiles && this.mapTiles.length > 0) {
      for (const tile of this.mapTiles) {
        this.uiCamera.ignore(tile);
      }
    }
    
    // 确保所有UI元素使用UI相机渲染
    if (this.uiPanel) this.uiCamera.ignore(this.uiPanel);
    if (this.panelBorder) this.uiCamera.ignore(this.panelBorder);
  }
  
  setupInput() {
    // 设置选择区域
    this.selectionRect = this.add.rectangle(0, 0, 0, 0, 0x0000ff, 0.3);
    this.selectionRect.setVisible(false);
    this.selectionRect.setOrigin(0, 0);
    this.selectionRect.setDepth(800); // 确保框选矩形在所有单位上方显示
    
    // 注册指针事件
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    
    // 键盘控制
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // 快捷键
    this.input.keyboard.on('keydown-ESC', () => {
      this.cancelAction();
    });
    
    // 监听调整大小事件
    this.scale.on('resize', () => this.handleResize());
  }
  
  // 设置输入模式
  setInputMode(mode) {
    // 只有当模式真正改变时才进行处理
    if (this.inputMode === mode && mode !== 'build') return;
    
    this.logDebug(`输入模式切换为: ${mode}`);
    this.inputMode = mode;
    
    // 取消当前选择和任何激活的模式
    if (mode !== 'build') {
      this.cancelBuildMode();
    }
    
    // 重置选择状态（如果进入的不是选择模式）
    if (mode !== 'select' && this.selectionRect) {
      this.selectionRect.setVisible(false);
      this.selectionStart = null;
    }
    
    // 根据模式更新鼠标样式
    switch(mode) {
      case 'select':
        this.input.setDefaultCursor('default');
        break;
      case 'move':
        this.input.setDefaultCursor('crosshair');
        break;
      case 'attack':
        this.input.setDefaultCursor('url(assets/attack-cursor.png), pointer');
        break;
      case 'build':
        this.input.setDefaultCursor('cell');
        break;
      case 'camera':
        this.input.setDefaultCursor('grab');
        break;
    }
    
    // 显示提示消息
    const modeMessages = {
      'select': '选择模式：点击选择单位或建筑',
      'move': '移动模式：点击地图移动选中的单位',
      'attack': '攻击模式：点击敌人攻击',
      'build': '建造模式：选择位置放置建筑',
      'camera': '相机移动模式：拖动屏幕移动视角'
    };
    
    // 更新UI按钮高亮状态
    if (this.controlButtons) {
      // 获取所有操作按钮的索引
      const modeIndex = ['select', 'move', 'attack', 'build', 'camera'].indexOf(mode);
      if (modeIndex >= 0 && modeIndex < this.controlButtons.length) {
        // 重置所有按钮颜色
        this.controlButtons.forEach(btn => {
          btn.background.setFillStyle(0x555555);
        });
        
        // 高亮当前模式按钮
        if (modeIndex < this.controlButtons.length) {
          this.controlButtons[modeIndex].background.setFillStyle(0x88aa88);
        }
      }
    }
    
    this.showMessage(modeMessages[mode] || '');
  }
  
  // 取消当前操作
  cancelAction() {
    // 取消建造模式
    if (this.buildMode) {
      this.cancelBuildMode();
    }
    
    // 取消选择
    this.clearSelection();
    
    // 重置为选择模式
    this.setInputMode('select');
    
    // 清除任何UI状态
    this.clearActionButtons();
    
    // 确保控制按钮中的选择按钮被高亮显示
    if (this.controlButtons && this.controlButtons.length > 0) {
      // 重置所有按钮颜色
      this.controlButtons.forEach(btn => {
        btn.background.setFillStyle(0x555555);
      });
      
      // 高亮选择模式按钮
      this.controlButtons[0].background.setFillStyle(0x88aa88);
    }
  }
  
  // 处理窗口调整大小
  handleResize() {
    // 更新UI尺寸
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // 重新调整相机视口
    const controlPanelHeight = this.controlPanelHeight || 100;
    this.cameras.main.setViewport(0, 0, width, height - controlPanelHeight);
  }
  
  handlePointerDown(pointer) {
    // 检查是否点击在游戏区域内（非UI区域）
    const isInGameArea = pointer.y < this.cameras.main.height - this.controlPanelHeight;
    
    if (!isInGameArea) {
      // 点击在UI区域内，不处理
      return;
    }
    
    // 如果在相机模式，则记录拖动起点
    if (this.inputMode === 'camera') {
      this.cameraStartDrag = { x: pointer.x, y: pointer.y };
      this.input.setDefaultCursor('grabbing');
      return;
    }
    
    // 如果在建造模式，则放置建筑
    if (this.buildMode && this.buildingToPlace) {
      this.placeBuilding(pointer.worldX, pointer.worldY);
      return;
    }
    
    // 根据当前输入模式处理
    switch (this.inputMode) {
      case 'select':
        // 开始框选
        this.selectionStart = { x: pointer.worldX, y: pointer.worldY };
        this.selectionRect.x = pointer.worldX;
        this.selectionRect.y = pointer.worldY;
        this.selectionRect.width = 0;
        this.selectionRect.height = 0;
        this.selectionRect.setVisible(true);
        break;
        
      case 'move':
        // 直接移动选中的单位
        if (this.selectedEntities.length > 0) {
          this.moveSelectedUnits(pointer.worldX, pointer.worldY);
          
          // 显示移动指示效果
          this.showMoveIndicator(pointer.worldX, pointer.worldY);
        }
        break;
        
      case 'attack':
        // 检查是否点击了敌方实体
        const target = this.getEntityAtPosition(pointer.worldX, pointer.worldY);
        if (target && target.faction === 'enemy' && this.selectedEntities.length > 0) {
          this.attackTarget(target);
          
          // 显示攻击指示效果
          this.showAttackIndicator(target.x, target.y);
        }
        break;
    }
  }
  
  handlePointerMove(pointer) {
    // 相机模式下的拖动处理
    if (this.inputMode === 'camera' && this.cameraStartDrag && pointer.isDown) {
      const dx = pointer.x - this.cameraStartDrag.x;
      const dy = pointer.y - this.cameraStartDrag.y;
      
      // 移动相机（反向移动，使得看起来像是拖动地图）
      this.cameras.main.scrollX -= dx;
      this.cameras.main.scrollY -= dy;
      
      // 更新拖动起点
      this.cameraStartDrag = { x: pointer.x, y: pointer.y };
      return;
    }
    
    // 更新框选区域（仅在选择模式下）
    if (this.selectionStart && this.inputMode === 'select' && pointer.isDown) {
      const width = pointer.worldX - this.selectionStart.x;
      const height = pointer.worldY - this.selectionStart.y;
      
      // 根据拖动方向更新矩形位置和尺寸
      if (width < 0) {
        this.selectionRect.x = pointer.worldX;
        this.selectionRect.width = Math.abs(width);
      } else {
        this.selectionRect.x = this.selectionStart.x;
        this.selectionRect.width = width;
      }
      
      if (height < 0) {
        this.selectionRect.y = pointer.worldY;
        this.selectionRect.height = Math.abs(height);
      } else {
        this.selectionRect.y = this.selectionStart.y;
        this.selectionRect.height = height;
      }
    }
    
    // 在建造模式下，建筑跟随鼠标
    if (this.buildMode && this.buildingToPlace) {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.buildingToPlace.x = worldPoint.x;
      this.buildingToPlace.y = worldPoint.y;
      
      // 检查是否可以放置建筑
      if (this.canPlaceBuilding(worldPoint.x, worldPoint.y)) {
        this.buildingToPlace.setTint(0x00ff00); // 绿色 - 可以放置
      } else {
        this.buildingToPlace.setTint(0xff0000); // 红色 - 不可放置
      }
    }
  }
  
  handlePointerUp(pointer) {
    // 检查是否点击在游戏区域内（非UI区域）
    const isInGameArea = pointer.y < this.cameras.main.height - this.controlPanelHeight;
    
    // 如果在相机模式，重置拖动状态
    if (this.inputMode === 'camera') {
      this.cameraStartDrag = null;
      this.input.setDefaultCursor('grab');
      return;
    }
    
    if (!isInGameArea || !this.selectionStart) {
      // 点击在UI区域内，或没有开始选择，不处理
      return;
    }
    
    // 在建造模式中不处理选择操作
    if (this.buildMode) return;
    
    // 仅在选择模式下处理
    if (this.inputMode === 'select') {
      // 计算真实的选择区域（处理负值宽高）
      const selectionBounds = this.getSelectionBounds();
      
      // 如果框选区域很小，视为点击
      if (selectionBounds.width < 5 && selectionBounds.height < 5) {
        // 检查是否点击了实体
        const clickedEntity = this.getEntityAtPosition(pointer.worldX, pointer.worldY);
        
        // 保存当前选择的实体，供后续判断使用
        const currentSelectedEntities = [...this.selectedEntities];
        const hasSelectedWorker = currentSelectedEntities.length > 0 && currentSelectedEntities[0].type === 'worker';
        
        if (clickedEntity) {
          // 如果点击了资源，并且已选择了工人，则收集资源
          if (clickedEntity instanceof Resource && hasSelectedWorker) {
            this.harvestResource(clickedEntity);
            // 不清除选择，直接返回
            this.selectionStart = null;
            this.selectionRect.setVisible(false);
            return;
          }
          
          // 如果点击了敌人单位或建筑，并且已选择了玩家单位，则发起攻击
          if (clickedEntity.faction === 'enemy' && currentSelectedEntities.length > 0 && currentSelectedEntities[0].faction === 'player') {
            this.attackTarget(clickedEntity);
            // 不清除选择，直接返回
            this.selectionStart = null;
            this.selectionRect.setVisible(false);
            return;
          }
          
          // 这里才清除之前的选择（只有需要选择新实体时）
          this.clearSelection();
          
          // 如果点击了玩家实体，选择它
          if (clickedEntity.faction === 'player') {
            this.selectEntity(clickedEntity);
          }
        } else {
          // 如果点击了空地，并且已选择了单位，则移动单位到点击位置
          if (currentSelectedEntities.length > 0 && currentSelectedEntities[0] instanceof Unit) {
            this.moveSelectedUnits(pointer.worldX, pointer.worldY);
            // 不清除选择，直接返回
            this.selectionStart = null;
            this.selectionRect.setVisible(false);
            return;
          }
          
          // 点击空地且没有选择单位时，清除选择
          this.clearSelection();
        }
      } else {
        // 处理区域选择
        this.handleAreaSelection(selectionBounds);
      }
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
  
  handleAreaSelection(bounds) {
    // 清除之前的选择
    this.clearSelection();
    
    // 选择区域内的所有玩家单位
    this.playerUnits.forEach(unit => {
      // 使用修正后的边界判断
      if (
        unit.x >= bounds.x &&
        unit.x <= bounds.x + bounds.width &&
        unit.y >= bounds.y &&
        unit.y <= bounds.y + bounds.height
      ) {
        this.selectEntity(unit, true); // true表示添加到选择，不清除之前的选择
      }
    });
    
    // 显示选择数量信息
    if (this.selectedEntities.length > 0) {
      this.showMessage(`已选择 ${this.selectedEntities.length} 个单位`);
    }
  }
  
  clearSelection() {
    // 清除所有选择
    this.selectedEntities.forEach(entity => {
      entity.setSelected(false);
    });
    
    this.selectedEntities = [];
    this.updateSelection(null);
  }
  
  selectEntity(entity, addToSelection = false) {
    if (!addToSelection) {
      this.clearSelection();
    }
    
    this.selectedEntities.push(entity);
    entity.setSelected(true);
    
    // 更新UI
    this.updateSelection(entity);
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
    // 确保只有工人才能收集资源
    const workers = this.selectedEntities.filter(entity => entity.type === 'worker');
    
    if (workers.length === 0) {
      this.showMessage('需要工人才能收集资源');
      return;
    }
    
    workers.forEach(worker => {
      worker.harvestResource(resource);
    });
    
    // 显示消息
    this.showMessage(`派遣${workers.length}个工人收集资源`);
    
    // 显示视觉反馈
    this.showMoveIndicator(resource.x, resource.y);
  }
  
  startBuildMode(buildingType) {
    // 检查资源是否足够
    const costs = {
      'barracks': 100
    };
    
    if (this.resources < costs[buildingType]) {
      this.showMessage('资源不足');
      return;
    }
    
    // 设置为建造模式
    this.buildMode = true;
    this.setInputMode('build');
    
    // 创建临时建筑用于放置
    this.buildingToPlace = this.add.image(
      this.input.activePointer.worldX,
      this.input.activePointer.worldY,
      buildingType
    );
    
    this.buildingToPlace.setAlpha(0.7);
    this.buildingToPlace.setData('type', buildingType);
    
    // 记录建筑类型便于调试
    this.logDebug(`开始建造模式: ${buildingType}`);
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
      this.updateResources();
      
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
      
      // 重置为选择模式
      this.setInputMode('select');
      
      // 播放建造音效
      try {
        this.sound.play('build');
      } catch (e) {
        console.log('音效播放失败', e);
      }
      
      // 显示成功消息
      this.showMessage(`${buildingType === 'barracks' ? '兵营' : buildingType} 建造开始`);
    } else {
      this.showMessage('无法在此处建造');
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
    
    // 资源生产 - 增加基础产出
    this.buildings.forEach(building => {
      if (building.faction === 'player' && building.type === 'base') {
        this.resources += 10; // 每秒基础产出从5增加到10
      }
    });
    
    // 更新UI中的资源显示
    this.updateResources();
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
              harvestAmount: 20
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
    this.updateResources();
  }
  
  createUnit(type, faction, x, y) {
    const unitProps = {
      'worker': {
        health: 50,
        speed: 100,
        damage: 5,
        attackRange: 20,
        attackSpeed: 1,
        harvestAmount: 20,
        cost: 30
      },
      'soldier': {
        health: 100,
        speed: 80,
        damage: 20,
        attackRange: 50,
        attackSpeed: 1.5,
        cost: 40
      }
    }[type];
    
    // 检查资源是否足够
    if (faction === 'player' && this.resources < unitProps.cost) {
      this.showMessage('资源不足');
      return null;
    }
    
    // 扣除资源
    if (faction === 'player') {
      this.resources -= unitProps.cost;
      this.updateResources();
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
  
  // 显示移动指示器
  showMoveIndicator(x, y) {
    // 创建一个移动指示动画
    const indicator = this.add.circle(x, y, 10, 0x00ff00, 0.7);
    
    // 添加动画效果
    this.tweens.add({
      targets: indicator,
      alpha: 0,
      scale: 2,
      duration: 500,
      onComplete: () => {
        indicator.destroy();
      }
    });
  }
  
  // 显示攻击指示器
  showAttackIndicator(x, y) {
    // 创建一个攻击指示动画
    const indicator = this.add.circle(x, y, 15, 0xff0000, 0.7);
    
    // 添加动画效果
    this.tweens.add({
      targets: indicator,
      alpha: 0,
      scale: 2,
      duration: 500,
      onComplete: () => {
        indicator.destroy();
      }
    });
  }

  // 显示消息
  showMessage(text) {
    if (this.messageText) {
      // 使用内置消息显示
      this.messageText.setText(text);
      this.messageText.setVisible(true);
      
      // 清除之前的计时器
      if (this.messageTimer) {
        this.messageTimer.remove();
      }
      
      // 设置新计时器
      this.messageTimer = this.time.delayedCall(3000, () => {
        this.messageText.setVisible(false);
      });
    } else {
      // 创建临时消息
      console.log('直接消息显示：', text);
      
      const tempMsg = this.add.text(this.cameras.main.width / 2, 100, text, {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
      });
      tempMsg.setScrollFactor(0);
      tempMsg.setOrigin(0.5);
      tempMsg.setDepth(1000);
      
      // 3秒后自动消失
      this.time.delayedCall(3000, () => {
        tempMsg.destroy();
      });
    }
  }
  
  // 显示建造菜单
  showBuildMenu() {
    const buttonY = this.cameras.main.height - this.controlPanelHeight/2;
    const width = this.cameras.main.width;
    
    // 记录当前建造按钮
    if (!this.buildButtons) {
      this.buildButtons = [];
    } else {
      // 清除之前的建造按钮
      this.buildButtons.forEach(btn => {
        btn.button.destroy();
        btn.text.destroy();
      });
      this.buildButtons = [];
    }
    
    // 添加建造选项
    const barracksBtn = this.createUIButton('兵营 (100资源)', width * 0.3, buttonY, 0xaa00ff, () => {
      this.startBuildMode('barracks');
    });
    this.buildButtons.push(barracksBtn);
    
    // 添加取消按钮
    const cancelBtn = this.createUIButton('取消', width * 0.7, buttonY, 0x888888, () => {
      // 清除建造按钮
      this.buildButtons.forEach(btn => {
        btn.button.destroy();
        btn.text.destroy();
      });
      this.buildButtons = [];
      
      // 恢复选择模式
      this.setInputMode('select');
    });
    this.buildButtons.push(cancelBtn);
    
    // 设置消息提示
    this.showMessage('选择要建造的建筑');
  }

  // 创建游戏UI (新方法，直接在Game类中创建UI，而不使用UI类)
  createGameUI() {
    // 创建底部控制面板
    const controlPanelHeight = 100;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // 创建底部面板
    this.uiPanel = this.add.rectangle(width / 2, height - controlPanelHeight/2, width, controlPanelHeight, 0x333333, 0.85);
    this.uiPanel.setScrollFactor(0);
    this.uiPanel.setDepth(900);
    
    // 添加边框
    this.panelBorder = this.add.graphics();
    this.panelBorder.lineStyle(2, 0x666666, 1);
    this.panelBorder.strokeRect(0, height - controlPanelHeight, width, controlPanelHeight);
    this.panelBorder.setScrollFactor(0);
    this.panelBorder.setDepth(900);
    
    // 创建控制按钮
    const buttonSize = 80;
    const buttonY = height - controlPanelHeight/2;
    const buttonSpacing = width / 6; // 调整间距，因为我们增加了一个按钮
    
    // 创建控制按钮数组
    this.controlButtons = [];
    
    // 创建按钮：选择、移动、攻击、建造、相机移动
    const selectBtn = this.createUIButton('选择', buttonSpacing * 1, buttonY, 0x00ff00, () => this.setInputMode('select'));
    const moveBtn = this.createUIButton('移动', buttonSpacing * 2, buttonY, 0x0088ff, () => this.setInputMode('move'));
    const attackBtn = this.createUIButton('攻击', buttonSpacing * 3, buttonY, 0xff0000, () => this.setInputMode('attack'));
    const buildBtn = this.createUIButton('建造', buttonSpacing * 4, buttonY, 0xffaa00, () => this.showBuildMenu());
    const cameraBtn = this.createUIButton('相机', buttonSpacing * 5, buttonY, 0xaaaaaa, () => this.setInputMode('camera'));
    
    // 将按钮添加到controlButtons数组
    this.controlButtons.push(selectBtn);
    this.controlButtons.push(moveBtn);
    this.controlButtons.push(attackBtn);
    this.controlButtons.push(buildBtn);
    this.controlButtons.push(cameraBtn); // 添加相机控制按钮
    
    // 默认高亮选择按钮
    selectBtn.background.setFillStyle(0x88aa88);
    
    // 创建资源显示
    this.resourceIcon = this.add.image(20, 20, 'resource-icon');
    this.resourceIcon.setScrollFactor(0);
    this.resourceIcon.setScale(0.5);
    this.resourceIcon.setDepth(900);
    
    this.resourceText = this.add.text(40, 20, `${this.resources}`, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff'
    });
    this.resourceText.setScrollFactor(0);
    this.resourceText.setDepth(900);
    
    // 创建信息显示区域
    this.infoText = this.add.text(width / 2, height - controlPanelHeight + 20, '准备开始游戏', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      align: 'center'
    });
    this.infoText.setScrollFactor(0);
    this.infoText.setOrigin(0.5, 0);
    this.infoText.setDepth(900);
    
    // 创建消息显示
    this.messageText = this.add.text(width / 2, height * 0.2, '', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    this.messageText.setScrollFactor(0);
    this.messageText.setOrigin(0.5);
    this.messageText.setVisible(false);
    this.messageText.setDepth(900);
    
    // 消息计时器
    this.messageTimer = null;
    
    // 存储控制面板高度
    this.controlPanelHeight = controlPanelHeight;
  }
  
  // 创建UI按钮
  createUIButton(text, x, y, color, callback) {
    // 创建按钮背景
    const button = this.add.rectangle(x, y, 100, 60, color, 0.9);
    button.setScrollFactor(0);
    button.setInteractive({ useHandCursor: true });
    button.setDepth(901);
    
    // 创建按钮文本
    const buttonText = this.add.text(x, y, text, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    buttonText.setScrollFactor(0);
    buttonText.setOrigin(0.5);
    buttonText.setDepth(902);
    
    // 添加交互效果
    button.on('pointerover', () => {
      button.setAlpha(1);
      buttonText.setScale(1.1);
    });
    
    button.on('pointerout', () => {
      button.setAlpha(0.9);
      buttonText.setScale(1);
    });
    
    button.on('pointerdown', () => {
      try {
        if (this.sound.get('click')) {
          this.sound.play('click');
        }
      } catch (e) {
        console.log('音效播放失败');
      }
      callback();
    });
    
    return { background: button, text: buttonText };
  }

  // 更新资源显示
  updateResources(amount) {
    // 更新资源数值
    if (amount !== undefined) {
      this.resources = amount;
    }
    
    // 更新显示
    if (this.resourceText) {
      this.resourceText.setText(`${this.resources}`);
    }
  }

  // 修改为Game类自己的updateSelection方法
  updateSelection(entity) {
    // 清除之前的操作按钮
    this.clearActionButtons();
    
    // 如果没有选择任何实体，只显示基础信息
    if (!entity) {
      if (this.infoText) {
        this.infoText.setText('没有选择单位');
      }
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
          this.startBuildMode('barracks');
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
      
      if (this.infoText) {
        this.infoText.setText(info);
      }
    } else {
      // 显示敌人信息
      if (this.infoText) {
        this.infoText.setText(`敌方 ${entity.type} - 生命值: ${Math.floor(entity.health)}/${entity.maxHealth}`);
      }
    }
  }
  
  // 添加操作按钮（底部面板内的按钮）
  addActionButton(text, callback) {
    // 如果还没有操作按钮数组，创建一个
    if (!this.actionButtons) {
      this.actionButtons = [];
      this.actionButtonCallbacks = [];
    }
    
    const buttonIndex = this.actionButtons.length;
    // 操作按钮放在底部面板内部
    const buttonY = this.cameras.main.height - this.controlPanelHeight/2;
    const buttonX = this.cameras.main.width * 0.3 + buttonIndex * 150;
    
    // 创建按钮背景
    const button = this.add.rectangle(buttonX, buttonY, 150, 50, 0xff00ff);
    button.setScrollFactor(0);
    button.setInteractive({ useHandCursor: true });
    button.setDepth(910); // 确保按钮显示在面板上方
    
    // 创建按钮文本
    const buttonText = this.add.text(buttonX, buttonY, text, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    buttonText.setScrollFactor(0);
    buttonText.setOrigin(0.5);
    buttonText.setDepth(911); // 文本深度比按钮高一点，确保显示
    
    // 添加点击效果
    button.on('pointerover', () => {
      button.setFillStyle(0x888888);
    });
    
    button.on('pointerout', () => {
      button.setFillStyle(0xff00ff);
    });
    
    button.on('pointerdown', () => {
      try {
        if (this.sound.get('click')) {
          this.sound.play('click');
        }
      } catch (e) {
        console.log('音效播放失败');
      }
      callback();
    });
    
    // 存储按钮引用
    this.actionButtons.push({ background: button, text: buttonText });
    this.actionButtonCallbacks.push(callback);
  }
  
  // 清除所有操作按钮
  clearActionButtons() {
    // 如果还没有操作按钮数组，创建一个
    if (!this.actionButtons) {
      this.actionButtons = [];
      this.actionButtonCallbacks = [];
      return;
    }
    
    // 清除所有操作按钮
    this.actionButtons.forEach(button => {
      button.background.destroy();
      button.text.destroy();
    });
    
    this.actionButtons = [];
    this.actionButtonCallbacks = [];
  }

  // 获取框选区域的真实边界
  getSelectionBounds() {
    const x = Math.min(this.selectionStart.x, this.selectionRect.x);
    const y = Math.min(this.selectionStart.y, this.selectionRect.y);
    const width = Math.abs(this.selectionRect.width);
    const height = Math.abs(this.selectionRect.height);
    
    return { x, y, width, height };
  }
} 