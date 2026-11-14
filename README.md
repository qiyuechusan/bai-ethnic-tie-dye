# 苍洱纹册 · 白族扎染数字科普站

苍洱纹册是面向青年用户的数字非遗科普网站，以云南大理白族扎染为切入点，通过“看、玩、问、练”的数字体验介绍蓝靛植物染、扎结工艺、传统纹样、传承地与人。

项目前端使用 Vite + Vue 3，后端使用 Spring Boot，AI 部分包含 DashScope/Qwen 大模型接入、混合 RAG 检索、ReAct 工具调用、输出校验和可追溯引用。

## 核心功能

| 模块 | 功能 |
|---|---|
| 登录与访客 | 注册、登录、游客漫游、Cookie 会话 |
| 扎染实验室 | 自然语言生成纹样参数、Canvas 纹样渲染、氧化显色动画 |
| 工艺长卷 | 七步成蓝线装书交互、氧化变色、染坊翻车诊断 |
| 智染研习社 | 纹样图鉴、知识竞答、情境剧本杀、成就收集 |
| 问蓝知染 | RAG 问答、动态出题、纹样绘制、学习画像、历史会话 |
| 苍洱染迹 | 周城、喜洲、巍山非遗地图与产业数据 |
| 匠人作品墙 | 作品浏览、筛选、上传、点赞、图片查看 |

## 技术架构

```text
┌────────────────────────────────────────────┐
│ Vite + Vue 3 + Vue Router + Pinia          │
│ 页面路由、会话状态、Canvas、可视化交互      │
└──────────────────────┬─────────────────────┘
                       │ /api
┌──────────────────────▼─────────────────────┐
│ Spring Boot 3.5 / Java 17                  │
│ Auth · Content · Artwork · Atlas           │
│ RAG · ReAct Agent · Scenario               │
└──────────────┬──────────────────┬──────────┘
               │                  │
        ┌──────▼──────┐    ┌──────▼─────────┐
        │ MySQL 8     │    │ DashScope API  │
        │ 业务与RAG   │    │ Qwen LLM /     │
        │ 数据        │    │ Embedding      │
        └─────────────┘    └────────────────┘
```

### AI 链路

1. 将扎染知识拆分为带来源、关键词和可信度的知识分片。
2. 使用向量相似度、关键词和元数据组成混合检索。
3. Agent 通过 `retrieve`、`gen_quiz`、`draw_pattern`、`grade_answer`、`clarify` 等工具决定下一步。
4. 模型只允许引用本轮检索到的知识分片。
5. JSON 输出经过结构校验；纹样参数还经过范围和渲染器校验。
6. 未配置模型时明确降级或报错，不把规则结果伪装成模型回答。

主要实现位于：

- `backend/src/main/java/com/baizu/tiedye/rag/`
- `backend/src/main/java/com/baizu/tiedye/tutor/`
- `backend/src/main/java/com/baizu/tiedye/diy/agent/`
- `backend/src/main/java/com/baizu/tiedye/scenario/`

## 目录结构

```text
.
├─ frontend/                 Vue 3 前端工程（正式入口）
│  ├─ src/pages/             各功能页面
│  ├─ src/components/        Vue/渲染相关组件
│  ├─ src/legacy/            迁移中的旧交互逻辑
│  ├─ src/router/            Vue Router
│  ├─ src/stores/            Pinia 状态
│  └─ src/styles/            页面样式
├─ backend/                  Spring Boot 后端
│  ├─ src/main/java/         业务、RAG、Agent、REST API
│  ├─ src/main/resources/    配置与知识库 JSON
│  └─ src/test/              H2 自动化测试
├─ assets/                   公共图片资源
├─ db/                       MySQL 初始化脚本
├─ .env.example              环境变量模板
└─ README.md
```

仓库根目录的旧 HTML 页面用于早期静态版本兼容；正式前端入口为 `frontend/`。

## 环境要求

- JDK 17
- MySQL 8
- Node.js 18 或更高版本
- npm 9 或更高版本
- DashScope API Key（在线 AI 功能需要）

## 环境变量

复制模板：

```powershell
Copy-Item .env.example .env
```

然后填写 `.env`。不要提交真实密钥。

Spring Boot 启动时会自动读取仓库根目录或 `backend/` 目录下的 `.env` 文件。

