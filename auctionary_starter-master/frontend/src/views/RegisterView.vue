<script setup>
import { ref } from "vue";
import PageCard from "../components/PageCard.vue";

const firstName = ref("");
const lastName = ref("");
const email = ref("");
const password = ref("");
const isSubmitting = ref(false);

const register = async () => {
  if (isSubmitting.value) return;
  if (!firstName.value || !lastName.value || !email.value || !password.value) {
  alert("Please fill in all fields before registering");
  return;
}


  isSubmitting.value = true;

  try {
    const res = await fetch("http://localhost:3333/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: firstName.value,
        last_name: lastName.value,
        email: email.value,
        password: password.value,
      }),
    });

    if (res.ok) {
      alert("Account created successfully");

      // clear the form after success
      firstName.value = "";
      lastName.value = "";
      email.value = "";
      password.value = "";
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error_message || "Registration failed");
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>


<template>
  <PageCard>
    <h2 class="mb-3">Register</h2>

    <div class="mb-3">
      <label class="form-label">First name</label>
      <input v-model="firstName" class="form-control" placeholder="e.g. Faraz" />
    </div>

    <div class="mb-3">
      <label class="form-label">Last name</label>
      <input v-model="lastName" class="form-control" placeholder="e.g. Umar" />
    </div>

    <div class="mb-3">
      <label class="form-label">Email</label>
      <input v-model="email" class="form-control" placeholder="you@example.com" />
    </div>

    <div class="mb-3">
      <label class="form-label">Password</label>
      <input v-model="password" class="form-control" type="password" placeholder="••••••••" />
    </div>

    <button class="btn btn-success w-100" :disabled="busy" @click="register">
      {{ busy ? "Registering..." : "Register" }}
    </button>
  </PageCard>
</template>
