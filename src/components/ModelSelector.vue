<!-- 
  模型选择器组件
  功能：下拉选择模型、显示模型状态、快速切换
-->
<template>
  <div class="model-selector">
    <div class="selector-trigger" @click="toggleDropdown">
      <div class="model-icon">
        {{ currentModelIcon }}
      </div>
      <div class="model-info">
        <div class="model-name">{{ currentModel?.name || '选择模型' }}</div>
        <div class="model-status" :class="connectionStatus">
          {{ statusText }}
        </div>
      </div>
      <span class="arrow" :class="{ 'open': isOpen }">▼</span>
    </div>
    
    <!-- 下拉菜单 -->
    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu" v-click-outside="closeDropdown">
        <div class="dropdown-header">
          <span>本地模型</span>
        </div>
        
        <div
          v-for="model in localModels"
          :key="model.id"
          class="dropdown-item"
          :class="{ 'active': current === model.id }"
          @click="selectModel(model.id)"
        >
          <div class="item-icon">🏠</div>
          <div class="item-info">
            <div class="item-name">{{ model.name }}</div>
            <div class="item-desc">{{ model.modelId }}</div>
          </div>
          <span v-if="current === model.id" class="check">✓</span>
        </div>
        
        <div class="dropdown-header">
          <span>在线API</span>
        </div>
        
        <div
          v-for="model in apiModels"
          :key="model.id"
          class="dropdown-item"
          :class="{ 'active': current === model.id }"
          @click="selectModel(model.id)"
        >
          <div class="item-icon">☁️</div>
          <div class="item-info">
            <div class="item-name">{{ model.name }}</div>
            <div class="item-desc">{{ model.baseUrl }}</div>
          </div>
          <span v-if="current === model.id" class="check">✓</span>
        </div>
        
        <div class="dropdown-footer">
          <button @click="showAddModal = true">
            + 添加自定义模型
          </button>
        </div>
      </div>
    </Transition>
    
    <!-- 添加模型弹窗 -->
    <AddModelModal
      v-if="showAddModal"
      @close="showAddModal = false"
      @add="handleAddModel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ModelConfig } from '@/types/chat'
import AddModelModal from './AddModelModal.vue'

const props = defineProps<{
  models: ModelConfig[]
  current: string
}>()

const emit = defineEmits<{
  change: [id: string]
}>()

const isOpen = ref(false)
const showAddModal = ref(false)
const connectionStatus = ref<'connected' | 'disconnected' | 'checking'>('checking')

// 分类模型
const localModels = computed(() => 
  props.models.filter(m => m.provider === 'ollama')
)

const apiModels = computed(() => 
  props.models.filter(m => m.provider !== 'ollama')
)

const currentModel = computed(() => 
  props.models.find(m => m.id === props.current)
)

const currentModelIcon = computed(() => {
  if (!currentModel.value) return '🤖'
  return currentModel.value.provider === 'ollama' ? '🏠' : '☁️'
})

const statusText = computed(() => {
  const map = {
    connected: '已连接',
    disconnected: '未连接',
    checking: '检测中...'
  }
  return map[connectionStatus.value]
})

// 检测连接状态
const checkConnection = async () => {
  if (!currentModel.value) return
  
  connectionStatus.value = 'checking'
  
  try {
    if (currentModel.value.provider === 'ollama') {
      const res = await fetch(`${currentModel.value.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      })
      connectionStatus.value = res.ok ? 'connected' : 'disconnected'
    } else {
      // API类型简单检测
      connectionStatus.value = currentModel.value.apiKey ? 'connected' : 'disconnected'
    }
  } catch {
    connectionStatus.value = 'disconnected'
  }
}

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    checkConnection()
  }
}

const closeDropdown = () => {
  isOpen.value = false
}

const selectModel = (id: string) => {
  emit('change', id)
  isOpen.value = false
  checkConnection()
}

const handleAddModel = (model: ModelConfig) => {
  // 通过事件传递给父组件处理
  emit('add-model', model)
  showAddModal.value = false
}

// 点击外部关闭指令
const vClickOutside = {
  mounted(el: HTMLElement, binding: any) {
    el._clickOutside = (event: Event) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', el._clickOutside)
  }
}

onMounted(() => {
  checkConnection()
})
</script>

<style scoped lang="scss">
.model-selector {
  position: relative;
}

.selector-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #f3f4f6;
    
    .dark & {
      background: #374151;
    }
  }
}

.model-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.model-info {
  flex: 1;
}

.model-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  
  .dark & {
    color: #e5e5e5;
  }
}

.model-status {
  font-size: 12px;
  
  &.connected { color: #10b981; }
  &.disconnected { color: #ef4444; }
  &.checking { color: #f59e0b; }
}

.arrow {
  font-size: 10px;
  color: #9ca3af;
  transition: transform 0.2s;
  
  &.open {
    transform: rotate(180deg);
  }
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  width: 320px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-height: 400px;
  overflow-y: auto;
  
  .dark & {
    background: #1f2937;
    border-color: #374151;
  }
}

.dropdown-header {
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #f9fafb;
    
    .dark & {
      background: #374151;
    }
  }
  
  &.active {
    background: #eff6ff;
    
    .dark & {
      background: #1e3a8a;
    }
    
    .item-name {
      color: #3b82f6;
      font-weight: 500;
    }
  }
}

.item-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  
  .dark & {
    background: #4b5563;
  }
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  color: #374151;
  
  .dark & {
    color: #e5e5e5;
  }
}

.item-desc {
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.check {
  color: #3b82f6;
  font-weight: bold;
}

.dropdown-footer {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  
  .dark & {
    border-color: #374151;
  }
  
  button {
    width: 100%;
    padding: 10px;
    border: 1px dashed #d1d5db;
    border-radius: 8px;
    background: transparent;
    color: #6b7280;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
    
    &:hover {
      border-color: #3b82f6;
      color: #3b82f6;
      background: #eff6ff;
    }
    
    .dark & {
      border-color: #4b5563;
      color: #9ca3af;
      
      &:hover {
        border-color: #3b82f6;
        color: #3b82f6;
        background: #1e3a8a;
      }
    }
  }
}

// 动画
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>