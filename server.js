"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { promisify } = require("node:util");
const { execFile } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4174);
const HOST = process.env.HOST || "127.0.0.1";
const SESSION_COOKIE = "lanbai_session";
const GUEST_COOKIE = "lanbai_guest";
const SESSION_DAYS = 7;
const scrypt = promisify(crypto.scrypt);
const execFileAsync = promisify(execFile);

const dataDirectory = path.join(ROOT, "data");
fs.mkdirSync(dataDirectory, { recursive: true });

const db = new DatabaseSync(path.join(dataDirectory, "lanbai.sqlite"));
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    display_name TEXT NOT NULL,
    account TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_login_at TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

  CREATE TABLE IF NOT EXISTS map_places (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    kicker TEXT NOT NULL,
    lead TEXT NOT NULL,
    highlight TEXT NOT NULL,
    person TEXT NOT NULL,
    current_state TEXT NOT NULL,
    note TEXT NOT NULL,
    master TEXT NOT NULL DEFAULT '',
    pattern TEXT NOT NULL DEFAULT '',
    quote TEXT NOT NULL DEFAULT '',
    tour TEXT NOT NULL DEFAULT '',
    tour_img TEXT NOT NULL DEFAULT '',
    photo TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    map_x REAL NOT NULL,
    map_y REAL NOT NULL,
    map_scale REAL NOT NULL,
    sort_order INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS map_stats (
    place_id TEXT PRIMARY KEY,
    workers INTEGER NOT NULL,
    workshops INTEGER NOT NULL,
    annual_output TEXT,
    source_note TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (place_id) REFERENCES map_places(id) ON DELETE CASCADE
  );
`);

const placeColumns = db.prepare("PRAGMA table_info(map_places)").all().map((row) => row.name);
const additionalPlaceColumns = [
  ["master", "TEXT NOT NULL DEFAULT ''"],
  ["pattern", "TEXT NOT NULL DEFAULT ''"],
  ["quote", "TEXT NOT NULL DEFAULT ''"],
  ["tour", "TEXT NOT NULL DEFAULT ''"],
  ["tour_img", "TEXT NOT NULL DEFAULT ''"]
];
additionalPlaceColumns.forEach(([name, definition]) => {
  if (!placeColumns.includes(name)) {
    db.exec(`ALTER TABLE map_places ADD COLUMN ${name} ${definition}`);
  }
});

const mapPlaceSeed = [
  {
    id: "zhoucheng",
    name: "周城",
    kicker: "核心传承地 · 白族扎染",
    lead: "苍山脚下、洱海西岸的白族村落。院落里的染缸与晾架，把扎染留在日常生活之中。",
    highlight: "扎花针脚、板蓝根靛缸、院落晾布",
    person: "段银开 · 白族扎染技艺代表性传承人",
    currentState: "家庭染坊、研学体验与文创产品并行",
    note: "先看一双手怎样把线缝进布里，再看蓝如何在空气里慢慢显出来。",
    master: "段银开、张翰敏",
    pattern: "蝴蝶纹、梅花纹、铜钱纹",
    quote: "白族女儿会说话就会唱歌，会走路就会跳舞。",
    tour: "走进院落染坊看扎花与晾布，亲手染一块方巾；沿村巷走到古戏台，看蓝布怎样回到日常生活。",
    tourImg: "assets/zhoucheng.jpg",
    photo: "assets/zhoucheng.jpg",
    latitude: 25.85,
    longitude: 100.13,
    mapX: 53.2,
    mapY: 45.3,
    mapScale: 1.08,
    sortOrder: 1
  },
  {
    id: "xizhou",
    name: "喜洲",
    kicker: "白族聚落 · 生活图景",
    lead: "从周城向南，苍山与洱海之间的白族院落、商道与集市，构成了理解扎染生活语境的一页。",
    highlight: "白族院落、照壁、传统商街与地方手艺",
    person: "地方匠人 · 院落中的家庭传承",
    currentState: "文化旅行与传统民居体验让手工艺被更多人看见",
    note: "在喜洲，染布不是孤立的，它和建筑、商帮与日常生活一起被记住。",
    master: "喜洲院落染坊传承群体",
    pattern: "蝴蝶纹、菊花纹、几何连续纹",
    quote: "三坊一照壁，四合五天井；院里晾蓝布，门外是苍山。",
    tour: "逛严家大院与喜洲老街，观察照壁和木雕，再在院落作坊体验扎染；顺路尝一口喜洲粑粑。",
    tourImg: "assets/xizhou.jpg",
    photo: "assets/xizhou.jpg",
    latitude: 25.72,
    longitude: 100.08,
    mapX: 40.8,
    mapY: 62.7,
    mapScale: 1.3,
    sortOrder: 2
  },
  {
    id: "weishan",
    name: "巍山",
    kicker: "山地古城 · 手艺记忆",
    lead: "沿苍洱向南进入巍山，古城与山地村落保留着另一种节奏。扎染在这里与刺绣、织布等手艺共同构成地方记忆。",
    highlight: "古城街巷、白族民居与山地手工艺",
    person: "地方手艺传承者 · 家庭作坊",
    currentState: "古城文旅与小型手作体验延续地方技艺",
    note: "把视野从一匹布移向它所生长的土地，蓝色就有了地方的方向。",
    master: "熊文杰、熊天艳",
    pattern: "太阳纹、八角花、回纹",
    quote: "一座巍山城，半部南诏史；一根面里，也能吃出古城的日子。",
    tour: "沿拱辰楼走进古城，逛南诏古街与老宅；找一家家庭作坊体验扎染，再尝一碗当地一根面。",
    tourImg: "assets/weishan.jpg",
    photo: "assets/weishan.jpg",
    latitude: 25.23,
    longitude: 100.31,
    mapX: 74.5,
    mapY: 76.6,
    mapScale: 1.3,
    sortOrder: 3
  }
];

const insertMapPlace = db.prepare(`
  INSERT INTO map_places
  (id, name, kicker, lead, highlight, person, current_state, note, master, pattern, quote, tour, tour_img, photo, latitude, longitude, map_x, map_y, map_scale, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    kicker = excluded.kicker,
    lead = excluded.lead,
    highlight = excluded.highlight,
    person = excluded.person,
    current_state = excluded.current_state,
    note = excluded.note,
    master = excluded.master,
    pattern = excluded.pattern,
    quote = excluded.quote,
    tour = excluded.tour,
    tour_img = excluded.tour_img,
    photo = excluded.photo,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    map_x = excluded.map_x,
    map_y = excluded.map_y,
    map_scale = excluded.map_scale,
    sort_order = excluded.sort_order
`);

mapPlaceSeed.forEach((place) => {
  insertMapPlace.run(
    place.id,
    place.name,
    place.kicker,
    place.lead,
    place.highlight,
    place.person,
    place.currentState,
    place.note,
    place.master,
    place.pattern,
    place.quote,
    place.tour,
    place.tourImg,
    place.photo,
    place.latitude,
    place.longitude,
    place.mapX,
    place.mapY,
    place.mapScale,
    place.sortOrder
  );
});

const mapStatsSeed = [
  ["zhoucheng", 4000, 200, "待调研", "演示统计口径 · 正式发布前请以实地调研数据替换", "2026-10-22"],
  ["xizhou", 1200, 85, "待调研", "演示统计口径 · 正式发布前请以实地调研数据替换", "2026-10-22"],
  ["weishan", 650, 40, "待调研", "演示统计口径 · 正式发布前请以实地调研数据替换", "2026-10-22"]
];
const insertMapStats = db.prepare(`
  INSERT OR IGNORE INTO map_stats
  (place_id, workers, workshops, annual_output, source_note, updated_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);
mapStatsSeed.forEach((row) => insertMapStats.run(...row));

function findPsql() {
  if (process.env.PSQL_PATH) return process.env.PSQL_PATH;
  const candidates = [
    "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe",
    "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe",
    "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe"
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || "psql";
}

async function queryPostgresJson(sql) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  const { stdout } = await execFileAsync(
    findPsql(),
    ["--dbname", process.env.DATABASE_URL, "--no-psqlrc", "--no-password", "-At", "-c", sql],
    { env: process.env, maxBuffer: 1024 * 1024, windowsHide: true }
  );

  const text = stdout.trim();
  return text ? JSON.parse(text) : null;
}

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function sendJson(response, status, body, extraHeaders = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders
  });
  response.end(JSON.stringify(body));
}

