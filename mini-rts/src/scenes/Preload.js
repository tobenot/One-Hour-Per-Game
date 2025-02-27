export default class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
    this.logDebug('Preload场景已构造');
  }

  // 调试日志辅助函数
  logDebug(message) {
    if (window.debugLog) {
      window.debugLog(`[Preload] ${message}`);
    } else {
      console.log(`[Preload] ${message}`);
    }
  }

  preload() {
    this.logDebug('Preload场景preload开始');
    
    try {
      // 创建加载条
      this.createLoadingBar();
      this.logDebug('加载条创建成功');
      
      // 添加声音（使用内置音效）
      this.createSoundEffects();
      this.logDebug('声音效果创建完成');
    } catch (error) {
      this.logDebug(`预加载资源失败: ${error.message}`);
      console.error(error);
    }
    
    this.logDebug('Preload场景preload完成');
  }

  create() {
    this.logDebug('Preload场景create开始');
    
    try {
      // 创建动画
      this.createAnimations();
      this.logDebug('动画创建成功');
      
      // 延迟一下，显示加载界面
      this.logDebug('设置500ms延时后启动MainMenu场景');
      this.time.delayedCall(500, () => {
        this.logDebug('延时结束，即将启动MainMenu场景');
        this.scene.start('MainMenu');
      });
    } catch (error) {
      this.logDebug(`创建动画失败: ${error.message}`);
      console.error(error);
    }
  }
  
  createLoadingBar() {
    this.logDebug('开始创建加载条UI');
    
    try {
      // 获取屏幕尺寸
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;
      this.logDebug(`屏幕尺寸: ${width}x${height}`);
      
      // 使用之前创建的纹理显示加载背景
      const loadingBg = this.add.sprite(
        width / 2, 
        height / 2, 
        'loading-bg'
      );
      
      // 创建进度条
      const loadingBar = this.add.sprite(
        width / 2 - 99, 
        height / 2, 
        'loading-bar'
      );
      
      loadingBar.setOrigin(0, 0.5);
      
      // 创建加载文本
      const loadingText = this.add.text(
        width / 2, 
        height / 2 - 30, 
        '加载中...', 
        {
          fontSize: '18px',
          fontFamily: 'Arial',
          color: '#ffffff'
        }
      );
      loadingText.setOrigin(0.5);
      
      // 显示加载进度
      const progressBar = this.add.graphics();
      
      this.load.on('progress', (value) => {
        this.logDebug(`加载进度: ${Math.round(value * 100)}%`);
        progressBar.clear();
        progressBar.fillStyle(0x0066ff, 1);
        progressBar.fillRect(
          width / 2 - 99, 
          height / 2 - 9, 
          198 * value, 
          18
        );
      });
      
      this.logDebug('加载条UI创建完成');
    } catch (error) {
      this.logDebug(`加载条UI创建失败: ${error.message}`);
      throw error;
    }
  }
  
  createSoundEffects() {
    // 使用基本音频API创建简单音效
    this.createBasicSoundEffect('click', [130, 165], 0.1);
    this.createBasicSoundEffect('build', [110, 150, 180], 0.3);
    this.createBasicSoundEffect('battle', [80, 100, 60], 0.2);
  }
  
  createBasicSoundEffect(key, freqs, duration) {
    // 创建音频上下文
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // 创建音频缓冲区
    const sampleRate = audioContext.sampleRate;
    const frameCount = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
    
    // 获取音频数据
    const data = buffer.getChannelData(0);
    
    // 生成简单音效
    for (let i = 0; i < frameCount; i++) {
      let sample = 0;
      
      // 对每个频率添加音效
      for (let j = 0; j < freqs.length; j++) {
        const freq = freqs[j];
        sample += Math.sin(2 * Math.PI * freq * i / sampleRate) * Math.exp(-3 * i / frameCount);
      }
      
      // 平均化并限制范围
      data[i] = Math.max(-0.8, Math.min(0.8, sample / freqs.length));
    }
    
    // 创建Blob URL
    const audioBlob = this.floatArrayToWavBlob(buffer);
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // 加载到Phaser
    this.load.audio(key, audioUrl);
  }
  
  floatArrayToWavBlob(audioBuffer) {
    const numOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    
    // 创建buffer视图
    const buffer = new ArrayBuffer(44 + audioBuffer.length * 2);
    const view = new DataView(buffer);
    
    // 写入WAV头部信息
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + audioBuffer.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, audioBuffer.length * 2, true);
    
    // 写入音频数据
    const data = audioBuffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }
  
  createAnimations() {
    // 由于我们改用了单个纹理，不再需要创建基于精灵表的动画
    // 但为了保持兼容性，我们创建一个简单的"动画"，每种类型只有一帧
    
    // 工人动画
    this.anims.create({
      key: 'worker-idle',
      frames: [ { key: 'worker' } ],
      frameRate: 5,
      repeat: -1
    });
    
    this.anims.create({
      key: 'worker-walk',
      frames: [ { key: 'worker' } ],
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: 'worker-attack',
      frames: [ { key: 'worker' } ],
      frameRate: 8,
      repeat: 0
    });
    
    // 士兵动画
    this.anims.create({
      key: 'soldier-idle',
      frames: [ { key: 'soldier' } ],
      frameRate: 5,
      repeat: -1
    });
    
    this.anims.create({
      key: 'soldier-walk',
      frames: [ { key: 'soldier' } ],
      frameRate: 12,
      repeat: -1
    });
    
    this.anims.create({
      key: 'soldier-attack',
      frames: [ { key: 'soldier' } ],
      frameRate: 10,
      repeat: 0
    });
  }
} 