/* =============================================
   SPENDLY — app.js
   Full CRUD + LocalStorage + Chart.js
============================================= */

// ── STATE ──────────────────────────────────────
const STORAGE_KEY = 'spendly_expenses';

let expenses = [];
let editingId = null;
let deleteTargetId = null;
let chartInstance = null;
let currentChartType = 'doughnut';

// Category colors (hex for Chart.js)
const CAT_COLORS = {
  Food:          '#b8860b',
  Transport:     '#1a4f8a',
  Utilities:     '#1a6b6b',
  Entertainment: '#5c3d8f',
  Health:        '#2d7a4f',
  Shopping:      '#8b1a4f',
  Education:     '#c8460a',
  Other:         '#7a7167',
};

const CAT_EMOJIS = {
  Food: '🍔', Transport: '🚗', Utilities: '⚡',
  Entertainment: '🎬', Health: '💊', Shopping: '🛍️',
  Education: '📚', Other: '📦',
};

// ── PERSISTENCE ────────────────────────────────
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    expenses = raw ? JSON.parse(raw) : [];
  } catch { expenses = []; }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

// ── HELPERS ────────────────────────────────────
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function fmtAmt(n) {
  return 'PKR ' + Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function fmtDate(str) {
  if (!str) return '—';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getFiltered() {
  const cat = document.getElementById('filterCategory').value;
  const from = document.getElementById('filterFrom').value;
  const to = document.getElementById('filterTo').value;

  return expenses
    .filter(e => {
      if (cat && e.category !== cat) return false;
      if (from && e.date < from) return false;
      if (to && e.date > to) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ── RENDER TABLE ───────────────────────────────
function renderTable() {
  const tbody = document.getElementById('expenseTableBody');
  const empty = document.getElementById('emptyState');
  const count = document.getElementById('expenseCount');
  const filtered = getFiltered();

  count.textContent = filtered.length + (filtered.length === 1 ? ' entry' : ' entries');

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  tbody.innerHTML = filtered.map(e => `
    <tr data-id="${e.id}">
      <td>
        <div class="expense-title">${escHtml(e.title)}</div>
        ${e.notes ? `<div class="expense-note">${escHtml(e.notes)}</div>` : ''}
      </td>
      <td>
        <span class="category-chip chip-${e.category}">
          ${CAT_EMOJIS[e.category] || ''} ${e.category}
        </span>
      </td>
      <td><span class="expense-date">${fmtDate(e.date)}</span></td>
      <td><span class="expense-amount">${fmtAmt(e.amount)}</span></td>
      <td>
        <div class="action-btns">
          <button class="icon-btn edit" data-id="${e.id}" title="Edit">✎</button>
          <button class="icon-btn delete" data-id="${e.id}" title="Delete">✕</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ── RENDER SUMMARY ─────────────────────────────
function renderSummary() {
  const filtered = getFiltered();
  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  document.getElementById('headerTotal').textContent = fmtAmt(total);
  document.getElementById('totalAmt').textContent = fmtAmt(total);
  document.getElementById('totalCount').textContent = filtered.length;

  // Category breakdown
  const byCategory = {};
  filtered.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
  });

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  document.getElementById('topCategory').textContent = sorted.length ? sorted[0][0] : '—';

  renderChart(sorted, total);
  renderBreakdown(sorted, total);
}

// ── CHART ──────────────────────────────────────
function renderChart(sorted, total) {
  const canvas = document.getElementById('categoryChart');
  const chartEmpty = document.getElementById('chartEmpty');

  if (sorted.length === 0) {
    canvas.style.display = 'none';
    chartEmpty.style.display = 'block';
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    return;
  }

  canvas.style.display = 'block';
  chartEmpty.style.display = 'none';

  const labels = sorted.map(([cat]) => cat);
  const data = sorted.map(([, val]) => val);
  const colors = sorted.map(([cat]) => CAT_COLORS[cat] || '#888');

  if (chartInstance) chartInstance.destroy();

  const ctx = canvas.getContext('2d');

  if (currentChartType === 'doughnut') {
    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${fmtAmt(ctx.parsed)} (${((ctx.parsed / total) * 100).toFixed(1)}%)`
            }
          }
        },
        animation: { animateRotate: true, duration: 500 }
      }
    });
  } else {
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${fmtAmt(ctx.parsed.y)}`
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: {
            grid: { color: '#f0ede8' },
            ticks: {
              font: { size: 10 },
              callback: v => 'PKR ' + (v >= 1000 ? (v/1000).toFixed(1)+'k' : v)
            }
          }
        },
        animation: { duration: 400 }
      }
    });
  }
}

// ── BREAKDOWN ──────────────────────────────────
function renderBreakdown(sorted, total) {
  const list = document.getElementById('breakdownList');
  if (sorted.length === 0) {
    list.innerHTML = '<p style="color:#aaa;font-size:12px;">No data</p>';
    return;
  }

  list.innerHTML = sorted.map(([cat, val]) => {
    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
    const color = CAT_COLORS[cat] || '#888';
    return `
      <div class="breakdown-item">
        <span class="breakdown-name">${CAT_EMOJIS[cat] || ''} ${cat}</span>
        <div class="breakdown-bar-wrap">
          <div class="breakdown-bar" style="width:${pct}%;background:${color};"></div>
        </div>
        <span class="breakdown-pct">${pct}%</span>
        <span class="breakdown-val">${fmtAmt(val)}</span>
      </div>
    `;
  }).join('');
}

// ── FULL RENDER ────────────────────────────────
function renderAll() {
  renderTable();
  renderSummary();
}

// ── MODAL ──────────────────────────────────────
function openModal(expense = null) {
  editingId = expense ? expense.id : null;
  document.getElementById('modalTitle').textContent = expense ? 'Edit Expense' : 'Add Expense';
  document.getElementById('inputTitle').value = expense ? expense.title : '';
  document.getElementById('inputAmount').value = expense ? expense.amount : '';
  document.getElementById('inputCategory').value = expense ? expense.category : '';
  document.getElementById('inputDate').value = expense ? expense.date : new Date().toISOString().split('T')[0];
  document.getElementById('inputNotes').value = expense ? (expense.notes || '') : '';
  clearErrors();
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('inputTitle').focus(), 100);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editingId = null;
}

function clearErrors() {
  ['Title','Amount','Category','Date'].forEach(f => {
    document.getElementById('err' + f).textContent = '';
    const el = document.getElementById('input' + f);
    if (el) el.classList.remove('invalid');
  });
}

function validateForm() {
  let valid = true;
  const title = document.getElementById('inputTitle').value.trim();
  const amount = document.getElementById('inputAmount').value;
  const category = document.getElementById('inputCategory').value;
  const date = document.getElementById('inputDate').value;

  if (!title) {
    setError('Title', 'Title is required'); valid = false;
  }
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    setError('Amount', 'Enter a valid positive amount'); valid = false;
  }
  if (!category) {
    setError('Category', 'Select a category'); valid = false;
  }
  if (!date) {
    setError('Date', 'Date is required'); valid = false;
  }

  return valid;
}

function setError(field, msg) {
  document.getElementById('err' + field).textContent = msg;
  document.getElementById('input' + field).classList.add('invalid');
}

function saveExpense() {
  if (!validateForm()) return;

  const data = {
    title: document.getElementById('inputTitle').value.trim(),
    amount: parseFloat(document.getElementById('inputAmount').value),
    category: document.getElementById('inputCategory').value,
    date: document.getElementById('inputDate').value,
    notes: document.getElementById('inputNotes').value.trim(),
  };

  if (editingId) {
    const idx = expenses.findIndex(e => e.id === editingId);
    if (idx > -1) expenses[idx] = { ...expenses[idx], ...data };
    showToast('Expense updated ✓', 'success');
  } else {
    expenses.push({ id: genId(), ...data });
    showToast('Expense added ✓', 'success');
  }

  save();
  closeModal();
  renderAll();
}

// ── DELETE ─────────────────────────────────────
function openDeleteModal(id) {
  deleteTargetId = id;
  const exp = expenses.find(e => e.id === id);
  document.getElementById('deleteTitle').textContent = exp ? `"${exp.title}"` : 'this expense';
  document.getElementById('deleteOverlay').classList.add('open');
}

function closeDeleteModal() {
  document.getElementById('deleteOverlay').classList.remove('open');
  deleteTargetId = null;
}

function confirmDelete() {
  if (!deleteTargetId) return;
  expenses = expenses.filter(e => e.id !== deleteTargetId);
  save();
  closeDeleteModal();
  renderAll();
  showToast('Expense deleted', 'success');
}

// ── TOAST ──────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── EXPORT CSV ─────────────────────────────────
function exportCSV() {
  const filtered = getFiltered();
  if (filtered.length === 0) {
    showToast('No expenses to export', 'error');
    return;
  }

  const headers = ['Title', 'Amount (PKR)', 'Category', 'Date', 'Notes'];
  const rows = filtered.map(e => [
    `"${e.title.replace(/"/g, '""')}"`,
    e.amount,
    e.category,
    e.date,
    `"${(e.notes || '').replace(/"/g, '""')}"`
  ]);

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spendly_expenses_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported to CSV ✓', 'success');
}

