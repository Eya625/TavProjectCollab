// routes.js

import { createRouter, createWebHistory } from 'vue-router';
import ConsulterProfil from '../components/ConsulterProfil.vue';
import ForgotPassword from '../components/ForgotPassword.vue';
import CreatePass from '../components/CreatePass.vue';
import BillingVehicle from '../views/BillingVehicle.vue';
import NavBar from '../components/NavBar.vue';
import ManOLA from '../views/ManOLA.vue';
import HistoryPage from '../views/HistoryPage.vue';
import ManageOLA from '../views/ManageOLA.vue';
import PrinterParc from '../views/PrinterParc.vue';
import Dashboard from '../views/Dashboard.vue';
import CurativeMaintenance from '../views/CurativeMaintenance.vue';
import OLADashboard from '../views/OLADashboard.vue';
import ManageVehicle from '../views/ManageVehicle.vue';
import VehicleNavbar from '../components/VehicleNavbar.vue';
import Facturation from '../views/Facturation.vue';
import DashboardChart from '../views/dashboardChart.vue';


const routes = [
  { path: '/profile/:email', component: ConsulterProfil },
  { path: '/forgot-password', component: ForgotPassword },
  {
    path: '/reset-password',
    component: CreatePass,
    props: (route) => ({
      // Récupérer les paramètres comme props
      email: route.query.email,
      token: route.query.token
    })
  },
  { path: '/', component: Dashboard },
  { path: '/vehicles', component: ManOLA },
  { path: '/billing', component: BillingVehicle },
  { path: '/navbar', component: NavBar },
  { path :'/history',component: HistoryPage},
  { path : '/ola',component: ManageOLA},
  { path : '/printer-parc',component: PrinterParc},
  { path : '/cur_main',component: CurativeMaintenance},
  { path : '/OLADashboard',component: OLADashboard},
  { path : '/manageVehicle',component:ManageVehicle},
  { path : '/nav',component: VehicleNavbar},
  { path: '/facturation',component: Facturation},
  { path: '/dashchart',component: DashboardChart}

];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
