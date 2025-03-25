export class ImageHandler {
  static initLazyLoading() {
    // 创建 Intersection Observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          // 如果图片有data-src属性，则加载它
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          // 停止观察这个图片
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.1
    });

    // 观察所有带有lazy类的图片
    document.querySelectorAll('img.lazy').forEach(img => {
      observer.observe(img);
    });
  }
} 