<template>
<a class="skip-link" href="#main-content">跳到主要内容</a>
  <canvas class="dye-canvas" id="dyeCanvas" aria-hidden="true"></canvas>
  <div class="paper-grain" aria-hidden="true"></div>

  <header class="site-header" id="siteHeader">
    <div class="nav-shell">
      <a class="brand" href="javascript:void(0)" @click="switchView('home')" aria-label="苍洱纹册首页">
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
        <a href="javascript:void(0)" data-view="home" @click="switchView('home')">首页</a>
        <a href="javascript:void(0)" data-view="modules" @click="switchView('modules')">六个展区</a>
        <a href="/diy">扎染实验室</a>
        <a href="/timeline">工艺长卷</a>
        <a href="/pattern">智染研习社</a>
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

  <main id="main-content">

    
    <div id="view-home" class="page-view active">
      <section class="home-hero" style="padding-top: 0;">
        <div class="hero-inner">
          <div class="hero-copy">
            <h1 class="reveal">
              风过苍洱<br>
              <span>留蓝于布</span>
            </h1>
            <p class="hero-description reveal">
              苍山脚下年年长蓝草，染坊里的手，换了一代又一代。
                                                  <br>
              他们捆布、下缸、晾晒，不贪省事，凭着一份踏实，传承了这份手艺。
            </p>


            <div class="hero-notes reveal">
              <div><span class="note-index">A.</span><p><strong>看</strong><small>纹样与器物</small></p></div>
              <div><span class="note-index">B.</span><p><strong>玩</strong><small>扎染与问答</small></p></div>
              <div><span class="note-index">C.</span><p><strong>问</strong><small>知识与来处</small></p></div>
              <div><span class="note-index">D.</span><p><strong>练</strong><small>亲手试一试</small></p></div>
            </div>
          </div>

          <div class="hero-visual reveal" aria-label="白族扎染蝴蝶与花卉纹样示意">
            <div class="visual-orbit visual-orbit-one" aria-hidden="true"></div>
            <div class="visual-orbit visual-orbit-two" aria-hidden="true"></div>
            <div class="hero-textile">
              <img src="/assets/indigo-textile.svg" alt="">
              <span class="textile-glint" aria-hidden="true"></span>
            </div>
            <span class="round-stamp">蓝<br>白</span>
          </div>
        </div>
        <div class="hero-waterline" aria-hidden="true">
          <svg viewBox="0 0 1600 100" preserveAspectRatio="none">
            <path d="M0 70c180-35 310 18 500-2s325-58 510-24 343 26 590-18"></path>
            <path d="M0 82c215-18 344 21 528 3s345-47 526-16 331 21 546-11"></path>
          </svg>
        </div>
      </section>
    </div>

    
    <div id="view-modules" class="page-view">
      <section class="explore-section">
        <div class="section-intro">
          <div class="section-title-wrap reveal is-visible">
            <h2>六种方式，<br>了解这项工艺</h2>
          </div>
          <div class="section-side-copy reveal is-visible">
            <div class="section-pattern-art" aria-hidden="true">
              <svg viewBox="0 0 560 210">
                <g class="section-pattern-orbit">
                  <circle cx="382" cy="92" r="74"></circle>
                  <circle cx="382" cy="92" r="56"></circle>
                  <circle cx="382" cy="92" r="35"></circle>
                  <path d="M382 40v104M330 92h104M345 55l74 74M419 55l-74 74"></path>
                </g>
                <path class="section-pattern-sweep" d="M36 153c54-21 92-12 139 4 54 18 111 17 166-8 51-23 102-26 176 2"></path>
                <path class="section-pattern-sweep soft" d="M43 174c57-17 91-5 142 7 49 12 101 10 151-10 54-22 104-24 168-2"></path>
                <path class="section-pattern-thread" d="M55 47c60 9 93 35 135 65 30 22 59 29 94 24 35-6 52-20 70-43"></path>
                <path class="section-pattern-thread" d="M121 23c-6 16 2 26 23 32 23 7 35 20 34 39-2 20 14 34 47 42"></path>
                <g class="section-pattern-knots">
                  <circle cx="88" cy="122" r="8"></circle>
                  <circle cx="207" cy="141" r="5"></circle>
                  <circle cx="472" cy="133" r="9"></circle>
                  <circle cx="505" cy="76" r="5"></circle>
                </g>
                <path class="section-pattern-petal" d="M382 15c-10 19-9 34 0 48 9-14 10-29 0-48ZM382 121c-10 19-9 34 0 48 9-14 10-29 0-48ZM305 92c19-10 34-9 48 0-14 9-29 10-48 0ZM411 92c19-10 34-9 48 0-14 9-29 10-48 0Z"></path>
              </svg>
            </div>
            <div class="section-rule"><i></i><span>六座数字展区</span></div>
          </div>
        </div>

        <div class="module-grid">
          
          <article class="module-card module-diy reveal is-visible" data-href="/diy" role="link" tabindex="0" aria-label="展区 01：扎染纹样在线创作工具，进入扎染实验室">
            <div class="card-topline">
              <span class="module-number">展区 01</span>
              <span class="module-state">智能生成</span>
            </div>
            <div class="diy-copy">
              <span class="module-icon" aria-hidden="true">
                <svg viewBox="0 0 48 48"><path d="M8 40 30 18M25 13l10 10M15 9c-4 0-7 3-7 7 0 3 2 5 4 7l5 5"></path><circle cx="31" cy="17" r="3"></circle><path d="M9 35c5 5 12 7 18 5"></path></svg>
              </span>
              <h3>扎染纹样<br>在线创作工具</h3>
              <p>本板块为扎染纹样智能生成工具。用户可以上传参考图案，系统基于白族扎染传统纹样特征，生成适配扎染工艺的新纹样，支持预览与下载，方便纹样创作、设计参考。</p>
              <a class="preview-pill" href="/diy"><i></i>进入扎染实验室</a>
            </div>
            <div class="diy-art" aria-hidden="true">
              <div class="dye-disc dye-disc-back"></div>
              <div class="dye-disc dye-disc-main">
                <span class="resist-ring ring-one"></span><span class="resist-ring ring-two"></span>
                <span class="resist-knot knot-one"></span><span class="resist-knot knot-two"></span><span class="resist-knot knot-three"></span>
              </div>
              <div class="oxidation-scale"><span>黄绿</span><i></i><span>靛蓝</span></div>
              <span class="diy-caption">描述 / 知识检索 / 参数生成</span>
            </div>
          </article>

          
          <article class="module-card module-craft reveal is-visible" data-href="/timeline" role="link" tabindex="0" aria-label="展区 02：七步成蓝工艺长卷，翻开长卷">
            <div class="card-topline">
              <span class="module-number">展区 02</span>
            </div>
            <div class="craft-copy">
              <span class="module-icon" aria-hidden="true">
                <svg viewBox="0 0 48 48"><path d="M24 6v36"></path><circle cx="24" cy="12" r="4"></circle><circle cx="24" cy="25" r="4"></circle><circle cx="24" cy="38" r="4"></circle><path d="M32 12h7M10 25h7M32 38h7"></path></svg>
              </span>
              <h3>扎染<br>完整工艺</h3>
              <p>按工序浏览，了解扎染从原料到成品的制作步骤</p>
            </div>
            <div class="mini-timeline" aria-hidden="true">
              <span class="timeline-track"></span>
              <div><b>01</b><p>采蓝草</p></div>
              <div><b>02</b><p>制蓝靛</p></div>
              <div><b>03</b><p>扎花</p></div>
              <div><b>04</b><p>浸染</p></div>
            </div>
            <button class="module-open" type="button" @click="window.location.href='/timeline'">
              点击查看
              <span aria-hidden="true">↗</span>
            </button>
          </article>

          
          <article class="module-card module-pattern reveal is-visible" data-href="/pattern" role="link" tabindex="0" aria-label="展区 03：智染研习社，包含图鉴、竞答与剧本杀">
            <div class="card-topline">
              <span class="module-number">展区 03</span>
            </div>
            <div class="pattern-art" aria-hidden="true">
              <svg viewBox="0 0 220 180">
                <path class="butterfly-wing" d="M110 91C91 54 54 42 36 60c-19 20 0 54 45 56-26 15-32 42-17 50 16 9 37-12 46-40 9 28 30 49 46 40 15-8 9-35-17-50 45-2 64-36 45-56-18-18-55-6-74 31Z"></path>
                <path class="butterfly-body" d="M110 66v74M102 69c-8-11-1-20 8-27 9 7 16 16 8 27"></path>
                <circle cx="89" cy="82" r="9"></circle><circle cx="131" cy="82" r="9"></circle><circle cx="55" cy="60" r="5"></circle><circle cx="165" cy="60" r="5"></circle>
              </svg>
              <span class="pattern-label">蝶恋花 / 吉祥</span>
            </div>
            <div class="pattern-copy">
              <span class="module-icon" aria-hidden="true">
                <svg viewBox="0 0 48 48"><path d="M24 9c-9 0-16 6-16 14 0 6 4 10 9 12l-2 7 9-4 9 4-2-7c5-2 9-6 9-12 0-8-7-14-16-14Z"></path><path d="M24 15v15M16 19c3 4 5 6 8 6s5-2 8-6"></path></svg>
              </span>
              <h3>图鉴 × 竞答<br>× 剧本杀</h3>
              <p>读懂纹样寓意、答题解锁图鉴，再进入三个扎染情景完成破局与成就收集。</p>
              <a class="preview-pill" href="/pattern"><i></i>进入智染研习社</a>
            </div>
          </article>

          
          <article class="module-card module-ask reveal is-visible" data-href="/quiz" role="link" tabindex="0" aria-label="展区 04：问蓝知染智能导师，开始对话">
            <div class="card-topline">
              <span class="module-number">展区 04</span>
              <span class="module-state">智能导师</span>
            </div>
            <div class="ask-copy">
              <span class="module-icon" aria-hidden="true">
                <svg viewBox="0 0 48 48"><path d="M8 10h32v23H23l-9 7v-7H8V10Z"></path><path d="M20 19c.5-4 7.8-4.6 8.5-.2.5 3.2-4 3.1-4 6.5M24.5 30h.1"></path></svg>
              </span>
              <h3>问蓝知染<br>智能导师</h3>
              <p>和智能导师对话，检索扎染知识、辨析概念、生成练习题与纹样，随时回看历史会话。</p>
              <div class="question-preview" aria-hidden="true">
                <span>绞缬</span><i>·</i><span>蜡缬</span><b>它们究竟有什么不同？</b>
              </div>
              <a class="preview-pill" href="/quiz"><i></i>开始对话</a>
            </div>
            <div class="bubble-lines" aria-hidden="true"><span></span><span></span><span></span></div>
          </article>

          
          <article class="module-card module-map reveal is-visible" data-href="/map" role="link" tabindex="0" aria-label="展区 05：苍洱染迹非遗地图，踏入地图">
            <div class="card-topline">
              <span class="module-number">展区 05</span>
            </div>
            <div class="mini-map" aria-hidden="true">
              <svg viewBox="0 0 320 240">
                <path class="map-shape" d="M45 84c29-38 77-33 104-53 35-26 75 4 105 31 23 20 24 55 7 83-17 29-59 50-101 52-45 2-92-12-112-46-17-30-19-44-3-67Z"></path>
                <path class="map-river" d="M105 35c-2 45 29 60 12 92-13 25 20 40 35 66M211 88c-33 5-47 26-73 36"></path>
                <g class="map-pin pin-main"><circle cx="184" cy="125" r="15"></circle><circle cx="184" cy="125" r="4"></circle><path d="M184 95v9"></path></g>
                <g class="map-pin pin-small"><circle cx="128" cy="147" r="7"></circle><circle cx="128" cy="147" r="2"></circle></g>
                <g class="map-pin pin-small second"><circle cx="232" cy="164" r="7"></circle><circle cx="232" cy="164" r="2"></circle></g>
                <text x="198" y="119">大理 · 周城</text><text class="map-small-text" x="92" y="166">巍山</text><text class="map-small-text" x="240" y="183">喜洲</text>
              </svg>
              <span class="map-coordinate">25.85°N / 100.13°E</span>
            </div>
            <div class="map-copy">
              <span class="module-icon" aria-hidden="true">
                <svg viewBox="0 0 48 48"><path d="M24 43s13-13.2 13-23A13 13 0 1 0 11 20c0 9.8 13 23 13 23Z"></path><circle cx="24" cy="19.5" r="4.5"></circle></svg>
              </span>
              <h3>苍洱染迹<br>非遗地图</h3>
              <p>地图标注大理扎染核心传承村落，收录手艺人访谈、工坊介绍、地方产业现状，可查看各地扎染的发展脉络与实景资料。</p>
              <button class="module-open module-open-light" type="button" @click="window.location.href='/map'">
                踏入地图
                <span aria-hidden="true">↗</span>
              </button>
            </div>
          </article>

          
          <article class="module-card module-gallery reveal is-visible" data-href="/gallery" role="link" tabindex="0" aria-label="展区 06：一方蓝布万千手艺，进入作品墙">
            <div class="gallery-copy">
              <div class="card-topline"><span class="module-number">展区 06</span></div>
              <div>
                <span class="module-icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48"><rect x="6" y="9" width="36" height="30" rx="2"></rect><path d="m6 33 10-10 8 8 6-6 12 12M15 19h.1"></path></svg>
                </span>
                <h3>一方蓝布，<br><em>万千手艺。</em></h3>
                <p>收藏每个人的扎染练习，也收藏纹样在当下继续生长的样子。</p>
                <a class="preview-pill" href="/gallery"><i></i>打开作品墙</a>
              </div>
            </div>
            <div class="gallery-strip" aria-hidden="true">
              <figure class="swatch swatch-one"><span class="swatch-pattern pattern-bloom"></span><figcaption><b>01</b><small>螺旋捆扎</small></figcaption></figure>
              <figure class="swatch swatch-two"><span class="swatch-pattern pattern-lines"></span><figcaption><b>02</b><small>风琴折叠</small></figcaption></figure>
              <figure class="swatch swatch-three"><span class="swatch-pattern pattern-butterfly"></span><figcaption><b>03</b><small>缝扎蝶纹</small></figcaption></figure>
              <figure class="swatch swatch-four"><span class="swatch-pattern pattern-rings"></span><figcaption><b>04</b><small>豆子绑扎</small></figcaption></figure>
            </div>
          </article>
        </div>
      </section>
    </div>


  </main>

  <footer class="site-footer">
    
    <div class="footer-brand">
      <a class="brand invert" href="javascript:void(0)" @click="switchView('home')" aria-label="蓝白之境首页">
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
        <a href="javascript:void(0)" @click="switchView('modules')">六大展区</a>
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
        <a href="javascript:void(0)" @click="switchView('modules')">六个展区</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>云南大理 · 白族扎染数字科普站</span>
    </div>
  </footer>
</template>

<script setup>
import { onMounted } from 'vue'
import { initHomeExtras } from '@/legacy/home'
import { initPage } from '@/legacy/app'

onMounted(() => {
  initHomeExtras()
  initPage()
})
</script>
