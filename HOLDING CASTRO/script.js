const toggleButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (toggleButton && navLinks) {
  toggleButton.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggleButton.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      navLinks.classList.remove('open');
      toggleButton.setAttribute('aria-expanded', 'false');
    }
  });
}

const yearElement = document.getElementById('year');
if (yearElement) yearElement.textContent = new Date().getFullYear();

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

function readStoredJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The planner still works for this visit if browser storage is unavailable.
  }
}

const financeFields = [
  'law-income',
  'current-capital',
  'monthly-contribution',
  'annual-return',
  'investment-years',
  'target-assets',
];
const storedFinance = readStoredJson('hc-finance-inputs-v1', {});

financeFields.forEach((id) => {
  const input = document.getElementById(id);
  if (!input) return;
  if (Number.isFinite(Number(storedFinance[id]))) input.value = storedFinance[id];
});

function calculateProjection() {
  const value = (id) => Math.max(0, Number(document.getElementById(id)?.value) || 0);
  const startingCapital = value('current-capital');
  const monthlyContribution = value('monthly-contribution');
  const annualReturn = Math.min(100, value('annual-return')) / 100;
  const years = Math.min(80, Math.max(1, value('investment-years')));
  const target = value('target-assets');
  const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
  let projected = startingCapital;

  for (let month = 0; month < years * 12; month += 1) {
    projected = projected * (1 + monthlyReturn) + monthlyContribution;
  }

  const progress = target > 0 ? Math.min(100, (projected / target) * 100) : 0;
  const wealthOutput = document.getElementById('projected-wealth');
  const bar = document.getElementById('wealth-progress');
  const track = bar?.parentElement;
  const progressLabel = document.getElementById('wealth-progress-label');
  const summary = document.getElementById('projection-summary');

  if (wealthOutput) wealthOutput.textContent = currency.format(projected);
  if (bar) bar.style.width = `${progress}%`;
  if (track) track.setAttribute('aria-valuenow', String(Math.round(progress)));
  if (progressLabel) progressLabel.textContent = `${Math.round(progress)}% da meta`;
  if (summary) summary.textContent = `Renda futura: ${currency.format(value('law-income'))}/mês`;

  const saved = {};
  financeFields.forEach((id) => {
    const input = document.getElementById(id);
    if (input) saved[id] = input.value;
  });
  writeStoredJson('hc-finance-inputs-v1', saved);
}

financeFields.forEach((id) => {
  document.getElementById(id)?.addEventListener('input', calculateProjection);
});
calculateProjection();

const assetList = document.getElementById('asset-list');
const assetTotal = document.getElementById('asset-total');
const assetTypes = ['Renda fixa', 'Ações', 'FIIs', 'Previdência'];
const assetGoals = ['Escritório', 'Imóvel', 'Viagens', 'Reserva', 'Outro'];
const assetStorageKey = 'hc-assets-v1';

function makeSelect(options, selected) {
  const select = document.createElement('select');
  options.forEach((optionText) => {
    const option = document.createElement('option');
    option.value = optionText;
    option.textContent = optionText;
    option.selected = optionText === selected;
    select.append(option);
  });
  return select;
}

function collectAssets() {
  if (!assetList) return [];
  return [...assetList.querySelectorAll('.asset-row')].map((row) => ({
    name: row.querySelector('[data-asset-name]')?.value || '',
    type: row.querySelector('[data-asset-type]')?.value || assetTypes[0],
    value: Math.max(0, Number(row.querySelector('[data-asset-value]')?.value) || 0),
    goal: row.querySelector('[data-asset-goal]')?.value || assetGoals[0],
  }));
}

function updateAssetSummary() {
  const assets = collectAssets();
  writeStoredJson(assetStorageKey, assets);
  if (assetTotal) {
    const total = assets.reduce((sum, asset) => sum + asset.value, 0);
    assetTotal.textContent = currency.format(total);
  }
}

