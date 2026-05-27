/**
 * 简易 Markdown 转 HTML
 * 支持：加粗、斜体、删除线、图片、链接、换行、列表
 */
function markdownToHtml(md) {
  if (!md) return '';
  
  let html = md;
  
  // 1. 加粗 **文本**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // 2. 斜体 *文本*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // 3. 删除线 ~~文本~~
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
  
  // 4. 图片 ![alt](url)
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%; height:auto; border-radius:8rpx; margin:8rpx 0;" />');
  
  // 5. 链接 [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color:#07c160;">$1</a>');
  
  // 6. 无序列表 - 项目 或 * 项目
  html = html.replace(/^[-*] (.*?)$/gm, '• $1<br/>');
  
  // 7. 有序列表 1. 项目
  html = html.replace(/^\d+\. (.*?)$/gm, '<span style="margin-left:20rpx;">$1</span><br/>');
  
  // 8. 标题
  html = html.replace(/^### (.*?)$/gm, '<h3 style="font-size:32rpx; font-weight:bold; margin:20rpx 0 10rpx;">$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2 style="font-size:36rpx; font-weight:bold; margin:20rpx 0 10rpx;">$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1 style="font-size:40rpx; font-weight:bold; margin:20rpx 0 10rpx;">$1</h1>');
  
  // 9. 换行
  html = html.replace(/\n/g, '<br/>');
  
  return html;
}

module.exports = { markdownToHtml };