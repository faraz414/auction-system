<script setup>
import { ref, onMounted } from "vue";
import PageCard from "../components/PageCard.vue";

const user = ref(null);
const loading = ref(true);

onMounted(async () => {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("user_id");

  if (!token || !userId) {
    loading.value = false;
    return;
  }

  try {
    const res = await fetch(`http://localhost:3333/users/${userId}`, {
      headers: { "X-Authorization": token },
    });

    if (res.status === 200) {
      user.value = await res.json();
    }
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <PageCard>
    <h2 class="mb-3">Profile</h2>

    <p v-if="loading" class="text-secondary mb-0">Loading...</p>

    <div v-else-if="user">
      <p class="mb-2">
        <span class="text-secondary">Name:</span>
        <span class="fw-semibold">{{ user.first_name }} {{ user.last_name }}</span>
      </p>

      <div class="list-group list-group-flush">
        <div class="list-group-item bg-dark text-light border-secondary d-flex justify-content-between">
          <span>Selling</span>
          <span class="badge text-bg-success">{{ user.selling.length }}</span>
        </div>

        <div class="list-group-item bg-dark text-light border-secondary d-flex justify-content-between">
          <span>Bidding on</span>
          <span class="badge text-bg-success">{{ user.bidding_on.length }}</span>
        </div>

        <div class="list-group-item bg-dark text-light border-secondary d-flex justify-content-between">
          <span>Ended auctions</span>
          <span class="badge text-bg-success">{{ user.auctions_ended.length }}</span>
        </div>
      </div>
    </div>

    <div v-else>
      <div class="alert alert-warning mb-0">
        Please login first.
      </div>
    </div>
  </PageCard>
</template>
