# 模块 5 / 6：手写 RAG + ReAct Agent 接口与数据结构

本文档用于答辩讲解与联调，覆盖接口契约、JSON 结构、服务可用性与数据库表。

## 1. 总体链路

```text
模块 5：
用户描述 + 面料 + 浓度
  → QueryAliasExpander 查询扩展
  → MysqlVectorRagService（MySQL 向量 + 关键词 + 元数据混合召回）
  → LLM JSON 输出 / DiyOfflinePlanner
  → DiyOutputValidator 校验
  → 失败带错误列表纠正（最多 2 轮）
  → diy_generate_record 落库
  → Canvas 纹样 + 氧化动画参数

模块 6：
用户消息 + sessionId
  → 预检索
  → ReAct 循环：retrieve / gen_quiz / draw_pattern / grade_answer / clarify / final_answer
  → 工具 Observation 回填上下文
  → final_answer（引用必须来自本轮证据）
  → agent_chat_history + agent_trace 落库
```

## 2. 模块 5 接口

### `POST /api/diy/agent/pattern`

请求：

```json
{
  "sessionId": "可选，首次为空",
  "prompt": "用棉布做一块洱海波纹的围巾，浓度高一点",
  "fabric": "cotton",
  "concentration": 0.85,
  "canvas": { "width": 900, "height": 1125 },
  "seed": "A7K2",
  "parentGenerationId": null
}
```

约束：`prompt` 2–300 字；`fabric ∈ cotton|linen|silk`；`concentration ∈ 0.1–1.0`；画布 600–1600、宽高比 0.5–2.0。

响应核心：

```json
{
  "sessionId": "...",
  "generationId": 1,
  "mode": "online",
  "degraded": false,
  "method": {
    "code": "ai-wave",
    "name": "AI·洱海微波",
    "subtitle": "纹样生成 · wave",
    "description": "...",
    "patternType": "motif",
    "difficulty": 2,
    "params": {
      "motifType": "wave",
      "symmetry": "none",
      "axes": 1,
      "centerX": 0.5,
      "centerY": 0.46,
      "scale": 0.214,
      "repeat": 6,
      "spacing": 0.223,
      "rotation": 0,
      "lineGap": 9,
      "partialRatio": 0.36,
      "jitter": 0.069
    },
    "previewColors": ["#c9d27c", "#7e9a70", "#2d6d8e", "#0b3863"]
  },
  "seed": "JRL9",
  "oxidation": {
    "stops": ["#c9d27c", "#7e9a70", "#2d6d8e", "#0b3863"],
    "finalColor": "#173159",
    "dipDurationMs": 620,
    "oxidationDurationMs": 2400,
    "tintAlpha": 0.92,
    "dips": 2,
    "fabric": "cotton",
    "concentration": 0.85,
    "easing": "easeOutCubic"
  },
  "explanation": "...",
  "citations": [
    {
      "chunkKey": "motif_erhai_01",
      "title": "洱海波纹意象",
      "category": "motif",
      "source": "...",
      "sourceUrl": null,
      "confidence": "B",
      "snippet": "..."
    }
  ],
  "suggestedPrompts": ["把纹样换成蝴蝶", "改用麻布，颜色浅一点"],
  "lowConfidence": false,
  "warnings": []
}
```

### 纹样参数范围（`DiyOutputValidator`）

| rendererType | 参数 |
|---|---|
| `spiral` | rings 6–40, gap 2–30, wobble 0–0.3, core 0–0.2, spokes 0–16 |
| `stitch` | rows 1–20, cols 1–20, gap 1–20, angle -90–90 |
| `accordion` | folds 4–60, amplitude 1–40, gap 1–30, slant -0.5–0.5 |
| `bean` | count 5–100, minRadius 2–40, maxRadius 3–60, halo 1–3, clusters 1–12, spread 0–1 |
| `motif` | motifType、symmetry、axes 1–12、scale 0.08–0.6、repeat 1–12、lineGap 2–20、partialRatio 0–1、jitter 0–0.15 |

`motifType ∈ butterfly|fish|lotus|plum|sun|octagon|wave|coin|fret|ice|geometric`。
氧化参数：stops 3–5 个合法 hex；dipDurationMs 350–1200；oxidationDurationMs 1200–5000；tintAlpha 0.6–1.0；dips 1–4。

### 其它接口

- `GET /api/diy/agent/suggestions`：灵感描述。
- `GET /api/diy/agent/history?sessionId=`：最近 10 次生成快照。

## 3. 模块 6 接口

### `POST /api/tutor/chat`

请求：

```json
{ "sessionId": "uuid", "message": "扎染和蜡染怎么区分？", "scope": "differentiation" }
```

`scope` 可选，取值与知识分类一致：`technique|oxidation|motif|differentiation|heritage|place|process|faq`。

响应：

```json
{
  "sessionId": "...",
  "turnNo": 1,
  "mode": "offline",
  "degraded": true,
  "degradedReason": "...",
  "intent": { "type": "qa", "topic": "differentiation", "confidence": 0.6 },
  "answer": {
    "text": "...",
    "citations": [],
    "relatedQuestions": ["..."],
    "suggestedPrompts": ["..."]
  },
  "cards": [
    { "type": "quiz", "quiz": { "quizId": "...", "stem": "...", "options": [], "hint": "..." } },
    { "type": "pattern", "pattern": { "generationId": 1, "methodName": "...", "params": {} } },
    { "type": "clarify", "clarify": { "question": "...", "options": [] } },
    { "type": "grade", "grade": { "quizId": "...", "correct": true } }
  ],
  "lowConfidence": false
}
```

