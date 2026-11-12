<template>
<a class="skip-link" href="#main-content">跳到主要内容</a>
  <canvas class="dye-canvas" id="dyeCanvas" aria-hidden="true"></canvas>
  <div class="paper-grain" aria-hidden="true"></div>

  <header class="site-header" id="siteHeader">
    <div class="nav-shell">
      <a class="brand" href="/home" aria-label="苍洱纹册首页">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48">
            <path d="M24 4.5C19.4 13 13.2 20 13.2 28.1a10.8 10.8 0 1 0 21.6 0C34.8 20 28.6 13 24 4.5Z"/>
            <path class="brand-mark-line" d="M18 28.2c2.7-1.9 4.2-4.1 4.5-6.8M24 34.5c.2-6.1 2.9-10.6 8.2-13.5"/>
          </svg>
        </span>
        <span class="brand-copy">
          <strong>苍洱纹册</strong>
        </span>
      </a>

      <nav class="main-nav" id="mainNav" aria-label="主导航">
        <a href="/home">首页</a>
        <a href="/home#modules">六个展区</a>
        <a href="/diy">扎染实验室</a>
        <a href="/timeline">工艺长卷</a>
        <a class="is-active" href="/pattern" aria-current="page">智染研习社</a>
        <a href="/quiz">问蓝知染</a>
        <a href="/map">寻迹地图</a>
        <a href="/gallery">作品墙</a>
        <a class="mobile-login" href="/login">登录 / 注册</a>
      </nav>

      <div class="header-actions">
        <span class="visitor-state"><i></i>访客漫游中</span>
        <a class="header-login" href="/login">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="3.2"></circle>
            <path d="M5.5 20c.6-4 2.7-6 6.5-6s5.9 2 6.5 6"></path>
          </svg>
          登录 / 注册
        </a>
        <button class="menu-button" id="menuButton" type="button" aria-expanded="false" aria-controls="mainNav" aria-label="打开菜单">
          <span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <main class="standalone-main" id="main-content">
    <section class="atlas-section" aria-labelledby="pattern-title">
      <header class="atlas-heading">
        <div>
          <h1 id="pattern-title">智染研习社</h1>
        </div>
      </header>

