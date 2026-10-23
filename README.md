# 蓝白之境 · 白族扎染数字科普站

一个以白族扎染为主题的数字非遗科普站。前端是原生 HTML / CSS / JavaScript 多页面应用，后端统一为 **JDK 17 + Spring Boot 3.5 + Spring Data JPA + MySQL 8**，前后端同源部署，启动一个进程即可浏览全部页面。

## 功能模块

| 模块 | 页面 | 内容 |
|---|---|---|
| 登录 / 访客 | `index.html` | 注册、登录、游客漫游、会话保持 |
| 六大展区 | `home.html` | 首页、六个展区入口、纹样图鉴、作品墙 |
| 纹样图鉴 | `home.html` → 展区 03 | 9 个纹样、答题解锁、纹样寓意 |
| 作品墙 | `home.html` → 展区 06 | 作品浏览、筛选、点赞、图片上传 |
| 工艺长卷 | `timeline.html` | 七步成蓝的工序长卷 |
| 非遗地图 | `map.html` | 周城 / 喜洲 / 巍山三地故事与统计图表 |
| 扎染实验室 | `diy.html` | 螺旋、缝扎、风琴折叠、豆结四种扎结方式 |
| 问蓝知染 | `quiz.html` | 非遗知识问答与知识块解析 |

## 协作开发

### 负责「工艺长卷（模块 02）」和「非遗地图（模块 05）」的同学

**工艺长卷 `timeline.html`**

| 文件 | 用途 |
|---|---|
| `timeline.html` | 长卷页面结构、七步工序内容 |
| `app.js` → `setupCraftStory()` | 滚动进度、书页展开、绣线动画 |
| `styles.css` → `.craft-book` / `.book-*` / `.cover-*` 段落 | 长卷与封面样式 |
| `assets/` | 长卷配图资源 |

**非遗地图 `map.html`**

| 文件 | 用途 |
|---|---|
| `map.html` | 地图页面、地点标记、人物图鉴弹层 |
| `app.js` → `setupAtlas()` | 地点切换、ECharts 图表、图鉴弹层交互 |
| `assets/echarts.min.js` | 图表库 |
| `styles.css` → `/* --- 3. 非遗地图 (map) --- */` 之后的 `.atlas-*` / `.marker-*` / `.ink-*` | 地图与图表样式 |
| `backend/src/main/java/com/baizu/tiedye/atlas/` | 地图后端：`controller/AtlasController.java`、`service/AtlasService.java`、`repository/*`、`entity/MapPlace.java`、`entity/MapStat.java`、`dto/*` |
| `db/mysql-init.sql` | 表结构：`map_place`、`map_stat` |
| `bootstrap/DataInitializer.java` → `seedMap()` | 三个地点与统计数据 |
| 接口 | `GET /api/map/places`、`GET /api/map/stats?place=zhoucheng` |

### 负责「模块 3 纹样图鉴」和「模块 4 作品墙」的同学

**模块 3：纹样图鉴 × 闯关答题**

| 文件 | 用途 |
|---|---|
| `home.html` | 展区 03 卡片、`#view-heritage` 纹样视图、`#modal-pattern` 图鉴与答题弹层 |
| `app.js` | `openModal / closeModal / loadPatterns / renderPatterns / loadQuiz / renderQuiz / checkAnswer` |
| `styles.css` → `模块 3 / 4：纹样图鉴与作品墙` 段落 | `.pattern-grid`、`.pattern-card`、`#modal-pattern .quiz-*` 等样式 |
| `backend/src/main/java/com/baizu/tiedye/pattern/` | 纹样接口：`controller/dto/entity/repository/service` |
| `backend/src/main/java/com/baizu/tiedye/quiz/` | 题库接口：`controller/dto/entity/repository/service` |
| `db/mysql-init.sql` | 表结构：`pattern`、`quiz_question`、`quiz_option`、`knowledge_chunk` |
| `bootstrap/DataInitializer.java` | `seedPatterns()`、`seedKnowledgeQuiz()`、`seedPatternQuiz()` |
| 接口 | `GET /api/patterns`、`GET /api/quiz/questions?scope=pattern&limit=10`、`POST /api/quiz/answer` |

**模块 4：作品墙**

| 文件 | 用途 |
|---|---|
| `home.html` | 展区 06 卡片、`#modal-ask` 作品墙弹层、上传表单、`#lightbox` 大图预览 |
| `app.js` | `loadArtworks / renderArtworks / filterArtworks / likeArtwork / handleUpload / previewImage / toggleUploadForm / openLightbox / closeLightbox / likeFromLightbox` |
| `styles.css` → `模块 3 / 4` 段落 | `.gallery-*`、`.polaroid-*`、`.like-*`、`.upload-*`、`#lightbox` 等样式 |
| `backend/src/main/java/com/baizu/tiedye/artwork/` | 作品接口：`controller/dto/entity/repository/service` |
| `db/mysql-init.sql` | 表结构：`artwork` |
| `bootstrap/DataInitializer.java` → `seedArtworks()` | 9 条演示作品 |
| 上传目录 | `${UPLOAD_DIR}`，默认 `backend/uploads`，通过 `/uploads/**` 访问 |
| 接口 | `GET /api/artworks`、`POST /api/artworks/upload`、`POST /api/artworks/{id}/like` |

**全站公共文件**

| 文件 | 用途 |
|---|---|
| `place.html` | 地点完整手记、传承人、纹样、打卡指南和产业数据 |
| `js/api-base.js` | 接口地址与统一请求封装，所有模块共用 |
| `js/http.js` | 统一请求头、Cookie 与接口响应处理 |
| `styles.css` 顶部变量与通用组件 | 全站字体、颜色、按钮、页头页脚 |
| `backend/src/main/java/com/baizu/tiedye/common/` | 统一接口响应与异常处理 |
| `bootstrap/DataInitializer.java` | 所有模块的演示数据 |
| `db/mysql-init.sql` | 交付用建库建表脚本 |

## 拉取项目后如何启动
安装 **JDK 17**、**MySQL 8**，并确保 MySQL 服务已启动。
进入后端目录启动（首次启动会自动建库建表并写入演示数据）：
   ```powershell
   cd backend
   $env:DB_PASSWORD="你的MySQL密码"
   .\mvnw.cmd spring-boot:run
   ```
浏览器访问 <http://localhost:8080/>。前端页面、接口、上传图片都由这一个进程提供，不需要再单独启动前端。
