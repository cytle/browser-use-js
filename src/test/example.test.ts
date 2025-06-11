/**
 * 示例测试文件
 * 展示如何在 browser-use-js 项目中编写测试
 */

import { describe, it, expect, vi } from 'vitest'

describe('示例测试套件', () => {
  it('应该能够运行基本测试', () => {
    expect(1 + 1).toBe(2)
  })

  it('应该能够测试 DOM 操作', () => {
    // 创建一个测试元素
    const element = document.createElement('div')
    element.textContent = 'Hello World'
    document.body.appendChild(element)

    // 验证元素是否正确添加
    expect(document.body.children.length).toBe(1)
    expect(element.textContent).toBe('Hello World')
  })

  it('应该能够模拟函数', () => {
    const mockFn = vi.fn()
    mockFn('test')

    expect(mockFn).toHaveBeenCalledWith('test')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('应该能够测试异步操作', async () => {
    const asyncFn = async (value: string) => {
      return new Promise<string>((resolve) => {
        setTimeout(() => resolve(`processed: ${value}`), 10)
      })
    }

    const result = await asyncFn('test')
    expect(result).toBe('processed: test')
  })

  it('应该能够测试浏览器 API', () => {
    // 测试 window 对象
    expect(window.innerWidth).toBe(1024)
    expect(window.innerHeight).toBe(768)

    // 测试模拟的 matchMedia
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    expect(mediaQuery.matches).toBe(false)
  })
})