<div id="modal-pattern" class="page-modal">
  <div class="modal-content">
    

    
    <div id="m3-entry" class="m3-view active">
      <h2 class="modal-title">智染研习社 · 图鉴 / 竞答 / 剧本杀</h2>
      <div class="m3-entry-buttons">
        <button
          type="button"
          class="m3-entry-btn m3-entry-btn-quiz"
          @click="window.module3.enterQuiz()"
        >
          <span class="m3-entry-btn-title">📚 知识竞答</span>
          <span class="m3-entry-btn-sub">答对解锁纹样卡牌</span>
        </button>
        <button
          type="button"
          class="m3-entry-btn m3-entry-btn-scenario"
          @click="window.module3.enterScenarios()"
        >
          <span class="m3-entry-btn-title">🎭 情境剧本杀</span>
          <span class="m3-entry-btn-sub">三个情景等你来破局</span>
        </button>
        <button
          type="button"
          class="m3-entry-btn m3-entry-btn-awards"
          @click="window.module3.openAwards()"
        >
          <span class="m3-entry-btn-title">🏆 我的成就</span>
          <span class="m3-entry-btn-sub">查看剧本杀通关勋章</span>
        </button>
      </div>
      <div class="gallery-wrapper">
        <h3>我的图鉴</h3>
        <div id="pattern-grid" class="pattern-grid">
          
        </div>
      </div>
    </div>

    
    <div id="m3-quiz" class="m3-view">
      <div class="m3-view-head">
        <button
          type="button"
          class="m3-back-btn"
          @click="window.module3.backToEntry()"
        >
          ← 返回
        </button>
        <h2 class="modal-title">知识竞答</h2>
        <span class="m3-view-tip">答对一题，解锁一张纹样卡牌</span>
      </div>
      <div class="quiz-wrapper">
        <div id="quiz-container">
          <p id="quiz-question">加载题目中...</p>
          <div id="quiz-options" class="quiz-options"></div>
          <p id="quiz-feedback" class="quiz-feedback"></p>
        </div>
      </div>
    </div>

    
    <div id="m3-scenario" class="m3-view">
      <div class="m3-view-head">
        <button
          type="button"
          class="m3-back-btn"
          @click="window.module3.backToEntry()"
        >
          ← 返回
        </button>
        <h2 class="modal-title">情境剧本杀</h2>
        <span class="m3-view-tip">选择一个情景，向右框 AI 提问破局</span>
      </div>
      <div id="m3-scenario-menu" class="m3-scenario-menu"></div>

      <div id="m3-scenario-play" class="m3-scenario-play">
        <div class="m3-play-head">
          <h3 id="m3-scenario-title"></h3>
          <span id="m3-scenario-hint" class="m3-scenario-hint"></span>
          <div id="m3-countdown" class="m3-countdown">
            <span class="m3-countdown-num"></span>
            <div class="m3-countdown-track">
              <div class="m3-countdown-bar"></div>
            </div>
          </div>
        </div>
        <div class="m3-play-layout">
          <div class="m3-stage-wrap">
            <div id="m3-stage" class="m3-stage"></div>
            <button
              type="button"
              id="m3-stage-next"
              class="m3-stage-next"
              @click="window.module3.nextDialogue()"
            >
              继续剧情 →
            </button>
          </div>
          <div class="m3-ask-wrap">
            <div class="m3-ask-head">
              向 <span id="m3-ask-role">传承人</span> 提问
            </div>
            <div id="m3-ask-log" class="m3-ask-log"></div>
            <div class="m3-ask-input-row">
              <input
                id="m3-ask-input"
                type="text"
                maxlength="500"
                placeholder="输入你的问题…"
                @keydown="$event.key==='Enter' && window.module3.askScenario()"
              />
              <button type="button" @click="window.module3.askScenario()">
                提问
              </button>
            </div>
          </div>
        </div>
        <div id="m3-rescue-canvas-wrap" class="m3-rescue-canvas-wrap">
          <canvas id="m3-rescue-canvas"></canvas>
          <p id="m3-rescue-status" class="m3-rescue-status"></p>
        </div>
      </div>
    </div>

    
    <div id="m3-awards" class="m3-view">
      <div class="m3-view-head">
        <button
          type="button"
          class="m3-back-btn"
          @click="window.module3.backToEntry()"
        >
          ← 返回
        </button>
        <h2 class="modal-title">我的成就</h2>
        <span class="m3-view-tip">通关剧本杀情景，收集成就勋章</span>
      </div>
      <div id="m3-awards-grid" class="m3-awards-grid">
        
      </div>
    </div>
  </div>

  
  <div id="m3-award-overlay" class="m3-overlay">
    <div class="m3-award-card">
      <div class="m3-award-icon" id="m3-award-icon">🏅</div>
      <div class="m3-award-title">成就解锁</div>
      <div class="m3-award-name" id="m3-award-name">火眼金睛</div>
      <div class="m3-award-desc" id="m3-award-desc"></div>
      <button type="button" @click="window.module3.closeAward()">
        收下成就
      </button>
      <button
        type="button"
        id="m3-award-replay"
        class="m3-award-replay"
        style="display: none;"
        @click="window.module3.replayRescueAnimation()"
      >
        再看一次动画
      </button>
    </div>
  </div>

  
  <div id="m3-pattern-card-overlay" class="m3-overlay">
    <div class="m3-pattern-card">
      <img id="m3-pattern-card-img" alt="纹样" loading="lazy" decoding="async" />
      <h4 id="m3-pattern-card-name"></h4>
      <p id="m3-pattern-card-meaning" class="m3-pattern-card-meaning"></p>
      <p id="m3-pattern-card-desc" class="m3-pattern-card-desc"></p>
      <button type="button" @click="window.module3.closePatternCard()">
        收下纹样
      </button>
    </div>
  </div>

  
  <div id="m3-challenge-overlay" class="m3-overlay">
    <div class="m3-challenge-card">
      <div class="m3-challenge-title">闯关答题</div>
      <p id="m3-challenge-question" class="m3-challenge-question"></p>
      <input
        id="m3-challenge-input"
        type="text"
        maxlength="120"
        placeholder="输入你的答案…"
        @keydown="$event.key==='Enter' && window.module3.submitChallenge()"
      />
      <p id="m3-challenge-feedback" class="m3-challenge-feedback"></p>
      <p id="m3-challenge-hint" class="m3-challenge-hint"></p>
      <div class="m3-challenge-actions">
        <button
          type="button"
          class="m3-challenge-ask"
          @click="window.module3.askTutorFromChallenge()"
        >
          向 <span id="m3-challenge-role">传承人</span> 提问 →
        </button>
        <button
          type="button"
          id="m3-challenge-submit"
          class="m3-challenge-submit"
          @click="window.module3.submitChallenge()"
        >
          提交
        </button>
      </div>
    </div>
  </div>
</div>
    </section>
  </main>

<footer class="site-footer">
    <div class="footer-brand">
      <a class="brand invert" href="/home" aria-label="苍洱纹册首页">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48">
            <path d="M24 4.5C19.4 13 13.2 20 13.2 28.1a10.8 10.8 0 1 0 21.6 0C34.8 20 28.6 13 24 4.5Z"/>
            <path class="brand-mark-line" d="M18 28.2c2.7-1.9 4.2-4.1 4.5-6.8M24 34.5c.2-6.1 2.9-10.6 8.2-13.5"/>
          </svg>
        </span>
        <span class="brand-copy"><strong>苍洱纹册</strong></span>
      </a>
      <p>让一匹蓝布，继续讲述<br>苍山洱海间的非遗故事。</p>
    </div>
    <div class="footer-nav">
      <div>
        <span>探索</span>
        <a href="/home#modules">六大展区</a>
        <a href="/diy">扎染实验室</a>
        <a href="/timeline">工艺长卷</a>
        <a href="/pattern">智染研习社</a>
        <a href="/quiz">问蓝知染</a>
        <a href="/map">寻迹地图</a>
        <a href="/gallery">作品墙</a>
      </div>
      <div>
        <span>连接</span>
        <a href="/login">登录 / 注册</a>
        <a href="/home">返回首页</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>云南大理 · 白族扎染数字科普站</span>
    </div>
  </footer>
</template>

<script setup>
import { onMounted } from 'vue'
import '@/legacy/module3'
import { initPage } from '@/legacy/app'

onMounted(() => {
  initPage()
  window.loadPatterns()
})
</script>
