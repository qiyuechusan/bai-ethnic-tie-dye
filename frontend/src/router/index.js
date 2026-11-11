import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/login/LoginView.vue'),
    meta: { bodyClass: 'page-login', title: '苍洱纹册 · 登录' },
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/pages/home/HomeView.vue'),
    meta: { bodyClass: 'page-home', title: '苍洱纹册 · 白族扎染数字科普' },
  },
  {
    path: '/timeline',
    name: 'timeline',
    component: () => import('@/pages/timeline/TimelineView.vue'),
    meta: { bodyClass: 'page-home page-standalone', title: '完整工艺流程 | 苍洱纹册' },
  },
  {
    path: '/map',
    name: 'map',
    component: () => import('@/pages/map/MapView.vue'),
    meta: { bodyClass: 'page-home page-standalone page-atlas', title: '苍洱寻迹 · 非遗地图 | 苍洱纹册' },
  },
  {
    path: '/place',
    name: 'place',
    component: () => import('@/pages/place/PlaceView.vue'),
    meta: { bodyClass: 'page-home page-standalone page-place-detail', title: '地方手记 | 苍洱纹册' },
  },
  {
    path: '/quiz',
    name: 'quiz',
    component: () => import('@/pages/quiz/QuizView.vue'),
    meta: { bodyClass: 'page-home page-lab page-quiz', title: '苍洱纹册 · 问蓝知染' },
  },
  {
    path: '/diy',
    name: 'diy',
    component: () => import('@/pages/diy/DiyView.vue'),
    meta: { bodyClass: 'page-home page-lab page-diy', title: '苍洱纹册 · 扎染实验室' },
  },
  {
    path: '/pattern',
    name: 'pattern',
    component: () => import('@/pages/pattern/PatternView.vue'),
    meta: { bodyClass: 'page-home page-standalone', title: '智染研习社 | 苍洱纹册' },
  },
  {
    path: '/gallery',
    name: 'gallery',
    component: () => import('@/pages/gallery/GalleryView.vue'),
    meta: { bodyClass: 'page-home page-standalone', title: '作品墙 | 苍洱纹册' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/home',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  document.body.className = to.meta.bodyClass || ''
  if (to.meta.title) {
    document.title = to.meta.title
  }
})

export default router
