<!-- 
  注册页面
  功能：表单验证、密码强度、条款同意、自动登录
-->
<template>
  <div class="register-page">
    <div class="register-container">
      <div class="form-section">
        <div class="form-container">
          <h2>创建账号</h2>
          <p class="subtitle">开始您的AI对话之旅</p>
          
          <!-- 步骤指示器 -->
          <div class="steps">
            <div class="step" :class="{ 'active': currentStep >= 1, 'current': currentStep === 1 }">
              <span class="step-num">1</span>
              <span class="step-label">基本信息</span>
            </div>
            <div class="step-line"></div>
            <div class="step" :class="{ 'active': currentStep >= 2, 'current': currentStep === 2 }">
              <span class="step-num">2</span>
              <span class="step-label">设置密码</span>
            </div>
            <div class="step-line"></div>
            <div class="step" :class="{ 'active': currentStep >= 3, 'current': currentStep === 3 }">
              <span class="step-num">3</span>
              <span class="step-label">完成</span>
            </div>
          </div>
          
          <!-- 错误提示 -->
          <div v-if="error" class="error-alert">
            <span class="icon">⚠️</span>
            {{ error }}
          </div>
          
          <!-- 步骤1：基本信息 -->
          <form v-if="currentStep === 1" @submit.prevent="nextStep">
            <div class="form-group">
              <label>用户名 <span class="required">*</span></label>
              <input
                v-model="form.username"
                type="text"
                placeholder="3-20个字符，支持字母数字"
                @blur="validateUsername"
              >
              <span v-if="errors.username" class="error-text">{{ errors.username }}</span>
            </div>
            
            <div class="form-group">
              <label>邮箱 <span class="required">*</span></label>
              <input
                v-model="form.email"
                type="email"
                placeholder="your@email.com"
                @blur="validateEmail"
              >
              <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
            </div>
            
            <div class="form-group">
              <label>昵称（可选）</label>
              <input
                v-model="form.nickname"
                type="text"
                placeholder="显示名称"
              >
            </div>
            
            <button type="submit" class="btn-primary" :disabled="!step1Valid">
              下一步
            </button>
          </form>
          
          <!-- 步骤2：设置密码 -->
          <form v-if="currentStep === 2" @submit.prevent="handleRegister">
            <div class="form-group">
              <label>密码 <span class="required">*</span></label>
              <div class="password-input">
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="至少8位，包含字母和数字"
                  @input="checkPasswordStrength"
                >
                <button type="button" class="toggle-btn" @click="showPassword = !showPassword">
                  {{ showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
              
              <!-- 密码强度 -->
              <div class="password-strength" v-if="form.password">
                <div class="strength-bar">
                  <div 
                    class="strength-fill" 
                    :class="passwordStrength"
                    :style="{ width: strengthWidth }"
                  ></div>
                </div>
                <span class="strength-text">{{ strengthText }}</span>
              </div>
              
              <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
            </div>
            
            <div class="form-group">
              <label>确认密码 <span class="required">*</span></label>
              <input
                v-model="form.confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                placeholder="再次输入密码"
                @blur="validateConfirmPassword"
              >
              <span v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</span>
            </div>
            
            <div class="form-group terms">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.agreeTerms">
                <span class="checkmark"></span>
                <span>
                  我已阅读并同意
                  <a href="#" @click.prevent="showTerms">服务条款</a>
                  和
                  <a href="#" @click.prevent="showPrivacy">隐私政策</a>
                </span>
              </label>
              <span v-if="errors.terms" class="error-text">{{ errors.terms }}</span>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn-secondary" @click="currentStep = 1">
                上一步
              </button>
              <button 
                type="submit" 
                class="btn-primary"
                :disabled="!step2Valid || isLoading"
              >
                <span v-if="isLoading" class="loading-spinner"></span>
                <span>{{ isLoading ? '注册中...' : '创建账号' }}</span>
              </button>
            </div>
          </form>
          
          <!-- 步骤3：完成 -->
          <div v-if="currentStep === 3" class="success-section">
            <div class="success-icon">🎉</div>
            <h3>注册成功！</h3>
            <p>正在为您登录...</p>
          </div>
          
          <p class="login-link">
            已有账号？
            <router-link to="/login">立即登录</router-link>
          </p>
        </div>
      </div>
      
      <!-- 右侧装饰 -->
      <div class="decoration-section">
        <div class="floating-cards">
          <div class="card card-1">💬 AI对话</div>
          <div class="card card-2">🧠 深度思考</div>
          <div class="card card-3">⚡ 实时响应</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import type { RegisterForm } from '@/types/user'

const router = useRouter()
const userStore = useUserStore()

const currentStep = ref(1)
const isLoading = ref(false)
const error = ref('')
const showPassword = ref(false)

const form = reactive<RegisterForm>({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  nickname: '',
  agreeTerms: false
})

const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  terms: ''
})

// 密码强度
const passwordStrength = ref('')
const strengthWidth = ref('0%')
const strengthText = ref('')

