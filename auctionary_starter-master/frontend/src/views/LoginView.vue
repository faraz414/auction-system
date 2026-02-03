<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import PageCard from "../components/PageCard.vue";

const router = useRouter();

const email = ref("");
const password = ref("");
const isLoggingIn = ref(false);

async function handleLogin() {
  if (isLoggingIn.value) return;
  if (!email.value || !password.value) {
  alert("Please enter both your email and password");
  return;
}

  isLoggingIn.value = true;

  try {
    const res = await fetch("http://localhost:3333/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });

    const data = await res.json().catch(() => null);

    if (res.status !== 200) {
      alert("Incorrect email or password. Please try again.");
      return;
    }

    localStorage.setItem("token", data.session_token);
    localStorage.setItem("user_id", data.user_id);
    router.push("/profile");
  } finally {
    isLoggingIn.value = false;
  }
}
</script>

<template>
  <PageCard>
    <h2 class="mb-3">Login</h2>

    <div class="mb-3">
      <label class="form-label">Email</label>
      <input v-model="email" class="form-control" placeholder="you@example.com" />
    </div>

    <div class="mb-3">
      <label class="form-label">Password</label>
      <input v-model="password" class="form-control" type="password" placeholder="••••••••" />
    </div>

    <button class="btn btn-success w-100" :disabled="isLoggingIn" @click="handleLogin">
      {{ isLoggingIn ? "Logging in..." : "Login" }}
    </button>
  </PageCard>
</template>
