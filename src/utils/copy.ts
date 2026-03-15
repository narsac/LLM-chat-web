/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('复制失败:', err)
    // 降级方案
    return fallbackCopy(text)
  }
}

/**
 * 复制代码块（带格式）
 */
export function copyCodeBlock(code: string, language?: string): Promise<boolean> {
  // 可以添加格式标记
  const formatted = language ? `\`\`\`${language}\n${code}\n\`\`\`` : code
  return copyToClipboard(formatted)
}

/**
 * 复制Markdown内容
 */
export function copyMarkdown(content: string): Promise<boolean> {
  return copyToClipboard(content)
}