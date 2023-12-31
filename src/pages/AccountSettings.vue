<script setup>
import AddressModal from "src/components/AddressModal.vue";
import FooterComponent from "src/components/FooterComponent.vue";
import NavBar from "src/components/NavBar.vue";

import { ref, computed } from "vue";
import { api } from "src/boot/axios";
import { useAuth0 } from "@auth0/auth0-vue";
import { useCustomerStore } from "src/stores/customer-store";
import { states } from "src/assets/usStates";

const customerStore = useCustomerStore();
const auth0 = useAuth0();

const editName = ref(false);
const deletetion = ref(false);
const newAddress = ref(false);

const isError = ref(null);
const messageName = ref(null);
const messageAddress = ref(null);

const email = customerStore.customer.email;

const first_name = ref(customerStore.customer.firstName);
const last_name = ref(customerStore.customer.lastName);

const address_first_name = ref("");
const address_last_name = ref("");
const street = ref("");
const apt = ref("");
const city = ref("");
const state = ref("");
const zip_code = ref("");

const disableAddressSave = computed(() => {
  return !(
    address_first_name.value &&
    address_last_name.value &&
    street.value &&
    city.value &&
    state.value &&
    (zip_code.value === null ? zip_code.value : zip_code.value.length === 5)
  );
});

const disableNameSave = computed(() => {
  return !(first_name.value && last_name.value);
});

const model = ref(null);

const handleClick = async () => {
  const customer_name = {
    first_name: first_name.value,
    last_name: last_name.value,
  };
  try {
    const response = await api.post(
      `/customer/editName/${auth0.user.value.sub.split("|")[1]}`,
      customer_name
    );
    if (response.status === 204) {
      isError.value = true;
      messageName.value =
        "No changes were made since there were no edits made!";
    } else if (response.status === 200) {
      isError.value = false;
      messageName.value = "Name changed successfully";
      customerStore.updateName(
        response.data.first_name,
        response.data.last_name
      );
      setTimeout(() => {
        isError.value = null;
        messageName.value = null;
      }, 2000);
      editName.value = false;
    } else {
      isError.value = true;
      messageName.value = "Something went wrong!";
    }
  } catch (err) {
    isError.value = true;
    messageName.value = "Something went wrong!";
    console.error(err);
  }
};

const deletedAccount = ref(false);
const deleteAccount = async () => {
  try {
    const response = await api.delete(
      `customer/delete/${auth0.user.value.sub.split("|")[1]}`
    );
    if (response.data) {
      await auth0.logout({
        logoutParams: { returnTo: "https://hamzehab.github.io/unlimiteddrinks-frontend" },
      });
      sessionStorage.clear();
    } else {
      deletedAccount.value = true;
      setTimeout(() => {
        deleteAccount.value = false;
      }, 2000);
    }
  } catch (e) {
    deletedAccount.value = true;
    setTimeout(() => {
      deleteAccount.value = false;
    }, 2000);
    console.error(e);
  }
};

const addresses = ref(
  sessionStorage.getItem("customer")
    ? [customerStore.getSelectedAddress, ...customerStore.getAddresses]
    : []
);

const addressStrings = computed(() =>
  addresses.value.map((address) => {
    return {
      id: address.id,
      label: {
        first_name: address.first_name,
        last_name: address.last_name,
      },
      value: {
        street: address.street,
        apt: address.street2 ? address.street2 : null,
        city: address.city,
        state: address.state,
        zip_code: address.zip_code,
      },
    };
  })
);

const isMainAddress = ref(false);
const updateSelectedAddress = async (value) => {
  model.value = value;

  address_first_name.value = value.label.first_name;
  address_last_name.value = value.label.last_name;

  street.value = value.value.street;
  apt.value = value.value.apt;

  city.value = value.value.city;
  state.value = value.value.state;
  zip_code.value = value.value.zip_code;

  try {
    const response = await api.get(
      `/address/isMain/${auth0.user.value.sub.split("|")[1]}/${value.id}`
    );
    if (response.data) isMainAddress.value = true;
    else isMainAddress.value = false;
  } catch (e) {
    console.error(e);
  }
};

const closeAddressModal = (address) => {
  addresses.value.push(address);
  newAddress.value = false;
};

const saveAddressUpdates = async () => {
  const data = {
    first_name: address_first_name.value,
    last_name: address_last_name.value,
    street: street.value,
    street2: apt.value !== "" ? apt.value : undefined,
    city: city.value,
    state: state.value,
    zip_code: zip_code.value,
  };
  try {
    const response = await api.post(
      `/address/update/${auth0.user.value.sub.split("|")[1]}/${model.value.id}`,
      data
    );

    if (response.status === 200) {
      isError.value = false;
      messageAddress.value = "Address Updated!";

      customerStore.updateAddress(response.data);
      addresses.value = [
        customerStore.getSelectedAddress,
        ...customerStore.getAddresses,
      ];

      model.value = null;
      setTimeout(() => {
        isError.value = null;
        messageAddress.value = null;
      }, 2000);
    } else if (response.status === 204) {
      isError.value = true;
      messageAddress.value =
        "Address not updated were made since there were no changes!";
    } else {
      isError.value = true;
      messageAddress.value = "Something went wrong!";
    }
  } catch (e) {
    isError.value = true;
    messageAddress.value = "Something went wrong!";
    console.error(e);
  }
};

