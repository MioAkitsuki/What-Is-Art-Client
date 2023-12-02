// Composables
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/default/Default.vue'),
    children: [
      {
        path: '/',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
      },
      {
        path: '/market',
        name: 'Market',
        component: () => import('@/views/Market.vue'),
      },
      {
        path: '/account',
        name: 'Account',
        component: () => import('@/views/Account.vue'),
      },
      {
        path: '/donate',
        name: 'Donate',
        component: () => import('@/views/Donate.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
