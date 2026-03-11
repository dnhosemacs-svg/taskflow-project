/* NextUp (browser) - Test harness reescrito desde cero */

function $(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing required element #${id}`);
  return el;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) throw new Error(message || `Expected ${expected} but got ${actual}`);
}

function assertDeepEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(message || `Expected ${e} but got ${a}`);
}

function readStoredTaskTexts() {
  const raw = localStorage.getItem('tasks');
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return null;
  if (parsed.length === 0) return [];
  if (typeof parsed[0] === 'string') return parsed;
  return parsed.map((t) => t.text);
}

function pendingLis() {
  return Array.from($('elemento').querySelectorAll('li'));
}

function completedLis() {
  const el = document.getElementById('completed');
  if (!el) return [];
  return Array.from(el.querySelectorAll('li'));
}

function pendingTexts() {
  return pendingLis().map((li) => li.querySelector('span')?.textContent ?? li.querySelector('input.edit-input')?.value ?? '');
}

function completedTexts() {
  return completedLis().map((li) => li.querySelector('span')?.textContent ?? '');
}

function visibleTextsIn(listEl) {
  return Array.from(listEl.querySelectorAll('li'))
    .filter((li) => window.getComputedStyle(li).display !== 'none')
    .map((li) => li.querySelector('span')?.textContent ?? li.querySelector('input.edit-input')?.value ?? '');
}

function assertCompletedSectionHidden(expectedHidden, context) {
  const heading = document.getElementById('completed-heading');
  const list = document.getElementById('completed');
  assert(heading, 'Falta #completed-heading');
  assert(list, 'Falta #completed');
  assertEqual(heading.classList.contains('hidden'), expectedHidden, `${context}: heading hidden mismatch`);
  assertEqual(list.classList.contains('hidden'), expectedHidden, `${context}: list hidden mismatch`);
}

