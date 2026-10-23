CREATE TABLE IF NOT EXISTS map_places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kicker TEXT NOT NULL,
  lead TEXT NOT NULL,
  highlight TEXT NOT NULL,
  person TEXT NOT NULL,
  current_state TEXT NOT NULL,
  note TEXT NOT NULL,
  master TEXT NOT NULL,
  pattern TEXT NOT NULL,
  quote TEXT NOT NULL,
  tour TEXT NOT NULL,
  tour_img TEXT NOT NULL,
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
  (id, name, kicker, lead, highlight, person, current_state, note, master, pattern, quote, tour, tour_img, photo, latitude, longitude, map_x, map_y, map_scale, sort_order)
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
    '段银开、张翰敏',
    '蝴蝶纹、梅花纹、铜钱纹',
    '白族女儿会说话就会唱歌，会走路就会跳舞。',
    '走进院落染坊看扎花与晾布，亲手染一块方巾；沿村巷走到古戏台，看蓝布怎样回到日常生活。',
    'assets/zhoucheng.jpg',
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
    '喜洲院落染坊传承群体',
    '蝴蝶纹、菊花纹、几何连续纹',
    '三坊一照壁，四合五天井；院里晾蓝布，门外是苍山。',
    '逛严家大院与喜洲老街，观察照壁和木雕，再在院落作坊体验扎染；顺路尝一口喜洲粑粑。',
    'assets/xizhou.jpg',
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
    '熊文杰、熊天艳',
    '太阳纹、八角花、回纹',
    '一座巍山城，半部南诏史；一根面里，也能吃出古城的日子。',
    '沿拱辰楼走进古城，逛南诏古街与老宅；找一家家庭作坊体验扎染，再尝一碗当地一根面。',
    'assets/weishan.jpg',
    'assets/weishan.jpg',
    25.23,
    100.31,
    74.5,
    76.6,
    1.3,
    3
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  kicker = EXCLUDED.kicker,
  lead = EXCLUDED.lead,
  highlight = EXCLUDED.highlight,
  person = EXCLUDED.person,
  current_state = EXCLUDED.current_state,
  note = EXCLUDED.note,
  master = EXCLUDED.master,
  pattern = EXCLUDED.pattern,
  quote = EXCLUDED.quote,
  tour = EXCLUDED.tour,
  tour_img = EXCLUDED.tour_img,
  photo = EXCLUDED.photo,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  map_x = EXCLUDED.map_x,
  map_y = EXCLUDED.map_y,
  map_scale = EXCLUDED.map_scale,
  sort_order = EXCLUDED.sort_order;

INSERT INTO map_stats
  (place_id, workers, workshops, annual_output, source_note, updated_at)
VALUES
  ('zhoucheng', 4000, 200, '待调研', '演示统计口径 · 正式发布前请以实地调研数据替换', '2026-10-22'),
  ('xizhou', 1200, 85, '待调研', '演示统计口径 · 正式发布前请以实地调研数据替换', '2026-10-22'),
  ('weishan', 650, 40, '待调研', '演示统计口径 · 正式发布前请以实地调研数据替换', '2026-10-22')
ON CONFLICT (place_id) DO NOTHING;
