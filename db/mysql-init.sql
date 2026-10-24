-- ============================================================
-- 蓝白之境 · 白族扎染数字科普站
-- MySQL 8 初始化脚本（交付 / 答辩用）
--
-- 说明：
--   1. 日常开发只需启动 Spring Boot，JPA ddl-auto=update 会自动建表，
--      DataInitializer 会在表为空时写入演示数据。
--   2. 本脚本用于一次性建库，方便老师在全新环境里核对表结构。
--   3. 本脚本只建表，不重复写种子数据；种子由 DataInitializer 负责，
--      避免两处种子同时写入造成重复。
--   4. 如果已经用本脚本建表，可把环境变量 SPRING_PROFILES_ACTIVE 保持为
--      mysql，ddl-auto=update 不会破坏已有数据；DataInitializer 仍是幂等的。
-- ============================================================

CREATE DATABASE IF NOT EXISTS baizu_tiedye
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE baizu_tiedye;

-- ---------- 登录与会话（原 Node server.js / SQLite） ----------
CREATE TABLE IF NOT EXISTS app_user (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  display_name  VARCHAR(20)  NOT NULL,
  account       VARCHAR(120) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  created_at    DATETIME(6)  NOT NULL,
  last_login_at DATETIME(6)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_app_user_account (account)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_session (
  token_hash CHAR(64)    NOT NULL,
  user_id    BIGINT      NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  PRIMARY KEY (token_hash),
  KEY idx_session_expiry (expires_at),
  KEY idx_session_user (user_id),
  CONSTRAINT fk_session_user FOREIGN KEY (user_id)
    REFERENCES app_user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- 模块 3：纹样图鉴 ----------
CREATE TABLE IF NOT EXISTS pattern (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  name        VARCHAR(50)  NOT NULL,
  image_url   VARCHAR(255) NOT NULL,
  meaning     VARCHAR(255) NULL,
  category    VARCHAR(32)  NULL,
  description TEXT         NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- 模块 4：作品墙 ----------
CREATE TABLE IF NOT EXISTS artwork (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  title       VARCHAR(100) NOT NULL,
  image_url   VARCHAR(255) NOT NULL,
  description TEXT         NULL,
  tie_method  VARCHAR(32)  NULL,
  author_name VARCHAR(50)  NULL,
  status      TINYINT      NOT NULL DEFAULT 0,
  likes       INT          NOT NULL DEFAULT 0,
  created_at  DATETIME(6)  NOT NULL,
  PRIMARY KEY (id),
  KEY idx_artwork_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- 模块 3：纹样图鉴题库 ----------
-- 模块 5 的 dye_tie_method、模块 6 的 knowledge_chunk / quiz_confuse_pair 已移除
CREATE TABLE IF NOT EXISTS quiz_question (
  id          BIGINT      NOT NULL AUTO_INCREMENT,
  stem        TEXT        NOT NULL,
  category    VARCHAR(32) NOT NULL,
  difficulty  INT         NOT NULL DEFAULT 1,
  explanation TEXT        NOT NULL,
  scope       VARCHAR(16) NOT NULL DEFAULT 'pattern',
  pattern_id  BIGINT      NULL,
  sort_order  INT         NOT NULL DEFAULT 0,
  enabled     TINYINT(1)  NOT NULL DEFAULT 1,
  created_at  DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_quiz_scope (scope),
  KEY idx_quiz_pattern (pattern_id),
  CONSTRAINT fk_quiz_pattern FOREIGN KEY (pattern_id)
    REFERENCES pattern (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quiz_option (
  id          BIGINT      NOT NULL AUTO_INCREMENT,
  question_id BIGINT      NOT NULL,
  option_key  VARCHAR(1)  NOT NULL,
  content     TEXT        NOT NULL,
  is_correct  TINYINT(1)  NOT NULL DEFAULT 0,
  sort_order  INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_quiz_option (question_id, option_key),
  CONSTRAINT fk_option_question FOREIGN KEY (question_id)
    REFERENCES quiz_question (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- 模块 5：非遗地图（原 db/postgres.sql） ----------
CREATE TABLE IF NOT EXISTS map_place (
  id            VARCHAR(32)  NOT NULL,
  name          VARCHAR(50)  NOT NULL,
  kicker        VARCHAR(100) NOT NULL,
  `lead`        TEXT         NOT NULL,
  highlight     VARCHAR(255) NOT NULL,
  person        VARCHAR(100) NOT NULL,
  current_state VARCHAR(255) NOT NULL,
  note          TEXT         NOT NULL,
  photo         VARCHAR(255) NOT NULL,
  latitude      DECIMAL(8,5) NOT NULL,
  longitude     DECIMAL(8,5) NOT NULL,
  map_x         DECIMAL(6,2) NOT NULL,
  map_y         DECIMAL(6,2) NOT NULL,
  map_scale     DECIMAL(4,2) NOT NULL,
  sort_order    INT          NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS map_stat (
  place_id      VARCHAR(32)  NOT NULL,
  workers       INT          NOT NULL,
  workshops     INT          NOT NULL,
  annual_output VARCHAR(32)  NULL,
  source_note   VARCHAR(255) NOT NULL,
  updated_at    DATE         NOT NULL,
  PRIMARY KEY (place_id),
  CONSTRAINT fk_stat_place FOREIGN KEY (place_id)
    REFERENCES map_place (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 已有旧库的迁移片段（全新库不需要执行）：
--
-- ALTER TABLE quiz_question
--   ADD COLUMN scope      VARCHAR(16) NOT NULL DEFAULT 'knowledge',
--   ADD COLUMN pattern_id BIGINT NULL,
--   ADD KEY idx_quiz_scope (scope),
--   ADD CONSTRAINT fk_quiz_pattern FOREIGN KEY (pattern_id)
--     REFERENCES pattern(id) ON DELETE SET NULL;
--
-- ALTER TABLE quiz_option
--   ADD UNIQUE KEY uk_quiz_option (question_id, option_key);
-- ============================================================

-- ============================================================
-- 蓝白之境 · 模块 5/6：手写 RAG + ReAct Agent
-- 全新库直接执行本段；已有库只执行 db/agent-rag-init.sql 即可
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
