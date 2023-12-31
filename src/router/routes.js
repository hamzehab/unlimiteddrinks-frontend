import { api } from "boot/axios";
import { authGuard } from "@auth0/auth0-vue";

const checkIfCategoryExists = async (category) => {
  try {
    const response = await api.get(`/category/${category}`);
    return response.data;
  } catch (error) {
    return false;
  }
};

const checkIfDrinkExists = async (product_id, category) => {
  try {
    const response = await api.get(`/product/${product_id}`);
    const category_name = response.data.category_name
      .toLowerCase()
      .split(" ")
      .join("-");

    if (category_name === category) {
      return true;
    }
  } catch (error) {
    return false;
  }
};

const routes = [
  {
    path: "/",
    component: () => import("pages/IndexPage.vue"),
    meta: { title: "Unlimited Drinks" },
  },
  {
    path: "/search",
    component: () => import("pages/SearchProductResults.vue"),
    meta: { title: `Unlimited Drinks Search Result:` },
  },
  {
    path: "/:category",
    component: () => import("pages/CategoryDrinks.vue"),
    meta: { title: "Unlimited Drinks" },
    beforeEnter: async (to, from, next) => {
      const categoryExists = await checkIfCategoryExists(to.params.category);
      if (categoryExists) {
        next();
      } else {
        next({ name: "NotFound" });
      }
    },
  },
  {
    path: "/:category/:id",
    component: () => import("pages/DrinksDetails.vue"),
    meta: { title: "Unlimited Drinks" },
    beforeEnter: async (to, from, next) => {
      const drinkExists = await checkIfDrinkExists(
        to.params.id,
        to.params.category
      );
      if (drinkExists) {
        next();
      } else {
        next({ name: "NotFound" });
      }
    },
  },
  {
    path: "/:category/:id/review",
    component: () => import("pages/CreateReview.vue"),
    meta: { title: "Unlimited Drinks: Reviews" },
    beforeEnter: async (to, from, next) => {
      const drinkExists = await checkIfDrinkExists(
        to.params.id,
        to.params.category
      );
      if (drinkExists) {
        next();
      } else {
        next({ name: "NotFound" });
      }
    },
  },

  {
    path: "/account",
    component: () => import("pages/AccountSettings.vue"),
    meta: { title: "Account Settings" },
    beforeEnter: authGuard,
  },
  {
    path: "/cart",
    component: () => import("pages/ViewCartPage.vue"),
    meta: { title: "Shopping Cart" },
  },
  {
    path: "/checkout",
    component: () => import("pages/OrderCheckout.vue"),
    meta: { title: "Checkout" },
    beforeEnter: authGuard,
  },
  {
    path: "/success",
    component: () => import("pages/OrderPlacedSuccess.vue"),
    meta: { title: "Thank you for placing an order!" },
    beforeEnter: authGuard,
  },
  {
    path: "/setup",
    component: () => import("pages/SetupAccount.vue"),
    meta: { title: "Setup Account" },
    beforeEnter: authGuard,
  },
  {
    path: "/orders",
    component: () => import("pages/ViewOrdersPage.vue"),
    meta: { title: "Unlimited Drinks: Orders" },
    beforeEnter: authGuard,
  },
  {
    path: "/:catchAll(.*)*",
    name: "NotFound",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
