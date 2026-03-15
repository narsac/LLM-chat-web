<!-- 
  登录页面
  功能：账号密码登录、表单验证、记住我、错误提示、跳转注册
-->
<template>
  <div class="login-page">
    <div class="login-container">
      <!-- 左侧：品牌展示 -->
      <div class="brand-section">
        <div class="brand-content">
          <div class="logo">🤖</div>
          <h1>LLM Chat</h1>
          <p>智能对话，触手可及</p>
          <div class="features">
            <div class="feature">
              <span class="icon">⚡</span>
              <span>支持多种大模型</span>
            </div>
            <div class="feature">
              <span class="icon">🔒</span>
              <span>本地隐私保护</span>
            </div>
            <div class="feature">
              <span class="icon">💬</span>
              <span>实时流式响应</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧：登录表单 -->
      <div class="form-section">
        <div class="form-container">
          <h2>欢迎回来</h2>
          <p class="subtitle">登录您的账号继续对话</p>
          
          <!-- 错误提示 -->
          <div v-if="userStore.loginError" class="error-alert">
            <span class="icon">⚠️</span>
            {{ userStore.loginError }}
          </div>
          
          <form @submit.prevent="handleLogin">
            <!-- 用户名 -->
            <div class="form-group">
              <label>用户名或邮箱</label>
              <div class="input-wrapper">
                <span class="input-icon">👤</span>
                <input
                  v-model="form.username"
                  type="text"
                  placeholder="请输入用户名"
                  :disabled="userStore.isLoading"
                  @blur="validateField('username')"
                >
              </div>
              <span v-if="errors.username" class="error-text">{{ errors.username }}</span>
            </div>
            
            <!-- 密码 -->
            <div class="form-group">
              <label>
                密码
                <a href="#" class="forgot-link" @click.prevent="forgotPassword">忘记密码？</a>
              </label>
              <div class="input-wrapper">
                <span class="input-icon">🔒</span>
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码"
                  :disabled="userStore.isLoading"
                  @blur="validateField('password')"
                >
                <button 
                  type="button" 
                  class="toggle-password"
                  @click="showPassword = !showPassword"
                >
                  {{ showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
              <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
            </div>
            
            <!-- 记住我 -->
            <div class="form-group remember">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.remember">
                <span class="checkmark"></span>
                <span>记住我（7天）</span>
              </label>
            </div>
            
            <!-- 登录按钮 -->
            <button 
              type="submit" 
              class="btn-login"
              :disabled="!isValid || userStore.isLoading"
            >
              <span v-if="userStore.isLoading" class="loading-spinner"></span>
              <span>{{ userStore.isLoading ? '登录中...' : '立即登录' }}</span>
            </button>
          </form>
          
          <!-- 第三方登录 -->
          <div class="divider">
            <span>或使用以下方式</span>
          </div>
          
          <div class="social-login">
            <button class="btn-social github" @click="socialLogin('github')">
              <span>GitHub</span>
            </button>
            <button class="btn-social google" @click="socialLogin('google')">
              <span>Google</span>
            </button>
          </div>
          
          <!-- 注册链接 -->
          <p class="register-link">
            还没有账号？
            <router-link to="/register">立即注册</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import type { LoginForm } from '@/types/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 表单数据
const form = reactive<LoginForm>({
  username: '',
  password: '',
  remember: false
})

const showPassword = ref(false)
const errors = reactive({
  username: '',
  password: ''
})

// 表单验证
const validateField = (field: keyof typeof errors) => {
  errors[field] = ''
  
  if (field === 'username') {
    if (!form.username.trim()) {
      errors.username = '请输入用户名'
    } else if (form.username.length < 3) {
      errors.username = '用户名至少3个字符'
    }
  }
  
  if (field === 'password') {
    if (!form.password) {
      errors.password = '请输入密码'
    } else if (form.password.length < 6) {
      errors.password = '密码至少6位'
    }
  }
}

const isValid = computed(() => {
  return form.username.trim().length >= 3 && 
         form.password.length >= 6 &&
         !errors.username && 
         !errors.password
})

// 登录处理
const handleLogin = async () => {
  // 验证所有字段
  validateField('username')
  validateField('password')
  
  if (!isValid.value) return
  
  const success = await userStore.login(form)
  
  if (success) {
    // 登录成功，跳转到原目标页面或首页
    const redirect = route.query.redirect as string
    router.push(redirect || '/chat')
  }
}

// 第三方登录
const socialLogin = (provider: string) => {
  alert(`${provider}登录功能开发中...`)
}

// 忘记密码
const forgotPassword = () => {
  alert('请联系管理员重置密码')
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-container {
  display: flex;
  width: 100%;
  max-width: 1200px;
  margin: auto;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  min-height: 600px;
}

// 左侧品牌区
.brand-section {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  
  .brand-content {
    text-align: center;
  }
  
  .logo {
    font-size: 80px;
    margin-bottom: 20px;
  }
  
  h1 {
    font-size: 48px;
    margin: 0 0 16px 0;
    font-weight: 700;
  }
  
  p {
    font-size: 20px;
    opacity: 0.9;
    margin-bottom: 40px;
  }
}

.features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}

.feature {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  
  .icon {
    font-size: 24px;
  }
}

// 右侧表单区
.form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: #fafafa;
}

.form-container {
  width: 100%;
  max-width: 400px;
  
  h2 {
    font-size: 32px;
    margin: 0 0 8px 0;
    color: #1f2937;
  }
  
  .subtitle {
    color: #6b7280;
    margin-bottom: 32px;
  }
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  margin-bottom: 20px;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
  
  label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
  }
}

.forgot-link {
  font-size: 13px;
  color: #3b82f6;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  font-size: 16px;
  color: #9ca3af;
}

input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
}

.toggle-password {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
}

.error-text {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  color: #ef4444;
}

// 记住我
.remember {
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-weight: normal;
    
    input {
      display: none;
    }
    
    .checkmark {
      width: 18px;
      height: 18px;
      border: 2px solid #d1d5db;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      
      &::after {
        content: '✓';
        color: white;
        font-size: 12px;
        display: none;
      }
    }
    
    input:checked + .checkmark {
      background: #3b82f6;
      border-color: #3b82f6;
      
      &::after {
        display: block;
      }
    }
  }
}

// 登录按钮
.btn-login {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// 分隔线
.divider {
  position: relative;
  text-align: center;
  margin: 24px 0;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: #e5e7eb;
  }
  
  span {
    position: relative;
    background: #fafafa;
    padding: 0 16px;
    color: #9ca3af;
    font-size: 14px;
  }
}

// 第三方登录
.social-login {
  display: flex;
  gap: 12px;
}

.btn-social {
  flex: 1;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
  
  &.github:hover {
    background: #24292e;
    color: white;
    border-color: #24292e;
  }
  
  &.google:hover {
    background: #ea4335;
    color: white;
    border-color: #ea4335;
  }
}

// 注册链接
.register-link {
  text-align: center;
  margin-top: 24px;
  color: #6b7280;
  font-size: 14px;
  
  a {
    color: #3b82f6;
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    margin: 0;
    border-radius: 0;
    min-height: 100vh;
  }
  
  .brand-section {
    padding: 40px 20px;
    
    .logo {
      font-size: 60px;
    }
    
    h1 {
      font-size: 32px;
    }
    
    .features {
      display: none;
    }
  }
  
  .form-section {
    padding: 40px 20px;
  }
}
</style>