import { createRouter, createWebHistory } from 'vue-router';
import ConsulterProfil from '../components/ConsulterProfil.vue';

const routes = [
  {
    path: '/profil',
    name: 'ConsulterProfil',
    component: ConsulterProfil
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});
export default router;