const deleted = ref(false);
const deleteAddress = async () => {
  try {
    const response = await api.delete(
      `/address/delete/${auth0.user.value.sub.split("|")[1]}/${model.value.id}`
    );
    if (response.data) {
      customerStore.deleteAddress(model.value);
      addresses.value = [
        customerStore.getSelectedAddress,
        ...customerStore.getAddresses,
      ];
      model.value = null;
    } else {
      deleted.value = true;
      setTimeout(() => {
        deleted.value = false;
      }, 1000);
    }
  } catch (e) {
    console.error(e);
  }
};

const usStates = states;
</script>

<template>
  <NavBar />
  <div class="main">
    <div class="q-mx-auto q-my-xl" style="width: 70%">
      <div class="ys text-h4 row items-center">
        <q-icon name="mdi-account-circle-outline" size="50px" />
        <div class="on-right">
          <div>Your Account</div>
          <div class="text-body1 on-right">
            Welcome, {{ customerStore.getFullName }}
          </div>
          <div class="text-caption on-right">
            Member Since: {{ customerStore.customer.memberSince }}
          </div>
        </div>
      </div>

      <q-separator class="q-mt-lg q-mb-xl" />

      <q-card class="q-pa-md">
        <q-card-section class="oswald" style="width: 100%; max-width: 60%">
          <div class="ys text-h6 q-mb-sm">Email</div>
          <q-input
            class="q-mb-sm"
            label="Email Address"
            v-model.trim="email"
            standout="bg-grey-3 text-deep-purple-14"
            input-class="text-dark"
            disable
          />
          <div class="row justify-end text-grey-6 text-body2">
            Email cannot be edited
          </div>
        </q-card-section>
      </q-card>

      <q-separator class="q-my-xl" />
      <q-card class="q-pa-lg">
        <q-card-section class="row justify-between">
          <div class="oswald" style="width: 100%; max-width: 60%">
            <div class="row ys q-mb-md">
              <div class="text-h6 on-left">Name</div>
              <div
                class="oswald underline row items-center text-deep-purple-14 text-body2"
              >
                <div
                  class="cursor-pointer"
                  v-if="!editName"
                  @click="editName = true"
                >
                  Edit Name
                </div>
              </div>
            </div>
            <transition
              appear
              enter-active-class="animated zoomIn"
              leave-active-class="animated zoomOut"
            >
              <q-card-section
                v-if="messageName"
                class="q-pa-none q-pb-md"
                :class="isError ? 'text-red' : 'text-green'"
              >
                {{ messageName }}
              </q-card-section>
            </transition>
            <q-input
              class="q-mb-lg"
              label="First Name"
              standout="bg-grey-3 text-deep-purple-14"
              input-class="text-dark"
              v-model.trim="first_name"
              :disable="!editName"
            />
            <q-input
              label="Last Name"
              standout="bg-grey-3 text-deep-purple-14"
              input-class="text-dark"
              v-model.trim="last_name"
              :disable="!editName"
            />
          </div>
        </q-card-section>

        <q-card-section v-if="editName" class="row justify-center oswald">
          <q-btn
            class="q-mt-lg on-left"
            label="Cancel"
            color="dark"
            flat
            @click="editName = false"
          />
          <q-btn
            class="q-mt-lg on-right"
            label="Confirm Changes"
            color="deep-purple-14"
            push
            :disable="disableNameSave"
            @click="handleClick()"
          />
        </q-card-section>
      </q-card>

      <q-separator class="q-my-xl" />

      <q-card class="q-pa-md">
        <q-card-section class="oswald">
          <div class="q-mb-sm row items-center">
            <div class="ys text-h6 on-left">Addresses</div>
          </div>
          <div class="row justify-between">
            <q-select
              ref="addressSelect"
              outlined
              v-model.trim="model"
              :options="addressStrings"
              label="Select Address"
              style="width: 60%"
            >
              <template v-slot:option="scope">
                <q-item
                  clickable
                  v-close-popup
                  @click="updateSelectedAddress(scope.opt)"
                >
                  <q-item-section>
                    <div class="text-bold text-body2">
                      {{ scope.opt.label.first_name }}
                      {{ scope.opt.label.last_name }}
                    </div>
                    <span class="text-caption">
                      {{ scope.opt.value.street
                      }}{{
                        scope.opt.value.apt ? " " + scope.opt.value.apt : ""
                      }},

                      {{ scope.opt.value.city }}
                      {{ scope.opt.value.state }}
                      {{ scope.opt.value.zip_code }}
                    </span>
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:selected-item="scope">
                <q-item class="q-pa-none">
                  <q-item-section>
                    <div class="text-bold text-body1">
                      {{ scope.opt.label.first_name }}
                      {{ scope.opt.label.last_name }}
                    </div>
                    <span class="text-body2">
                      {{ scope.opt.value.street
                      }}{{
                        scope.opt.value.apt ? " " + scope.opt.value.apt : ""
                      }},
                      {{ scope.opt.value.city }}
                      {{ scope.opt.value.state }}
                      {{ scope.opt.value.zip_code }}
                    </span>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-btn flat color="deep-purple-14" @click="newAddress = true">
              <div class="text-center">
                <q-icon name="add" size="30px" />
                <div>Add Address</div>
              </div>
            </q-btn>
          </div>
          <q-card-section v-if="model" class="q-pa-none q-pt-lg">
            <q-input
              class="q-my-md"
              label="First Name"
              v-model.trim="address_first_name"
              standout="bg-grey-3 text-deep-purple-14"
              input-class="text-dark"
            />
            <q-input
              label="Last Name"
              v-model.trim="address_last_name"
              standout="bg-grey-3 text-deep-purple-14 "
              input-class="text-dark"
            />
            <q-input
              class="q-my-md"
              label="Street Address"
              v-model.trim="street"
              standout="bg-grey-3 text-deep-purple-14"
              input-class="text-dark"
            />
            <q-input
              label="Apt, suite, unit, building, floor, etc."
              standout="bg-grey-3 text-deep-purple-14"
              input-class="text-dark"
              v-model.trim="apt"
            />
            <q-input
              class="q-my-md"
              label="City"
              standout="bg-grey-3 text-deep-purple-14"
              input-class="text-dark"
              v-model.trim="city"
            />
            <div class="row justify-between">
              <q-select
                standout="bg-grey-3 text-deep-purple-14"
                style="width: 100%; max-width: 49%"
                label="State"
                emit-value
                map-options
                options-dense
                v-model="state"
                :options="usStates"
              >
                <template v-slot:selected-item="scope">
                  <span class="text-dark">
                    {{ scope.opt.label }}
                  </span>
                </template>
              </q-select>

              <q-input
                label="ZIP Code"
                v-model.trim="zip_code"
                standout="bg-grey-3 text-deep-purple-14"
                input-class="text-dark"
                mask="#####"
                style="width: 100%; max-width: 49%"
              />
            </div>
          </q-card-section>
        </q-card-section>
        <q-card-section
          v-if="model && !isMainAddress"
          class="q-pb-none flex flex-center"
        >
          <q-btn
            :class="deleted ? 'animated shakeX slower' : ''"
            label="Remove from account"
            flat
            color="red"
            @click="deleteAddress()"
          />
        </q-card-section>
        <q-card-section v-if="model" class="flex flex-center oswald">
          <div
            class="text-center text-body1 cursor-pointer underline"
            style="width: 200px"
            @click="(model = null), (messageAddress = null)"
          >
            Cancel
          </div>
          <q-btn
            label="Save Changes"
            color="deep-purple-14"
            style="width: 200px"
            push
            :disable="disableAddressSave"
            @click="saveAddressUpdates()"
          />
        </q-card-section>
        <q-card-section
          v-if="messageAddress"
          :class="isError ? 'q-pb-none' : 'q-py-none'"
        >
          <div
            class="text-body2 oswald"
            :class="isError ? 'text-red text-center' : 'text-green'"
          >
            {{ messageAddress }}
          </div>
        </q-card-section>
      </q-card>

      <div class="row justify-end q-mt-xl">
        <q-btn
          class="q-pa-md"
          flat
          label="Delete Account"
          color="negative"
          @click="deletetion = true"
        />
      </div>
    </div>
    <q-dialog v-model="deletetion">
      <q-card style="width: 100%; max-width: 700px">
        <q-card-section class="text-h6 ys bg-deep-purple-14 text-white">
          Are you sure you want to permanently delete your account?
        </q-card-section>
        <q-card-section class="oswald text-body1 q-mx-xl">
          <div>By deleting your account:</div>
          <div class="q-ml-md">
            <div>
              <q-icon name="remove" />
              You will lose access to your order history and any saved cart
              items.
            </div>
            <div>
              <q-icon name="remove" />
              Any active subscriptions or membership benefits will be canceled.
            </div>
            <div>
              <q-icon name="remove" />
              You will lose access to your order history and any saved cart
              items.
            </div>
            <div>
              <q-icon name="remove" />
              You won't be able to track the status of current or future orders.
            </div>
            <div>
              <q-icon name="remove" />
              Your personal information will be permanently removed from our
              system and will not be used for future transactions.
            </div>
          </div>
        </q-card-section>
        <q-card-actions class="q-pb-md" align="right">
          <q-btn
            label="cancel"
            push
            color="dark"
            style="width: 100%; max-width: 150px"
            v-close-popup
          />
          <q-btn
            :class="deletedAccount ? 'animated shakeX slower' : ''"
            label="delete"
            style="width: 100%; max-width: 150px"
            flat
            color="negative"
            @click="deleteAccount()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <AddressModal v-model="newAddress" @add-address="closeAddressModal" />
  </div>
  <FooterComponent />
</template>
