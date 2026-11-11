let pending = null

export function loadEcharts() {
  if (window.echarts) {
    return Promise.resolve(window.echarts)
  }
  if (pending) {
    return pending
  }
  pending = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = '/assets/echarts.min.js'
    script.async = true
    script.onload = () => resolve(window.echarts)
    script.onerror = () => reject(new Error('ECharts 加载失败'))
    document.head.appendChild(script)
  })
  return pending
}
