import { createRouter, createWebHistory } from 'vue-router'
import SheetMusicView from '../views/SheetMusicView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'sheet-music',
      component: SheetMusicView,
    },
  ],
})

export default router