function parseCookies(request) {
  const cookies = {};
  const raw = request.headers.cookie;
  if (!raw) return cookies;

  raw.split(";").forEach((entry) => {
    const separator = entry.indexOf("=");
    if (separator < 0) return;
    const key = entry.slice(0, separator).trim();
    const value = entry.slice(separator + 1).trim();
    if (!key) return;
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  });

  return cookies;
}

function makeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax"];
  if (Number.isFinite(options.maxAge)) parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.expired) parts.push("Max-Age=0", "Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  return parts.join("; ");
}

function clearAuthCookie(name) {
  return makeCookie(name, "", { expired: true });
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password, salt = crypto.randomBytes(16)) {
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${Buffer.from(derived).toString("hex")}`;
}

async function verifyPassword(password, stored) {
  const [algorithm, saltHex, hashHex] = String(stored).split("$");
  if (algorithm !== "scrypt" || !saltHex || !hashHex) return false;

  const derived = await scrypt(password, Buffer.from(saltHex, "hex"), 64);
  const actual = Buffer.from(derived);
  const expected = Buffer.from(hashHex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function normalizeAccount(value) {
  return String(value || "").trim().toLowerCase();
}

function validAccount(account) {
  return (
    /^1[3-9]\d{9}$/.test(account) ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(account)
  );
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let raw = "";

    request.on("data", (chunk) => {
      raw += chunk;
      if (Buffer.byteLength(raw) > 16_384) {
        reject(Object.assign(new Error("请求内容过大"), { statusCode: 413 }));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(Object.assign(new Error("请求格式不正确"), { statusCode: 400 }));
      }
    });

    request.on("error", reject);
  });
}

function sameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
}

function publicUser(row) {
  return {
    id: row.id,
    displayName: row.display_name,
    account: row.account
  };
}

function createSession(userId, remember) {
  const token = crypto.randomBytes(32).toString("base64url");
  const maxAgeSeconds = (remember ? SESSION_DAYS * 2 : SESSION_DAYS) * 24 * 60 * 60;
  const now = Date.now();

  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
  db.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
  ).run(hashToken(token), userId, now + maxAgeSeconds * 1000, now);

  return {
    token,
    maxAge: maxAgeSeconds
  };
}

function currentSession(request) {
  const cookies = parseCookies(request);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;

  const row = db.prepare(`
    SELECT users.id, users.display_name, users.account, sessions.expires_at
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(hashToken(token), Date.now());

  return row || null;
}

