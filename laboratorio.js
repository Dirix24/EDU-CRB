'use strict';

function loadPreference(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function savePreference(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { /* El laboratorio también funciona sin almacenamiento disponible. */ }
}

const themeButton = $('theme');
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const next = theme === 'light' ? 'oscuro' : 'claro';
  themeButton.textContent = 'Tema ' + next;
  themeButton.setAttribute('aria-label', 'Activar tema ' + next);
}
setTheme(loadPreference('edu-theme', 'dark'));
themeButton.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  setTheme(theme);
  savePreference('edu-theme', theme);
});

function showTokens() {
  if (!M.ready) {
    $('token-count').textContent = 'El tokenizador estará disponible al cargar el modelo.';
    return;
  }
  const ids = enc($('token-text').value);
  $('token-count').textContent = ids.length + (ids.length === 1 ? ' token' : ' tokens');
  $('token-result').replaceChildren(...ids.map(id => el('li', '', tstr(id) + ' · ' + id)));
}
$('token-text').addEventListener('input', showTokens);
showTokens();

const matrixContainer = $('attention');
const matrixDetails = matrixContainer.closest('details');
const rowPicker = $('attention-row');
let matrixCache;
function renderMatrix() {
  if (!matrixDetails.open || !lastRun) return;
  const {ctxw} = lastRun;
  const layer = Number($('sL').value);
  const head = Number($('sH').value);
  if (matrixCache?.context !== ctxw || matrixCache.layer !== layer || matrixCache.head !== head) {
    matrixCache = {context: ctxw, layer, head, values: forward(ctxw, layer, head).matrix};
  }
  const values = matrixCache.values;
  const previous = rowPicker.selectedIndex;
  if (rowPicker.options.length !== ctxw.length || rowPicker.dataset.tokens !== ctxw.join(',')) {
    rowPicker.replaceChildren(...ctxw.map((id, i) => new Option((i + 1) + ' · ' + tstr(id), i)));
    rowPicker.dataset.tokens = ctxw.join(',');
    rowPicker.selectedIndex = previous < 0 ? ctxw.length - 1 : Math.min(previous, ctxw.length - 1);
  }
  const index = rowPicker.selectedIndex;
  const table = el('table');
  const headings = table.createTHead().insertRow();
  headings.append(el('th', '', 'Consulta / clave'));
  const start = Math.max(0, index - 11);
  const end = Math.min(ctxw.length, index + 2);
  for (let i = start; i < end; i++) {
    const heading = el('th', '', (i + 1) + ' · ' + tstr(ctxw[i]));
    heading.scope = 'col';
    headings.append(heading);
  }
  const body = table.createTBody();
  for (let row = start; row < end; row++) {
    const tr = body.insertRow();
    if (row === index) tr.className = 'selected';
    const heading = el('th', '', (row + 1) + ' · ' + tstr(ctxw[row]));
    heading.scope = 'row';
    tr.append(heading);
    for (let column = start; column < end; column++) {
      const weight = values[row][column];
      const cell = tr.insertCell();
      cell.textContent = weight === undefined ? '—' : (weight * 100).toFixed(1) + '%';
      cell.style.setProperty('--weight', weight ?? 0);
    }
  }
  const strongest = [...values[index]].reduce((best, weight, i, list) => weight > list[best] ? i : best, 0);
  const summary = el('p', 'note', 'Mayor peso de la consulta: «' + tstr(ctxw[strongest]) + '», posición ' +
    (strongest + 1) + ' (' + (values[index][strongest] * 100).toFixed(1) + '%). ' +
    'Vista de las posiciones ' + (start + 1) + ' a ' + end + ' de ' + ctxw.length + '. El guion indica una posición futura enmascarada.');
  matrixContainer.replaceChildren(summary, table);
}
for (const id of ['attention-row', 'sL', 'sH']) $(id).addEventListener('change', renderMatrix);
matrixDetails.addEventListener('toggle', renderMatrix);
document.addEventListener('model-step', renderMatrix);
document.addEventListener('model-ready', showTokens);

const stages = [0, 1, 2, 3, 6, 7, 8];
let stage = 0;
function showStage() {
  const i = stages[stage];
  const run = lastRun;
  const detail = run ? dyn(i, run.result, run.sample, run.ctxw, run.parameters, run.generated) : '';
  hover = -1;
  focus = i;
  mark(i);
  setInfo(S[i], detail || 'Genera una respuesta para inspeccionar valores del modelo.');
  $('stage-count').textContent = 'Etapa ' + (stage + 1) + ' de ' + stages.length + ' · ' + S[i].t;
  $('previous').disabled = stage === 0;
  $('next').disabled = stage === stages.length - 1;
}
$('previous').addEventListener('click', () => { stage--; showStage(); });
$('next').addEventListener('click', () => { stage++; showStage(); });

function updateActivation() {
  const a = Number($('weight-a').value);
  const b = Number($('weight-b').value);
  const sum = a + 2 * b;
  $('wa').value = a.toFixed(1);
  $('wb').value = b.toFixed(1);
  $('activation').textContent = 'Suma ponderada: ' + sum.toFixed(2) + ' · Activación: ' + Math.max(0, sum).toFixed(2);
  document.querySelector('.neuron strong').classList.toggle('active', sum > 0);
}
for (const id of ['weight-a', 'weight-b']) $(id).addEventListener('input', updateActivation);
updateActivation();

