const state = {
  items: [],
  areas: [],
  categories: [],
  loading: true,
  error: null,
  filterArea: 'all',
  filterCategory: 'all',
  filterPriority: 'all',
  editingId: null,
  editingPriorityId: null,
  search: '',
};

function formatPrice(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function parsePriceInput(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = parseFloat(trimmed.replace(/\./g, '').replace(',', '.'));
  return isNaN(value) ? null : value;
}

const PRIORITY_ORDER = { alta: 0, media: 1, baixa: 2 };
const PRIORITY_LABEL = { alta: '🔴 Alta', media: '🟡 Média', baixa: '⚪ Baixa' };

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function areaName(id) {
  return state.areas.find((a) => a.id === id)?.name || '—';
}

function categoryName(id) {
  return state.categories.find((c) => c.id === id)?.name || '—';
}

async function loadAll() {
  state.loading = true;
  render();

  const [areasRes, categoriesRes, itemsRes] = await Promise.all([
    supabaseClient.from('areas').select('*').order('sort_order'),
    supabaseClient.from('categories').select('*').order('sort_order'),
    supabaseClient.from('items').select('*').order('status').order('created_at', { ascending: false }),
  ]);

  if (areasRes.error || categoriesRes.error || itemsRes.error) {
    state.error = 'Não consegui carregar os dados. Puxe pra atualizar.';
  } else {
    state.areas = areasRes.data;
    state.categories = categoriesRes.data;
    state.items = itemsRes.data;
    state.error = null;
  }
  state.loading = false;
  render();
}

async function addItem({ name, price, quantity, priority, link, note, areaId, categoryId }) {
  const { error } = await supabaseClient.from('items').insert({
    name,
    price,
    quantity,
    priority,
    link: link || null,
    note: note || null,
    area_id: areaId || null,
    category_id: categoryId || null,
  });
  if (error) {
    state.error = 'Não consegui adicionar o item.';
    render();
  }
}

async function updateItem(id, { name, price, quantity, priority, link, note, areaId, categoryId }) {
  const { error } = await supabaseClient
    .from('items')
    .update({
      name,
      price,
      quantity,
      priority,
      link: link || null,
      note: note || null,
      area_id: areaId || null,
      category_id: categoryId || null,
    })
    .eq('id', id);
  if (error) {
    state.error = 'Não consegui salvar as alterações.';
  } else {
    state.editingId = null;
  }
  render();
}

async function toggleStatus(item) {
  const nextStatus = item.status === 'pending' ? 'purchased' : 'pending';
  const { error } = await supabaseClient
    .from('items')
    .update({
      status: nextStatus,
      purchased_at: nextStatus === 'purchased' ? new Date().toISOString() : null,
    })
    .eq('id', item.id);
  if (error) {
    state.error = 'Não consegui atualizar o item.';
    render();
  }
}

async function updatePriority(id, priority) {
  const { error } = await supabaseClient.from('items').update({ priority }).eq('id', id);
  if (error) {
    state.error = 'Não consegui atualizar a prioridade.';
  }
  state.editingPriorityId = null;
  render();
}

async function deleteItem(id) {
  const { error } = await supabaseClient.from('items').delete().eq('id', id);
  if (error) {
    state.error = 'Não consegui remover o item.';
    render();
  }
}

function normalizeText(str) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function filteredItems() {
  const search = normalizeText(state.search.trim());
  return state.items.filter((item) => {
    if (state.filterArea !== 'all' && item.area_id !== state.filterArea) return false;
    if (state.filterCategory !== 'all' && item.category_id !== state.filterCategory) return false;
    if (state.filterPriority !== 'all' && item.priority !== state.filterPriority) return false;
    if (search && !normalizeText(item.name).includes(search)) return false;
    return true;
  });
}

function render() {
  const app = document.getElementById('app');

  if (state.loading) {
    app.innerHTML = '<p class="loading">Carregando...</p>';
    return;
  }

  const activeElement = document.activeElement;
  const wasSearchFocused = activeElement && activeElement.id === 'search-input';
  const searchCursorPos = wasSearchFocused ? activeElement.selectionStart : null;

  const hasActiveFilter = state.filterArea !== 'all' || state.filterCategory !== 'all' || state.filterPriority !== 'all' || state.search.trim() !== '';
  const emptyMessage = hasActiveFilter
    ? 'Nenhum item encontrado com esse filtro/busca.'
    : 'Nada por aqui ainda.';

  const items = filteredItems();
  const pending = items
    .filter((i) => i.status === 'pending')
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const purchased = items.filter((i) => i.status === 'purchased');

  const errorBanner = state.error
    ? `<div class="banner"><span>${escapeHtml(state.error)}</span></div>`
    : '';

  const areaOptions = state.areas.map((a) => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('');
  const categoryOptions = state.categories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

  app.innerHTML = `
    <header class="header">
      <h1>🏠 Wishlist da Casa</h1>
    </header>

    ${errorBanner}

    <details class="add-details">
      <summary>+ Adicionar item</summary>
      <form id="add-form" class="add-form">
        <input type="text" id="input-name" placeholder="Nome do produto" required />
        <div class="row">
          <input type="text" id="input-price" placeholder="Preço médio (ex: 149,90, opcional)" inputmode="decimal" />
          <input type="number" id="input-quantity" placeholder="Qtd" min="1" value="1" inputmode="numeric" />
        </div>
        <div class="row">
          <select id="input-area">
            <option value="">Área (opcional)</option>
            ${areaOptions}
          </select>
          <select id="input-category">
            <option value="">Categoria (opcional)</option>
            ${categoryOptions}
          </select>
        </div>
        <select id="input-priority">
          <option value="alta">🔴 Alta prioridade</option>
          <option value="media" selected>🟡 Média prioridade</option>
          <option value="baixa">⚪ Baixa prioridade</option>
        </select>
        <input type="url" id="input-link" placeholder="Link (opcional)" />
        <input type="text" id="input-note" placeholder="Nota (opcional)" />
        <button type="submit">Adicionar</button>
      </form>
    </details>

    <div class="toolbar">
      <input type="text" id="search-input" class="search-input" placeholder="🔎 Buscar produto..." value="${escapeHtml(state.search)}" />
      <div class="filters">
        <select id="filter-area">
          <option value="all">Todas as áreas</option>
          ${state.areas.map((a) => `<option value="${a.id}" ${state.filterArea === a.id ? 'selected' : ''}>${escapeHtml(a.name)}</option>`).join('')}
        </select>
        <select id="filter-category">
          <option value="all">Todas as categorias</option>
          ${state.categories.map((c) => `<option value="${c.id}" ${state.filterCategory === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
        </select>
        <select id="filter-priority">
          <option value="all">Todas prioridades</option>
          <option value="alta" ${state.filterPriority === 'alta' ? 'selected' : ''}>🔴 Alta</option>
          <option value="media" ${state.filterPriority === 'media' ? 'selected' : ''}>🟡 Média</option>
          <option value="baixa" ${state.filterPriority === 'baixa' ? 'selected' : ''}>⚪ Baixa</option>
        </select>
      </div>
    </div>

    <section>
      <h2 class="section-title">Pendentes <span class="count">${pending.length}</span></h2>
      ${renderTable(pending, emptyMessage)}
    </section>

    ${purchased.length ? `
      <section>
        <h2 class="section-title">Já comprados <span class="count">${purchased.length}</span></h2>
        ${renderTable(purchased, emptyMessage)}
      </section>
    ` : ''}
  `;

  document.getElementById('add-form').addEventListener('submit', onSubmitAdd);
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    state.search = e.target.value;
    render();
  });
  if (wasSearchFocused) {
    searchInput.focus();
    searchInput.setSelectionRange(searchCursorPos, searchCursorPos);
  }
  document.getElementById('filter-area').addEventListener('change', (e) => {
    state.filterArea = e.target.value;
    render();
  });
  document.getElementById('filter-category').addEventListener('change', (e) => {
    state.filterCategory = e.target.value;
    render();
  });
  document.getElementById('filter-priority').addEventListener('change', (e) => {
    state.filterPriority = e.target.value;
    render();
  });
}

function renderTable(items, emptyMessage) {
  if (!items.length) {
    return `<p class="empty">${emptyMessage}</p>`;
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="col-check"></th>
            <th>Produto</th>
            <th class="col-priority">Prioridade</th>
            <th>Área</th>
            <th>Categoria</th>
            <th class="col-qty">Qtd</th>
            <th class="col-price">Preço</th>
            <th class="col-link">Link</th>
            <th class="col-del"></th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item) => item.id === state.editingId ? renderEditRow(item) : renderRow(item)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderPriorityCell(item) {
  if (state.editingPriorityId === item.id) {
    return `
      <div class="priority-picker">
        ${Object.keys(PRIORITY_LABEL).map((key) => `
          <button type="button" class="priority-option" data-action="set-priority" data-id="${item.id}" data-priority="${key}">
            ${PRIORITY_LABEL[key]}
          </button>
        `).join('')}
      </div>
    `;
  }
  return `
    <button type="button" class="tag tag-priority-${item.priority} tag-btn" data-action="open-priority" data-id="${item.id}">
      ${PRIORITY_LABEL[item.priority] || PRIORITY_LABEL.media}
    </button>
  `;
}

function renderRow(item) {
  return `
    <tr class="${item.status === 'purchased' ? 'purchased' : ''}">
      <td class="col-check">
        <button class="check" data-action="toggle" data-id="${item.id}" title="Marcar como ${item.status === 'pending' ? 'comprado' : 'pendente'}">
          ${item.status === 'purchased' ? '✓' : ''}
        </button>
      </td>
      <td>
        <button class="name-btn" data-action="edit" data-id="${item.id}" title="Editar item">
          <div class="name">${escapeHtml(item.name)}</div>
          ${item.note ? `<div class="note">${escapeHtml(item.note)}</div>` : ''}
        </button>
      </td>
      <td class="col-priority">${renderPriorityCell(item)}</td>
      <td><span class="tag tag-area">${escapeHtml(areaName(item.area_id))}</span></td>
      <td><span class="tag tag-category">${escapeHtml(categoryName(item.category_id))}</span></td>
      <td class="col-qty">${item.quantity > 1 ? `×${item.quantity}` : ''}</td>
      <td class="col-price price">${formatPrice(item.price)}</td>
      <td class="col-link">${item.link ? `<a class="link-icon" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer" title="Ver produto">🔗</a>` : ''}</td>
      <td class="col-del"><button class="del" data-action="delete" data-id="${item.id}" title="Remover">×</button></td>
    </tr>
  `;
}

function renderEditRow(item) {
  const areaOptions = state.areas.map((a) => `<option value="${a.id}" ${a.id === item.area_id ? 'selected' : ''}>${escapeHtml(a.name)}</option>`).join('');
  const categoryOptions = state.categories.map((c) => `<option value="${c.id}" ${c.id === item.category_id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
  const priceValue = item.price === null || item.price === undefined ? '' : String(item.price).replace('.', ',');

  return `
    <tr class="editing">
      <td colspan="9">
        <form class="edit-form" data-action="save-edit" data-id="${item.id}">
          <div class="row">
            <input type="text" class="edit-name" placeholder="Nome do produto" value="${escapeHtml(item.name)}" required />
            <input type="text" class="edit-price" placeholder="Preço (opcional)" inputmode="decimal" value="${escapeHtml(priceValue)}" />
            <input type="number" class="edit-quantity" placeholder="Qtd" min="1" value="${item.quantity || 1}" inputmode="numeric" />
          </div>
          <div class="row">
            <select class="edit-area">
              <option value="">Área (opcional)</option>
              ${areaOptions}
            </select>
            <select class="edit-category">
              <option value="">Categoria (opcional)</option>
              ${categoryOptions}
            </select>
          </div>
          <select class="edit-priority">
            <option value="alta" ${item.priority === 'alta' ? 'selected' : ''}>🔴 Alta prioridade</option>
            <option value="media" ${item.priority === 'media' ? 'selected' : ''}>🟡 Média prioridade</option>
            <option value="baixa" ${item.priority === 'baixa' ? 'selected' : ''}>⚪ Baixa prioridade</option>
          </select>
          <input type="url" class="edit-link" placeholder="Link (opcional)" value="${escapeHtml(item.link || '')}" />
          <input type="text" class="edit-note" placeholder="Nota (opcional)" value="${escapeHtml(item.note || '')}" />
          <div class="row edit-actions">
            <button type="button" class="btn-cancel" data-action="cancel-edit">Cancelar</button>
            <button type="submit" class="btn-save">Salvar</button>
          </div>
        </form>
      </td>
    </tr>
  `;
}

function onSubmitAdd(e) {
  e.preventDefault();
  const name = document.getElementById('input-name').value.trim();
  const priceRaw = document.getElementById('input-price').value;
  const quantity = parseInt(document.getElementById('input-quantity').value, 10) || 1;
  const priority = document.getElementById('input-priority').value;
  const areaId = document.getElementById('input-area').value;
  const categoryId = document.getElementById('input-category').value;
  const link = document.getElementById('input-link').value.trim();
  const note = document.getElementById('input-note').value.trim();

  if (!name) return;

  addItem({ name, price: parsePriceInput(priceRaw), quantity, priority, link, note, areaId, categoryId });
  e.target.reset();
  document.getElementById('input-name').focus();
}

function onSubmitEdit(form, id) {
  const name = form.querySelector('.edit-name').value.trim();
  const priceRaw = form.querySelector('.edit-price').value;
  const quantity = parseInt(form.querySelector('.edit-quantity').value, 10) || 1;
  const priority = form.querySelector('.edit-priority').value;
  const areaId = form.querySelector('.edit-area').value;
  const categoryId = form.querySelector('.edit-category').value;
  const link = form.querySelector('.edit-link').value.trim();
  const note = form.querySelector('.edit-note').value.trim();

  if (!name) return;

  updateItem(id, { name, price: parsePriceInput(priceRaw), quantity, priority, link, note, areaId, categoryId });
}

document.getElementById('app').addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  const id = target.getAttribute('data-id');
  const action = target.getAttribute('data-action');

  if (action === 'toggle') {
    const item = state.items.find((i) => i.id === id);
    if (item) toggleStatus(item);
  } else if (action === 'delete') {
    if (confirm('Remover este item da lista?')) deleteItem(id);
  } else if (action === 'edit') {
    state.editingId = id;
    render();
  } else if (action === 'cancel-edit') {
    state.editingId = null;
    render();
  } else if (action === 'open-priority') {
    state.editingPriorityId = id;
    render();
  } else if (action === 'set-priority') {
    updatePriority(id, target.getAttribute('data-priority'));
  }
});

document.addEventListener('mousedown', (e) => {
  if (!state.editingPriorityId) return;
  if (e.target.closest('.col-priority')) return;
  state.editingPriorityId = null;
  render();
});

document.getElementById('app').addEventListener('submit', (e) => {
  const form = e.target.closest('[data-action="save-edit"]');
  if (!form) return;
  e.preventDefault();
  onSubmitEdit(form, form.getAttribute('data-id'));
});

supabaseClient
  .channel('items-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
    loadAll();
  })
  .subscribe();

loadAll();
