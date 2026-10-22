CREATE TABLE IF NOT EXISTS map_places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kicker TEXT NOT NULL,
  lead TEXT NOT NULL,
  highlight TEXT NOT NULL,
  person TEXT NOT NULL,
  current_state TEXT NOT NULL,
  note TEXT NOT NULL,
  photo TEXT NOT NULL,
  latitude NUMERIC(8, 5) NOT NULL,
  longitude NUMERIC(8, 5) NOT NULL,
  map_x NUMERIC(6, 2) NOT NULL,
  map_y NUMERIC(6, 2) NOT NULL,
  map_scale NUMERIC(4, 2) NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS map_stats (
  place_id TEXT PRIMARY KEY REFERENCES map_places(id) ON DELETE CASCADE,
  workers INTEGER NOT NULL,
  workshops INTEGER NOT NULL,
  annual_output TEXT,
  source_note TEXT NOT NULL,
  updated_at DATE NOT NULL
);

INSERT INTO map_places
  (id, name, kicker, lead, highlight, person, current_state, note, photo, latitude, longitude, map_x, map_y, map_scale, sort_order)
VALUES
  (
    'zhoucheng',
    '周城',
    '核心传承地 · 白族扎染',
    '苍山脚下、洱海西岸的白族村落。院落里的染缸与晾架，把扎染留在日常生活之中。',
    '扎花针脚、板蓝根靛缸、院落晾布',
    '段银开 · 白族扎染技艺代表性传承人',
    '家庭染坊、研学体验与文创产品并行',
    '先看一双手怎样把线缝进布里，再看蓝如何在空气里慢慢显出来。',
    'assets/zhoucheng.jpg',
    25.85,
    100.13,
    53.2,
    45.3,
    1.08,
    1
  ),
  (
    'xizhou',
    '喜洲',
    '白族聚落 · 生活图景',
    '从周城向南，苍山与洱海之间的白族院落、商道与集市，构成了理解扎染生活语境的一页。',
    '白族院落、照壁、传统商街与地方手艺',
    '地方匠人 · 院落中的家庭传承',
    '文化旅行与传统民居体验让手工艺被更多人看见',
    '在喜洲，染布不是孤立的，它和建筑、商帮与日常生活一起被记住。',
    'assets/xizhou.jpg',
    25.72,
    100.08,
    40.8,
    62.7,
    1.3,
    2
  ),
  (
    'weishan',
    '巍山',
    '山地古城 · 手艺记忆',
    '沿苍洱向南进入巍山，古城与山地村落保留着另一种节奏。扎染在这里与刺绣、织布等手艺共同构成地方记忆。',
    '古城街巷、白族民居与山地手工艺',
    '地方手艺传承者 · 家庭作坊',
    '古城文旅与小型手作体验延续地方技艺',
    '在巍山，染布不是孤立的，它和织布、挑花一起，缝进了古城的生活。',
    'assets/weishan.jpg',
    25.23,
    100.31,
    74.5,
    76.6,
    1.3,
    3
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO map_stats
  (place_id, workers, workshops, annual_output, source_note, updated_at)
VALUES
  ('zhoucheng', 4000, 200, '待调研', '演示统计口径 · 正式发布前请以实地调研数据替换', '2026-10-22'),
  ('xizhou', 1200, 85, '待调研', '演示统计口径 · 正式发布前请以实地调研数据替换', '2026-10-22'),
  ('weishan', 650, 40, '待调研', '演示统计口径 · 正式发布前请以实地调研数据替换', '2026-10-22')
ON CONFLICT (place_id) DO NOTHING;
