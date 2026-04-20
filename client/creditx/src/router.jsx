import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";

import App from "./App";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import FormList from "./pages/FormList";
import MultiStepForm from "./pages/MultiSelectStepsForm";
import { requireAuth, requireGuest } from "./auth/auth";

const rootRoute = createRootRoute({ component: App });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: () => requireGuest(),
  component: Login,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  beforeLoad: () => requireGuest(),
  component: Register,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  beforeLoad: () => requireAuth(),
  component: Dashboard,
});

const multiStepFormRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/multi-select-form",
  beforeLoad: () => requireAuth(),
  component: MultiStepForm,
});

const listRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forms",
  beforeLoad: () => requireAuth(),
  component: FormList,
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute,
    loginRoute,
    registerRoute,
    dashboardRoute,
    multiStepFormRoute,
    listRoute,
  ]),
});