| 变量 | 必填 | 说明 |
|---|---|---|
| `DB_PASSWORD` | 是 | MySQL 密码 |
| `DB_USERNAME` | 否 | 数据库用户名，默认 `root` |
| `DB_URL` | 否 | MySQL JDBC 地址 |
| `SERVER_PORT` | 否 | 后端端口，默认 `8080` |
| `DASHSCOPE_API_KEY` | 在线 AI 必填 | DashScope API Key |
| `DASHSCOPE_CHAT_MODEL` | 否 | 问答模型 |
| `DASHSCOPE_EMBEDDING_MODEL` | 否 | 向量模型 |
| `AI_MODE` | 否 | `auto`、`dashscope` 或 `offline` |
| `AI_ALLOW_OFFLINE_FALLBACK` | 否 | 是否允许本地规则兜底 |
| `RAG_REINDEX_TOKEN` | 否 | 知识库重建接口令牌 |
| `UPLOAD_DIR` | 否 | 用户作品保存目录 |
| `CORS_ALLOWED_ORIGINS` | 否 | 前端开发地址白名单 |

`application.yml` 使用 `${变量名:默认值}` 读取这些配置。PowerShell 临时设置示例：

```powershell
$env:DB_PASSWORD="你的MySQL密码"
$env:DASHSCOPE_API_KEY="你的DashScope密钥"
$env:AI_MODE="auto"
```

## 本地启动

### 1. 准备数据库

启动 MySQL 后，可以让 Spring Data JPA 自动建表，也可以执行：

```powershell
mysql -u root -p --default-character-set=utf8mb4 --execute="source db/mysql-init.sql"
```

### 2. 启动后端

```powershell
cd backend
$env:DB_PASSWORD="你的MySQL密码"
$env:DASHSCOPE_API_KEY="你的DashScope密钥"
.\mvnw.cmd spring-boot:run
```

后端地址：`http://localhost:8080`

### 3. 启动前端

```powershell
cd frontend
npm ci
npm run dev
```

前端地址：`http://localhost:5173`

Vite 会将 `/api` 和 `/uploads` 代理到 `http://localhost:8080`。

## 构建与检查

前端：

```powershell
cd frontend
npm ci
npm run typecheck
npm run build
npm run preview
```

后端测试：

```powershell
cd backend
.\mvnw.cmd test
```

## 主要接口

| 接口 | 用途 |
|---|---|
| `POST /api/register` | 注册 |
| `POST /api/login` | 登录 |
| `GET /api/patterns` | 纹样图鉴 |
| `GET /api/artworks` | 作品列表 |
| `GET /api/map/places` | 非遗地点 |
| `GET /api/map/stats` | 地区产业数据 |
| `POST /api/diy/agent/pattern` | AI 纹样参数生成 |
| `POST /api/tutor/chat` | RAG + ReAct 智能导师 |
| `GET /api/tutor/catalog` | 知识分类 |
| `GET /api/tutor/knowledge` | 知识分片阅览 |
| `POST /api/scenario/ask` | 剧本杀知识问答 |
| `POST /api/scenario/answer` | 剧本杀挑战判题 |
| `POST /api/admin/rag/reindex` | 重建 RAG 索引 |

## 团队与分工

| 成员 | 主要工作 |
|---|---|
| 王一帆 | 项目统筹、整合联调、工艺长卷、非遗地图 |
| 罗丽梅（Git：llm935） | 纹样图鉴、情境剧本杀与知识竞答、作品墙与相关资料 |
| 侯晓然（Git：Xiaoran Hou） | 问蓝知染与 AI 技术链路前端框架、扎染体验、前端整合 |

以上分工根据仓库提交记录和模块归属整理。

## Git 历史

主开发分支及 Pull Request 记录保留在仓库中。提交范围覆盖静态原型、Vue 迁移、AI/RAG、情景剧本杀、页面整合和问题修复。

## 已知配置说明

- 未配置 `DASHSCOPE_API_KEY` 时，页面应显示 AI 离线/未配置状态。
- `AI_ALLOW_OFFLINE_FALLBACK=true` 仅建议用于离线演示。
- 上传文件不会提交到 Git，默认保存在 `UPLOAD_DIR`。
- 数据库密码、API Key 和重建令牌不得写入源码。
