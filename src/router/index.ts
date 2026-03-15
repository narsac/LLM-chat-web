/**
 * 路由配置
 * 功能：路由定义、权限守卫、懒加载
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import type { RouteRecordRaw } from 'vue-router'

// 路由定义
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true, title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { public: true, title: '注册' }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/chat',
    children: [
      {
        path: 'chat',
        name: 'Chat',
        component: () => import('@/views/ChatView.vue'),
        meta: { title: '对话', keepAlive: true }
      },
      {
        path: 'chat/:sessionId',
        name: 'ChatSession',
        component: () => import('@/views/ChatView.vue'),
        meta: { title: '对话', keepAlive: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/ProfileView.vue'),
        meta: { title: '个人中心' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/SettingsView.vue'),
        meta: { title: '系统设置' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

// ==================== 路由守卫 ====================

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 设置页面标题
  document.title = `${to.meta.title || 'AI对话'} - LLM Chat`
  
  // 1. 检查是否需要登录
  const isPublicRoute = to.meta.public === true
  
  if (!isPublicRoute && !userStore.isLoggedIn) {
    // 未登录且访问需要权限的页面，重定向到登录页
    next({ 
      name: 'Login', 
      query: { redirect: to.fullPath }  // 保存原目标路径
    })
    return
  }
  
  // 2. 已登录用户访问登录/注册页，重定向到首页
  if (isPublicRoute && userStore.isLoggedIn && 
      (to.name === 'Login' || to.name === 'Register')) {
    next({ name: 'Chat' })
    return
  }
  
  // 3. 尝试恢复登录状态（刷新页面后）
  if (!isPublicRoute && !userStore.userInfo) {
    try {
      await userStore.restoreSession()
    } catch {
      // 恢复失败，登出并跳转登录页
      userStore.logout()
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
  }
  
  next()
})

// 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
})

export default router