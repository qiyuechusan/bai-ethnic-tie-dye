<template>
<a class="skip-link" href="#main-content">跳到主要内容</a>
  <canvas class="dye-canvas" id="dyeCanvas" aria-hidden="true"></canvas>
  <div class="paper-grain" aria-hidden="true"></div>

  
  <header class="site-header" id="siteHeader">
    <div class="nav-shell">
      <a class="brand" href="/home" aria-label="苍洱纹册首页">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48"><path d="M24 4.5C19.4 13 13.2 20 13.2 28.1a10.8 10.8 0 1 0 21.6 0C34.8 20 28.6 13 24 4.5Z"/><path class="brand-mark-line" d="M18 28.2c2.7-1.9 4.2-4.1 4.5-6.8M24 34.5c.2-6.1 2.9-10.6 8.2-13.5"/></svg>
        </span>
        <span class="brand-copy"><strong>苍洱纹册</strong></span>
      </a>
      <nav class="main-nav" id="mainNav" aria-label="主导航">
        <a href="/home">首页</a>
        <a href="/home#modules">六个展区</a>
        <a href="/diy">扎染实验室</a>
        <a href="/timeline">工艺长卷</a>
        <a href="/pattern">智染研习社</a>
        <a href="/quiz">问蓝知染</a>
        <a class="is-active" href="/map" aria-current="page">寻迹地图</a>
        <a href="/gallery">作品墙</a>
      </nav>
      <div class="header-actions">
        <span class="visitor-state"><i></i>访客漫游中</span>
        <a class="header-login" href="/login">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"></circle><path d="M5.5 20c.6-4 2.7-6 6.5-6s5.9 2 6.5 6"></path></svg>登录 / 注册
        </a>
        <button class="menu-button" id="menuButton" type="button" aria-expanded="false" aria-controls="mainNav" aria-label="打开菜单"><span></span><span></span></button>
      </div>
    </div>
  </header>

  <main class="standalone-main" id="main-content">
    <section class="atlas-section" aria-labelledby="atlas-title">
      <header class="atlas-heading">
        <div>
          <p class="eyebrow"></p>
          <h1 id="atlas-title">循着蓝染印记，<br>看看三处扎染老地方。</h1>
        </div>
        <div class="atlas-intro">
          <span class="atlas-chapter">苍洱手记 · 地图 01</span>
          <p>点一盏染缸，听一段地方与人的故事。用右侧路线带，继续走向下一站。</p>
        </div>
      </header>

      <div class="atlas-layout">
        
        <div class="atlas-map-panel">
          <div class="atlas-toolbar">
            <span class="atlas-mode"><i></i>水墨地形 / 非遗寻迹</span>
            <span class="atlas-legend"><i class="legend-dot"></i>扎染传承地 <i class="legend-river"></i>苍洱水系</span>
          </div>

          <div class="atlas-viewport" id="atlasViewport">
            <div class="map-stage" id="mapStage">
              
              <svg class="ink-map" viewBox="0 0 1100 720" preserveAspectRatio="none" role="img" aria-label="大理白族扎染文化点位水墨示意图">
                <defs>
                  <filter id="mapWash" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="2" seed="8" result="noise"></feTurbulence><feDisplacementMap in="SourceGraphic" in2="noise" scale="9"></feDisplacementMap></filter>
                  <filter id="mapSoft"><feGaussianBlur stdDeviation="18"></feGaussianBlur></filter>
                  <pattern id="atlasGrid" width="52" height="52" patternUnits="userSpaceOnUse"><path d="M52 0H0V52" fill="none" stroke="#183f5d" stroke-opacity=".055" stroke-width="1"></path></pattern>
                  <linearGradient id="lakeWash" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b7d2d2" stop-opacity=".72"></stop><stop offset="1" stop-color="#dce7df" stop-opacity=".48"></stop></linearGradient>
                  <radialGradient id="mountainMist"><stop stop-color="#d9e5e1" stop-opacity=".8"></stop><stop offset="1" stop-color="#d9e5e1" stop-opacity="0"></stop></radialGradient>
                </defs>
                <rect width="1100" height="720" fill="#eef0e5"></rect>
                <rect width="1100" height="720" fill="url(#atlasGrid)"></rect>
                <ellipse cx="316" cy="352" rx="410" ry="275" fill="url(#mountainMist)" filter="url(#mapSoft)"></ellipse>
                <g class="mountain-contours" filter="url(#mapWash)">
                  <path d="M-50 210c102-94 168-76 225-21 48 46 107 10 149-55 53-82 128-101 196-41 58 51 95 46 153 13 87-48 168-18 230 70"></path>
                  <path d="M-60 260c99-76 169-58 223-6 51 49 119 12 164-48 55-75 120-84 180-28 57 53 104 51 168 15 78-43 150-16 207 62"></path>
                  <path d="M-40 321c90-69 161-47 212-2 54 48 122 22 167-31 57-67 124-67 183-14 59 54 105 49 172 17 74-36 148-2 194 66"></path>
                </g>
                <g class="ink-lake">
                  <path d="M364 346c44-84 141-138 259-137 121 1 221 61 262 151 40 89-2 180-98 226-94 45-217 32-304-17-83-47-157-137-119-223Z" fill="url(#lakeWash)"></path>
                  <path d="M430 341c44-46 102-67 176-61 68 5 127 34 170 83M410 411c51 19 80 13 119-8M499 506c54 15 95 10 135-11M593 274c43 27 87 34 135 19"></path>
                </g>
                <g class="atlas-water-lines">
                  <path d="M101 545c117-57 188-22 278 18 93 42 169 31 260-16 97-50 170-39 341 33"></path>
                  <path d="M64 578c112-42 194-15 279 21 95 40 182 32 270-11 106-51 188-31 380 50"></path>
                  <path d="M741 92c-42 92-32 155 12 215 45 61 51 128 13 205-27 56-61 91-111 123"></path>
                </g>
                <g class="atlas-roads">
                  <path d="M188 560c125-73 240-112 374-136 109-20 201-68 324-170"></path>
                  <path d="M268 229c95 66 190 113 299 155 93 36 174 87 254 167"></path>
                </g>
                <g class="atlas-labels">
                  <text x="105" y="156">苍山</text><text x="366" y="588">苍 山 余 脉</text><text x="664" y="365">洱海</text><text x="740" y="205">大 理 坝 子</text><text x="132" y="484">漾 濞</text><text x="800" y="615">巍 山</text>
                </g>
                <g class="map-route-line" aria-hidden="true">
                  <path data-route-segment="0" d="M585 326C545 360 482 407 449 451"></path>
                  <path data-route-segment="1" d="M449 451C560 500 687 490 820 552"></path>
                </g>
              </svg>

              
              <button class="place-marker" type="button" data-place="zhoucheng" style="--marker-x: 53.2%; --marker-y: 45.3%;" aria-label="查看周城">
                <span class="marker-wave"></span>
                <span class="marker-vat"><svg viewBox="0 0 44 52" aria-hidden="true"><path d="M8 18c1 16 5 25 14 27 9-2 13-11 14-27"></path><ellipse cx="22" cy="18" rx="14" ry="6"></ellipse><path d="M13 32c6 3 12 3 18 0"></path></svg></span>
                <span class="marker-label"><strong>周城</strong><small>扎染之乡</small></span>
              </button>
              <button class="place-marker" type="button" data-place="xizhou" style="--marker-x: 40.8%; --marker-y: 62.7%;" aria-label="查看喜洲">
                <span class="marker-wave"></span>
                <span class="marker-vat"><svg viewBox="0 0 44 52" aria-hidden="true"><path d="M8 18c1 16 5 25 14 27 9-2 13-11 14-27"></path><ellipse cx="22" cy="18" rx="14" ry="6"></ellipse><path d="M13 32c6 3 12 3 18 0"></path></svg></span>
                <span class="marker-label"><strong>喜洲</strong><small>白族院落</small></span>
              </button>
              <button class="place-marker" type="button" data-place="weishan" style="--marker-x: 74.5%; --marker-y: 76.6%;" aria-label="查看巍山">
                <span class="marker-wave"></span>
                <span class="marker-vat"><svg viewBox="0 0 44 52" aria-hidden="true"><path d="M8 18c1 16 5 25 14 27 9-2 13-11 14-27"></path><ellipse cx="22" cy="18" rx="14" ry="6"></ellipse><path d="M13 32c6 3 12 3 18 0"></path></svg></span>
                <span class="marker-label"><strong>巍山</strong><small>山地手作</small></span>
              </button>
            </div>
          </div>
        </div>

        
        <aside class="atlas-sidebar" id="atlasSidebar">
          <div class="atlas-sidebar-index">
            <span id="routeCount">01 / 03</span><span>沿苍洱寻蓝</span>
          </div>

          <div class="place-visual" id="placeVisual" data-place="zhoucheng">
            
            <div id="placeSketch">
              <span class="place-moon"></span><span class="place-mountain-back"></span>
              <span class="place-building"></span><span class="place-cloth cloth-a"></span>
              <span class="place-cloth cloth-b"></span><span class="place-figure"></span>
            </div>
            
            <img id="placePhoto" class="real-photo-layer" src="" alt="实景图" decoding="async">
            <span class="place-coordinate" id="placeCoordinate" style="z-index: 8;">坐标加载中...</span>
            <button id="togglePhotoBtn" class="toggle-photo-btn">看实景</button>
          </div>

          <div class="place-story">
            <div class="place-heading-row">
              <div>
                <p class="place-kicker" id="placeKicker">加载中...</p>
                <h2 id="placeName">--</h2>
              </div>
              <span class="place-heading-mark" id="placeHeadingMark" aria-hidden="true">染</span>
            </div>

            <div class="sidebar-tabs" role="tablist" aria-label="地点信息分类">
              <button class="sidebar-tab is-active" type="button" role="tab" aria-selected="true" data-map-tab="story">地方</button>
              <button class="sidebar-tab" type="button" role="tab" aria-selected="false" data-map-tab="voice">手记</button>
              <button class="sidebar-tab" type="button" role="tab" aria-selected="false" data-map-tab="data">数据</button>
            </div>

            <div class="sidebar-panels">
              <section class="sidebar-panel is-active" data-map-panel="story" role="tabpanel">
                <p class="place-lead" id="placeLead">--</p>
                                              <dl class="place-facts">
                  <div style="cursor:pointer;" @click="showExploreModal('master')" title="点击查看传承人详细档案">
                    <dt>代表性传承人</dt>
                    <dd>点击查看 &rarr;</dd>
                  </div>
                  <div style="cursor:pointer;" @click="showExploreModal('pattern')" title="点击查看特色纹样详细档案">
                    <dt>特色纹样寓意</dt>
                    <dd>点击查看 &rarr;</dd>
                  </div>
                  <div style="cursor:pointer;" @click="showExploreModal('geo')" title="点击查看地理风土详细档案">
                    <dt>地理风土</dt>
                    <dd>点击查看 &rarr;</dd>
                  </div>
                  <div style="cursor:pointer;" @click="showExploreModal('landmark')" title="点击查看文化地标详细档案">
                    <dt>文化地标</dt>
                    <dd>点击查看 &rarr;</dd>
                  </div>
                  <div style="cursor:pointer;" @click="showExploreModal('color')" title="点击查看当地色谱详细档案">
                    <dt>当地色谱</dt>
                    <dd>点击查看 &rarr;</dd>
                  </div>
                </dl>
              </section>

              <section class="sidebar-panel" data-map-panel="voice" role="tabpanel" hidden>
                <div class="place-note">
                  <span>在地絮语</span><p id="placeQuote">--</p>
                </div>

                <a class="full-story-link" id="placeDetailLink" href="/place?place=zhoucheng">
                  <span>
                    <small>完整地方手记</small>
                    <strong>民谣、打卡指南与更多故事</strong>
                  </span>
                  <i aria-hidden="true">↗</i>
                </a>

                <button class="puzzle-cta" id="puzzleButton" type="button">
                  <span class="puzzle-mark" aria-hidden="true">?</span>
                  <span>
                    <small>非遗小考 · 点开图鉴</small>
                    <strong>你知道这里的传承人是谁吗？</strong>
                  </span>
                  <i aria-hidden="true">↗</i>
                </button>
              </section>

                            <section class="sidebar-panel" data-map-panel="data" role="tabpanel" hidden>

                <div class="chart-heading">
                  <span>染坊微观察</span>
                  <small id="chartCaption">周城 · 产业图谱</small>
                </div>

                                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px;">
                  <div style="background: rgba(255,255,255,0.6); border: 1px solid rgba(13,57,89,0.08); border-radius: 6px; padding: 10px; text-align: center;">
                    <span style="font-size: 11px; color: #8a9695; display: block; margin-bottom: 2px;">👥 从业人数</span>
                    <strong id="statWorkers" style="font-size: 18px; color: #0b3863; font-family: var(--font-round);">--</strong>
                  </div>
                  <div style="background: rgba(255,255,255,0.6); border: 1px solid rgba(13,57,89,0.08); border-radius: 6px; padding: 10px; text-align: center;">
                    <span style="font-size: 11px; color: #8a9695; display: block; margin-bottom: 2px;">🏠 经营作坊</span>
                    <strong id="statWorkshops" style="font-size: 18px; color: #0b3863; font-family: var(--font-round);">--</strong>
                  </div>
                  <div style="background: rgba(255,255,255,0.6); border: 1px solid rgba(13,57,89,0.08); border-radius: 6px; padding: 10px; text-align: center;">
                    <span style="font-size: 11px; color: #8a9695; display: block; margin-bottom: 2px;">💰 年产值</span>
                    <strong id="statOutput" style="font-size: 18px; color: #0b3863; font-family: var(--font-round);">--</strong>
                  </div>
                  <div style="background: rgba(255,255,255,0.6); border: 1px solid rgba(13,57,89,0.08); border-radius: 6px; padding: 10px; text-align: center;">
                    <span style="font-size: 11px; color: #8a9695; display: block; margin-bottom: 2px;">🎓 研学接待</span>
                    <strong id="statStudents" style="font-size: 18px; color: #0b3863; font-family: var(--font-round);">--</strong>
                  </div>
                </div>

                
                <figure style="margin-top: 15px; margin-bottom: 15px;">
                  <img src="/assets/data-study.jpg" alt="扎染研学体验" loading="lazy" decoding="async" style="width: 100%; height: 90px; object-fit: cover; border-radius: 6px;">
                  <figcaption style="text-align: right; font-size: 10px; color: #8a9695; margin-top: 4px; font-style: italic;">▲ 非遗扎染研学实景</figcaption>
                </figure>

                
                <div style="margin-top: 15px;">
                  <span style="font-size: 12px; color: #435c67; display: block; margin-bottom: 8px; font-weight: bold;">非遗传承人梯队</span>

                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <span style="font-size: 11px; width: 40px; color: #5c6b70;">国家级</span>
                    <div style="flex: 1; background: rgba(13,57,89,0.08); height: 8px; border-radius: 4px; overflow: hidden;">
                      <div style="width: 15%; background: #0b3863; height: 100%;"></div>
                    </div>
                  </div>

                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <span style="font-size: 11px; width: 40px; color: #5c6b70;">省级</span>
                    <div style="flex: 1; background: rgba(13,57,89,0.08); height: 8px; border-radius: 4px; overflow: hidden;">
                      <div style="width: 35%; background: #24648e; height: 100%;"></div>
                    </div>
                  </div>

                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <span style="font-size: 11px; width: 40px; color: #5c6b70;">州/市级</span>
                    <div style="flex: 1; background: rgba(13,57,89,0.08); height: 8px; border-radius: 4px; overflow: hidden;">
                      <div style="width: 60%; background: #7fa596; height: 100%;"></div>
                    </div>
                  </div>

                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 11px; width: 40px; color: #5c6b70;">县级</span>
                    <div style="flex: 1; background: rgba(13,57,89,0.08); height: 8px; border-radius: 4px; overflow: hidden;">
                      <div style="width: 70%; background: #a9b784; height: 100%;"></div>
                    </div>
                  </div>
                </div>

                
                <figure style="margin-top: 15px; margin-bottom: 15px;">
                  <img src="/assets/data-master.jpg" alt="手艺人教学" loading="lazy" decoding="async" style="width: 100%; height: 90px; object-fit: cover; border-radius: 6px;">
                  <figcaption style="text-align: right; font-size: 10px; color: #8a9695; margin-top: 4px; font-style: italic;">▲ 老手艺人教授扎花技法</figcaption>
                </figure>

                
                <div style="padding: 10px 12px; border-left: 2px solid #24648e; background: rgba(36,100,142,0.04);">
                  <p id="dataInsightText" style="font-size: 12px; line-height: 1.6; color: #5c6b70; margin: 0;">
                    <strong>数据洞察：</strong>加载中...
                  </p>
                </div>

                <p class="chart-source" id="chartSource" style="margin-top: 12px;">数据口径：基于各村委及文旅局调研数据</p>
              </section>
            </div>
          </div>

          <div class="place-route">
            <button id="previousStop" type="button" aria-label="上一站"><span aria-hidden="true">←</span></button>
            <div class="route-dots" id="routeDots"><i class="is-active"></i><i></i><i></i></div>
            <button class="next-stop" id="nextStop" type="button">
              <span id="nextStopLabel">下一站 · 喜洲</span><i aria-hidden="true">→</i>
            </button>
          </div>
        </aside>
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
        <a href="/home#modules">六个展区</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>云南大理 · 白族扎染数字科普站</span>
    </div>
  </footer>

   <div class="heritage-modal" id="puzzleModal" hidden>
    <button class="puzzle-backdrop" type="button" data-close-puzzle aria-label="关闭图鉴"></button>
    <section class="puzzle-card" role="dialog" aria-modal="true" aria-labelledby="puzzleTitle">
      <button class="puzzle-close" type="button" data-close-puzzle aria-label="关闭图鉴">×</button>
      <p class="puzzle-card-kicker" id="puzzlePlace">周城 · 人物图鉴</p>

      <h2 id="puzzleTitle" style="margin-bottom: 20px;">段银开、张翰敏</h2>

      
      <div id="puzzleContent" style="max-height: 50vh; overflow-y: auto; padding-right: 10px;">
        
      </div>
      

      <div class="puzzle-actions" style="margin-top: 20px;">
        <a href="/pattern">去智染研习社继续探索 <span>→</span></a>
        <button type="button" data-close-puzzle>收好图鉴</button>
      </div>
    </section>
  </div>
  
  <div class="heritage-modal" id="exploreModal" hidden>
    <button class="puzzle-backdrop" type="button" @click="closeExploreModal()" aria-label="关闭"></button>
    <section class="puzzle-card" role="dialog" aria-modal="true" style="max-height: 85vh; display: flex; flex-direction: column; width: min(92vw, 600px);">
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
</template>

<script setup>
import { onMounted } from 'vue'
import { loadEcharts } from '@/lib/echarts'
import { initMapExtras } from '@/legacy/map'
import { initPage } from '@/legacy/app'

onMounted(async () => {
  await loadEcharts()
  initPage()
  initMapExtras()
})
</script>