async function handleApi(request, response, pathname) {
  if (pathname === "/api/map/places" && request.method === "GET") {
    let places = null;
    let dataSource = "sqlite";

    if (process.env.DATABASE_URL) {
      try {
        places = await queryPostgresJson(`
          SELECT COALESCE(json_agg(json_build_object(
            'id', id,
            'name', name,
            'kicker', kicker,
            'lead', lead,
            'highlight', highlight,
            'person', person,
            'currentState', current_state,
            'note', note,
            'master', master,
            'pattern', pattern,
            'quote', quote,
            'tour', tour,
            'tourImg', tour_img,
            'photo', photo,
            'latitude', latitude,
            'longitude', longitude,
            'mapX', map_x,
            'mapY', map_y,
            'mapScale', map_scale
          ) ORDER BY sort_order), '[]'::json)::text
          FROM map_places
        `);
        dataSource = "postgresql";
      } catch (error) {
        console.warn("PostgreSQL unavailable, using SQLite map data:", error.message);
      }
    }

    if (!places) {
      places = db.prepare(`
        SELECT id, name, kicker, lead, highlight, person, current_state, note,
               master, pattern, quote, tour, tour_img, photo,
               latitude, longitude, map_x, map_y, map_scale
        FROM map_places
        ORDER BY sort_order ASC
      `).all().map((row) => ({
        id: row.id,
        name: row.name,
        kicker: row.kicker,
        lead: row.lead,
        highlight: row.highlight,
        person: row.person,
        currentState: row.current_state,
        note: row.note,
        master: row.master,
        pattern: row.pattern,
        quote: row.quote,
        tour: row.tour,
        tourImg: row.tour_img,
        photo: row.photo,
        latitude: row.latitude,
        longitude: row.longitude,
        mapX: row.map_x,
        mapY: row.map_y,
        mapScale: row.map_scale
      }));
    }

    sendJson(response, 200, { ok: true, source: dataSource, places });
    return true;
  }

  if (pathname === "/api/map/stats" && request.method === "GET") {
    const placeId = new URL(
      request.url,
      `http://${request.headers.host || `${HOST}:${PORT}`}`
    ).searchParams.get("place");

    if (!placeId) {
      sendJson(response, 400, { ok: false, message: "缺少 place 参数。" });
      return true;
    }

    if (!/^[a-z0-9_-]+$/i.test(placeId)) {
      sendJson(response, 400, { ok: false, message: "place 参数格式不正确。" });
      return true;
    }

    let row = null;
    let dataSource = "sqlite";

    if (process.env.DATABASE_URL) {
      try {
        row = await queryPostgresJson(`
          SELECT json_build_object(
            'name', map_places.name,
            'workers', map_stats.workers,
            'workshops', map_stats.workshops,
            'annual_output', map_stats.annual_output,
            'source_note', map_stats.source_note,
            'updated_at', map_stats.updated_at
          )::text
          FROM map_stats
          JOIN map_places ON map_places.id = map_stats.place_id
          WHERE map_stats.place_id = '${placeId}'
        `);
        dataSource = "postgresql";
      } catch (error) {
        console.warn("PostgreSQL unavailable, using SQLite map statistics:", error.message);
      }
    }

    if (!row) {
      row = db.prepare(`
        SELECT map_places.name, map_stats.workers, map_stats.workshops,
               map_stats.annual_output, map_stats.source_note, map_stats.updated_at
        FROM map_stats
        JOIN map_places ON map_places.id = map_stats.place_id
        WHERE map_stats.place_id = ?
      `).get(placeId);
    }

    if (!row) {
      sendJson(response, 404, { ok: false, message: "没有找到该地点的统计数据。" });
      return true;
    }

    sendJson(response, 200, {
      ok: true,
      place: placeId,
      placeName: row.name,
      workers: row.workers,
      workshops: row.workshops,
      annualOutput: row.annual_output,
      annualOutputUnit: "万元",
      sourceNote: row.source_note,
      updatedAt: row.updated_at,
      source: dataSource
    });
    return true;
  }

  if (request.method !== "POST" && pathname !== "/api/session") {
    sendJson(response, 405, { ok: false, message: "请求方法不支持。" });
    return true;
  }

  if (request.method === "POST" && !sameOrigin(request)) {
    sendJson(response, 403, { ok: false, message: "请求来源不受信任。" });
    return true;
  }

  if (pathname === "/api/session" && request.method === "GET") {
    const session = currentSession(request);
    if (session) {
      sendJson(response, 200, { ok: true, role: "user", user: publicUser(session) });
      return true;
    }

    const guest = parseCookies(request)[GUEST_COOKIE] === "1";
    sendJson(response, 200, { ok: true, role: guest ? "guest" : "anonymous" });
    return true;
  }

  if (pathname === "/api/register" && request.method === "POST") {
    const body = await readJson(request);
    const displayName = String(body.displayName || "").trim();
    const account = normalizeAccount(body.account);
    const password = String(body.password || "");

    if (displayName.length < 2 || displayName.length > 20) {
      sendJson(response, 400, { ok: false, message: "昵称需要 2–20 个字符。" });
      return true;
    }
    if (!validAccount(account)) {
      sendJson(response, 400, { ok: false, message: "请输入有效的手机号或邮箱。" });
      return true;
    }
    if (password.length < 8 || password.length > 72) {
      sendJson(response, 400, { ok: false, message: "密码需要 8–72 个字符。" });
      return true;
    }

    const exists = db.prepare("SELECT id FROM users WHERE account = ?").get(account);
    if (exists) {
      sendJson(response, 409, { ok: false, message: "该账号已经注册，请直接登录。" });
      return true;
    }

    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    try {
      const result = db.prepare(
        "INSERT INTO users (display_name, account, password_hash, created_at) VALUES (?, ?, ?, ?)"
      ).run(displayName, account, passwordHash, now);

      sendJson(response, 201, {
        ok: true,
        message: "账号创建成功，请使用新账号登录。",
        user: {
          id: Number(result.lastInsertRowid),
          displayName,
          account
        }
      });
    } catch (error) {
      if (String(error.message).includes("UNIQUE")) {
        sendJson(response, 409, { ok: false, message: "该账号已经注册，请直接登录。" });
        return true;
      }
      throw error;
    }
    return true;
  }

  if (pathname === "/api/login" && request.method === "POST") {
    const body = await readJson(request);
    const account = normalizeAccount(body.account);
    const password = String(body.password || "");
    const remember = Boolean(body.remember);

    if (!account || !password) {
      sendJson(response, 400, { ok: false, message: "请完整填写账号和密码。" });
      return true;
    }

    const user = db.prepare(
      "SELECT id, display_name, account, password_hash FROM users WHERE account = ?"
    ).get(account);

    const passwordMatches = user ? await verifyPassword(password, user.password_hash) : false;
    if (!user || !passwordMatches) {
      sendJson(response, 401, {
        ok: false,
        code: "INVALID_CREDENTIALS",
        message: "账号或密码不正确；首次使用请先注册。"
      });
      return true;
    }

    const session = createSession(user.id, remember);
    db.prepare("UPDATE users SET last_login_at = ? WHERE id = ?")
      .run(new Date().toISOString(), user.id);

    sendJson(
      response,
      200,
      { ok: true, message: "登录成功。", user: publicUser(user) },
      {
        "Set-Cookie": [
          makeCookie(SESSION_COOKIE, session.token, { maxAge: session.maxAge }),
          clearAuthCookie(GUEST_COOKIE)
        ]
      }
    );
    return true;
  }

  if (pathname === "/api/guest" && request.method === "POST") {
    sendJson(
      response,
      200,
      { ok: true, role: "guest", message: "已进入访客漫游。" },
      {
        "Set-Cookie": [
          makeCookie(GUEST_COOKIE, "1", { maxAge: SESSION_DAYS * 24 * 60 * 60 }),
          clearAuthCookie(SESSION_COOKIE)
        ]
      }
    );
    return true;
  }

  if (pathname === "/api/logout" && request.method === "POST") {
    const token = parseCookies(request)[SESSION_COOKIE];
    if (token) {
      db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
    }
    sendJson(
      response,
      200,
      { ok: true, message: "已退出登录。" },
      { "Set-Cookie": [clearAuthCookie(SESSION_COOKIE), clearAuthCookie(GUEST_COOKIE)] }
    );
    return true;
  }

  return false;
}

