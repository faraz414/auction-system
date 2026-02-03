<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useRoute } from "vue-router";

const API = "http://localhost:3333";
const route = useRoute();
const itemId = computed(() => Number(route.params.id));

const item = ref(null);
const bids = ref([]);
const questions = ref([]);

const bidAmount = ref("");
const questionText = ref("");
const answerDrafts = ref({});

const myUserId = ref(null);
const loading = ref(true);
const error = ref("");

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { "X-Authorization": token } : null;
}

async function loadItem() {
  const res = await fetch(`${API}/item/${itemId.value}`);
  if (!res.ok) throw new Error("Failed to load item");
  item.value = await res.json();
}

async function loadBids() {
  try {
    const res = await fetch(`${API}/item/${itemId.value}/bid`);
    bids.value = res.ok ? await res.json() : [];
  } catch {
    bids.value = [];
  }
}

async function loadQuestions() {
  try {
    const res = await fetch(`${API}/item/${itemId.value}/question`);
    questions.value = res.ok ? await res.json() : [];
  } catch {
    questions.value = [];
  }
}

async function refreshPage() {
  loading.value = true;
  error.value = "";

  try {
    await loadItem();
    await loadBids();
    await loadQuestions();
  } catch (err) {
    error.value = err.message || "Something went wrong";
  } finally {
    loading.value = false;
  }
}

async function placeBid() {
  const headers = getAuthHeaders();
  if (!headers) {
    alert("You must be logged in to bid");
    return;
  }

  const amount = Number(bidAmount.value);
  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Please enter a valid bid amount");
    return;
  }

  try {
    const res = await fetch(`${API}/item/${itemId.value}/bid`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ amount }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      alert(data?.error_message || `Bid failed, you can't place bid on your own item (${res.status})`);
      return;
    }

    alert("Bid placed!");
    bidAmount.value = "";
    await loadItem();
    await loadBids();
  } catch {
    alert("Bid failed (network error)");
  }
}


async function askQuestion() {
  const headers = getAuthHeaders();
  if (!headers) {
    alert("You must be logged in");
    return;
  }

  try {
    const res = await fetch(`${API}/item/${itemId.value}/question`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ question_text: questionText.value }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      alert(data?.error_message || `you can't ask questions on your own auction item (${res.status})`);
      return;
    }

    alert("Question sent!");
    questionText.value = "";
    await loadQuestions();
  } catch {
    alert("Failed to send question");
  }
}


async function answerQuestion(questionId) {
  const headers = getAuthHeaders();
  if (!headers) return;

  const text = (answerDrafts.value[questionId] || "").trim();
  if (!text) {
    alert("Answer cannot be empty");
    return;
  }

  try {
    await fetch(`${API}/question/${questionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ answer_text: text }),
    });

    answerDrafts.value[questionId] = "";
    await loadQuestions();
  } catch {
    alert("Failed to post answer");
  }
}

onMounted(() => {
  myUserId.value = Number(localStorage.getItem("user_id")) || null;
  refreshPage();
});

watch(
  () => route.params.id,
  () => {
    refreshPage();
  }
);
</script>


<template>
  <div class="item-wrapper">
    <div class="item-container">
      <p v-if="loading" class="text-secondary">Loading...</p>
      <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

      <div v-else-if="item">
        <h2 class="mb-3">{{ item.name }}</h2>
        <p class="text-secondary mb-4">{{ item.description }}</p>

        <div class="info-grid mb-4">
          <div class="info-item">
            <span class="info-label">Current bid:</span>
            <span class="info-value">£{{ item.current_bid }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Seller:</span>
            <span class="info-value">{{ item.first_name }} {{ item.last_name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Ends:</span>
            <span class="info-value">{{ new Date(item.end_date).toLocaleString() }}</span>
          </div>
        </div>

        <div class="card bg-dark border border-secondary mb-4">
          <div class="card-body">
            <h4 class="mb-3">Place a bid</h4>
            <div class="d-flex gap-2">
              <input
                v-model="bidAmount"
                type="number"
                class="form-control"
                placeholder="Bid amount"
                style="max-width: 200px"
              />
              <button class="btn btn-success" @click="placeBid">Place Bid</button>
            </div>
          </div>
        </div>

        <div class="card bg-dark border border-secondary mb-4">
          <div class="card-body">
            <h4 class="mb-3">Bid History</h4>
            <p v-if="bids.length === 0" class="text-secondary mb-0">No bids yet.</p>
            <div v-else class="bid-list">
              <div v-for="(b, idx) in bids" :key="idx" class="bid-item">
                <span class="bid-amount">£{{ b.amount }}</span>
                <span class="bid-user">{{ b.first_name }} {{ b.last_name }}</span>
                <span class="bid-time text-secondary">{{ new Date(b.timestamp).toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-dark border border-secondary">
          <div class="card-body">
            <h4 class="mb-3">Questions</h4>

            <div class="mb-4">
              <textarea
                v-model="questionText"
                class="form-control mb-2"
                placeholder="Ask a question about this item..."
                rows="3"
              ></textarea>
              <button class="btn btn-outline-success" @click="askQuestion">Send Question</button>
            </div>

            <p v-if="questions.length === 0" class="text-secondary">No questions yet.</p>

            <div v-else class="questions-list">
              <div
                v-for="q in questions"
                :key="q.question_id"
                class="question-item card bg-dark border border-secondary mb-3"
              >
                <div class="card-body">
                  <p class="mb-2"><strong>Q:</strong> {{ q.question_text }}</p>
                  <p v-if="q.answer_text" class="mb-0"><strong>A:</strong> {{ q.answer_text }}</p>
                  <p v-else class="text-secondary mb-0"><em>No answer yet</em></p>

                  <div v-if="!q.answer_text && myUserId === item.creator_id" class="mt-3">
                    <input
                      v-model="answerDrafts[q.question_id]"
                      class="form-control mb-2"
                      placeholder="Write an answer..."
                    />
                    <button class="btn btn-sm btn-outline-success" @click="answerQuestion(q.question_id)">
                      Post Answer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.item-wrapper {
  width: 100%;
  min-height: calc(100vh - 56px);
  background: #121212;
  padding: 2rem 3rem;
}

.item-container {
  max-width: 900px;
  margin: 0 auto;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  color: #9ca3af;
  font-size: 0.875rem;
}

.info-value {
  font-weight: 600;
  font-size: 1.125rem;
}

.bid-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bid-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #1a1a1a;
  border-radius: 0.375rem;
  border: 1px solid #2d2d2d;
}

.bid-amount {
  font-weight: 700;
  color: #34d399;
  min-width: 80px;
}

.bid-user {
  flex: 1;
}

.bid-time {
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .item-wrapper {
    padding: 1rem;
  }

  .bid-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

.bid-user {
  color: #e5e7eb; /* light readable text */
  font-weight: 500;
}

.bid-time {
  color: #9ca3af; /* softer grey for time */
}

.question-item p {
  color: #e5e7eb; /* light readable text */
}

.question-item strong {
  color: #ffffff;
}


</style>