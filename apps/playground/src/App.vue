<script setup lang="ts">
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "@andabove/vuqs";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import DemoPanel from "./components/DemoPanel.vue";

const tabs = ["overview", "details", "settings"] as const;

const search = useQueryState("q", parseAsString);
const page = useQueryState("page", parseAsInteger.withDefault(1));
const active = useQueryState("active", parseAsBoolean.withDefault(false));
const tab = useQueryState("tab", parseAsStringLiteral(tabs).withDefault("overview"));
const tags = useQueryState("tags", parseAsArrayOf(parseAsString).withDefault([]));
const sort = useQueryState("sort", parseAsString.withOptions({ mode: "push" }));

const route = useRoute();
const newTag = ref("");

const currentUrl = computed(() => {
  if (typeof window === "undefined") return route.fullPath;
  return `${window.location.origin}${route.fullPath}`;
});

const parsedState = computed(() => ({
  q: search.value,
  page: page.value,
  active: active.value,
  tab: tab.value,
  tags: tags.value,
  sort: sort.value,
}));

const cleanUrlNotes = computed(() => {
  const notes: string[] = [];
  if (page.value === 1) notes.push("page omitted (default: 1)");
  if (active.value === false) notes.push("active omitted (default: false)");
  if (tab.value === "overview") notes.push("tab omitted (default: overview)");
  if (tags.value.length === 0) notes.push("tags omitted (default: [])");
  if (sort.value === null) notes.push("sort omitted (no value set)");
  return notes;
});

function addTag() {
  const value = newTag.value.trim();
  if (!value || tags.value.includes(value)) return;
  tags.value = [...tags.value, value];
  newTag.value = "";
}

function removeTag(tag: string) {
  tags.value = tags.value.filter((item) => item !== tag);
}
</script>

<template>
  <div class="page">
    <header class="header">
      <h1>vuqs playground</h1>
      <p>Type-safe URL query state for Vue 3. Change controls below and watch the URL update.</p>
    </header>

    <DemoPanel title="Live URL">
      <code class="url">{{ currentUrl }}</code>
      <p class="hint">Route path: {{ route.path }}</p>
    </DemoPanel>

    <DemoPanel title="Query controls">
      <label class="field">
        <span>q (parseAsString)</span>
        <input v-model="search" type="text" placeholder="Search…" />
      </label>

      <div class="field">
        <span>page (parseAsInteger, default 1)</span>
        <div class="row">
          <button type="button" @click="page = Math.max(1, page - 1)">−</button>
          <strong>{{ page }}</strong>
          <button type="button" @click="page = page + 1">+</button>
          <button type="button" class="secondary" @click="page = 1">Reset</button>
        </div>
      </div>

      <label class="field checkbox">
        <input v-model="active" type="checkbox" />
        <span>active (parseAsBoolean, default false)</span>
      </label>

      <div class="field">
        <span>tab (parseAsStringLiteral)</span>
        <div class="row">
          <label v-for="option in tabs" :key="option" class="radio">
            <input v-model="tab" type="radio" name="tab" :value="option" />
            {{ option }}
          </label>
        </div>
      </div>

      <div class="field">
        <span>tags (parseAsArrayOf parseAsString)</span>
        <div class="row">
          <input v-model="newTag" type="text" placeholder="Add tag…" @keyup.enter="addTag" />
          <button type="button" @click="addTag">Add</button>
        </div>
        <div class="chips">
          <button v-for="tag in tags" :key="tag" type="button" class="chip" @click="removeTag(tag)">
            {{ tag }} ×
          </button>
          <span v-if="tags.length === 0" class="hint">No tags</span>
        </div>
      </div>

      <label class="field">
        <span>sort (parseAsString, mode: push — use browser back after changing)</span>
        <select v-model="sort">
          <option :value="null">—</option>
          <option value="asc">asc</option>
          <option value="desc">desc</option>
        </select>
      </label>
    </DemoPanel>

    <DemoPanel title="Parsed state">
      <pre>{{ JSON.stringify(parsedState, null, 2) }}</pre>
    </DemoPanel>

    <DemoPanel v-if="cleanUrlNotes.length > 0" title="Clean URL (defaults omitted)">
      <ul>
        <li v-for="note in cleanUrlNotes" :key="note">{{ note }}</li>
      </ul>
    </DemoPanel>
  </div>
</template>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.5rem 3rem;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  color: #111;
}

.header h1 {
  margin: 0 0 0.5rem;
  font-size: 1.75rem;
}

.header p {
  margin: 0 0 1.5rem;
  color: #555;
}

.url {
  display: block;
  word-break: break-all;
  padding: 0.75rem;
  background: #f4f4f5;
  border-radius: 6px;
  font-size: 0.875rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.field.checkbox {
  flex-direction: row;
  align-items: center;
}

.field span {
  font-size: 0.875rem;
  font-weight: 600;
}

input[type="text"],
select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d4d4d8;
  border-radius: 6px;
  font: inherit;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

button {
  padding: 0.45rem 0.85rem;
  border: 1px solid #d4d4d8;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font: inherit;
}

button.secondary {
  color: #555;
}

.radio {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 400;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.hint {
  margin: 0.5rem 0 0;
  color: #71717a;
  font-size: 0.875rem;
}

pre {
  margin: 0;
  padding: 0.75rem;
  background: #f4f4f5;
  border-radius: 6px;
  font-size: 0.8125rem;
  overflow-x: auto;
}

ul {
  margin: 0;
  padding-left: 1.25rem;
  color: #555;
}
</style>
