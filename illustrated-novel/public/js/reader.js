import { ImageHandler } from './image-handler.js';

// 获取URL参数
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    novelId: params.get('novel') || 'default-novel',
    chapter: parseInt(params.get('chapter') || '1', 10)
  };
}

// 加载小说数据
async function loadNovel() {
  const { novelId, chapter } = getUrlParams();
  
  try {
    // 加载小说元数据
    const metadataResponse = await fetch(`/novels/${novelId}/metadata.json`);
    const metadata = await metadataResponse.json();
    
    // 加载章节数据
    const chapterResponse = await fetch(`/novels/${novelId}/chapters/${chapter}.json`);
    const chapterData = await chapterResponse.json();
    
    // 更新页面标题和章节信息
    document.title = `${metadata.title} - ${chapterData.title}`;
    document.getElementById('novel-title').textContent = metadata.title;
    document.getElementById('novel-chapter').textContent = chapterData.title;
    
    // 渲染章节内容
    renderChapter(chapterData);
    
    // 更新导航按钮
    updateNavigation(novelId, chapter, metadata.chapterCount);
    
  } catch (error) {
    console.error('加载小说失败:', error);
    document.getElementById('novel-content').innerHTML = `
      <div class="error">
        <p>加载小说内容失败，请稍后再试。</p>
        <p>错误信息: ${error.message}</p>
      </div>
    `;
  }
}

// 渲染章节内容
function renderChapter(chapterData) {
  const contentElement = document.getElementById('novel-content');
  contentElement.innerHTML = '';
  
  // 处理章节内容
  chapterData.content.forEach(block => {
    if (block.type === 'text') {
      // 文本段落
      const paragraph = document.createElement('p');
      paragraph.className = 'novel-paragraph';
      paragraph.textContent = block.content;
      contentElement.appendChild(paragraph);
    } 
    else if (block.type === 'image') {
      // 图片内容
      const imageContainer = document.createElement('div');
      imageContainer.className = `novel-image-container ${block.layout || ''}`;
      
      const img = document.createElement('img');
      img.className = `novel-image ${block.size || ''}`;
      img.src = block.src;
      img.alt = block.alt || '插图';
      img.loading = 'lazy';
      
      imageContainer.appendChild(img);
      
      // 如果有图片说明，添加说明文字
      if (block.caption) {
        const caption = document.createElement('div');
        caption.className = 'image-caption';
        caption.textContent = block.caption;
        imageContainer.appendChild(caption);
      }
      
      contentElement.appendChild(imageContainer);
      
      // 如果需要清除浮动，添加清除浮动的div
      if (block.layout === 'image-left' || block.layout === 'image-right') {
        const clearfix = document.createElement('div');
        clearfix.className = 'clearfix';
        contentElement.appendChild(clearfix);
      }
    }
    else if (block.type === 'image-pair') {
      // 双图布局
      const pairContainer = document.createElement('div');
      pairContainer.className = 'image-pair';
      
      block.images.forEach(imgData => {
        const img = document.createElement('img');
        img.src = imgData.src;
        img.alt = imgData.alt || '插图';
        img.loading = 'lazy';
        pairContainer.appendChild(img);
      });
      
      if (block.caption) {
        const caption = document.createElement('div');
        caption.className = 'image-caption';
        caption.textContent = block.caption;
        pairContainer.appendChild(caption);
      }
      
      contentElement.appendChild(pairContainer);
    }
    else if (block.type === 'image-grid') {
      // 图片网格布局
      const gridContainer = document.createElement('div');
      gridContainer.className = 'image-grid';
      
      block.images.forEach(imgData => {
        const img = document.createElement('img');
        img.src = imgData.src;
        img.alt = imgData.alt || '插图';
        img.loading = 'lazy';
        gridContainer.appendChild(img);
      });
      
      contentElement.appendChild(gridContainer);
    }
    else if (block.type === 'character-card') {
      // 角色卡片
      const card = document.createElement('div');
      card.className = 'character-card';
      
      const img = document.createElement('img');
      img.className = 'character-image';
      img.src = block.image;
      img.alt = block.name;
      card.appendChild(img);
      
      const info = document.createElement('div');
      info.className = 'character-info';
      
      const name = document.createElement('h3');
      name.className = 'character-name';
      name.textContent = block.name;
      info.appendChild(name);
      
      const desc = document.createElement('p');
      desc.className = 'character-description';
      desc.textContent = block.description;
      info.appendChild(desc);
      
      card.appendChild(info);
      contentElement.appendChild(card);
    }
  });
}

// 更新导航按钮
function updateNavigation(novelId, currentChapter, totalChapters) {
  const prevButton = document.getElementById('prev-chapter');
  const nextButton = document.getElementById('next-chapter');
  
  // 设置上一章按钮
  if (currentChapter <= 1) {
    prevButton.disabled = true;
  } else {
    prevButton.disabled = false;
    prevButton.onclick = () => {
      window.location.href = `reader.html?novel=${novelId}&chapter=${currentChapter - 1}`;
    };
  }
  
  // 设置下一章按钮
  if (currentChapter >= totalChapters) {
    nextButton.disabled = true;
  } else {
    nextButton.disabled = false;
    nextButton.onclick = () => {
      window.location.href = `reader.html?novel=${novelId}&chapter=${currentChapter + 1}`;
    };
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  loadNovel();
  ImageHandler.initLazyLoading();
}); 