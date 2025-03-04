// 预定义的颜色映射
export const labelColors: { [key: string]: string } = {
  person: '#FF3B30',      // 红色
  bicycle: '#FF9500',     // 橙色
  car: '#FFCC00',         // 黄色
  motorcycle: '#4CD964',  // 绿色
  airplane: '#5856D6',    // 紫色
  bus: '#007AFF',         // 蓝色
  train: '#5AC8FA',       // 浅蓝色
  truck: '#E85D75',       // 粉红色
  boat: '#4A90E2',        // 天蓝色
  // ... 可以继续添加更多类别的颜色
}

// 默认颜色列表，用于没有预定义颜色的标签
const defaultColors = [
  '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5856D6',
  '#007AFF', '#5AC8FA', '#E85D75', '#4A90E2', '#BF5AF2'
]

// 用于记录已分配的颜色
const usedColors = new Map<string, string>()
let colorIndex = 0

export const getLabelColor = (label: string): string => {
  // 如果标签已有预定义颜色，直接返回
  if (labelColors[label]) {
    return labelColors[label]
  }
  
  // 如果标签已被分配颜色，返回已分配的颜色
  if (usedColors.has(label)) {
    return usedColors.get(label)!
  }
  
  // 分配新颜色
  const color = defaultColors[colorIndex % defaultColors.length]
  colorIndex++
  usedColors.set(label, color)
  return color
} 