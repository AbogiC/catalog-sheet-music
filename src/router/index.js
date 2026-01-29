import Vue from 'vue'
import VueRouter from 'vue-router'
import SheetMusicView from '../views/SheetMusicView.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'sheet-music',
    component: SheetMusicView,
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

export default router
