/**
 * Markdown处理工具
 * 功能：解析Markdown、代码高亮、数学公式支持
 */
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

// 配置marked选项
marked.setOptions({
  breaks: true,      // 支持GitHub风格换行
  gfm: true,         // GitHub Flavored Markdown
  headerIds: false,  // 不自动生成标题ID
  mangle: false,     // 不转义邮件地址
  sanitize: false    // 信任输入（需确保内容安全）
})

// 自定义渲染器
const renderer = new marked.Renderer()

// 自定义代码块渲染
renderer.code = (code: string, language?: string) => {
  const validLang = language && hljs.getLanguage(language) ? language : 'plaintext'
  const highlighted = hljs.highlight(code, { language: validLang }).value
  
  // 生成唯一ID用于复制
  const id = `code-${Math.random().toString(36).substr(2, 9)}`
  
  return `
    <div class="code-block-wrapper" id="${id}">
      <div class="code-block-header">
        <span class="code-language">${validLang}</span>
        <button class="copy-code-btn" onclick="window.copyCodeBlock('${id}')" title="复制">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>复制</span>
        </button>
      </div>
      <pre class="hljs"><code class="language-${validLang}">${highlighted}</code></pre>
    </div>
  `
}

// 自定义链接渲染（新窗口打开）
renderer.link = (href: string, title: string | null | undefined, text: string) => {
  const titleAttr = title ? ` title="${title}"` : ''
  return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`
}

// 自定义表格渲染
renderer.table = (header: string, body: string) => {
  return `<div class="table-wrapper"><table class="markdown-table"><thead>${header}</thead><tbody>${body}</tbody></table></div>`
}

// 应用自定义渲染器
marked.use({ renderer })

/**
 * 渲染Markdown为HTML
 */
export function renderMarkdown(content: string): string {
  if (!content) return ''
  
  try {
    return marked.parse(content) as string
  } catch (err) {
    console.error('Markdown渲染失败:', err)
    return escapeHtml(content)
  }
}

/**
 * 转义HTML特殊字符
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * 提取纯文本（用于预览）
 */
export function extractText(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || ''
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// 全局复制函数（供HTML调用）
;(window as any).copyCodeBlock = (wrapperId: string) => {
  const wrapper = document.getElementById(wrapperId)
  if (!wrapper) return
  
  const code = wrapper.querySelector('code')?.textContent || ''
  
  navigator.clipboard.writeText(code).then(() => {
    const btn = wrapper.querySelector('.copy-code-btn')
    if (btn) {
      const original = btn.innerHTML
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span>已复制</span>`
      btn.classList.add('copied')
      
      setTimeout(() => {
        btn.innerHTML = original
        btn.classList.remove('copied')
      }, 2000)
    }
  })
}