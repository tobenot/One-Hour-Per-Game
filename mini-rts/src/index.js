import Phaser from 'phaser';
import BootScene from './scenes/Boot';
import PreloadScene from './scenes/Preload';
import MainMenuScene from './scenes/MainMenu';
import GameScene from './scenes/Game';

// 调试日志函数
function logDebug(message) {
  if (window.debugLog) {
    window.debugLog(message);
  } else {
    console.log(message);
  }
}

// 记录初始加载
logDebug('index.js 已加载');

// 游戏配置
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#2d2d2d',
  scene: [BootScene, PreloadScene, MainMenuScene, GameScene],
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  audio: {
    disableWebAudio: false,
    noAudio: false
  },
  // 添加回调函数，监控游戏启动过程
  callbacks: {
    preBoot: function() {
      logDebug('游戏 preBoot 阶段');
    },
    postBoot: function() {
      logDebug('游戏 postBoot 阶段');
    }
  },
  // 强制使用Canvas渲染器，防止WebGL问题
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true
  }
};

// 创建游戏实例
let game;

window.addEventListener('load', () => {
  logDebug('开始创建游戏实例');
  
  try {
    // 清空游戏容器
    const container = document.getElementById('game-container');
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    // 创建游戏实例
    game = new Phaser.Game(config);
    
    // 将游戏实例存储在window上方便调试
    window.game = game;
    
    logDebug('游戏实例已创建');
    
    // 监听场景变化
    game.events.on('SCENE_TRANSITION_COMPLETE', (fromScene, toScene) => {
      logDebug(`场景已切换: ${fromScene} -> ${toScene}`);
    });
  } catch (error) {
    logDebug(`游戏创建出错: ${error.message}`);
    console.error(error);
  }
  
  // 在移动设备上添加全屏按钮
  if (game && game.device && (game.device.os.android || game.device.os.iOS)) {
    const fullscreenButton = document.createElement('button');
    fullscreenButton.textContent = '全屏';
    fullscreenButton.style.position = 'absolute';
    fullscreenButton.style.right = '10px';
    fullscreenButton.style.top = '10px';
    fullscreenButton.style.zIndex = '100';
    fullscreenButton.style.padding = '8px 12px';
    fullscreenButton.style.fontSize = '14px';
    
    document.body.appendChild(fullscreenButton);
    
    fullscreenButton.addEventListener('click', () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.getElementById('game-container').requestFullscreen();
      }
    });
  }
});

// 添加调整窗口大小的处理
window.addEventListener('resize', () => {
  if (game) {
    logDebug('窗口大小调整');
    game.scale.refresh();
  }
});

// 添加错误捕获
window.addEventListener('error', (event) => {
  logDebug(`全局错误: ${event.message}`);
}); 