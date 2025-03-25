import { Database } from 'articy-js';

class Game {
    constructor(articyDB) {
        console.log('Database received:', articyDB);
        
        try {
            // 直接使用传入的 Database 实例
            this.articy = articyDB;
            console.log('Database successfully set');
            
            this.currentNode = null;
            this.storyText = document.getElementById('story-text');
            this.choicesContainer = document.getElementById('choices');
            this.startGame();
        } catch (error) {
            console.error('Error setting up game:', error);
            throw error;
        }
    }

    startGame() {
        try {
            // 获取起始节点，这里需要提供起始节点的ID
            // 这个ID应该是你在Articy中设置的入口点
            // 我们可以从清单中查找或使用一个硬编码的值
            this.currentNode = this.articy.getObject("0x0100000000000001");
            console.log('Start node:', this.currentNode);
            
            if (!this.currentNode) {
                throw new Error('Start node not found. Make sure you have a valid starting point.');
            }
            
            this.displayCurrentNode();
        } catch (error) {
            console.error('Error starting game:', error);
            throw error;
        }
    }

    displayCurrentNode() {
        if (!this.currentNode) {
            console.error('No current node available');
            return;
        }

        try {
            // 显示文本 - 根据节点类型获取相应的文本
            let displayText = '无文本';
            
            if (this.currentNode.properties && this.currentNode.properties.Text) {
                displayText = this.currentNode.properties.Text;
            } else if (this.currentNode.properties && this.currentNode.properties.DisplayName) {
                displayText = this.currentNode.properties.DisplayName;
            }
            
            this.storyText.textContent = displayText;
            console.log('Displaying node text:', displayText);

            // 清空选项
            this.choicesContainer.innerHTML = '';

            // 尝试获取后续连接的节点作为选项
            // 这里需要根据Articy的数据结构进行适当调整
            const outConnections = [];
            
            if (this.currentNode.outConnections) {
                for (const conn of this.currentNode.outConnections) {
                    const targetNode = this.articy.getObject(conn.target);
                    if (targetNode) {
                        outConnections.push({
                            targetId: conn.target,
                            text: targetNode.properties.DisplayName || targetNode.properties.Text || '继续'
                        });
                    }
                }
            }
            
            console.log('Available connections:', outConnections);
            
            // 显示选项
            outConnections.forEach(conn => {
                const button = document.createElement('button');
                button.className = 'choice-button';
                button.textContent = conn.text;
                button.onclick = () => this.makeChoice(conn.targetId);
                this.choicesContainer.appendChild(button);
            });
            
            // 如果没有连接，显示一个结束提示
            if (outConnections.length === 0) {
                this.storyText.textContent += '\n\n[故事结束]';
            }
        } catch (error) {
            console.error('Error displaying node:', error);
            throw error;
        }
    }

    makeChoice(targetId) {
        try {
            // 获取下一个节点
            this.currentNode = this.articy.getObject(targetId);
            console.log('Moving to next node:', this.currentNode);
            this.displayCurrentNode();
        } catch (error) {
            console.error('Error making choice:', error);
            throw error;
        }
    }
}

// 打印当前页面URL，帮助调试
console.log('Current page URL:', window.location.href);

// 加载所有必要的文件
Promise.all([
    fetch('/story/package_0100000000000102_objects.json').then(r => r.json()),
    fetch('/story/object_definitions.json').then(r => r.json()),
    fetch('/story/hierarchy.json').then(r => r.json()),
    fetch('/story/global_variables.json').then(r => r.json()),
    fetch('/story/manifest.json').then(r => r.json()),
    fetch('/story/script_methods.json').then(r => r.json())
])
.then(([objsData, objDefs, hierarchy, globalVars, manifest, scriptMethods]) => {
    console.log('All files loaded successfully');
    
    // 确保我们从Objects文件中获取正确的对象数组
    const objects = Array.isArray(objsData.Objects) ? objsData.Objects : objsData;
    
    // 构建数据结构，匹配Articy期望的格式
    const articyData = {
        Project: manifest.Project || {},
        ObjectDefinitions: objDefs,
        Hierarchy: hierarchy,
        Objects: objects,
        GlobalVariables: globalVars,
        ScriptMethods: scriptMethods
    };
    
    console.log('Prepared Articy data structure:', articyData);
    
    try {
        // 创建数据库实例
        const articyDB = new Database(articyData);
        console.log('Database created successfully');
        
        // 创建游戏实例
        const game = new Game(articyDB);
    } catch (error) {
        console.error('Error creating Articy database:', error);
        document.getElementById('story-text').textContent = '创建故事数据库失败：' + error.message;
    }
})
.catch(error => {
    console.error('加载故事文件失败:', error);
    document.getElementById('story-text').textContent = '加载故事文件失败，请确保所有必要的文件存在且格式正确。';
}); 