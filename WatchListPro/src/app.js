/**
 * WatchListPro - app.js
 * - CRUD de ítems (películas / series)
 * - Estados: saw (Visto), to-do (Por ver), saved (Guardado)
 * - Persistencia: localStorage
 */
const STORAGE_KEY = 'watchlistpro_state_v1';

/** @typedef {"movies"|"series"} ItemType */
/** @typedef {"saw"|"to-do"|"saved"} ItemStatus */
/**
 * @typedef {Object} WatchItem
 * @property {string} id
 * @property {ItemType} type
 * @property {string} title
 * @property {string} genre
 * @property {ItemStatus} status
 * @property {number} createdAt
 */

const form = document.getElementById('item-form');
const typeSelect = document.getElementById('item-type');
const titleInput = document.getElementById('item-title');
const genreInput = document.getElementById('item-genre');
const statusSelect = document.getElementById('item-status');
const clearAllBtn = document.getElementById('clear-all');

const seriesList = document.getElementById('series-list');
const moviesList = document.getElementById('movies-list');
const seriesCount = document.getElementById('series-count');
const moviesCount = document.getElementById('movies-count');

const filterButtons = Array.from(document.querySelectorAll('button[data-filter]'));

/** @type {WatchItem[]} */
let items = [];

/** @type {"all"|ItemStatus} */
let activeFilter = 'all';

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** @returns {{ items: WatchItem[] } | null} */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return null;
    return { items: parsed.items };
  } catch {
    return null;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
}

/** @param {ItemStatus} status */
function statusLabel(status) {
  if (status === 'saw') return 'Visto';
  if (status === 'to-do') return 'Por ver';
  return 'Guardado';
}

/** @param {ItemType} type */
function typeLabel(type) {
  return type === 'movies' ? 'Película' : 'Serie';
}

function normalizeText(s) {
  return String(s ?? '').trim();
}

/** @param {WatchItem} item */
function createRow(item) {
  const li = document.createElement('li');
  li.className = 'item-row';
  li.dataset.id = item.id;
  li.dataset.status = item.status;
  li.dataset.type = item.type;

  const title = document.createElement('div');
  title.className = 'item-title';
  title.textContent = item.title;
  title.title = item.title;

  const genre = document.createElement('div');
  genre.className = 'item-genre';
  genre.textContent = item.genre || '—';
  genre.title = item.genre || '';

  const badge = document.createElement('button');
  badge.type = 'button';
  badge.className = `badge ${item.status}`;
  badge.textContent = statusLabel(item.status);
  badge.setAttribute('aria-label', `Cambiar estado (${statusLabel(item.status)})`);
  badge.title = 'Cambiar estado';
  badge.addEventListener('click', () => cycleStatus(item.id));

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'icon-btn icon-btn--danger';
  del.setAttribute('aria-label', `Eliminar ${typeLabel(item.type)}`);
  del.title = 'Eliminar';
  del.textContent = '×';
  del.addEventListener('click', () => deleteItem(item.id));

  li.appendChild(title);
  li.appendChild(genre);
  li.appendChild(badge);
  li.appendChild(del);
  return li;
}

function applyFilterToDom() {
  const shouldShow = (li) => {
    if (activeFilter === 'all') return true;
    return li.dataset.status === activeFilter;
  };

  [seriesList, moviesList].forEach((ul) => {
    if (!ul) return;
    Array.from(ul.querySelectorAll('li.item-row')).forEach((li) => {
      li.style.display = shouldShow(li) ? '' : 'none';
    });
  });
}

function render() {
  if (!seriesList || !moviesList) return;

  seriesList.innerHTML = '';
  moviesList.innerHTML = '';

  const series = items.filter(i => i.type === 'series');
  const movies = items.filter(i => i.type === 'movies');

  series
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach((i) => seriesList.appendChild(createRow(i)));

  movies
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach((i) => moviesList.appendChild(createRow(i)));

  if (seriesCount) seriesCount.textContent = String(series.length);
  if (moviesCount) moviesCount.textContent = String(movies.length);

  applyFilterToDom();
}

/** @param {string} id */
function deleteItem(id) {
  items = items.filter(i => i.id !== id);
  saveState();
  render();
}

/** @param {string} id */
function cycleStatus(id) {
  const order = /** @type {ItemStatus[]} */ (['to-do', 'saved', 'saw']);
  const item = items.find(i => i.id === id);
  if (!item) return;
  const idx = order.indexOf(item.status);
  item.status = order[(idx + 1) % order.length];
  saveState();
  render();
}

function clearAll() {
  const ok = window.confirm('¿Borrar toda tu watchlist?');
  if (!ok) return;
  items = [];
  saveState();
  render();
}

function setActiveFilter(next) {
  activeFilter = next;
  filterButtons.forEach((b) => {
    b.classList.toggle('is-active', b.dataset.filter === next);
  });
  applyFilterToDom();
}

function addFromForm() {
  if (!(typeSelect instanceof HTMLSelectElement)) return;
  if (!(statusSelect instanceof HTMLSelectElement)) return;
  if (!(titleInput instanceof HTMLInputElement)) return;
  if (!(genreInput instanceof HTMLInputElement)) return;

  const type = /** @type {ItemType} */ (typeSelect.value === 'movies' ? 'movies' : 'series');
  const status = /** @type {ItemStatus} */ (
    statusSelect.value === 'saw' ? 'saw' : statusSelect.value === 'saved' ? 'saved' : 'to-do'
  );
  const title = normalizeText(titleInput.value);
  const genre = normalizeText(genreInput.value);
  if (!title) return;

  /** @type {WatchItem} */
  const item = {
    id: generateId(),
    type,
    title,
    genre,
    status,
    createdAt: Date.now()
  };

  items.unshift(item);
  saveState();

  titleInput.value = '';
  genreInput.value = '';
  titleInput.focus();

  render();
}

// ===== Init =====
const state = loadState();
items = state?.items ?? [];

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  addFromForm();
});

clearAllBtn?.addEventListener('click', clearAll);

filterButtons.forEach((b) => {
  b.addEventListener('click', () => {
    const f = b.dataset.filter;
    if (f === 'saw' || f === 'to-do' || f === 'saved') setActiveFilter(f);
    else setActiveFilter('all');
  });
});

render();

