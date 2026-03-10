/* Minimal test harness for NextUp (browser only) */

function $(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing required element #${id}`);
  return el;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function readStoredTasks() {
  const raw = localStorage.getItem('tasks');
  if (!raw) return null;

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return null;

  // Soporta formato antiguo (array de strings) y nuevo (array de objetos { id, text }).
  if (parsed.length === 0) return [];
  if (typeof parsed[0] === 'string') return parsed;
  return parsed.map((t) => t.text);
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected} but got ${actual}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(message || `Expected ${e} but got ${a}`);
}

function liTexts() {
  return Array.from($('elemento').querySelectorAll('li span')).map((s) => s.textContent);
}

function visibleLiTexts() {
  return Array.from($('elemento').querySelectorAll('li'))
    .filter((li) => window.getComputedStyle(li).display !== 'none')
    .map((li) => li.querySelector('span')?.textContent ?? '');
}

function resetUI() {
  $('entrada').value = '';
  $('search').value = '';
  $('elemento').innerHTML = '';
  localStorage.removeItem('tasks');
}

async function runTests() {
  const report = $('report');
  const results = [];

  async function test(name, fn) {
    try {
      await fn();
      results.push({ name, ok: true });
    } catch (err) {
      results.push({ name, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  // Sanity: app.js loaded and functions are callable.
  await test('exports: funciones globales existen', async () => {
    assertEqual(typeof window.addTask, 'function', 'addTask() no está disponible');
    assertEqual(typeof window.createTaskElement, 'function', 'createTaskElement() no está disponible');
    assertEqual(typeof window.saveTasks, 'function', 'saveTasks() no está disponible');
    assertEqual(typeof window.loadTasks, 'function', 'loadTasks() no está disponible');
    assertEqual(typeof window.filterTasks, 'function', 'filterTasks() no está disponible');
  });

  await test('addTask: ignora input vacío/espacios', async () => {
    resetUI();
    $('entrada').value = '   ';
    window.addTask();
    assertEqual($('elemento').children.length, 0, 'No debería crear <li>');
    assertEqual(localStorage.getItem('tasks'), null, 'No debería guardar tasks');
  });

  await test('addTask: crea <li> y persiste en localStorage', async () => {
    resetUI();
    $('entrada').value = 'Comprar pan';
    window.addTask();

    assertEqual($('elemento').children.length, 1, 'Debería haber 1 tarea en el DOM');
    assertDeepEqual(readStoredTasks(), ['Comprar pan'], 'localStorage debería contener la tarea');
    assertDeepEqual(liTexts(), ['Comprar pan'], 'El DOM debería mostrar el texto correcto');
  });

  await test('createTaskElement: renderiza estructura básica', async () => {
    resetUI();
    window.createTaskElement('Tarea A');

    const li = $('elemento').querySelector('li');
    assert(li, 'No se creó el <li>');
    assert(li.querySelector('button.delete-btn'), 'Falta botón .delete-btn');
    const span = li.querySelector('span');
    assert(span, 'Falta <span> del texto');
    assertEqual(span.textContent, 'Tarea A', 'Texto incorrecto');
  });

  await test('loadTasks: carga desde localStorage y renderiza', async () => {
    resetUI();
    localStorage.setItem('tasks', JSON.stringify(['Uno', 'Dos']));
    window.loadTasks();

    assertEqual($('elemento').children.length, 2, 'Debería renderizar 2 tareas');
    assertDeepEqual(liTexts(), ['Uno', 'Dos'], 'Orden/texto debería coincidir con storage');
  });

  await test('filterTasks: oculta y muestra según búsqueda', async () => {
    resetUI();
    localStorage.setItem('tasks', JSON.stringify(['Alpha', 'Beta', 'Alpine']));
    window.loadTasks();

    $('search').value = 'alp';
    window.filterTasks();
    assertDeepEqual(visibleLiTexts(), ['Alpha', 'Alpine'], 'Filtro debería dejar solo coincidencias');

    $('search').value = 'beta';
    window.filterTasks();
    assertDeepEqual(visibleLiTexts(), ['Beta'], 'Filtro debería encontrar Beta');
  });

  await test('delete: click en .delete-btn elimina del DOM y actualiza storage', async () => {
    resetUI();
    localStorage.setItem('tasks', JSON.stringify(['X', 'Y']));
    window.loadTasks();

    const firstLi = $('elemento').querySelector('li');
    assert(firstLi, 'No hay primer <li>');
    const btn = firstLi.querySelector('button.delete-btn');
    assert(btn, 'No hay botón delete');

    btn.click();
    // app.js elimina tras 200ms por animación
    await sleep(260);

    assertDeepEqual(liTexts(), ['Y'], 'Debería quedar solo Y en el DOM');
    assertDeepEqual(readStoredTasks(), ['Y'], 'Storage debería actualizarse a ["Y"]');
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;

  const lines = [
    `<strong>Resultados:</strong> <span class="pass">${passed} OK</span>, <span class="fail">${failed} FAIL</span>`,
    '<ul>',
    ...results.map((r) =>
      r.ok
        ? `<li class="pass">✓ ${r.name}</li>`
        : `<li class="fail">✗ ${r.name}<br/><code>${escapeHtml(r.error)}</code></li>`
    ),
    '</ul>',
  ];
  report.innerHTML = lines.join('\n');

  // Also log for devtools
  // eslint-disable-next-line no-console
  console.log('[NextUp tests]', { passed, failed, results });
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// Run after current call stack (ensures app.js executed)
setTimeout(() => {
  runTests().catch((e) => {
    $('report').innerHTML = `<span class="fail"><strong>Error ejecutando tests:</strong> <code>${escapeHtml(
      e instanceof Error ? e.message : String(e)
    )}</code></span>`;
  });
}, 0);

