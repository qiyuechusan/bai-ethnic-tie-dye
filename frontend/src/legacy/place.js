export function initPlaceExtras() {
  window.switchTab = function (tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(function (el) {
      el.style.setProperty('display', 'none', 'important')
      el.classList.remove('is-changing')
    })

    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.classList.remove('is-active')
      btn.setAttribute('aria-selected', 'false')
    })

    const target = document.getElementById('tab-' + tabId)
    if (target) {
      target.style.setProperty('display', 'block', 'important')
      void target.offsetWidth
      target.classList.add('is-changing')
    }

    btnElement.classList.add('is-active')
    btnElement.setAttribute('aria-selected', 'true')

    if (tabId === 'data') {
      window.setTimeout(() => {
        if (typeof window.refreshIndustryChart === 'function') {
          window.refreshIndustryChart()
        }
      }, 80)
    }
  }

  const exploreTitles = {
    master: '代表性传承人',
    pattern: '特色纹样寓意',
    see: '核心在地风物',
    now: '今日产业图景',
  }

  window.showExploreModal = function (type) {
    const place = window.currentPlaceData || {}

    document.getElementById('exploreModalKicker').textContent =
      `${place?.name || '当前地点'} · 详细档案`
    document.getElementById('exploreModalTitle').textContent = exploreTitles[type] || '详细档案'

    const container = document.getElementById('exploreModalContent')
    let htmlContent = ''

    if (type === 'master') {
      htmlContent = `
          <div style="margin-bottom: 35px; border-bottom: 1px dashed rgba(13,55,87,0.15); padding-bottom: 20px;">
            <img src="/assets/person-duanyinkai.jpg"
                 onerror="this.src='/assets/data-master.jpg'"
                 style="display:block !important; width: 100%; height: 220px; object-fit: cover; border-radius: 6px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
            <h3 style="font-family: var(--font-round); color: #0b3863; font-size: 24px; margin-bottom: 5px;">段银开</h3>
            <p style="color: #24648e; font-size: 13px; margin-bottom: 12px; font-weight: bold;">国家级代表性传承人</p>
            <p style="color: #5c6f73; font-size: 15px; line-height: 1.8; text-align: justify;">段银开，国家级非遗传承人，自幼随长辈学习扎染，精通全套72道扎染工序，创办璞真染坊并扩建为博物馆，带动上千名白族妇女就业。</p>
          </div>
          <div style="margin-bottom: 35px; border-bottom: 1px dashed rgba(13,55,87,0.15); padding-bottom: 20px;">
            <img src="/assets/person-zhanghanmin.jpg"
                 onerror="this.src='/assets/data-master.jpg'"
                 style="display:block !important; width: 100%; height: 220px; object-fit: cover; border-radius: 6px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
            <h3 style="font-family: var(--font-round); color: #0b3863; font-size: 24px; margin-bottom: 5px;">张翰敏</h3>
            <p style="color: #24648e; font-size: 13px; margin-bottom: 12px; font-weight: bold;">州级代表性传承人</p>
            <p style="color: #5c6f73; font-size: 15px; line-height: 1.8; text-align: justify;">张翰敏，州级传承人，创立“蓝续”品牌，将现代审美与国际视野带入传统扎染，让周城扎染登上了国际时装周。</p>
          </div>
        `
    } else {
      let detail = place?.exploreData?.[type]
      if (type === 'pattern' && Array.isArray(place?.pattern)) {
        detail = place.pattern
      }

      if (Array.isArray(detail) && detail.length > 0) {
        htmlContent = detail
          .map(
            (item) => `
            <div style="margin-bottom: 24px; border-bottom: 1px dashed rgba(13,55,87,0.15); padding-bottom: 20px;">
              <img src="${item.img || '/assets/pattern-closeup.jpg'}"
                   onerror="this.src='/assets/pattern-closeup.jpg'"
                   style="display:block !important; width: 100%; height: 180px; object-fit: cover; border-radius: 6px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
              <h3 style="font-family: var(--font-round); color: #0b3863; font-size: 20px; margin-bottom: 8px;">${item.title || ''}</h3>
              <p style="color: #5c6f73; font-size: 15px; line-height: 1.8; text-align: justify;">${item.desc || item.text || ''}</p>
            </div>
          `,
          )
          .join('')
      } else {
        const text = typeof detail === 'string' ? detail : detail?.text || '暂无详细档案。'
        htmlContent = `<p style="color: #5c6f73; font-size: 15px; line-height: 1.9; text-align: justify;">${text}</p>`
      }
    }

    container.innerHTML = htmlContent
    document.getElementById('exploreModal').hidden = false
    document.body.classList.add('modal-open')
  }

  window.closeExploreModal = function () {
    document.getElementById('exploreModal').hidden = true
    document.body.classList.remove('modal-open')
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') window.closeExploreModal()
  })

  window.renderPatternCards = function () {
    const container = document.getElementById('patternCardsContainer')
    if (!container) return

    const patterns = window.currentPatternData || []

    if (!patterns || !patterns.length) {
      container.innerHTML = `<p style="color: #8a9695; font-size: 14px;">暂无纹样数据，请检查数据是否传递成功。</p>`
      return
    }

    container.innerHTML = ''
    patterns.forEach((item) => {
      const card = document.createElement('div')
      card.className = 'flip-card'
      card.innerHTML = `
          <div class="flip-card-inner">
            <div class="flip-card-front">
              <div class="card-icon">🦋</div>
              <h4>${item.title || '纹样'}</h4>
              <span>点击翻看</span>
            </div>
            <div class="flip-card-back">
              <img src="${item.img || '/assets/pattern-closeup.jpg'}"
                   onerror="this.src='/assets/pattern-closeup.jpg'"
                   alt="${item.title}">
              <p>${item.desc}</p>
            </div>
          </div>
        `
      card.onclick = function () {
        this.classList.toggle('is-flipped')
      }
      container.appendChild(card)
    })
  }

  window.setTimeout(window.renderPatternCards, 100)

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.textContent.trim() === '纹样民俗') {
        if (typeof window.renderPatternCards === 'function') {
          window.setTimeout(window.renderPatternCards, 50)
        }
      }
    })
  })
}