function appendAsset(asset = {}) {
  if (!assetList) return;
  const row = document.createElement('div');
  row.className = 'asset-row';

  const nameLabel = document.createElement('label');
  nameLabel.append('Ativo');
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Ex.: Tesouro';
  nameInput.value = asset.name || '';
  nameInput.setAttribute('data-asset-name', '');
  nameLabel.append(nameInput);

  const typeLabel = document.createElement('label');
  typeLabel.append('Classe');
  const typeSelect = makeSelect(assetTypes, assetTypes.includes(asset.type) ? asset.type : assetTypes[0]);
  typeSelect.setAttribute('data-asset-type', '');
  typeLabel.append(typeSelect);

  const valueLabel = document.createElement('label');
  valueLabel.append('Valor (R$)');
  const valueInput = document.createElement('input');
  valueInput.type = 'number';
  valueInput.min = '0';
  valueInput.step = '100';
  valueInput.inputMode = 'decimal';
  valueInput.placeholder = '0';
  valueInput.value = asset.value || '';
  valueInput.setAttribute('data-asset-value', '');
  valueLabel.append(valueInput);

  const goalLabel = document.createElement('label');
  goalLabel.append('Meta');
  const goalSelect = makeSelect(assetGoals, assetGoals.includes(asset.goal) ? asset.goal : assetGoals[0]);
  goalSelect.setAttribute('data-asset-goal', '');
  goalLabel.append(goalSelect);

  const removeButton = document.createElement('button');
  removeButton.className = 'asset-remove';
  removeButton.type = 'button';
  removeButton.setAttribute('aria-label', 'Remover ativo');
  removeButton.textContent = '×';
  removeButton.addEventListener('click', () => {
    row.remove();
    updateAssetSummary();
  });

  row.append(nameLabel, typeLabel, valueLabel, goalLabel, removeButton);
  row.addEventListener('input', updateAssetSummary);
  row.addEventListener('change', updateAssetSummary);
  assetList.append(row);
}

if (assetList) {
  const savedAssets = readStoredJson(assetStorageKey, null);
  const starterAssets = assetTypes.map((type) => ({ type, value: 0, goal: assetGoals[0] }));
  (Array.isArray(savedAssets) ? savedAssets : starterAssets).forEach(appendAsset);
  updateAssetSummary();
}

document.getElementById('add-asset')?.addEventListener('click', () => appendAsset());

function restoreChecklist(selector, storageKey) {
  const checklist = document.querySelector(selector);
  if (!checklist) return;
  const saved = readStoredJson(storageKey, {});
  checklist.querySelectorAll('input[type="checkbox"][data-planner-check], input[type="checkbox"][data-habit-check]').forEach((input) => {
    input.checked = Boolean(saved[input.dataset.plannerCheck || input.dataset.habitCheck]);
    input.addEventListener('change', () => {
      const values = {};
      checklist.querySelectorAll('input[type="checkbox"]').forEach((item) => {
        values[item.dataset.plannerCheck || item.dataset.habitCheck] = item.checked;
      });
      writeStoredJson(storageKey, values);
      updateHabitProgress();
    });
  });
}

function updateHabitProgress() {
  const checklist = document.getElementById('habit-checklist');
  if (!checklist) return;
  const items = [...checklist.querySelectorAll('input[type="checkbox"]')];
  const complete = items.filter((item) => item.checked).length;
  const label = document.getElementById('habit-progress-label');
  const bar = document.getElementById('habit-progress');
  if (label) label.textContent = `${complete} de ${items.length} hábitos concluídos`;
  if (bar) bar.style.width = `${items.length ? (complete / items.length) * 100 : 0}%`;
}

restoreChecklist('#goal-checklist', 'hc-goals-v1');
const today = new Date();
const todayKey = today.toLocaleDateString('en-CA');
const dateLabel = document.getElementById('habit-date');
if (dateLabel) {
  dateLabel.textContent = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(today);
}
restoreChecklist('#habit-checklist', `hc-habits-v1-${todayKey}`);
updateHabitProgress();

const form = document.querySelector('form');
if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (!button) return;
    const label = button.textContent;
    button.textContent = 'Mensagem enviada!';
    button.disabled = true;
    setTimeout(() => {
      button.textContent = label;
      button.disabled = false;
      form.reset();
    }, 2000);
  });
}
