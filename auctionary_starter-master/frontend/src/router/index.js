import { createRouter, createWebHistory } from "vue-router";

import HomeView from "../views/HomeView.vue";
import RegisterView from "../views/RegisterView.vue";
import LoginView from "../views/LoginView.vue";
import ProfileView from "../views/ProfileView.vue";
import CreateItemView from "../views/CreateItemView.vue";
import ItemView from "../views/ItemView.vue";


const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: HomeView },
    { path: "/register", component: RegisterView },
    { path: "/login", component: LoginView },
    { path: "/profile", component: ProfileView },
    { path: "/create", component: CreateItemView },
    { path: "/item/:id", component: ItemView },
  ],
});

export default router;
