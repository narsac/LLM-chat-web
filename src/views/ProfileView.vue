<!-- 
  个人中心页面
  功能：信息展示、编辑资料、修改密码、使用统计
-->
<template>
  <div class="profile-page">
    <div class="profile-container">
      <!-- 左侧：用户信息卡片 -->
      <div class="profile-card">
        <div class="card-header">
          <div class="avatar-section">
            <img :src="userStore.avatar" alt="avatar" class="avatar">
            <button class="btn-change-avatar" @click="changeAvatar">
              📷
            </button>
          </div>
          <h2>{{ userStore.displayName }}</h2>
          <p class="role-badge" :class="userStore.userInfo?.role">
            {{ userStore.userInfo?.role === 'admin' ? '管理员' : '普通用户' }}
          </p>
        </div>
        
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalChats }}</div>
            <div class="stat-label">对话次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalMessages }}</div>
            <div class="stat-label">消息总数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalTokens }}</div>
            <div class="stat-label">Token消耗</div>
          </div>
        </div>
        
        <div class="member-info">
          <div class="info-row">
            <span class="label">注册时间</span>
            <span class="value">{{ formatDate(userStore.userInfo?.createdAt) }}</span>
          </div>
          <div class="info-row">
            <span class="label">最后登录</span>
            <span class="value">{{ formatDate(userStore.userInfo?.lastLoginAt) }}</span>
          </div>
        </div>
      </div>
      
      <!-- 右侧：编辑区域 -->
      <div class="edit-section">
        <div class="section-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.key"
            class="tab-btn"
            :class="{ 'active': currentTab === tab.key }"
            @click="currentTab = tab.key"
          >
            {{ tab.name }}
          </button>
        </div>
        
        <!-- 基本信息 -->
        <div v-if="currentTab === 'info'" class="tab-content">
          <form @submit.prevent="saveProfile">
            <div class="form-group">
              <label>用户名</label>
              <input v-model="editForm.username" disabled type="text">
              <span class="hint">用户名不可修改</span>
            </div>
            
            <div class="form-group">
              <label>昵称</label>
              <input v-model="editForm.nickname" type="text" placeholder="设置显示名称">
            </div>
            
            <div class="form-group">
              <label>邮箱</label>
              <input v-model="editForm.email" type="email">
            </div>
            
            <div class="form-group">
              <label>个人简介</label>
              <textarea 
                v-model="editForm.bio" 
                rows="4"
                placeholder="介绍一下自己..."
              ></textarea>
            </div>
            
            <button type="submit" class="btn-save" :disabled="saving">
              {{ saving ? '保存中...' : '保存修改' }}
            </button>
          </form>
        </div>
        
        <!-- 修改密码 -->
        <div v-if="currentTab === 'password'" class="tab-content">
          <form @submit.prevent="changePassword">
            <div class="form-group">
              <label>当前密码</label>
              <input v-model="passwordForm.oldPassword" type="password">
            </div>
            
            <div class="form-group">
              <label>新密码</label>
              <input v-model="passwordForm.newPassword" type="password">
              <div class="password-strength" v-if="passwordForm.newPassword">
                <div class="strength-bar">
                  <div 
                    class="strength-fill" 
                    :style="{ width: passwordStrength.width, background: passwordStrength.color }"
                  ></div>
                </div>
                <span :style="{ color: passwordStrength.color }">
                  {{ passwordStrength.text }}
                </span>
              </div>
            </div>
            
            <div class="form-group">
              <label>确认新密码</label>
              <input v-model="passwordForm.confirmPassword" type="password">
              <span v-if="passwordError" class="error-text">{{ passwordError }}</span>
            </div>
            
            <button type="submit" class="btn-save" :disabled="changingPassword">
              {{ changingPassword ? '修改中...' : '修改密码' }}
            </button>
          </form>
        </div>
        
        <!-- 偏好设置 -->
        <div v-if="currentTab === 'preferences'" class="tab-content">
          <div class="preference-list">
            <div class="preference-item">
              <div>
                <h4>暗黑模式</h4>
                <p>切换深色主题保护眼睛</p>
              </div>
              <label class="switch">
                <input 
                  type="checkbox" 
                  :checked="settingsStore.isDarkMode"
                  @change="settingsStore.toggleDarkMode"
                >
                <span class="slider"></span>
              </label>
            </div>
            
            <div class="preference-item">
              <div>
                <h4>消息通知</h4>
                <p>接收新消息浏览器通知</p>
              </div>
              <label class="switch">
                <input type="checkbox" v-model="preferences.notifications">
                <span class="slider"></span>
              </label>
            </div>
            
            <div class="preference-item">
              <div>
                <h4>自动保存</h4>
                <p>自动保存对话到本地</p>
              </div>
              <label class="switch">
                <input type="checkbox" v-model="preferences.autoSave" checked>
                <span class="slider"></span>
              </label>
            </div>
            
            <div class="preference-item">
              <div>
                <h4>语言</h4>
                <p>界面显示语言</p>
              </div>
              <select v-model="preferences.language">
                <option value="zh">简体中文</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          
          <button class="btn-save" @click="savePreferences">
            保存偏好
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useChatStore } from '@/stores/chatStore'

