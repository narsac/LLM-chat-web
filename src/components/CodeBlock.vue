<!-- 
  代码块组件
  功能：语法高亮、行号显示、一键复制、语言标识
-->
<template>
  <div class="code-block">
    <div class="code-header">
      <div class="lang-badge">{{ displayLanguage }}</div>
      <div class="code-actions">
        <button 
          class="action-btn"
          @click="copyCode"
          :class="{ 'copied': copied }"
        >
          <span class="icon">{{ copied ? '✅' : '📋' }}</span>
          {{ copied ? '已复制' : '复制' }}
        </button>
        <button class="action-btn" @click="downloadCode" v-if="canDownload">
          <span class="icon">💾</span>
          下载
        </button>
      </div>
    </div>
    
    <div class="code-wrapper">
      <pre><code ref="codeRef" :class="`hljs language-${language}`">{{ code }}</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import hljs from 'highlight.js'

const props = defineProps<{
  code: string
  language?: string
  filename?: string
}>()

const codeRef = ref<HTMLElement>()
const copied = ref(false)

const languageMap: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'sh': 'bash',
  'yml': 'yaml',
  'html': 'xml',
  'vue': 'xml',
  'jsx': 'javascript',
  'tsx': 'typescript'
}

const language = computed(() => {
  const lang = props.language || 'text'
  return languageMap[lang] || lang
})

const displayLanguage = computed(() => {
  const map: Record<string, string> = {
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'python': 'Python',
    'bash': 'Bash',
    'yaml': 'YAML',
    'json': 'JSON',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'java': 'Java',
    'go': 'Go',
    'rust': 'Rust',
    'c': 'C',
    'cpp': 'C++',
    'text': 'Plain Text'
  }
  return map[language.value] || language.value
})

const canDownload = computed(() => props.filename || props.code.length > 100)

onMounted(() => {
  if (codeRef.value) {
    hljs.highlightElement(codeRef.value)
  }
})

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const downloadCode = () => {
  const blob = new Blob([props.code], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = props.filename || `code.${getFileExtension()}`
  a.click()
  URL.revokeObjectURL(url)
}

const getFileExtension = () => {
  const extMap: Record<string, string> = {
    'javascript': 'js',
    'typescript': 'ts',
    'python': 'py',
    'bash': 'sh',
    'yaml': 'yml',
    'json': 'json',
    'html': 'html',
    'css': 'css',
    'java': 'java',
    'go': 'go',
    'rust': 'rs'
  }
  return extMap[language.value] || 'txt'
}
</script>

<style scoped lang="scss">
.code-block {
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
  background: #1e1e1e;
  border: 1px solid #333;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #252526;
  border-bottom: 1px solid #333;
}

.lang-badge {
  font-size: 12px;
  color: #858585;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: monospace;
}

.code-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  background: #3c3c3c;
  color: #cccccc;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #4c4c4c;
    color: white;
  }
  
  &.copied {
    background: #238636;
    color: white;
  }
  
  .icon {
    font-size: 14px;
  }
}

.code-wrapper {
  overflow-x: auto;
  max-height: 500px;
  overflow-y: auto;
}

pre {
  margin: 0;
  padding: 16px;
  
  code {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.6;
    background: transparent !important;
    padding: 0 !important;
  }
}

:deep(.hljs) {
  background: #1e1e1e;
  color: #d4d4d4;
}

:deep(.hljs-keyword) { color: #569cd6; }
:deep(.hljs-string) { color: #ce9178; }
:deep(.hljs-number) { color: #b5cea8; }
:deep(.hljs-comment) { color: #6a9955; }
:deep(.hljs-function) { color: #dcdcaa; }
:deep(.hljs-class) { color: #4ec9b0; }
</style>