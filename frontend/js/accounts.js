let db;
let filterState = { q: '', type: '', status: '' };

document.addEventListener('DOMContentLoaded', () => {
  const session = renderShell('accounts', 'Account Management', 'Directory / All Branches');
  if (!session) return;

  db = DB();
  renderPage();

  const params = new URLSearchParams(window.location.search);
  if (params.get('action') === 'add') openCreateModal();
});

function renderPage() {
  pageContent().innerHTML = `
    <div class="toolbar">
      <div class="toolbar-filters">
        <input type="text" id="f-search" placeholder="Search account no. or customer…" style="min-width:260px;">
        <select id="f-type">
          <option value="">All types</option>
          <option value="SAVINGS">Savings</option>
          <option value="CURRENT">Current</option>
          <option value="FIXED_DEPOSIT">Fixed Deposit</option>
          <option value="SALARY">Salary</option>
        </select>
        <select id="f-status">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DORMANT">Dormant</option>
          <option value="FROZEN">Frozen</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>
      <button class="btn btn-primary" id="btn-add-account">+ Create Account</button>
    </div>
    <div id="account-table-wrap"></div>
  `;

  document.getElementById('f-search').addEventListener('input', e => { filterState.q = e.target.value; renderTable(); });
  document.getElementById('f-type').addEventListener('change', e => { filterState.type = e.target.value; renderTable(); });
  document.getElementById('f-status').addEventListener('change', e => { filterState.status = e.target.value; renderTable(); });
  document.getElementById('btn-add-account').addEventListener('click', openCreateModal);

  renderTable();
}

function customerName(id) {
  const c = db.customers.find(x => x.customer_id === id);
  return c ? `${c.first_name} ${c.last_name}` : `Customer ${id}`;
}

function filteredAccounts() {
  const q = filterState.q.trim().toLowerCase();
  return db.accounts.filter(a => {
    if (filterState.type && a.account_type !== filterState.type) return false;
    if (filterState.status && a.status !== filterState.status) return false;
    if (q) {
      const hay = `${a.account_number} ${customerName(a.customer_id)}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => b.account_id - a.account_id);
}

function renderTable() {
  const list = filteredAccounts();
  const wrap = document.getElementById('account-table-wrap');
  if (!list.length) {
    wrap.innerHTML = `<div class="table-wrap"><div class="empty-state"><div class="glyph">— · —</div>No accounts match these filters.</div></div>`;
    return;
  }
  wrap.innerHTML = `
    <div class="section-title"><span></span><span class="count">${list.length} account${list.length === 1 ? '' : 's'}</span></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Account No</th><th>Customer</th><th>Type</th><th class="num">Balance</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${list.map(rowHtml).join('')}</tbody>
      </table>
    </div>`;

  list.forEach(a => {
    const closeBtn = document.getElementById(`close-${a.account_id}`);
    const freezeBtn = document.getElementById(`freeze-${a.account_id}`);
    if (closeBtn) closeBtn.addEventListener('click', () => setStatus(a.account_id, 'CLOSED'));
    if (freezeBtn) freezeBtn.addEventListener('click', () => setStatus(a.account_id, a.status === 'FROZEN' ? 'ACTIVE' : 'FROZEN'));
  });
}

function rowHtml(a) {
  const stripe = a.status === 'ACTIVE' ? 'ok' : a.status === 'FROZEN' ? 'bad' : a.status === 'DORMANT' ? 'warn' : '';
  const pill = a.status === 'ACTIVE' ? 'pill-ok' : a.status === 'FROZEN' ? 'pill-bad' : a.status === 'DORMANT' ? 'pill-warn' : 'pill-slate';
  const closed = a.status === 'CLOSED';
  return `
    <tr class="row-stripe ${stripe}">
      <td class="mono">${a.account_number}</td>
      <td>${customerName(a.customer_id)}</td>
      <td>${a.account_type.replace('_', ' ')}</td>
      <td class="num">${fmtINR(a.balance)}</td>
      <td><span class="pill ${pill}">${a.status}</span></td>
      <td>
        <div class="btn-row">
          <button class="btn btn-secondary btn-sm" id="freeze-${a.account_id}" ${closed ? 'disabled' : ''}>${a.status === 'FROZEN' ? 'Unfreeze' : 'Freeze'}</button>
          <button class="btn btn-danger btn-sm" id="close-${a.account_id}" ${closed ? 'disabled' : ''}>Close</button>
        </div>
      </td>
    </tr>`;
}

function setStatus(accountId, status) {
  const idx = db.accounts.findIndex(a => a.account_id === accountId);
  if (idx === -1) return;
  db.accounts[idx].status = status;
  if (status === 'CLOSED') db.accounts[idx].closed_date = new Date().toISOString().slice(0, 10);
  saveDB(db);
  toast(status === 'CLOSED' ? 'Account closed' : status === 'FROZEN' ? 'Account frozen' : status === 'ACTIVE' ? 'Account unfrozen' : 'Status updated');
  renderTable();
}

function openCreateModal() {
  const customerOptions = db.customers
    .sort((a, b) => a.first_name.localeCompare(b.first_name))
    .map(c => `<option value="${c.customer_id}">${c.first_name} ${c.last_name} (CUST-${String(c.customer_id).padStart(4, '0')})</option>`).join('');
  const branchOptions = db.branches.map(b => `<option value="${b.branch_id}">${b.branch_name}</option>`).join('');

  const modalHtml = `
    <div class="modal-overlay open" id="modal-overlay">
      <div class="modal">
        <div class="modal-head"><h2>Create Account</h2><button class="modal-close" id="modal-close">✕</button></div>
        <div class="modal-body">
          <div class="field"><label>Customer</label><select id="m-customer">${customerOptions}</select></div>
          <div class="field"><label>Branch</label><select id="m-branch">${branchOptions}</select></div>
          <div class="form-grid">
            <div class="field">
              <label>Account type</label>
              <select id="m-type">
                <option value="SAVINGS">Savings</option>
                <option value="CURRENT">Current</option>
                <option value="FIXED_DEPOSIT">Fixed Deposit</option>
                <option value="SALARY">Salary</option>
              </select>
            </div>
            <div class="field"><label>Opening deposit (₹)</label><input type="number" id="m-balance" value="5000"></div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
          <button class="btn btn-primary" id="modal-save">Create Account</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', createAccount);
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.remove();
}

function createAccount() {
  const customerId = Number(document.getElementById('m-customer').value);
  const branchId = Number(document.getElementById('m-branch').value);
  const type = document.getElementById('m-type').value;
  const balance = Number(document.getElementById('m-balance').value) || 0;

  const newId = db._next.account_id++;
  const acctNum = `AIB${(900000000 + newId).toString()}`;
  db.accounts.push({
    account_id: newId, customer_id: customerId, branch_id: branchId,
    account_number: acctNum, account_type: type, balance: balance,
    currency: 'INR', status: 'ACTIVE',
    opened_date: new Date().toISOString().slice(0, 10), closed_date: null,
  });
  saveDB(db);
  closeModal();
  toast(`Account ${acctNum} created`);
  renderTable();
}