// ── EVENT LISTENERS ────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  load();
  renderAll();

  // Open add modal
  document.getElementById('openAddModal').addEventListener('click', () => openModal());

  // Close modal buttons
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('cancelModal').addEventListener('click', closeModal);

  // Close on overlay click
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });

  // Save expense
  document.getElementById('saveExpense').addEventListener('click', saveExpense);

  // Enter key in form saves
  document.getElementById('modal').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      saveExpense();
    }
  });

  // Delete modal
  document.getElementById('closeDelete').addEventListener('click', closeDeleteModal);
  document.getElementById('cancelDelete').addEventListener('click', closeDeleteModal);
  document.getElementById('confirmDelete').addEventListener('click', confirmDelete);
  document.getElementById('deleteOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('deleteOverlay')) closeDeleteModal();
  });

  // Table actions (edit / delete) — delegated
  document.getElementById('expenseTableBody').addEventListener('click', e => {
    const editBtn = e.target.closest('.icon-btn.edit');
    const delBtn = e.target.closest('.icon-btn.delete');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const exp = expenses.find(x => x.id === id);
      if (exp) openModal(exp);
    }
    if (delBtn) {
      openDeleteModal(delBtn.dataset.id);
    }
  });

  // Filters
  ['filterCategory', 'filterFrom', 'filterTo'].forEach(id => {
    document.getElementById(id).addEventListener('change', renderAll);
  });

  document.getElementById('clearFilters').addEventListener('click', () => {
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterFrom').value = '';
    document.getElementById('filterTo').value = '';
    renderAll();
  });

  // Chart toggle
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentChartType = btn.dataset.type;
      renderSummary();
    });
  });

  // Export CSV
  document.getElementById('exportCSV').addEventListener('click', exportCSV);

  // Input: remove invalid state on typing
  ['inputTitle','inputAmount','inputCategory','inputDate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => {
      el.classList.remove('invalid');
      const field = id.replace('input','');
      const errEl = document.getElementById('err' + field);
      if (errEl) errEl.textContent = '';
    });
  });
});
