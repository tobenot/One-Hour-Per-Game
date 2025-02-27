export default class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
    this.logDebug('Boot场景已构造');
  }

  // 调试日志辅助函数
  logDebug(message) {
    if (window.debugLog) {
      window.debugLog(`[Boot] ${message}`);
    } else {
      console.log(`[Boot] ${message}`);
    }
  }

  preload() {
    this.logDebug('Boot场景preload开始');
    // 不再加载外部资源，而是在create中创建
    this.logDebug('Boot场景preload完成');
  }

  create() {
    this.logDebug('Boot场景create开始');
    
    // 创建所有游戏所需的"假"资源
    try {
      this.createGeometryResources();
      this.logDebug('几何资源创建成功');
    } catch (error) {
      this.logDebug(`几何资源创建失败: ${error.message}`);
      console.error(error);
    }
    
    // 启动预加载场景
    this.logDebug('准备启动Preload场景');
    this.scene.start('Preload');
  }
  
  createGeometryResources() {
    this.logDebug('开始创建几何资源');
    // 创建UI资源
    this.createLoadingBar();
    
    // 创建游戏资源
    this.createGameAssets();
  }
  
  createLoadingBar() {
    try {
      this.logDebug('创建加载条');
      // 创建加载背景
      const loadingBgGraphics = this.make.graphics();
      loadingBgGraphics.fillStyle(0x222222, 1);
      loadingBgGraphics.fillRect(0, 0, 200, 20);
      loadingBgGraphics.generateTexture('loading-bg', 200, 20);
      
      // 创建加载条
      const loadingBarGraphics = this.make.graphics();
      loadingBarGraphics.fillStyle(0x0066ff, 1);
      loadingBarGraphics.fillRect(0, 0, 198, 18);
      loadingBarGraphics.generateTexture('loading-bar', 198, 18);
      
      this.logDebug('加载条创建完成');
    } catch (error) {
      this.logDebug(`加载条创建失败: ${error.message}`);
      throw error;
    }
  }
  
  createGameAssets() {
    // 创建按钮
    const buttonGraphics = this.make.graphics();
    buttonGraphics.fillStyle(0x444444, 1);
    buttonGraphics.fillRect(0, 0, 200, 50);
    buttonGraphics.lineStyle(2, 0xffffff, 1);
    buttonGraphics.strokeRect(0, 0, 200, 50);
    buttonGraphics.generateTexture('button', 200, 50);
    
    // 创建面板
    const panelGraphics = this.make.graphics();
    panelGraphics.fillStyle(0x333333, 0.8);
    panelGraphics.fillRect(0, 0, 300, 200);
    panelGraphics.lineStyle(2, 0x666666, 1);
    panelGraphics.strokeRect(0, 0, 300, 200);
    panelGraphics.generateTexture('panel', 300, 200);
    
    // 创建资源图标
    const resourceIconGraphics = this.make.graphics();
    resourceIconGraphics.fillStyle(0xffcc00, 1);
    resourceIconGraphics.fillCircle(20, 20, 20);
    resourceIconGraphics.lineStyle(2, 0x996600, 1);
    resourceIconGraphics.strokeCircle(20, 20, 20);
    resourceIconGraphics.generateTexture('resource-icon', 40, 40);
    
    // 创建地面
    const grassGraphics = this.make.graphics();
    grassGraphics.fillStyle(0x228833, 1);
    grassGraphics.fillRect(0, 0, 64, 64);
    // 添加一些纹理
    grassGraphics.fillStyle(0x339944, 1);
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * 64;
      const y = Math.random() * 64;
      grassGraphics.fillRect(x, y, 4, 4);
    }
    grassGraphics.generateTexture('grass', 64, 64);
    
    // 创建树
    const treeGraphics = this.make.graphics();
    treeGraphics.fillStyle(0x663300, 1);
    treeGraphics.fillRect(12, 16, 8, 16); // 树干
    treeGraphics.fillStyle(0x116611, 1);
    treeGraphics.fillCircle(16, 12, 12); // 树冠
    treeGraphics.generateTexture('tree', 32, 32);
    
    // 创建岩石
    const rockGraphics = this.make.graphics();
    rockGraphics.fillStyle(0x888888, 1);
    rockGraphics.fillCircle(16, 16, 10);
    rockGraphics.lineStyle(2, 0x666666, 1);
    rockGraphics.strokeCircle(16, 16, 10);
    rockGraphics.generateTexture('rock', 32, 32);
    
    // 创建基地
    const baseGraphics = this.make.graphics();
    baseGraphics.fillStyle(0x0000cc, 1);
    baseGraphics.fillRect(0, 0, 64, 64);
    baseGraphics.lineStyle(3, 0x0000ff, 1);
    baseGraphics.strokeRect(0, 0, 64, 64);
    baseGraphics.fillStyle(0xffffff, 1);
    baseGraphics.fillRect(24, 24, 16, 16);
    baseGraphics.generateTexture('base', 64, 64);
    
    // 创建兵营
    const barracksGraphics = this.make.graphics();
    barracksGraphics.fillStyle(0xaa6600, 1);
    barracksGraphics.fillRect(0, 0, 64, 48);
    barracksGraphics.fillStyle(0x994400, 1);
    barracksGraphics.fillTriangle(0, 0, 64, 0, 32, -16);
    barracksGraphics.lineStyle(2, 0xcc8800, 1);
    barracksGraphics.strokeRect(0, 0, 64, 48);
    barracksGraphics.generateTexture('barracks', 64, 48);
    
    // 创建矿山资源
    const mineGraphics = this.make.graphics();
    mineGraphics.fillStyle(0xffcc00, 1);
    mineGraphics.fillCircle(24, 24, 16);
    mineGraphics.lineStyle(3, 0xcc9900, 1);
    mineGraphics.strokeCircle(24, 24, 16);
    mineGraphics.fillStyle(0xffee88, 1);
    mineGraphics.fillCircle(20, 20, 4);
    mineGraphics.generateTexture('mine', 48, 48);
    
    // 创建工人单位精灵表
    this.createWorkerSpritesheet();
    
    // 创建士兵单位精灵表
    this.createSoldierSpritesheet();
  }
  
  createWorkerSpritesheet() {
    // 创建工人的单个纹理，而不是试图创建精灵表
    const graphics = this.make.graphics();
    
    // 身体
    graphics.fillStyle(0x00cc00, 1);
    graphics.fillCircle(16, 16, 10);
    
    // 头部
    graphics.fillStyle(0xffcc99, 1);
    graphics.fillCircle(16, 12, 5);
    
    // 工具
    graphics.fillStyle(0x999999, 1);
    graphics.fillRect(22, 12, 6, 2);
    
    // 生成纹理
    graphics.generateTexture('worker', 32, 32);
  }
  
  createSoldierSpritesheet() {
    // 创建士兵的单个纹理，而不是试图创建精灵表
    const graphics = this.make.graphics();
    
    // 身体
    graphics.fillStyle(0xcc0000, 1);
    graphics.fillCircle(16, 16, 10);
    
    // 头盔
    graphics.fillStyle(0x999999, 1);
    graphics.fillCircle(16, 12, 6);
    
    // 武器
    graphics.fillStyle(0x666666, 1);
    graphics.fillRect(22, 12, 8, 2);
    
    // 生成纹理
    graphics.generateTexture('soldier', 32, 32);
  }
} 