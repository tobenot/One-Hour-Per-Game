import Phaser from 'phaser';
import Boot from './scenes/Boot';
import Preload from './scenes/Preload';
import MainMenu from './scenes/MainMenu';
import Game from './scenes/Game';

// 游戏配置
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  backgroundColor: '#4a442d',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [Boot, Preload, MainMenu, Game]
};

// 创建游戏实例
const game = new Phaser.Game(config);

// 添加调整窗口大小的处理
window.addEventListener('resize', () => {
  game.scale.refresh();
}); 