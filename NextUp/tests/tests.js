/* NextUp (browser) - Test harness de integración (DOM + localStorage) */

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

function readState() {
  const raw = localStorage.getItem('nextup_state_v2');
  if (!raw) return null;
  return JSON.parse(raw);
}

function writeState(state) {
  localStorage.setItem('nextup_state_v2', JSON.stringify(state));
}

function readStoredTaskTexts() {
  const raw = localStorage.getItem('nextup_state_v2');
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') return null;
  const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : null;
  const activeProjectId = parsed.ui?.activeProjectId ?? null;
  if (!tasks || !activeProjectId) return [];
  return tasks.filter((t) => t.projectId === activeProjectId).map((t) => t.text);
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
  localStorage.removeItem('nextup_state_v2');

  // Limpieza del DOM
  $('entrada').value = '';
  $('search').value = '';
  $('elemento').innerHTML = '';
  const projectList = document.getElementById('project-list');
  if (projectList) projectList.innerHTML = '';
  const projectListMobile = document.getElementById('project-list-mobile');
  if (projectListMobile) projectListMobile.innerHTML = '';
  const completed = document.getElementById('completed');
  if (completed) completed.innerHTML = '';

  // Cargar desde storage (vacío) para que la app sincronice estado
  window.loadTasks();
  window.filterTasks();

  // En el estado real, app.js oculta/enseña según haya <li>.
  // Tras limpiar el DOM, la sección debe quedar oculta.
  assertCompletedSectionHidden(true, 'reset');
}

