-- ============================================================
-- 蓝白之境 · 模块 5/6：手写 RAG + ReAct Agent
-- 已有数据库升级脚本（全新库可直接执行 db/mysql-init.sql）
--
-- 说明：
--   1. 向量以 JSON 数组文本存入 dye_knowledge_chunk.embedding，
--      检索时由后端反序列化并在内存计算余弦相似度。
--   2. 旧的 knowledge_chunk 已移除；quiz_question 只保留模块 3 的 pattern 题库。
--   3. 本脚本只建表；知识分片与会话由启动器幂等写入。
-- ============================================================

USE baizu_tiedye;

CREATE TABLE IF NOT EXISTS dye_knowledge_chunk (
  id              BIGINT       NOT NULL AUTO_INCREMENT,
  chunk_key       VARCHAR(80)  NOT NULL,
  category        VARCHAR(32)  NOT NULL,
  title           VARCHAR(200) NOT NULL,
  content         TEXT         NOT NULL,
  keywords        VARCHAR(500) NULL,
  metadata_json   LONGTEXT     NULL,
  source          VARCHAR(500) NULL,
  source_url      VARCHAR(500) NULL,
  confidence      VARCHAR(8)   NOT NULL DEFAULT 'B',
  chunk_role      VARCHAR(24)  NOT NULL DEFAULT 'fact',
  embedding       LONGTEXT     NULL,
  embedding_model VARCHAR(64)  NULL,
  embedding_dim   INT          NULL,
  content_hash    VARCHAR(64)  NULL,
  enabled         TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME(6)  NOT NULL,
  updated_at      DATETIME(6)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_dkc_chunk_key (chunk_key),
  KEY idx_dkc_category_enabled (category, enabled),
  KEY idx_dkc_role (chunk_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS agent_session (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  session_key  VARCHAR(64)  NOT NULL,
  user_id      BIGINT       NULL,
  kind         VARCHAR(16)  NOT NULL,
  title        VARCHAR(120) NULL,
  summary      TEXT         NULL,
  context_json LONGTEXT     NULL,
  turn_count   INT          NOT NULL DEFAULT 0,
  degraded     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   DATETIME(6)  NOT NULL,
  updated_at   DATETIME(6)  NOT NULL,
  expires_at   DATETIME(6)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_agent_session_key (session_key),
  KEY idx_agent_session_user (user_id, updated_at),
  KEY idx_agent_session_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS diy_generate_record (
  id                    BIGINT       NOT NULL AUTO_INCREMENT,
  session_id            BIGINT       NOT NULL,
  user_id               BIGINT       NULL,
  parent_id             BIGINT       NULL,
  prompt                TEXT         NULL,
  fabric                VARCHAR(16)  NULL,
  concentration         DECIMAL(4,2) NULL,
  canvas_width          INT          NULL,
  canvas_height         INT          NULL,
  renderer_type         VARCHAR(16)  NULL,
  motif_type            VARCHAR(32)  NULL,
  method_code           VARCHAR(48)  NULL,
  seed                  VARCHAR(16)  NULL,
  pattern_params_json   LONGTEXT     NULL,
  oxidation_params_json LONGTEXT     NULL,
  preview_colors_json   LONGTEXT     NULL,
  explanation           TEXT         NULL,
  citations_json        LONGTEXT     NULL,
  degraded              TINYINT(1)   NOT NULL DEFAULT 0,
  mode                  VARCHAR(16)  NULL,
  model                 VARCHAR(64)  NULL,
  validation_attempts   INT          NULL DEFAULT 0,
  latency_ms            INT          NULL,
  created_at            DATETIME(6)  NOT NULL,
  PRIMARY KEY (id),
  KEY idx_diy_gen_session (session_id, created_at),
  KEY idx_diy_gen_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS agent_quiz_question (
  id             BIGINT       NOT NULL AUTO_INCREMENT,
  quiz_key       VARCHAR(36)  NOT NULL,
  session_id     BIGINT       NOT NULL,
  actor_key      VARCHAR(96)  NULL,
  topic          VARCHAR(64)  NULL,
  difficulty     INT          NOT NULL,
  stem           TEXT         NOT NULL,
  options_json   LONGTEXT     NOT NULL,
  correct_key    CHAR(1)      NOT NULL,
  explanation    TEXT         NULL,
  citations_json LONGTEXT     NULL,
  origin         VARCHAR(16)  NULL,
  status         VARCHAR(16)  NULL,
  selected_key   CHAR(1)      NULL,
  correct        TINYINT(1)   NULL,
  answered_at    DATETIME(6)  NULL,
  created_at     DATETIME(6)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_aqq_quiz_key (quiz_key),
  KEY idx_aqq_session_status (session_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_quiz_stat (
  id              BIGINT      NOT NULL AUTO_INCREMENT,
  actor_key       VARCHAR(96) NOT NULL,
  user_id         BIGINT      NULL,
  session_id      BIGINT      NULL,
  topic           VARCHAR(64) NOT NULL,
  attempts        INT         NOT NULL DEFAULT 0,
  correct         INT         NOT NULL DEFAULT 0,
  streak          INT         NOT NULL DEFAULT 0,
  best_streak     INT         NOT NULL DEFAULT 0,
  last_difficulty INT         NULL,
  mastery         DOUBLE      NOT NULL DEFAULT 0.5,
  updated_at      DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_uqs_actor_topic (actor_key, topic),
  KEY idx_uqs_user (user_id),
  KEY idx_uqs_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS agent_chat_history (
  id           BIGINT      NOT NULL AUTO_INCREMENT,
  session_id   BIGINT      NOT NULL,
  turn_no      INT         NOT NULL,
  message_role VARCHAR(16) NOT NULL,
  content      TEXT        NULL,
  payload_json LONGTEXT    NULL,
  created_at   DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_ach_session_turn (session_id, turn_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS agent_trace (
  id           BIGINT      NOT NULL AUTO_INCREMENT,
  session_id   BIGINT      NOT NULL,
  turn_no      INT         NOT NULL,
  step_no      INT         NOT NULL,
  type         VARCHAR(24) NOT NULL,
  tool_name    VARCHAR(40) NULL,
  latency_ms   INT         NULL,
  token_in     INT         NULL,
  token_out    INT         NULL,
  payload_json LONGTEXT    NULL,
  created_at   DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_agt_session_turn (session_id, turn_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