function serveStatic(response, pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  let decoded;

  try {
    decoded = decodeURIComponent(requested);
  } catch {
    sendJson(response, 400, { ok: false, message: "路径格式不正确。" });
    return;
  }

  const relative = decoded.replace(/^\/+/, "");
  const filePath = path.resolve(ROOT, relative);
  const relativeFromRoot = path.relative(ROOT, filePath);

  if (relativeFromRoot.startsWith("..") || path.isAbsolute(relativeFromRoot)) {
    sendJson(response, 403, { ok: false, message: "禁止访问该路径。" });
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      sendJson(response, 404, { ok: false, message: "页面不存在。" });
      return;
    }

    const contentType = contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cache-Control": contentType.startsWith("image/") ? "public, max-age=3600" : "no-cache"
    });
    fs.createReadStream(filePath).pipe(response);
  });
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || `${HOST}:${PORT}`}`);

    if (url.pathname.startsWith("/api/")) {
      const handled = await handleApi(request, response, url.pathname);
      if (!handled) sendJson(response, 404, { ok: false, message: "接口不存在。" });
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { ok: false, message: "请求方法不支持。" });
      return;
    }

    serveStatic(response, url.pathname);
  } catch (error) {
    console.error(error);
    if (!response.headersSent) {
      sendJson(response, error.statusCode || 500, {
        ok: false,
        message: error.statusCode ? error.message : "服务器暂时无法处理请求。"
      });
    } else {
      response.end();
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`蓝白之境已启动：http://${HOST}:${PORT}`);
  console.log(`用户数据库：${path.join(dataDirectory, "lanbai.sqlite")}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
