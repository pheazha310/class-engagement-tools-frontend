import { createRouter, createWebHistory } from 'vue-router'
import Homepage from '../views/Homepage.vue'
import About from '../views/About.vue'
import Contact from '../views/Contact.vue'
import Icebreakers from '../views/Icebreakers.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Homepage,
    },
    {
      path: '/about',
      name: 'about',
      component: About,
    },
    {
      path: '/contact',
      name: 'contact',
      component: Contact,
    },
    {
      path: '/tools/icebreakers',
      name: 'icebreakers',
      component: Icebreakers,
    },
  ],
})

export default router
