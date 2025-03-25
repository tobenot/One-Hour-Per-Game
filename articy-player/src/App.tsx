import React, { useEffect, useState } from 'react';
import type { Database, DialogueFragment, GameIterationConfig, ArticyData } from 'articy-js';
import * as ArticyJS from 'articy-js';
import './App.css';

interface Branch {
  targetId: string;
}

interface GameState {
  branches: Branch[];
}

function App(): JSX.Element {
  const [db, setDb] = useState<Database | null>(null);
  const [currentNode, setCurrentNode] = useState<DialogueFragment | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [choices, setChoices] = useState<Array<{ id: string; text: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStory = async () => {
      try {
        console.log('开始加载故事文件...');
        const storyPath = './stories/package_010000000000102_objects.json';
        console.log('故事文件路径:', window.location.origin + storyPath);
        
        const response = await fetch(storyPath);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('故事文件加载成功，正在解析 JSON...');
        
        const storyData = await response.json();
        console.log('故事数据解析成功，初始化数据库...');
        console.log('故事数据:', storyData);
        
        // 初始化数据库
        const database = new ArticyJS.Database(storyData);
        setDb(database);
        console.log('数据库初始化成功');

        // 设置迭代配置
        const iterationConfig: GameIterationConfig = {
          stopAtTypes: ["DialogueFragment"]
        };

        // 获取初始节点（这里使用您故事中的起始节点ID）
        const startNodeId = "0x0100000000000001"; // 请替换为您的实际起始节点ID
        console.log('尝试加载起始节点:', startNodeId);
        
        const [initialState, initialNode] = database.startupGameFlowState(startNodeId, iterationConfig);
        console.log('起始节点加载成功:', initialNode);
        
        setGameState(initialState as GameState);
        if (initialNode instanceof ArticyJS.DialogueFragment) {
          setCurrentNode(initialNode);
          // 刷新分支选项
          const refreshedState = database.refreshBranches(initialState, iterationConfig);
          updateChoices(refreshedState as GameState);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '未知错误';
        console.error('加载故事文件失败:', errorMessage);
        setError(`加载故事失败: ${errorMessage}`);
      }
    };

    loadStory();
  }, []);

  const updateChoices = (state: GameState) => {
    if (!state.branches) return;
    
    const newChoices = state.branches.map((branch: Branch) => {
      const node = db?.getObject(branch.targetId, ArticyJS.DialogueFragment);
      return {
        id: branch.targetId,
        text: node?.properties.Text || '未知选项'
      };
    });
    setChoices(newChoices);
  };

  const handleChoice = (choiceId: string) => {
    if (!db || !gameState) return;

    const iterationConfig: GameIterationConfig = {
      stopAtTypes: ["DialogueFragment"]
    };

    // 前进到选择的分支
    const [nextState, nextNode] = db.advanceGameFlowState(gameState, iterationConfig, choiceId);
    
    setGameState(nextState as GameState);
    if (nextNode instanceof ArticyJS.DialogueFragment) {
      setCurrentNode(nextNode);
      // 刷新分支选项
      const refreshedState = db.refreshBranches(nextState, iterationConfig);
      updateChoices(refreshedState as GameState);
    }
  };

  if (error) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>错误</h1>
        </header>
        <main>
          <div className="error-message">
            {error}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Articy 故事播放器</h1>
      </header>
      <main>
        <div className="story-content">
          {currentNode ? (
            <>
              {currentNode.properties.Speaker && (
                <div className="speaker">{currentNode.properties.Speaker}</div>
              )}
              <div className="dialogue">{currentNode.properties.Text}</div>
            </>
          ) : (
            '正在加载故事...'
          )}
        </div>
        <div className="choices">
          {choices.map((choice) => (
            <button
              key={choice.id}
              className="choice-button"
              onClick={() => handleChoice(choice.id)}
            >
              {choice.text}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App; 