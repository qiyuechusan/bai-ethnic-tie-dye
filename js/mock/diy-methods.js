/**
 * 后端未启动时的演示数据，字段结构与 GET /api/diy/methods 返回一致。
 * 只有用户主动点击“使用演示数据”时才会使用。
 */
export const mockDiyMethods = [
  {
    id: 1,
    code: 'spiral',
    name: '螺旋绞缬',
    subtitle: '星芒螺旋',
    description: '从布面中心提起并旋转扎紧，染液沿折痕渗入，展开后形成放射状螺旋。',
    patternType: 'spiral',
    difficulty: 2,
    params: { rings: 14, spacing: 1.04, gap: 9, wobble: 0.06, core: 0.05, spokes: 6, twist: 0.18 },
    previewColors: ['#f7f3e8', '#c9d27c', '#7e9a70', '#2d6d8e', '#0b3863'],
    sortOrder: 10,
  },
  {
    id: 2,
    code: 'stitch',
    name: '缝扎蝴蝶',
    subtitle: '蝶翼缝线',
    description: '用针线沿蝴蝶轮廓缝合并抽紧，线迹阻挡染液，留下细腻的蝶翼纹样。',
    patternType: 'stitch',
    difficulty: 3,
    params: { motif: 'butterfly', cellWidth: 150, cellHeight: 170, gap: 6, angle: -18, rows: 6, cols: 5 },
    previewColors: ['#f7f3e8', '#d7dc9a', '#6f9588', '#24648e', '#082a4c'],
    sortOrder: 20,
  },
  {
    id: 3,
    code: 'accordion',
    name: '风琴折叠',
    subtitle: '层叠水波',
    description: '将织物反复折叠成风琴状，再用线绳分段扎紧，形成连续的波纹与折痕。',
    patternType: 'accordion',
    difficulty: 1,
    params: { folds: 22, amplitude: 10, gap: 7, taper: 0.18, slant: 0.12 },
    previewColors: ['#f7f3e8', '#c9d27c', '#7e9a70', '#2d6d8e', '#0b3863'],
    sortOrder: 30,
  },
  {
    id: 4,
    code: 'bean',
    name: '豆结扎染',
    subtitle: '豆粒圆纹',
    description: '以豆粒或石子包裹布面后扎紧，形成大小不一的圆点，晕染后像散落的豆纹。',
    patternType: 'bean',
    difficulty: 2,
    params: { count: 34, minRadius: 10, maxRadius: 26, halo: 1.55, clusters: 5, spread: 0.72 },
    previewColors: ['#f7f3e8', '#d7dc9a', '#7e9a70', '#24648e', '#0b3863'],
    sortOrder: 40,
  },
];
