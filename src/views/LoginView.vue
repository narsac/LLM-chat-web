<template>
  <div class="login-view">
    <div class="login-container">
      <!-- 标题 -->
      <h1 class="title">欢迎回来</h1>
      <p class="subtitle">请登录你的账号继续</p>
      
      <!-- 登录表单 -->
      <form @submit.prevent="handleLogin" class="login-form">
        <!-- 邮箱输入 -->
        <div class="form-group">
          <input
            type="email"
            v-model="email"
            required
            placeholder="电子邮箱"
            :class="{ 'error': emailError }"
            @blur="validateEmail"
          />
          <span v-if="emailError" class="error-message">{{ emailError }}</span>
        </div>

        <!-- 密码输入 -->
        <div class="form-group">
          <div class="password-wrapper">
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              required
              placeholder="密码"
              :class="{ 'error': passwordError }"
              @blur="validatePassword"
            />
          </div>
          <span v-if="passwordError" class="error-message">{{ passwordError }}</span>
        </div>

        <!-- 登录按钮 -->
        <button 
          type="submit" 
          class="login-btn"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <span>{{ isLoading ? '登录中...' : '登录' }}</span>
        </button>

        <!-- 注册链接 -->
        <div class="signup-link">
          还没有账号？ <a href="#">立即注册</a>
        </div>

        <!-- 演示提示 -->
        <div class="demo-hint">
          演示账号：任意邮箱和密码即可登录
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const email = ref<string>('')
const password = ref<string>('')
const showPassword = ref<boolean>(false)
const isLoading = ref<boolean>(false)

const emailError = ref<string>('')
const passwordError = ref<string>('')

const validateEmail = (): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email.value) {
    emailError.value = '邮箱不能为空'
  } else if (!emailRegex.test(email.value)) {
    emailError.value = '请输入有效的邮箱地址'
  } else {
    emailError.value = ''
  }
}

const validatePassword = (): void => {
  if (!password.value) {
    passwordError.value = '密码不能为空'
  } else if (password.value.length < 6) {
    passwordError.value = '密码长度至少为6位'
  } else {
    passwordError.value = ''
  }
}

const handleLogin = async (): Promise<void> => {
  validateEmail()
  validatePassword()
  
  if (emailError.value || passwordError.value) return
  
  isLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    await userStore.login(email.value, password.value)
    router.push('/')
  } catch (error) {
    alert('登录失败：' + (error as Error).message)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 360px;
  padding: 40px 24px;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 32px;
}

.logo-icon {
  font-size: 32px;
}

.logo-text {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
}

/* 标题 */
.title {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  text-align: center;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-bottom: 32px;
}

/* 表单 */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  background: #fafafa;
}

.form-group input:focus {
  outline: none;
  border-color: #10a37f;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(16, 163, 127, 0.1);
}

.form-group input.error {
  border-color: #dc2626;
  background: #fff5f5;
}

/* 密码输入框包装器 */
.password-wrapper {
  position: relative;
}

.password-wrapper input {
  padding-right: 44px;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #999;
  padding: 4px;
}

.password-toggle:hover {
  color: #666;
}

/* 错误信息 */
.error-message {
  font-size: 12px;
  color: #dc2626;
  margin-left: 4px;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  padding: 12px;
  background: #10a37f;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.login-btn:hover:not(:disabled) {
  background: #0e8c6c;
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 加载动画 */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 注册链接 */
.signup-link {
  text-align: center;
  font-size: 14px;
  color: #666;
  margin-top: 16px;
}

.signup-link a {
  color: #10a37f;
  text-decoration: none;
  font-weight: 500;
}

.signup-link a:hover {
  text-decoration: underline;
}

/* 演示提示 */
.demo-hint {
  margin-top: 24px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
  text-align: center;
  font-size: 12px;
  color: #666;
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .login-view {
    background: #1a1a1a;
  }
  
  .logo-text {
    color: #e5e5e5;
  }
  
  .title {
    color: #e5e5e5;
  }
  
  .subtitle {
    color: #999;
  }
  
  .form-group input {
    background: #2d2d2d;
    border-color: #404040;
    color: #e5e5e5;
  }
  
  .form-group input:focus {
    background: #333;
    border-color: #10a37f;
  }
  
  .demo-hint {
    background: #2d2d2d;
    color: #999;
  }
  
  .signup-link {
    color: #999;
  }
}
</style>