function resetState() {
  // Limpieza del estado persistido
  localStorage.removeItem('tasks');

  // Limpieza del DOM
  $('entrada').value = '';
  $('search').value = '';
  $('elemento').innerHTML = '';
  const completed = document.getElementById('completed');
  if (completed) completed.innerHTML = '';

  // Cargar desde storage (vacío) para que la app sincronice estado
  window.loadTasks();
  window.filterTasks();

  // En el estado real, app.js oculta/enseña según haya <li>.
  // Tras limpiar el DOM, la sección debe quedar oculta.
  assertCompletedSectionHidden(true, 'reset');
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

  await test('sanity: funciones públicas existen', async () => {
    assertEqual(typeof window.addTask, 'function', 'addTask() no está disponible');
    assertEqual(typeof window.createTaskElement, 'function', 'createTaskElement() no está disponible');
    assertEqual(typeof window.saveTasks, 'function', 'saveTasks() no está disponible');
    assertEqual(typeof window.loadTasks, 'function', 'loadTasks() no está disponible');
    assertEqual(typeof window.filterTasks, 'function', 'filterTasks() no está disponible');
  });

  await test('UI: completadas ocultas al inicio (sin tareas)', async () => {
    resetState();
  });

  await test('addTask: ignora input vacío o espacios', async () => {
    resetState();
    $('entrada').value = '   ';
    window.addTask();
    assertEqual(pendingLis().length, 0, 'No debería crear <li>');
    assertEqual(localStorage.getItem('tasks'), null, 'No debería guardar tasks');
  });

  await test('addTask: añade en DOM y persiste', async () => {
    resetState();
    $('entrada').value = 'Comprar pan';
    window.addTask();
    assertDeepEqual(pendingTexts(), ['Comprar pan'], 'Texto en pendientes incorrecto');
    assertDeepEqual(readStoredTaskTexts(), ['Comprar pan'], 'Storage debería contener la tarea');
  });

  await test('createTaskElement: estructura básica (delete + edit + svg)', async () => {
    resetState();
    window.createTaskElement('Tarea A');
    const li = pendingLis()[0];
    assert(li, 'No se creó el <li>');
    assert(li.querySelector('button.delete-btn'), 'Falta botón .delete-btn');
    const editBtn = li.querySelector('button.edit-btn');
    assert(editBtn, 'Falta botón .edit-btn');
    const svg = editBtn.querySelector('svg');
    assert(svg, 'Falta SVG en botón editar');
    assertEqual(svg.getAttribute('viewBox'), '0 0 16 16', 'SVG editar viewBox incorrecto');
    assertEqual(svg.getAttribute('fill'), 'currentColor', 'SVG editar debería usar currentColor');
  });

  await test('loadTasks: renderiza desde localStorage (strings antiguos)', async () => {
    resetState();
    localStorage.setItem('tasks', JSON.stringify(['Uno', 'Dos']));
    $('elemento').innerHTML = '';
    window.loadTasks();
    assertDeepEqual(pendingTexts(), ['Uno', 'Dos'], 'Debería renderizar Uno, Dos');
  });

  await test('filterTasks: filtra pendientes', async () => {
    resetState();
    localStorage.setItem('tasks', JSON.stringify(['Alpha', 'Beta', 'Alpine']));
    $('elemento').innerHTML = '';
    window.loadTasks();

    $('search').value = 'alp';
    window.filterTasks();
    assertDeepEqual(visibleTextsIn($('elemento')), ['Alpha', 'Alpine'], 'Filtro alp incorrecto');
  });

  await test('soft-delete: delete mueve a completadas, tacha y actualiza storage', async () => {
    resetState();
    localStorage.setItem('tasks', JSON.stringify(['X', 'Y']));
    $('elemento').innerHTML = '';
    window.loadTasks();

    const first = pendingLis()[0];
    assert(first, 'No hay primer <li>');
    first.querySelector('button.delete-btn')?.click();
    await sleep(260);

    assertDeepEqual(pendingTexts(), ['Y'], 'Pendientes debería quedar con Y');
    assertDeepEqual(completedTexts(), ['X'], 'Completadas debería tener X');
    assertDeepEqual(readStoredTaskTexts(), ['Y'], 'Storage debería quedar con Y');

    assertCompletedSectionHidden(false, 'after delete');

    const completedLi = completedLis()[0];
    const span = completedLi?.querySelector('span');
    assert(span, 'Falta span en completadas');
    // En el test-runner no cargamos Tailwind, así que comprobamos la clase (no el estilo computado).
    assert(span.classList.contains('line-through'), 'La tarea completada debería tener clase line-through');

    const restoreBtn = completedLi?.querySelector('button.restore-btn');
    assert(restoreBtn, 'Falta botón restore en completadas');
    const restoreSvg = restoreBtn?.querySelector('svg');
    assert(restoreSvg, 'Restore debería incluir svg');
    assertEqual(restoreSvg.getAttribute('viewBox'), '0 0 16 16', 'SVG restore viewBox incorrecto');
  });

  await test('restore: vuelve a pendientes y re-persiste, ocultando completadas si queda vacío', async () => {
    resetState();
    localStorage.setItem('tasks', JSON.stringify(['X', 'Y']));
    $('elemento').innerHTML = '';
    window.loadTasks();

    // mover X a completadas
    pendingLis()[0].querySelector('button.delete-btn')?.click();
    await sleep(260);

    // restore X
    completedLis()[0].querySelector('button.restore-btn')?.click();
    await sleep(260);

    assertDeepEqual(pendingTexts(), ['Y', 'X'], 'X debería volver a pendientes al final');
    assertDeepEqual(completedTexts(), [], 'Completadas debería quedar vacío');
    assertDeepEqual(readStoredTaskTexts(), ['Y', 'X'], 'Storage debería volver a incluir X');
    assertCompletedSectionHidden(true, 'after restore');
  });

  await test('edit: Enter guarda en DOM + storage', async () => {
    resetState();
    localStorage.setItem('tasks', JSON.stringify(['Original']));
    $('elemento').innerHTML = '';
    window.loadTasks();

    const li = pendingLis()[0];
    const editBtn = li.querySelector('button.edit-btn');
    assert(editBtn, 'Falta botón edit');
    assertEqual(editBtn.getAttribute('aria-label'), 'Editar', 'aria-label inicial debería ser Editar');

    editBtn.click();
    const input = li.querySelector('input.edit-input');
    assert(input, 'No entró en modo edición');
    assertEqual(editBtn.getAttribute('aria-label'), 'Guardar', 'aria-label debería ser Guardar en edición');

    input.value = 'Cambiado';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    assertEqual(li.querySelector('input.edit-input'), null, 'Debería salir de edición');
    assertDeepEqual(pendingTexts(), ['Cambiado'], 'DOM debería mostrar Cambiado');
    assertDeepEqual(readStoredTaskTexts(), ['Cambiado'], 'Storage debería persistir Cambiado');
    assertEqual(editBtn.getAttribute('aria-label'), 'Editar', 'aria-label debería volver a Editar');
  });

  await test('edit: Escape cancela y NO persiste', async () => {
    resetState();
    localStorage.setItem('tasks', JSON.stringify(['Mantener']));
    $('elemento').innerHTML = '';
    window.loadTasks();

    const li = pendingLis()[0];
    const editBtn = li.querySelector('button.edit-btn');
    assert(editBtn, 'Falta botón edit');

    editBtn.click();
    const input = li.querySelector('input.edit-input');
    assert(input, 'No entró en modo edición');

    input.value = 'No guardar';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    assertEqual(li.querySelector('input.edit-input'), null, 'Debería salir de edición tras Escape');
    assertDeepEqual(pendingTexts(), ['Mantener'], 'DOM debería restaurar Mantener');
    assertDeepEqual(readStoredTaskTexts(), ['Mantener'], 'Storage NO debería cambiar');
    assertEqual(editBtn.getAttribute('aria-label'), 'Editar', 'aria-label debería ser Editar tras cancelar');
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;

  report.innerHTML = [
    `<strong>Resultados:</strong> <span class="pass">${passed} OK</span>, <span class="fail">${failed} FAIL</span>`,
    '<ul>',
    ...results.map((r) =>
      r.ok
        ? `<li class="pass">✓ ${escapeHtml(r.name)}</li>`
        : `<li class="fail">✗ ${escapeHtml(r.name)}<br/><code>${escapeHtml(r.error)}</code></li>`
    ),
    '</ul>',
  ].join('\n');

  // eslint-disable-next-line no-console
  console.log('[NextUp tests]', { passed, failed, results });
}

setTimeout(() => {
  runTests().catch((e) => {
    $('report').innerHTML = `<span class="fail"><strong>Error ejecutando tests:</strong> <code>${escapeHtml(
      e instanceof Error ? e.message : String(e)
    )}</code></span>`;
  });
}, 0);