function svgElement(name, attributes, text) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text) node.textContent = text;
  return node;
}

let trained;
function predict() {
  const input = $('predict').valueAsNumber;
  if (!trained) return;
  $('prediction').textContent = Number.isFinite(input) ?
    'Predicción: ' + (trained.weight * input + trained.bias).toFixed(3) :
    'Introduce un número para predecir.';
}
$('predict').addEventListener('input', predict);

$('train').addEventListener('submit', async event => {
  event.preventDefault();
  const status = $('training-status');
  const points = $('examples').value.trim().split(/\n/).map(line => line.split(',').map(value => value.trim()));
  if (points.length < 2 || points.some(pair => pair.length !== 2 ||
      pair.some(value => !value || !Number.isFinite(Number(value)) || Math.abs(Number(value)) > 100))) {
    status.textContent = 'Introduce al menos dos pares x, y con valores entre −100 y 100.';
    return;
  }
  const examples = points.map(pair => pair.map(Number));
  const epochs = $('epochs').valueAsNumber;
  const rate = $('rate').valueAsNumber;
  const button = event.currentTarget.querySelector('button');
  button.disabled = true;
  let weight = 0;
  let bias = 0;
  let diverged = false;
  const losses = [];
  const loss = () => examples.reduce((sum, [x, y]) => sum + (weight * x + bias - y) ** 2, 0) / examples.length;
  losses.push(loss());
  const svg = $('loss');
  svg.hidden = false;
  for (let epoch = 1; epoch <= epochs; epoch++) {
    let gradientWeight = 0;
    let gradientBias = 0;
    for (const [x, y] of examples) {
      const error = weight * x + bias - y;
      gradientWeight += error * x;
      gradientBias += error;
    }
    weight -= 2 * rate * gradientWeight / examples.length;
    bias -= 2 * rate * gradientBias / examples.length;
    const current = loss();
    if (!Number.isFinite(current) || current > 1e12) { diverged = true; break; }
    losses.push(current);
    const max = Math.max(...losses, 1e-12);
    const coords = losses.map((value, i) => (12 + i / epochs * 276) + ',' + (88 - value / max * 70));
    svg.replaceChildren(svgElement('polyline', {points: coords.join(' '), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 3}));
    status.textContent = 'Época ' + epoch + '/' + epochs + ' · Pérdida: ' + current.toPrecision(4);
    if (epoch % 2 === 0) await new Promise(resolve => setTimeout(resolve, 30));
  }
  if (diverged) {
    status.textContent = 'La pérdida creció demasiado. Reduce la tasa o usa entradas de menor magnitud.';
    svg.hidden = true;
  } else {
    trained = {weight, bias};
    status.textContent += ' · Pérdida inicial: ' + losses[0].toPrecision(4);
    predict();
  }
  button.disabled = false;
});

const vectors = {gato: [0.76,0.38], perro: [0.88,0.5], lobo: [0.62,0.56],
  lápiz: [-0.75,0.54], papel: [-0.5,0.75], agua: [-0.2,-0.82], mar: [-0.4,-0.69]};
const wordPicker = $('word');
wordPicker.replaceChildren(...Object.keys(vectors).map(word => new Option(word, word)));
const similarity = ([a,b], [c,d]) => (a*c+b*d) / (Math.hypot(a,b)*Math.hypot(c,d));
function renderEmbeddings() {
  const selected = wordPicker.value;
  const svg = $('embedding');
  svg.replaceChildren(svgElement('line', {x1: 15,y1: 110,x2: 305,y2: 110}),
    svgElement('line', {x1: 160,y1: 15,x2: 160,y2: 205}));
  for (const [word, [a,b]] of Object.entries(vectors)) {
    const x = 160 + a * 120;
    const y = 110 - b * 105;
    svg.append(svgElement('circle', {cx: x, cy: y, r: 5, class: word === selected ? 'selected' : ''}),
      svgElement('text', {x, y: y - 8, 'text-anchor': 'middle'}, word));
  }
  const nearest = Object.keys(vectors).filter(word => word !== selected)
    .map(word => [word, similarity(vectors[selected], vectors[word])]).sort((a,b) => b[1] - a[1]).slice(0, 2);
  $('similarity').textContent = 'Mayor similitud con «' + selected + '»: ' +
    nearest.map(([word, score]) => word + ' (' + score.toFixed(2) + ')').join(', ') + '.';
}
wordPicker.addEventListener('change', renderEmbeddings);
renderEmbeddings();

const checks = [...document.querySelectorAll('.quiz')];
const saved = loadPreference('edu-progress', []);
const completed = new Set(Array.isArray(saved) ? saved.filter(id => checks.some(form => form.id === id)) : []);
function showProgress() {
  $('progress').textContent = completed.size + ' de ' + checks.length + ' cuestionarios resueltos.';
}
for (const form of checks) {
  const result = form.querySelector('[role=status]');
  if (completed.has(form.id)) result.textContent = 'Ya has resuelto este cuestionario.';
  form.addEventListener('submit', event => {
    event.preventDefault();
    const correct = new FormData(form).get('answer') === form.dataset.answer;
    result.textContent = (correct ? 'Correcto. ' : 'Vuelve a intentarlo. ') + form.dataset.explanation;
    if (correct) {
      completed.add(form.id);
      savePreference('edu-progress', [...completed]);
      showProgress();
    }
  });
}
showProgress();