const userStore = useUserStore()
const settingsStore = useSettingsStore()
const chatStore = useChatStore()

const tabs = [
  { key: 'info', name: '基本信息' },
  { key: 'password', name: '修改密码' },
  { key: 'preferences', name: '偏好设置' }
]

const currentTab = ref('info')
const saving = ref(false)
const changingPassword = ref(false)
const passwordError = ref('')

// 编辑表单
const editForm = reactive({
  username: userStore.userInfo?.username || '',
  nickname: userStore.userInfo?.nickname || '',
  email: userStore.userInfo?.email || '',
  bio: ''
})

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 偏好设置
const preferences = reactive({
  notifications: false,
  autoSave: true,
  language: 'zh'
})

// 使用统计
const stats = computed(() => {
  const sessions = chatStore.sessions
  const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0)
  const totalTokens = sessions.reduce((sum, s) => 
    sum + s.messages.reduce((mSum, m) => mSum + (m.tokens?.total || 0), 0), 0
  )
  
  return {
    totalChats: sessions.length,
    totalMessages,
    totalTokens: totalTokens > 1000 ? `${(totalTokens/1000).toFixed(1)}k` : totalTokens
  }
})

// 密码强度
const passwordStrength = computed(() => {
  const pwd = passwordForm.newPassword
  if (!pwd) return { width: '0%', color: '#e5e7eb', text: '' }
  
  let score = 0
  if (pwd.length >= 8) score++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[^a-zA-Z0-9]/.test(pwd)) score++
  
  const levels = [
    { width: '25%', color: '#ef4444', text: '弱' },
    { width: '50%', color: '#f59e0b', text: '一般' },
    { width: '75%', color: '#3b82f6', text: '良好' },
    { width: '100%', color: '#10b981', text: '强' }
  ]
  
  return levels[score - 1] || levels[0]
})

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const saveProfile = async () => {
  saving.value = true
  await userStore.updateUserInfo({
    nickname: editForm.nickname,
    email: editForm.email
  })
  saving.value = false
  alert('保存成功！')
}

const changePassword = async () => {
  passwordError.value = ''
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = '两次输入的密码不一致'
    return
  }
  
  if (passwordForm.newPassword.length < 8) {
    passwordError.value = '新密码至少8位'
    return
  }
  
  changingPassword.value = true
  try {
    await userStore.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
    alert('密码修改成功！请重新登录')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error: any) {
    passwordError.value = error.message
  }
  changingPassword.value = false
}

const savePreferences = () => {
  // 保存到本地存储或发送到服务器
  console.log('保存偏好:', preferences)
  alert('偏好设置已保存')
}

const changeAvatar = () => {
  alert('头像上传功能开发中...')
}

onMounted(() => {
  // 初始化表单数据
  if (userStore.userInfo) {
    editForm.username = userStore.userInfo.username
    editForm.nickname = userStore.userInfo.nickname || ''
    editForm.email = userStore.userInfo.email
  }
})
</script>

<style scoped lang="scss">
.profile-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.profile-container {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

// 左侧卡片
.profile-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  height: fit-content;
  
  .dark & {
    background: #1f2937;
  }
}

.card-header {
  text-align: center;
  margin-bottom: 24px;
  
  .avatar-section {
    position: relative;
    display: inline-block;
    margin-bottom: 16px;
    
    .avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #f3f4f6;
      
      .dark & {
        border-color: #374151;
      }
    }
    
    .btn-change-avatar {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: #3b82f6;
      color: white;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        background: #2563eb;
      }
    }
  }
  
  h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
    color: #1f2937;
    
    .dark & {
      color: #e5e5e5;
    }
  }
  
  .role-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
}