const checkPasswordStrength = () => {
  const pwd = form.password
  let score = 0
  
  if (pwd.length >= 8) score++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[^a-zA-Z0-9]/.test(pwd)) score++
  
  const levels = ['weak', 'fair', 'good', 'strong']
  const texts = ['弱', '一般', '良好', '强']
  const widths = ['25%', '50%', '75%', '100%']
  
  passwordStrength.value = levels[score - 1] || 'weak'
  strengthWidth.value = widths[score - 1] || '25%'
  strengthText.value = texts[score - 1] || '弱'
}

// 验证
const validateUsername = () => {
  errors.username = ''
  if (!form.username) {
    errors.username = '请输入用户名'
  } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) {
    errors.username = '3-20个字符，仅限字母数字下划线'
  }
}

const validateEmail = () => {
  errors.email = ''
  if (!form.email) {
    errors.email = '请输入邮箱'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = '邮箱格式不正确'
  }
}

const validateConfirmPassword = () => {
  errors.confirmPassword = ''
  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = '两次输入的密码不一致'
  }
}

const step1Valid = computed(() => {
  return form.username && form.email && 
         !errors.username && !errors.email
})

const step2Valid = computed(() => {
  return form.password.length >= 8 && 
         form.confirmPassword === form.password &&
         form.agreeTerms
})

const nextStep = () => {
  validateUsername()
  validateEmail()
  if (step1Valid.value) {
    currentStep.value = 2
  }
}

const handleRegister = async () => {
  if (!step2Valid.value) return
  
  isLoading.value = true
  error.value = ''
  
  const success = await userStore.register(form)
  
  if (success) {
    currentStep.value = 3
    // 自动跳转
    setTimeout(() => {
      router.push('/chat')
    }, 1500)
  } else {
    error.value = userStore.loginError || '注册失败'
  }
  
  isLoading.value = false
}

const showTerms = () => alert('服务条款内容...')
const showPrivacy = () => alert('隐私政策内容...')
</script>

<style scoped lang="scss">
.register-page {
  min-height: 100vh;
  display: flex;
  background: #f3f4f6;
}

.register-container {
  display: flex;
  width: 100%;
  max-width: 1000px;
  margin: auto;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.1);
  min-height: 700px;
}

.form-section {
  flex: 1;
  padding: 60px;
  display: flex;
  align-items: center;
}

.form-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  
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

// 步骤指示器
.steps {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  
  .step-num {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e5e7eb;
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s;
  }
  
  .step-label {
    font-size: 12px;
    color: #9ca3af;
  }
  
  &.active .step-num {
    background: #3b82f6;
    color: white;
  }
  
  &.current .step-num {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
  }
}

.step-line {
  flex: 1;
  height: 2px;
  background: #e5e7eb;
  margin: 0 16px;
  position: relative;
  top: -14px;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fee2e2;
  border-radius: 8px;
  color: #991b1b;
  margin-bottom: 20px;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
  
  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
    
    .required {
      color: #ef4444;
    }
  }
  
  input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    font-size: 15px;
    transition: all 0.2s;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
}

.password-input {
  position: relative;
  
  input {
    padding-right: 40px;
  }
  
  .toggle-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
  }
}

.password-strength {
  margin-top: 8px;
  
  .strength-bar {
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
  }
  
  .strength-fill {
    height: 100%;
    transition: all 0.3s;
    
    &.weak { background: #ef4444; }
    &.fair { background: #f59e0b; }
    &.good { background: #3b82f6; }
    &.strong { background: #10b981; }
  }
  
  .strength-text {
    font-size: 12px;
    color: #6b7280;
    margin-top: 4px;
    display: block;
  }
}

.terms {
  .checkbox-label {
    display: flex;
    align-items: flex-start;
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
      flex-shrink: 0;
      margin-top: 2px;
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
    
    a {
      color: #3b82f6;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  
  button {
    flex: 1;
    padding: 14px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
}

.btn-secondary {
  border: 1px solid #e5e7eb;
  background: white;
  color: #374151;
  
  &:hover {
    background: #f9fafb;
  }
}

.btn-primary {
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  
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

// 成功页面
.success-section {
  text-align: center;
  padding: 40px 0;
  
  .success-icon {
    font-size: 64px;
    margin-bottom: 16px;
    animation: bounce 1s infinite;
  }
  
  h3 {
    font-size: 24px;
    margin: 0 0 8px 0;
    color: #1f2937;
  }
  
  p {
    color: #6b7280;
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.login-link {
  text-align: center;
  margin-top: 24px;
  color: #6b7280;
  font-size: 14px;
  
  a {
    color: #3b82f6;
    text-decoration: none;
    font-weight: 500;
  }
}

// 右侧装饰
.decoration-section {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.floating-cards {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.card {
  background: rgba(255,255,255,0.95);
  padding: 20px 32px;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  animation: float 3s ease-in-out infinite;
  
  &.card-1 { animation-delay: 0s; }
  &.card-2 { animation-delay: 0.5s; }
  &.card-3 { animation-delay: 1s; }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(2deg); }
}

// 响应式
@media (max-width: 768px) {
  .decoration-section {
    display: none;
  }
  
  .form-section {
    padding: 40px 20px;
  }
}
</style>