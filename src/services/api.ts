import { Annotation } from '../types/project'

interface AutoAnnotateResponse {
  annotations: Annotation[]
}

export const ApiService = {
  saveAnnotations: async (imageId: string, annotations: Annotation[]) => {
    // 模拟保存到后端
    console.log('保存标注:', imageId, annotations)
    return Promise.resolve()
  },

  exportAnnotations: async (projectId: string) => {
    // 模拟导出功能
    console.log('导出项目:', projectId)
    return Promise.resolve({ url: '#' })
  },

  autoAnnotate: async (imageId: string): Promise<AutoAnnotateResponse> => {
    // 模拟自动标注
    // 在实际项目中，这里应该调用后端 API
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟延迟
    
    // 模拟返回一些随机标注
    const annotations: Annotation[] = [
      {
        id: 'auto_1',
        imageId,
        bbox: [100, 100, 200, 200],
        label: '自动标注_1',
        confidence: 0.95,
      },
      {
        id: 'auto_2',
        imageId,
        bbox: [300, 300, 150, 150],
        label: '自动标注_2',
        confidence: 0.88,
      },
    ]

    return { annotations }
  }
} 