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
        <a href="/pattern">智染研习社</a>
        <a href="/quiz">问蓝知染</a>
        <a href="/map">寻迹地图</a>
        <a class="is-active" href="/gallery" aria-current="page">作品墙</a>
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
    <section class="atlas-section" aria-labelledby="gallery-title">
      <header class="atlas-heading">
        <div>
          <h1 id="gallery-title">作品墙</h1>
        </div>
      </header>

<div id="modal-ask" class="page-modal">
    <div class="modal-content" style="max-width: 1400px; background: var(--paper); box-shadow: inset 0 0 50px rgba(0,0,0,0.05);">
      

      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 class="modal-title" style="border: none; margin: 0; padding: 0; font-size: 36px;">匠人作品墙</h2>
        <button @click="toggleUploadForm()" style="padding: 12px 24px; background: var(--indigo-800); color: white; cursor: pointer; border: none; font-size: 15px; border-radius: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          + 钉一张拍立得
        </button>
      </div>

      
      <div id="upload-form-container" class="upload-section" style="display: none; margin-bottom: 40px; justify-content: center; display: flex;">
        <div class="polaroid-form-card">
          <form id="uploadForm" @submit="handleUpload($event)">
            
            <div class="polaroid-photo-preview" @click="document.getElementById('fileInput').click()">
              <span id="previewText" style="color:#999; font-family: var(--font-serif);">点击此处选择照片</span>
              <img id="previewImg" src="" style="display: none; width: 100%; height: 100%; object-fit: cover; position: absolute; top:0; left:0;">
            </div>
            <input id="fileInput" type="file" name="file" accept="image/*" required style="display: none;" @change="previewImage($event.currentTarget)">

            
            <div class="polaroid-bottom">
              <input type="text" name="title" placeholder="作品名称" required class="marker-input" style="font-size: 20px; font-weight: bold;">
              <input type="text" name="authorName" placeholder="你的称呼 (选填)" class="marker-input">
              <textarea name="description" placeholder="写下一句感悟..." class="marker-input" rows="2" style="resize:none;"></textarea>

              <select name="tieMethod" class="marker-input" style="margin-top: 10px;">
                <option value="捆扎">螺旋捆扎</option>
                <option value="缝扎">缝扎勾勒</option>
                <option value="折叠夹扎">风琴折叠</option>
              </select>

              <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button type="submit" class="btn-pill">挂上麻绳</button>
                <button type="button" @click="toggleUploadForm()" class="btn-pill" style="background: #ccc; color: #333;">取消</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      
      <div class="filter-tags">
        <button class="active" @click="filterArtworks('全部', $event.currentTarget)">全部</button>
        <button @click="filterArtworks('捆扎', $event.currentTarget)">螺旋捆扎</button>
        <button @click="filterArtworks('折叠夹扎', $event.currentTarget)">风琴折叠</button>
        <button @click="filterArtworks('缝扎', $event.currentTarget)">缝扎勾勒</button>
      </div>

      
      <div class="clothesline-container">
        <div class="rope"></div>
        <div id="artwork-grid" class="clothesline-items">
          
        </div>
      </div>
            
      <div id="lightbox" class="lightbox" @click="closeLightbox($event)">
        <div class="lightbox-content" @click="$event.stopPropagation()">
          <button class="lightbox-close" @click="closeLightbox()">&times;</button>
          <img id="lightbox-img" src="" alt="放大图片">
          <div class="lightbox-info">
            <h2 id="lightbox-title"></h2>
            <p id="lightbox-desc"></p>
            <div class="lightbox-meta">
              <span id="lightbox-author"></span>
              <div class="like-vat" id="lightbox-like" @click="likeFromLightbox($event)">
                <i class="vat-icon"></i>
                <span class="like-count" id="lightbox-likes">0</span>
              </div>
            </div>
          </div>
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
import { initPage } from '@/legacy/app'

onMounted(() => {
  initPage()
  window.loadArtworks()
})
</script>
