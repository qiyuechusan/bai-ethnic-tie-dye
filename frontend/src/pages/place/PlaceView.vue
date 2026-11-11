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
        <span class="brand-copy"><strong>苍洱纹册</strong></span>
      </a>
      <nav class="main-nav" id="mainNav" aria-label="主导航">
        <a href="/home">首页</a>
        <a href="/home#modules">六个展区</a>
        <a href="/timeline">工艺长卷</a>
        <a class="is-active" href="/map">寻迹地图</a>
        <a href="/pattern">智染研习社</a>
        <a href="/home#about">关于扎染</a>
        <a class="mobile-login" href="/login">登录 / 注册</a>
      </nav>
      <div class="header-actions">
        <span class="visitor-state"><i></i>访客漫游中</span>
        <a class="header-login" href="/login">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"></circle><path d="M5.5 20c.6-4 2.7-6 6.5-6s5.9 2 6.5 6"></path></svg>
          登录
        </a>
        <button class="menu-button" id="menuButton" type="button" aria-expanded="false" aria-controls="mainNav" aria-label="打开菜单">
          <span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <main class="standalone-main place-detail-main" id="main-content">
    <section class="place-detail-shell">
      <aside class="place-detail-profile">
        <div>
          <a class="detail-back" id="detailBackMap" href="/map">
            <span aria-hidden="true">←</span>
            回到苍洱寻迹
          </a>
          <p class="place-detail-kicker" id="detailKicker">正在展开地方手记</p>
          <h1 id="detailName">苍洱染迹</h1>
          <p class="place-detail-lead" id="detailLead">
            沿着一匹蓝布，走进村落、院落与日常生活。
          </p>
        </div>

          <figure class="place-detail-photo">
          <img id="detailPhoto" src="/assets/zhoucheng.jpg" alt="白族扎染地点实景">
          <button type="button" class="photo-nav-btn prev" id="photoPrevBtn" aria-label="上一张图片">←</button>
          <button type="button" class="photo-nav-btn next" id="photoNextBtn" aria-label="下一张图片">→</button>
          <span class="detail-photo-index" id="detailIndex">1 / 3</span>
          <figcaption id="detailCaption">云南大理 · 白族扎染文化现场</figcaption>
        </figure>

        <blockquote class="detail-profile-quote">
          <span>在地絮语</span>
          <p id="placeQuote">白族女儿会说话就会唱歌，会走路就会跳舞。</p>
        </blockquote>
          <div class="detail-extra-story">
          
          <h3 class="detail-story-title">故事· <span id="detailStoryTitle">正在展开...</span></h3>
          <p class="detail-story-desc" id="detailStoryDesc">
            正在加载地方故事...
          </p>
          <figure class="detail-story-figure">
            
            <img id="detailStoryImg" src="/assets/zhoucheng-story.jpg" alt="在地故事实景">
            <figcaption>日常生活中的扎染图景</figcaption>
          </figure>
        </div>
      </aside>

      <section class="place-detail-workbench">
        <header class="detail-workbench-head">
        </header>

        <nav class="detail-tab-bar" role="tablist" aria-label="地方手记内容">
          <button class="tab-btn is-active" type="button" role="tab" aria-selected="true" @click="switchTab('story', $event.currentTarget)">地方故事</button>
          <button class="tab-btn" type="button" role="tab" aria-selected="false" @click="switchTab('itinerary', $event.currentTarget)">游览指南</button>
          <button class="tab-btn" type="button" role="tab" aria-selected="false" @click="switchTab('dye', $event.currentTarget)">植物染</button>
          <button class="tab-btn" type="button" role="tab" aria-selected="false" @click="switchTab('culture', $event.currentTarget)">纹样民俗</button>
          <button class="tab-btn" type="button" role="tab" aria-selected="false" @click="switchTab('data', $event.currentTarget)">产业数据</button>
        </nav>

        <div class="detail-tab-window">
          <div id="tab-story" class="tab-content detail-story-panel" style="display: block;">
              <div class="detail-story-heading">
              <span class="detail-section-number">01</span>
              <div>
                <p class="detail-section-kicker"></p>
                <h2>苍山脚下，<br>这座城的故事。</h2>
              </div>
            </div>
            <p class="detail-story-note" id="detailNote">先看一双手怎样把线缝进布里，再看蓝如何在空气里慢慢显出来。</p>
                  <div class="detail-record-grid">
          <button type="button" @click="showExploreModal('master')" style="text-align:left; cursor:pointer; border:0; background:transparent; padding:0;" class="detail-record-card">
            <article style="width:100%; height:100%; border:0; margin:0;">
              <span>传承人</span>
              <p id="placeMaster">--</p>
            </article>
          </button>

          <button type="button" @click="showExploreModal('pattern')" style="text-align:left; cursor:pointer; border:0; background:transparent; padding:0;" class="detail-record-card">
            <article style="width:100%; height:100%; border:0; margin:0;">
              <span>特色纹样</span>
              <p id="placePattern">--</p>
            </article>
          </button>

          <button type="button" @click="showExploreModal('see')" style="text-align:left; cursor:pointer; border:0; background:transparent; padding:0;" class="detail-record-card">
            <article style="width:100%; height:100%; border:0; margin:0;">
              <span>到了看什么</span>
              <p id="detailSee">--</p>
            </article>
          </button>

          <button type="button" @click="showExploreModal('now')" style="text-align:left; cursor:pointer; border:0; background:transparent; padding:0;" class="detail-record-card">
            <article style="width:100%; height:100%; border:0; margin:0;">
              <span>今日图景</span>
              <p id="detailNow">--</p>
            </article>
          </button>
        </div>
          </div>

                   <div id="tab-itinerary" class="tab-content" style="display: none;">
            <div class="detail-editorial-row" style="grid-template-columns: 1fr 1fr; gap: 30px; align-items: start;">

              
              <div>
                <p class="detail-section-kicker"></p>
                <h2>去这里，可以做这四件事。</h2>

                <div id="tourChecklist" class="tour-checklist"></div>

                <a class="detail-inline-link" id="detailMapLink" href="/map?place=zhoucheng" style="margin-top: 20px;">在地图上看看 <span>↗</span></a>
              </div>

              
              <div class="tour-right-panel">
                
                <div id="tourPhotoEmpty" class="tour-photo-empty">
                  <span>点击左侧任务<br>解锁实景</span>
                </div>
                
                <img id="tourPhotoReveal" src="" alt="解锁实景" class="tour-photo-reveal" style="display: none;">

                               
                <div id="tourAchievement" class="tour-achievement" style="display: none;">
                  
                  <div class="achievement-seal">
                    <div>非</div><div>遗</div>
                    <div>达</div><div>人</div>
                  </div>
                  
                  <p>恭喜你解锁了【<span id="achievementPlace"></span>寻蓝】全部打卡！</p>
                </div>
              </div>

            </div>
          </div>

                           <div id="tab-dye" class="tab-content" style="display: none;">
            <div class="detail-editorial-row" style="grid-template-columns: 1.1fr 0.9fr; gap: 40px; align-items: start;">

              
              <div class="dye-science-text">
                <p class="detail-section-kicker"></p>
                <h2>这抹蓝，究竟是哪里来的？</h2>

                <div class="dye-text-block">
                  <h3>1. 植物的发酵与沉淀</h3>
                  <p>白族扎染的蓝取自板蓝根等植物。村民采摘茎叶，将其浸泡在水中发酵。在这个过程中，植物里的吲哚酚会游离出来。随后加入石灰水（碱性），通过打靛使其沉淀，最终得到深蓝色的“靛泥”。</p>
                </div>

                <div class="dye-text-block">
                  <h3>2. 神奇的氧化还原反应</h3>
                  <p>浸染后的布面刚出缸时，呈现的是黄绿色。这是因为此时的靛蓝处于“隐色体”状态，溶解在染液中。接触空气中的氧气后，它才会慢慢氧化，分子结构改变，最终变成深邃的靛蓝色。</p>
                </div>

                <div class="dye-text-block">
                  <h3>3. 物理防染的东方智慧</h3>
                  <p>那白族花纹是怎么来的？其实原理极其简单：靠“扎”。用线把布紧紧扎起来，被线缚住的地方染液进不去，就留住了布原本的白。拆线后，蓝底白花便如变魔术般显现出来。</p>
                </div>
              </div>

              
              <div class="dye-right-col">
                
                <figure class="dye-top-image">
                  <img src="/assets/indigo-vat.jpg" alt="植物染料和染缸">
                  <figcaption>传统植物制靛与染缸</figcaption>
                </figure>

                
                <div class="dye-slider-container">
                  <label>拖动滑块，吹入空气，见证氧化显色：</label>
                  <input type="range" min="0" max="100" value="0" id="oxidationSlider" class="dye-slider">
                  <div class="dye-slider-labels">
                    <span>刚出缸 (黄绿)</span>
                    <span>风中氧化</span>
                    <span>最终显色</span>
                  </div>
                </div>

                <div class="dye-simulator-panel">
                  <div class="dye-cloth-sim" id="dyeClothSim">
                    <span class="dye-text" id="dyeStatusText">黄绿色 · 湿润</span>
                    <div class="dye-pattern-hole"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>

                <div id="tab-culture" class="tab-content" style="display: none;">
            <div class="detail-editorial-row" style="grid-template-columns: 1fr; gap: 20px; align-items: start;">

              <div>
                <p class="detail-section-kicker"></p>
                <h2>不仅是布，更是白族人的史诗。</h2>
                <p class="detail-body-copy" style="max-width: 800px;">
                  扎染纹样进入婚嫁、节庆与日常服饰。蝴蝶纹承载创世想象，梅花纹寄托坚韧，几何连续纹则让布面像一段不断延伸的生活叙事。
                </p>
                <p class="detail-body-copy" style="max-width: 800px; font-size: 13px; color: #8a9695; margin-top: 10px;">
                  👉 互动提示：将鼠标悬停在下方卡片上（或点击），可翻开纹样卡片，了解其背后的民俗寓意。
                </p>
              </div>


              <div class="pattern-cards-grid" id="patternCardsContainer">

              </div>
              </div>


            </div>

                    <div id="tab-data" class="tab-content" style="display: none;">
            <div class="detail-data-heading">
              <div>
                <p class="detail-section-kicker"></p>
                <h2>扎染给这里留下了什么？</h2>
              </div>
              <button type="button" class="data-badge-btn" @click="alert('当前数据为线上抓取与线下访谈综合评估，部分年产值数据正在进一步调研中。')">数据看板</button>
            </div>

                    
            <div class="detail-stats" aria-label="扎染产业微数据">
              
              <div @click="showDataModal('workers')" style="cursor: pointer;">
                <span>👥 从业人数</span>
                <strong id="detailWorkers">--</strong>
                <small>人</small>
              </div>
              
              <div @click="showDataModal('workshops')" style="cursor: pointer;">
                <span>🏠 经营作坊</span>
                <strong id="detailWorkshops">--</strong>
                <small>家</small>
              </div>
              
              <div @click="showDataModal('output')" style="cursor: pointer;">
                <span>💰 年产值</span>
                <strong id="detailOutput">待调研</strong>
                <small id="detailOutputUnit"></small>
              </div>
            </div>

            <p class="detail-data-note" id="detailSourceNote">数据口径加载中</p>

            
            <div class="industry-chart-container">
              <div class="chart-header">
                <span>近五年非遗研学体验人次趋势</span>
                <small>数据示意 · 单位：万人次</small>
              </div>
              <div id="industryChart" style="width: 100%; height: 220px; margin-top: 15px;"></div>
            </div>

          </div>
        </div>

        <footer class="detail-workbench-footer">
          <a id="detailPrevious" href="/map"><span>←</span><small>上一处</small><strong>返回地图</strong></a>
          <a id="detailNext" href="/map"><small>下一处</small><strong>继续寻蓝</strong><span>→</span></a>
        </footer>
      </section>
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
        <a href="/map">寻迹地图</a>
        <a href="/timeline">工艺长卷</a>
        <a href="/pattern">智染研习社</a>
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
  
  
  <div class="heritage-modal" id="exploreModal" hidden>
    <button class="puzzle-backdrop" type="button" @click="closeExploreModal()" aria-label="关闭"></button>
    <section class="puzzle-card" role="dialog" aria-modal="true" style="max-height: 85vh; display: flex; flex-direction: column;">
      <button class="puzzle-close" type="button" @click="closeExploreModal()" aria-label="关闭">×</button>

      <p class="puzzle-card-kicker" id="exploreModalKicker">田野手记 · 详细档案</p>
      <h2 id="exploreModalTitle" style="margin-bottom: 15px;">传承人</h2>

      
      <div id="exploreModalContent" style="flex: 1; overflow-y: auto; padding-right: 8px; scrollbar-width: thin;">
        
      </div>
      

      <div class="puzzle-actions" style="margin-top: 15px; flex-shrink: 0;">
        <button type="button" @click="closeExploreModal()">收好档案</button>
      </div>
    </section>
  </div>

  
  
  <div class="heritage-modal" id="dataModal" hidden>
    <button class="puzzle-backdrop" type="button" @click="closeDataModal()" aria-label="关闭"></button>
    <section class="puzzle-card" role="dialog" aria-modal="true" style="max-height: 85vh; display: flex; flex-direction: column; width: min(92vw, 600px);">
      <button class="puzzle-close" type="button" @click="closeDataModal()" aria-label="关闭">×</button>
      <p class="puzzle-card-kicker" id="dataModalKicker">周城 · 产业数据档案</p>
      <h2 id="dataModalTitle" style="margin-bottom: 15px;">从业人数</h2>

      
      <div id="dataModalChart" style="width: 100%; height: 200px; margin-bottom: 20px;"></div>

      
      <div id="dataModalText" style="color: #5c6f73; font-size: 15px; line-height: 1.8; text-align: justify; overflow-y: auto;">
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { loadEcharts } from '@/lib/echarts'
import { initPlaceExtras } from '@/legacy/place'
import { initPage } from '@/legacy/app'

onMounted(async () => {
  await loadEcharts()
  initPage()
  initPlaceExtras()
})
</script>
