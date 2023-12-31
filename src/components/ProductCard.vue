<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useCartStore } from "src/stores/cart-store";
import { api } from "src/boot/axios";

const cartStore = useCartStore();
const $router = useRouter();

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
});

const quantity = ref(1);
const isLoading = ref(false);
const addedToCart = ref(null);

const exceedsLimit = ref(null);
const exceedQuantity = ref(null);

const viewFullItem = () => {
  const category = props.product.category_name
    .toLowerCase()
    .split(" ")
    .join("-");
  $router.push(`/${category}/${props.product.id}`);
};

const addToCart = async (event) => {
  if (event && event.stopPropagation) event.stopPropagation();
  isLoading.value = true;
  const totalQuantity =
    quantity.value +
    (cartStore.items.find((item) => item.product_id === props.product.id)
      ? cartStore.items.find((item) => item.product_id === props.product.id)
          .quantity
      : 0);

  try {
    const response = await api.get(
      `product/cart/${props.product.id}?quantity=${totalQuantity}`
    );
    if (response.data["can_add"] === true) {
      cartStore.addItem(props.product.id, quantity.value);
      addedToCart.value = true;
      exceedsLimit.value = false;
      quantity.value = 1;
    } else {
      exceedsLimit.value = true;
      exceedQuantity.value = response.data.quantity;
    }
  } catch (e) {
    console.error(e);
  }

  setTimeout(() => {
    isLoading.value = false;
  }, 1000);
  setTimeout(() => {
    addedToCart.value = null;
  }, 3000);
};

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value = parseInt(quantity.value) - 1;
  }
};

const increaseQuantity = () => {
  if (quantity.value < 25) {
    quantity.value = parseInt(quantity.value) + 1;
  }
};

onMounted(() => {
  const slide = document.querySelectorAll(".slide");
  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("animated", entry.isIntersecting);
      entry.target.classList.toggle("slideInLeft", entry.isIntersecting);
      entry.target.classList.toggle("slower", entry.isIntersecting);
      if (entry.isIntersecting) slideObserver.unobserve(entry.target);
    });
  });

  slide.forEach((entry) => {
    slideObserver.observe(entry);
  });
});
</script>

<template>
  <q-card class="slide q-my-lg oswald" style="width: 100%; max-width: 400px">
    <img
      class="cursor-pointer"
      :src="`static/products/${product.image}`"
      @click="viewFullItem()"
    />
    <q-separator
      class="q-mt-md bg-deep-purple-14"
      style="padding-top: 1px; padding-bottom: 1px"
    />

    <q-card-section class="q-pb-none" @click="viewFullItem()">
      <span class="text-h6 cursor-pointer" @click="viewFullItem()">
        {{ product.name }}
      </span>
    </q-card-section>

    <q-card-section class="q-pb-none">
      <div>{{ product.description.slice(0, 250) }}...</div>
    </q-card-section>

    <q-card-section class="q-pb-none row justify-end items-center">
      <q-icon
        class="cursor-pointer on-left"
        name="remove"
        size="20px"
        @click="decreaseQuantity()"
      />
      <q-input
        class="rounded-borders"
        input-class="ys text-bold text-h6 text-center"
        style="width: 2.5rem"
        v-model.trim="quantity"
        mask="##"
        dense
        borderless
        unmasked-value
        readonly
      />
      <q-icon
        class="cursor-pointer on-right"
        name="add"
        size="20px"
        @click="increaseQuantity()"
      />
    </q-card-section>
    <q-card-section class="q-pt-none">
      <div class="text-caption row justify-end">Max limit 25</div>
    </q-card-section>
    <q-card-section v-if="exceedsLimit">
      <transition
        appear
        enter-active-class="animated zoomIn"
        leave-active-class="animated zoomOut"
      >
        <div class="text-warning animated zoomIn">
          Cannot add to cart. Only {{ exceedQuantity }} left in stock!
        </div>
      </transition>
    </q-card-section>
    <q-card-section
      class="q-py-none"
      v-if="cartStore.items.find((item) => item.product_id === product.id)"
    >
      <div
        class="row justify-end"
        v-if="cartStore.items.find((item) => item.product_id === product.id)"
      >
        <div
          v-if="
            cartStore.items.find((item) => item.product_id === product.id)
              .quantity +
              quantity <=
            25
          "
        >
          <transition
            appear
            enter-active-class="animated zoomIn"
            leave-active-class="animated zoomOut"
          >
            <div v-if="addedToCart" class="text-positive animated zoomIn">
              {{ product.name }} successfully added to cart!
            </div>
          </transition>
          <transition
            appear
            enter-active-class="animated zoomIn"
            leave-active-class="animated zoomOut"
          >
            <div
              v-if="addedToCart == false"
              class="text-negative animated zoomIn slow"
            >
              Something went wrong adding item to cart!
            </div>
          </transition>
        </div>
        <transition
          appear
          enter-active-class="animated zoomIn"
          leave-active-class="animated zoomOut"
        >
          <div
            v-if="
              cartStore.items.find((item) => item.product_id === product.id)
                .quantity === 25
            "
            class="text-amber-8"
          >
            Quantity exceeds limit
          </div>
        </transition>
      </div>
    </q-card-section>
    <q-card-section class="row justify-between items-center">
      <div class="ys text-h6 cursor-pointer" @click="viewFullItem()">
        $ {{ product.price.toFixed(2) }}
      </div>

      <q-btn
        :color="product.quantity === 0 ? 'negative' : 'deep-purple-14'"
        rounded
        push
        :disable="
          product.quantity === 0 ||
          cartStore.items.some(
            (item) => item.product_id === product.id && item.quantity === 25
          )
        "
        @click="addToCart()"
      >
        <div v-if="product.quantity === 0">OUT OF STOCK</div>
        <div
          v-else-if="
            cartStore.items.some(
              (item) => item.product_id === product.id && item.quantity === 25
            )
          "
        >
          MAX LIMIT REACHED
        </div>
        <div v-else-if="product.quantity !== 0 && !isLoading">
          ADD TO CART
          <q-icon
            v-if="product.quantity !== 0"
            name="mdi-cart-outline on-right"
          />
        </div>
        <div v-else-if="isLoading">
          <q-spinner color="white" size="1em" :thickness="8" />
        </div>
      </q-btn>
    </q-card-section>
  </q-card>
</template>
