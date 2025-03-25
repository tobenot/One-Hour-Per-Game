# Articy 故事播放器

这是一个基于 React 和 TypeScript 的 Articy 故事播放器，用于展示和播放从 Articy 导出的互动故事。

## 功能特点

- 支持加载和播放 Articy 导出的 JSON 格式故事文件
- 现代化的用户界面
- 支持故事分支和选择
- 响应式设计，适配各种屏幕尺寸

## 安装

1. 克隆项目到本地
2. 安装依赖：
```bash
npm install
```

## 使用方法

1. 启动开发服务器：
```bash
npm start
```

2. 在浏览器中打开 http://localhost:3000

3. 加载你的 Articy 故事文件：
   - 将你的 Articy 导出的 JSON 文件放在 `public/stories` 目录下
   - 在 `App.tsx` 中修改 `loadFromJson` 的路径指向你的故事文件

## 项目结构

```
src/
  ├── App.tsx          # 主应用组件
  ├── App.css          # 主应用样式
  ├── index.tsx        # 应用入口
  └── index.css        # 全局样式
```

## 注意事项

- 确保你的 Articy 故事文件格式正确
- 目前支持基本的文本显示和选项功能
- 如果需要添加更多功能（如存档、音效等），可以进一步扩展

## 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进这个项目。