// ===== Suite de pruebas End-to-End (DOM + localStorage) =====

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
    // La app siempre inicializa al menos un proyecto y persiste el state v2.
    // Lo importante aquí es que NO se cree ninguna tarea.
    assertDeepEqual(readStoredTaskTexts(), [], 'No debería persistir tareas');
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
    // Forzar migración legacy: si existe el state v2, la app no leerá `tasks`.
    localStorage.removeItem('nextup_state_v2');
    localStorage.setItem('tasks', JSON.stringify(['Uno', 'Dos']));
    $('elemento').innerHTML = '';
    window.loadTasks();
    assertDeepEqual(pendingTexts(), ['Uno', 'Dos'], 'Debería renderizar Uno, Dos');
  });

  await test('filterTasks: filtra pendientes', async () => {
    resetState();
    localStorage.removeItem('nextup_state_v2');
    localStorage.setItem('tasks', JSON.stringify(['Alpha', 'Beta', 'Alpine']));
    $('elemento').innerHTML = '';
    window.loadTasks();

    $('search').value = 'alp';
    window.filterTasks();
    assertDeepEqual(visibleTextsIn($('elemento')), ['Alpha', 'Alpine'], 'Filtro alp incorrecto');
  });

  await test('soft-delete: delete mueve a completadas, tacha y actualiza storage', async () => {
    resetState();
    localStorage.removeItem('nextup_state_v2');
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
    localStorage.removeItem('nextup_state_v2');
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
    localStorage.removeItem('nextup_state_v2');
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
    localStorage.removeItem('nextup_state_v2');
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

  await test('projects: filtra tareas por proyecto activo', async () => {
    resetState();
    const p1 = { id: 'p1', name: 'A', createdAt: 1 };
    const p2 = { id: 'p2', name: 'B', createdAt: 2 };
    writeState({
      schemaVersion: 2,
      projects: [p1, p2],
      tasks: [
        { id: 't1', text: 'En A', projectId: 'p1' },
        { id: 't2', text: 'En B', projectId: 'p2' },
      ],
      ui: { activeProjectId: 'p1' },
    });

    $('elemento').innerHTML = '';
    window.loadTasks();
    assertDeepEqual(pendingTexts(), ['En A'], 'Debe renderizar solo tareas del proyecto activo');

    // Cambiar proyecto activo clicando en la lista de proyectos
    const projectButtons = Array.from(document.querySelectorAll('#project-list button'));
    assert(projectButtons.length >= 2, 'Debería renderizar botones de proyectos');
    projectButtons.find((b) => b.textContent === 'B')?.click();
    assertDeepEqual(pendingTexts(), ['En B'], 'Al cambiar de proyecto debe cambiar el render');
  });

  await test('projects: renombrar proyecto (modal) actualiza UI y storage', async () => {
    resetState();
    writeState({
      schemaVersion: 2,
      projects: [{ id: 'p1', name: 'Viejo', createdAt: 1 }],
      tasks: [],
      ui: { activeProjectId: 'p1' },
    });
    window.loadTasks();

    const renameBtn = document.querySelector('#project-list button[aria-label="Renombrar"]');
    assert(renameBtn, 'Falta botón Renombrar en la lista de proyectos');
    renameBtn.click();

    const modal = $('project-modal');
    assert(!modal.classList.contains('hidden'), 'El modal de renombrar debería abrirse');
    $('project-modal-input').value = 'Nuevo';
    $('project-modal-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    // Esperar a que se resuelva la promesa del modal y se persista.
    await sleep(0);

    const st = readState();
    assert(st, 'No hay state');
    assertEqual(st.projects[0].name, 'Nuevo', 'El nombre del proyecto debería actualizarse en storage');

    const projectBtn = Array.from(document.querySelectorAll('#project-list button')).find((b) => b.textContent === 'Nuevo');
    assert(projectBtn, 'La UI debería mostrar el nombre nuevo');
  });

  await test('projects: borrar proyecto elimina sus tareas', async () => {
    resetState();
    writeState({
      schemaVersion: 2,
      projects: [
        { id: 'p1', name: 'P1', createdAt: 1 },
        { id: 'p2', name: 'P2', createdAt: 2 },
      ],
      tasks: [
        { id: 'a', text: 'A', projectId: 'p1' },
        { id: 'b', text: 'B', projectId: 'p2' },
      ],
      ui: { activeProjectId: 'p1' },
    });
    window.loadTasks();

    const deleteBtn = document.querySelector('#project-list button[aria-label="Eliminar"]');
    assert(deleteBtn, 'Falta botón Eliminar en la lista de proyectos');
    deleteBtn.click();

    // Confirmación: el borrado ahora requiere aceptar en el modal (no es confirm() nativo).
    const accept = document.getElementById('confirm-modal-accept');
    assert(accept, 'Falta botón Aceptar del modal de confirmación');
    accept.click();
    // Esperar a que la promesa del modal resuelva y se persista el estado.
    await sleep(0);

    const st = readState();
    assert(st, 'No hay state');
    assertEqual(st.projects.length, 1, 'Debería quedar 1 proyecto');
    assertEqual(st.projects[0].id, 'p2', 'Debería quedar el proyecto p2');
    assertDeepEqual(st.tasks.map((t) => t.text), ['B'], 'Debería borrar tareas del proyecto eliminado');
  });

  await test('tasks: mover tarea a otro proyecto (modal) actualiza storage y UI', async () => {
    resetState();
    writeState({
      schemaVersion: 2,
      projects: [
        { id: 'p1', name: 'P1', createdAt: 1 },
        { id: 'p2', name: 'P2', createdAt: 2 },
      ],
      tasks: [{ id: 't1', text: 'Moverme', projectId: 'p1' }],
      ui: { activeProjectId: 'p1' },
    });
    window.loadTasks();
    assertDeepEqual(pendingTexts(), ['Moverme'], 'Precondición: tarea visible en P1');

    const li = pendingLis()[0];
    const moveBtn = li.querySelector('button.move-btn');
    assert(moveBtn, 'Falta botón mover');
    moveBtn.click();

    const modal = $('move-task-modal');
    assert(!modal.classList.contains('hidden'), 'Modal mover tarea debería abrirse');

    // seleccionar P2 dentro del modal
    const optionButtons = Array.from($('move-task-modal-list').querySelectorAll('button'));
    assert(optionButtons.length >= 1, 'Debe haber opciones de proyectos');
    optionButtons.find((b) => b.textContent === 'P2')?.click();
    $('move-task-modal-confirm').click();
    // Esperar a que se resuelva el modal y a que termine la animación (200ms).
    await sleep(260);

    const st = readState();
    assert(st, 'No hay state');
    // Buscar explícitamente la tarea "Moverme" (o id t1) en storage,
    // en lugar de asumir que está en la posición 0.
    const moved = Array.isArray(st.tasks)
      ? st.tasks.find((t) => t.id === 't1' || t.text === 'Moverme')
      : null;
    assert(moved, 'No se encontró la tarea "Moverme" en storage');
    assertEqual(moved.projectId, 'p2', 'La tarea debería moverse a p2 en storage');

    // La tarea debe desaparecer de la lista del proyecto activo (P1).
    assertEqual(pendingLis().length, 0, 'La tarea debería desaparecer del proyecto activo tras mover');
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

