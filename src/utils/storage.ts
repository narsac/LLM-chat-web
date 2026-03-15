/**
 * 本地存储封装
 * 支持localStorage和内存回退
 */
export class Storage {
  private memoryStore: Map<string, string> = new Map()
  private useMemory: boolean = false

  constructor() {
    // 检测是否支持localStorage
    try {
      const test = '__test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
    } catch (e) {
      this.useMemory = true
      console.warn('localStorage不可用，使用内存存储')
    }
  }

  get<T>(key: string): T | null {
    try {
      const data = this.useMemory 
        ? this.memoryStore.get(key) 
        : localStorage.getItem(key)
      
      if (!data) return null
      return JSON.parse(data) as T
    } catch (e) {
      console.error('Storage get error:', e)
      return null
    }
  }

  set(key: string, value: unknown): boolean {
    try {
      const data = JSON.stringify(value)
      if (this.useMemory) {
        this.memoryStore.set(key, data)
      } else {
        localStorage.setItem(key, data)
      }
      return true
    } catch (e) {
      console.error('Storage set error:', e)
      return false
    }
  }

  remove(key: string): void {
    if (this.useMemory) {
      this.memoryStore.delete(key)
    } else {
      localStorage.removeItem(key)
    }
  }

  clear(): void {
    if (this.useMemory) {
      this.memoryStore.clear()
    } else {
      localStorage.clear()
    }
  }
}

// 导出单例
export const storage = new Storage()