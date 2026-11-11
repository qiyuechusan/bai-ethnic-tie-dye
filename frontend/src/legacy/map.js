export function initMapExtras() {
  const hardcodedLocalData = {
    weishan: {
      pattern: [
        { img: '/assets/weishan-sun.jpg', title: '太阳纹', desc: '象征光明与生机，彝族图腾常见元素。' },
        { img: '/assets/weishan-flower.jpg', title: '八角花', desc: '彝族服饰中常见的吉祥图案。' },
        { img: '/assets/weishan-hui.jpg', title: '回纹', desc: '寓意连绵不断，结合挑花与刺绣。' },
      ],
    },
    xizhou: {
      pattern: [
        { img: '/assets/pattern-butterfly.jpg', title: '蝴蝶纹', desc: '喜洲白族院落中常见的纹样，寓意美好姻缘。' },
        { img: '/assets/pattern-plum.jpg', title: '菊花纹', desc: '常与当地商帮文化结合，寓意富贵与长寿。' },
        { img: '/assets/pattern-jihe.jpg', title: '几何连续纹', desc: '常见于照壁和门窗，与木雕呼应。' },
      ],
    },
    zhoucheng: {
      pattern: [
        { img: '/assets/pattern-butterfly.jpg', title: '蝴蝶纹', desc: '源自白族创世神话，寓意生命轮回与美好爱情。' },
        { img: '/assets/pattern-plum.jpg', title: '梅花纹', desc: '大理风大，梅花迎风傲雪，象征坚韧品格。' },
        { img: '/assets/pattern-coin.jpg', title: '铜钱纹', desc: '喜洲商帮走南闯北，寄托招财进宝的朴素愿望。' },
      ],
    },
  }

  const titles = {
    master: '代表性传承人',
    pattern: '特色纹样寓意',
    geo: '地理风土',
    landmark: '文化地标',
    color: '当地色谱',
  }

  window.showExploreModal = function (type) {
    const place = window.currentMapPlaceData
    const modal = document.getElementById('exploreModal')
    const kicker = document.getElementById('exploreModalKicker')
    const title = document.getElementById('exploreModalTitle')
    const container = document.getElementById('exploreModalContent')

    if (!modal || !container || !place) return

    kicker.textContent = `${place.name} · 详细档案`
    title.textContent = titles[type] || '详细档案'

    let htmlContent = ''
    let finalDetail = null

    if (type === 'pattern' && hardcodedLocalData[place.id]) {
      finalDetail = hardcodedLocalData[place.id].pattern
    } else {
      finalDetail = place.exploreData ? place.exploreData[type] : null
    }

    if (Array.isArray(finalDetail) && finalDetail.length > 0) {
      htmlContent = finalDetail
        .map(
          (item) => `
          <div style="margin-bottom: 24px; border-bottom: 1px dashed rgba(13,55,87,0.15); padding-bottom: 20px;">
            <img src="${item.img || '/assets/placeholder.jpg'}"
                 onerror="this.src='https://via.placeholder.com/400x200?text=图片加载失败'"
                 style="width: 100%; height: 180px; object-fit: cover; border-radius: 6px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);"
                 alt="${item.title}">
            <h3 style="font-family: var(--font-round); color: #0b3863; font-size: 20px; margin-bottom: 8px;">${item.title}</h3>
            <p style="color: #5c6f73; font-size: 15px; line-height: 1.8; text-align: justify;">${item.desc || item.text || ''}</p>
          </div>
        `,
        )
        .join('')
    } else if (type === 'master' && place.persons && place.persons.length) {
      htmlContent = place.persons
        .map(
          (person) => `
          <div style="margin-bottom: 24px; border-bottom: 1px dashed rgba(13,55,87,0.15); padding-bottom: 20px;">
            <img src="${person.img || '/assets/data-master.jpg'}" style="width: 100%; height: 210px; object-fit: cover; border-radius: 6px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
            <h3 style="font-family: var(--font-round); color: #0b3863; font-size: 24px; margin-bottom: 5px;">${person.name}</h3>
            <p style="color: #24648e; font-size: 12px; margin-bottom: 12px; font-weight: bold;">${person.role}</p>
            <p style="color: #5c6f73; font-size: 15px; line-height: 1.8; text-align: justify;">${person.desc}</p>
          </div>
        `,
        )
        .join('')
    } else {
      const text = typeof finalDetail === 'string' ? finalDetail : finalDetail?.text || '暂无详细档案。'
      htmlContent = `<p style="color: #5c6f73; font-size: 15px; line-height: 1.9; text-align: justify;">${text}</p>`
    }

    container.innerHTML = htmlContent
    modal.hidden = false
    document.body.classList.add('modal-open')
  }

  window.closeExploreModal = function () {
    const modal = document.getElementById('exploreModal')
    if (modal) modal.hidden = true
    document.body.classList.remove('modal-open')
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') window.closeExploreModal()
  })
}
