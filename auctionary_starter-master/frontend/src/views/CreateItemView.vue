<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import PageCard from "../components/PageCard.vue";

const router = useRouter();

const itemName = ref("");
const itemDescription = ref("");
const startingBid = ref("");
const endDate = ref("");
const isSubmitting = ref(false);

// local draft key
const draftStorageKey = "create_item_draft";

// save draft
const saveDraftLocally = () => {
  const draft = {
    itemName: itemName.value,
    itemDescription: itemDescription.value,
    startingBid: startingBid.value,
    endDate: endDate.value,
  };

  localStorage.setItem(draftStorageKey, JSON.stringify(draft));
  alert("Draft saved");
};


// for loading  draft
const loadSavedDraft = () => {
  const saved = localStorage.getItem(draftStorageKey);
  if (!saved) {
    alert("No draft found");
    return;
  }

  const draft = JSON.parse(saved);

  itemName.value = draft.itemName || "";
  itemDescription.value = draft.itemDescription || "";
  startingBid.value = draft.startingBid || "";
  endDate.value = draft.endDate || "";

  alert("Draft loaded");
};


// to delete draft
const clearDraft = () => {
  localStorage.removeItem(draftStorageKey);
  alert("Draft deleted");
};


async function submitAuction() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in first");
    return;
  }

  if (!itemName.value.trim()) {
  alert("Please enter an item name");
  return;
}

if (!itemDescription.value.trim()) {
  alert("Please add a description for the item");
  return;
}

  // API expects a timestamp, so convert the date input
  const endTimestamp = new Date(endDate.value).getTime();

  if (!Number.isFinite(endTimestamp)) {
    alert("Please select an end date and time");
    return;
  }

  isSubmitting.value = true;

  try {
    const res = await fetch("http://localhost:3333/item", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Authorization": token,
      },
      body: JSON.stringify({
        name: itemName.value,
        description: itemDescription.value,
        starting_bid: Number(startingBid.value),
        end_date: endTimestamp,
      }),
    });

    if (res.status === 201) {
      alert("Auction created successfully");
      router.push("/");
      return;
    }

    const data = await res.json().catch(() => null);
    alert(data?.error_message || "Could not create auction");
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <PageCard>
    <h2 class="mb-3">Create Auction</h2>

    <div class="mb-3">
      <label class="form-label">Item name</label>
      <input
        v-model="itemName"
        class="form-control"
        placeholder="e.g. PlayStation 4"
      />
    </div>

    <div class="mb-3">
      <label class="form-label">Description</label>
      <textarea
        v-model="itemDescription"
        class="form-control"
        rows="4"
        placeholder="Condition, accessories, etc."
      ></textarea>
    </div>

    <div class="mb-3">
      <label class="form-label">Starting bid (£)</label>
      <input
        v-model="startingBid"
        class="form-control"
        type="number"
        placeholder="e.g. 150"
      />
    </div>

    <div class="mb-3">
      <label class="form-label">End date/time</label>
      <input
        v-model="endDate"
        class="form-control"
        type="datetime-local"
      />
    </div>

    <div class="d-flex gap-2 mb-3">
  <button class="btn btn-outline-secondary w-100" @click="saveDraftLocally">
    Save Draft
  </button>

  <button class="btn btn-outline-secondary w-100" @click="loadSavedDraft">
    Load Draft
  </button>

  <button class="btn btn-outline-danger w-100" @click="clearDraft">
    Delete Draft
  </button>
</div>


    <button
      class="btn btn-success w-100"
      :disabled="isSubmitting"
      @click="submitAuction"
    >
      {{ isSubmitting ? "Creating..." : "Create" }}
    </button>
  </PageCard>
</template>
