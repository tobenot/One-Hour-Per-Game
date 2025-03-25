// 获取小说列表并展示
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 获取小说列表
    const response = await fetch('/novels/index.json');
    const novels = await response.json();
    
    // 显示小说列表
    displayNovels(novels);
  } catch (error) {
    console.error('加载小说列表失败:', error);
    document.getElementById('novel-grid').innerHTML = '<p class="error">加载小说列表失败，请稍后再试。</p>';
  }
});

// 显示小说列表
function displayNovels(novels) {
  const novelGrid = document.getElementById('novel-grid');
  
  novels.forEach(novel => {
    const novelCard = document.createElement('div');
    novelCard.className = 'novel-card';
    
    novelCard.innerHTML = `
      <div class="novel-cover">
        <picture>
          <source srcset="${novel.cover.replace('.jpg', '.webp')}" type="image/webp">
          <img src="${novel.cover}" alt="${novel.title}" loading="lazy">
        </picture>
      </div>
      <div class="novel-info">
        <h2 class="novel-title">${novel.title}</h2>
        <p class="novel-author">作者：${novel.author}</p>
        <p class="novel-description">${novel.description}</p>
        <a href="/reader.html?novel=${novel.id}" class="novel-btn">开始阅读</a>
      </div>
    `;
    
    novelGrid.appendChild(novelCard);
  });
} 