`cards` 只返回当前回合实际产生的卡片，非当前类型字段会被 `non_null` 省略。

### `POST /api/tutor/submit-answer`

```json
{ "sessionId": "...", "quizId": "uuid", "optionKey": "B" }
```

判题由服务端完成，返回正确答案、解析、引用、学习画像和下一题难度。判题前题目接口不返回 `correctKey`。

### 其它接口

- `POST /api/tutor/quiz/generate`：显式生成一道辨析题。
- `GET /api/tutor/catalog`：知识分类、条数、示例问题、概念对。
- `GET /api/tutor/knowledge?category=&offset=&limit=`：知识分片浏览。
- `GET /api/tutor/sessions`：当前登录用户的历史会话列表。
- `GET /api/tutor/history?sessionId=`：某个会话的对话历史。
- `GET /api/tutor/stats?sessionId=`：学习画像。
- `GET /api/ai/status`：模型可用性、知识条数、索引模型。
- 模块 5/6 页面与接口均要求登录；未登录返回 401 或跳转登录页。

## 4. ReAct 动作结构

模型每轮只输出一个动作：

```json
{
  "thought": "先检索扎染与蜡染的防染差异",
  "action": "retrieve",
  "actionInput": { "query": "扎染 蜡染 防染 区别", "topK": 6 }
}
```

允许动作：`retrieve`、`gen_quiz`、`draw_pattern`、`grade_answer`、`clarify`、`final_answer`。

`final_answer`：

```json
{
  "thought": "...",
  "action": "final_answer",
  "actionInput": {
    "answerText": "中文回答",
    "citationChunkKeys": ["diff_jiaola_01"],
    "relatedQuestions": ["夹缬和灰缬有什么不同？"],
    "suggestedPrompts": ["考我一道辨析题"]
  }
}
```

安全阀：最多 3 次模型调用 / 3 次工具调用；重复工具+参数会被拦截；引用必须来自本轮证据；失败时返回服务不可用，不生成模拟答案。

## 5. 服务可用性与登录

- 生产默认 `allow-offline-fallback=false`：没有模型或网络时，模块 5/6 的智能接口返回「服务未配置/暂时不可用」，不使用模拟数据进行伪装。
- `AI_ALLOW_OFFLINE_FALLBACK=true` 仅用于测试环境，可启用本地哈希向量和规则 planner。
- 模块 5/6 页面与接口要求登录：未登录访问页面跳转 `index.html?loginRequired=1`，接口返回 HTTP 401。
- 检索不到知识时仍然明确说“知识库暂未收录”，不编答案。
- 判题始终由服务端完成，不依赖 LLM。
- 所有响应保留 `mode` / `degraded` 字段；在线成功时为 `online` / `false`。

## 6. 数据库表

| 表 | 作用 |
|---|---|
| `dye_knowledge_chunk` | 知识分片、分类、关键词、来源、embedding JSON、模型名/维度 |
| `agent_session` | 模块 5/6 共享会话 |
| `diy_generate_record` | 模块 5 生成快照、参数、引用、重试次数、耗时 |
| `agent_quiz_question` | 动态生成题、正确答案（仅服务端）、作答状态 |
| `user_quiz_stat` | 按 actor + topic 的答题画像、掌握度、下一题难度 |
| `agent_chat_history` | 单条对话消息与卡片 JSON |
| `agent_trace` | ReAct 动作、工具、耗时、截断后的 payload |

完整建表脚本：`db/agent-rag-init.sql`；全新库也可直接执行 `db/mysql-init.sql`（已包含这些表）。

## 7. 配置

```text
AI_MODE=auto|dashscope|offline
DASHSCOPE_API_KEY=...
DASHSCOPE_CHAT_MODEL=qwen3.7-plus
DASHSCOPE_EMBEDDING_MODEL=qwen3.7-text-embedding
DASHSCOPE_ENABLE_THINKING=false
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_NATIVE_BASE_URL=https://dashscope.aliyuncs.com/api/v1
AI_ALLOW_OFFLINE_FALLBACK=false
REQUIRE_LOGIN=true
RAG_REINDEX_TOKEN=...
```

有 Key 且在线时，启动会调用远程 embedding 重建/补齐向量；模型或维度变化会自动全量重建，避免不同模型向量混用。

## 8. 性能与错误兜底

- 默认 `enable-thinking: false`。qwen3.7-plus 开启思考模式时会额外生成 reasoning token，实测同一请求慢 2–4 倍；关闭后仍保留完整 JSON 输出能力。
- 单次模型调用 `request-timeout: 20s`；模块 5 另有总预算，超时直接返回服务不可用。
- 模块 6：明确的出题/画纹样意图会强制走工具；工具产出卡片后直接给确定性收尾，不再多调一次模型。
- 启动时知识库仍在做远程向量化，RAG 请求会等待索引就绪（最多 20s），避免把空索引误判成“未收录”。
- 模型异常会转成明确的服务不可用提示或业务错误；不会再因为未捕获异常直接抛“服务器开小差了”。
- 如果还嫌慢，可把 `DASHSCOPE_CHAT_MODEL` 改成 `qwen3.7-flash`（实测短请求约 0.6s，plus 约 1.2s），代价是复杂回答略弱。
