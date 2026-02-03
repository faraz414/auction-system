<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const auctions = ref([]);
const isLoading = ref(false);
const loadError = ref("");

const API_URL = "http://localhost:3333";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { "X-Authorization": token } : {};
}

function formatEndDate(ms) {
  return new Date(ms).toLocaleString();
}

async function loadAuctions() {
  isLoading.value = true;
  loadError.value = "";

  try {
    const res = await fetch(`${API_URL}/search`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const message = data?.error_message || `Request failed (${res.status})`;
      throw new Error(message);
    }

    auctions.value = await res.json();
  } catch (err) {
    loadError.value = err?.message || "Something went wrong";
  } finally {
    isLoading.value = false;
  }
}

function openItem(id) {
  router.push(`/item/${id}`);
}

onMounted(loadAuctions);
</script>

<template>
  <div class="home-wrapper">
    <div class="container-fluid px-4">
      <header class="hero-header">
        <h1>Console Auctions</h1>
        <p class="text-secondary">
          Buy and sell video game consoles, accessories, and collectibles.
        </p>

        <button class="btn btn-outline-success mt-3" @click="loadAuctions">
          Refresh
        </button>
      </header>

      <p v-if="isLoading" class="text-secondary">Loading...</p>
      <div v-else-if="loadError" class="alert alert-danger">{{ loadError }}</div>

      <div v-else>
        <div v-if="auctions.length === 0" class="alert alert-secondary">
          No items found.
        </div>

        <div v-else class="cards-grid">
          <article
            v-for="it in auctions"
            :key="it.item_id"
            class="auction-card"
            role="button"
            tabindex="0"
            @click="openItem(it.item_id)"
            @keydown.enter="openItem(it.item_id)"
          >
            <h5 class="mb-2">{{ it.name }}</h5>

            <p class="text-secondary description">
              {{ it.description }}
            </p>

            <small class="text-secondary">
              Ends: {{ formatEndDate(it.end_date) }}
            </small>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-wrapper {
  min-height: calc(100vh - 56px);
  background: #121212;
  padding: 2rem 0;
}

.hero-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

.auction-card {
  background: #1a1a1a;
  border: 1px solid #2d2d2d;
  border-radius: 10px;
  padding: 1.25rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.auction-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
}

/* keeps card heights similar */
.description {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
