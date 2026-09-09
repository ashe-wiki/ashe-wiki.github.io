// mermaid-zoom.js

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const STEP = 1.25;

/**
 * 设置 Mermaid 图表的缩放功能
 * @param {SVGElement} svgElement - Mermaid 图表的 SVG 元素
 */
function setupMermaidZoom(svgElement) {
    // 获取包含 SVG 的容器元素
    const container = svgElement.closest('.mermaid');
    // 如果容器不存在或已经设置了缩放功能，则直接返回
    if (!container || container.dataset.zoomReady === "true") return;

    // 标记容器已设置缩放功能
    container.dataset.zoomReady = "true";

    // 1. 初始化 viewBox
    // 获取 SVG 元素的边界框
    const bbox = svgElement.getBBox();
    // 优先使用 svg 自带的 viewBox，否则根据 getBBox 计算
    if (!svgElement.hasAttribute('viewBox')) {
        svgElement.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
    }
    
    let [vbx, vby, vbw, vbh] = svgElement.getAttribute('viewBox').split(' ').map(Number);
    const originalViewBox = { x: vbx, y: vby, w: vbw, h: vbh };

    // 2. 缩放逻辑
    function applyZoom(scale, centerX, centerY) {
        const newW = originalViewBox.w * scale;
        const newH = originalViewBox.h * scale;
        const newX = centerX - (centerX - originalViewBox.x) * (newW / originalViewBox.w);
        const newY = centerY - (centerY - originalViewBox.y) * (newH / originalViewBox.h);
        svgElement.setAttribute('viewBox', `${newX} ${newY} ${newW} ${newH}`);
    }

    let currentScale = 1;

    // 3. 动态插入控件 (与你的原逻辑相似，此处简化示意)
    // ... 插入 + - ↻ 按钮并绑定 applyZoom 逻辑 ...

    // 4. 鼠标滚轮缩放
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? STEP : 1 / STEP;
        const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentScale * delta));
        if (newScale !== currentScale) {
            currentScale = newScale;
            // 以鼠标位置为中心缩放
            const rect = svgElement.getBoundingClientRect();
            const mouseX = originalViewBox.x + ((e.clientX - rect.left) / rect.width) * originalViewBox.w;
            const mouseY = originalViewBox.y + ((e.clientY - rect.top) / rect.height) * originalViewBox.h;
            applyZoom(currentScale, mouseX, mouseY);
        }
    }, { passive: false });

    // 5. 双击重置
    container.addEventListener('dblclick', (e) => {
        if (e.target.closest('.mermaid-zoom-controls')) return;
        currentScale = 1;
        svgElement.setAttribute('viewBox', `${originalViewBox.x} ${originalViewBox.y} ${originalViewBox.w} ${originalViewBox.h}`);
    });
}

// 6. 使用 MutationObserver 监听 Material 渲染出的 SVG
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node instanceof Element) {
                // 检查插入的节点本身或其子节点是否为目标 SVG
                const svgs = node.matches('div.mermaid > svg[id^="dmermaid-diagram-"]') 
                    ? [node] 
                    : [...node.querySelectorAll('div.mermaid > svg[id^="dmermaid-diagram-"]')];
                
                svgs.forEach(svg => setupMermaidZoom(svg));
            }
        }
    }
});

// 开始监听 document.body，捕获 Material 插件的渲染动作
observer.observe(document.body, { childList: true, subtree: true });

// 兜底：处理首次加载时已经渲染好的 SVG
document.querySelectorAll('div.mermaid > svg[id^="dmermaid-diagram-"]').forEach(setupMermaidZoom);
