let db;
let filterState = { q: '', segment: '', kyc: '' };

document.addEventListener('DOMContentLoaded', () => {
  const session = renderShell('customers', 'Customer Management', 'Directory / All Branches');
  if (!session) return;

  db = DB();
  renderPage();

  const params = new URLSearchParams(window.location.search);
  if (params.get('action') === 'add') openCustomerModal(null);
});

function renderPage() {
  pageContent().innerHTML = `
    <div class="toolbar">
      <div class="toolbar-filters">
        <input type="text" id="f-search" placeholder="Search name, email, phone, city…" style="min-width:260px;" value="${filterState.q}">
        <select id="f-segment">
          <option value="">All segments</option>
          <option value="RETAIL">Retail</option>
          <option value="PREMIUM">Premium</option>
          <option value="CORPORATE">Corporate</option>
          <option value="STUDENT">Student</option>
        </select>
        <select id="f-kyc">
          <option value="">All KYC status</option>
          <option value="VERIFIED">Verified</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      <button class="btn btn-primary" id="btn-add-customer">+ Add Customer</button>
    </div>
    <div id="customer-table-wrap"></div>
  `;

  document.getElementById('f-search').value = filterState.q;
  document.getElementById('f-segment').value = filterState.segment;
  document.getElementById('f-kyc').value = filterState.kyc;

  document.getElementById('f-search').addEventListener('input', (e) => { filterState.q = e.target.value; renderTable(); });
  document.getElementById('f-segment').addEventListener('change', (e) => { filterState.segment = e.target.value; renderTable(); });
  document.getElementById('f-kyc').addEventListener('change', (e) => { filterState.kyc = e.target.value; renderTable(); });
  document.getElementById('btn-add-customer').addEventListener('click', () => openCustomerModal(null));

  renderTable();
}

function filteredCustomers() {
  const q = filterState.q.trim().toLowerCase();
  return db.customers.filter(c => {
    if (filterState.segment && c.segment !== filterState.segment) return false;
    if (filterState.kyc && c.kyc_status !== filterState.kyc) return false;
    if (q) {
      const hay = `${c.first_name} ${c.last_name} ${c.email} ${c.phone} ${c.city}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => b.customer_id - a.customer_id);
}

function renderTable() {
  const list = filteredCustomers();
  const wrap = document.getElementById('customer-table-wrap');

  if (!list.length) {
    wrap.innerHTML = `<div class="table-wrap"><div class="empty-state"><div class="glyph">— · —</div>No customers match these filters.</div></div>`;
    return;
  }

  wrap.innerHTML = `
    <div class="section-title"><span></span><span class="count">${list.length} customer${list.length === 1 ? '' : 's'}</span></div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Customer ID</th><th>Name</th><th>City</th><th>Segment</th>
            <th class="num">Income</th><th class="num">Credit Score</th><th>KYC</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(rowHtml).join('')}
        </tbody>
      </table>
    </div>
  `;

  list.forEach(c => {
    document.getElementById(`view-${c.customer_id}`).addEventListener('click', () => viewCustomer(c.customer_id));
    document.getElementById(`edit-${c.customer_id}`).addEventListener('click', () => openCustomerModal(c.customer_id));
    document.getElementById(`del-${c.customer_id}`).addEventListener('click', () => deleteCustomer(c.customer_id));
  });
}

function rowHtml(c) {
  const kycPill = c.kyc_status === 'VERIFIED' ? 'pill-ok' : c.kyc_status === 'PENDING' ? 'pill-warn' : 'pill-bad';
  const stripe = c.kyc_status === 'VERIFIED' ? 'ok' : c.kyc_status === 'PENDING' ? 'warn' : 'bad';
  return `
    <tr class="row-stripe ${stripe}">
      <td class="num">CUST-${String(c.customer_id).padStart(4, '0')}</td>
      <td>${c.first_name} ${c.last_name}</td>
      <td>${c.city}</td>
      <td><span class="pill pill-slate">${c.segment}</span></td>
      <td class="num">${fmtINR(c.annual_income)}</td>
      <td class="num">${c.credit_score}</td>
      <td><span class="pill ${kycPill}">${c.kyc_status}</span></td>
      <td>
        <div class="btn-row">
          <button class="btn btn-secondary btn-sm" id="view-${c.customer_id}">View</button>
          <button class="btn btn-secondary btn-sm" id="edit-${c.customer_id}">Edit</button>
          <button class="btn btn-danger btn-sm" id="del-${c.customer_id}">Delete</button>
        </div>
      </td>
    </tr>`;
}

/* ---------------- Modal: add / edit ---------------- */
function openCustomerModal(customerId) {
  const editing = customerId !== null;
  const c = editing ? db.customers.find(x => x.customer_id === customerId) : null;

  const modalHtml = `
    <div class="modal-overlay open" id="modal-overlay">
      <div class="modal">
        <div class="modal-head">
          <h2>${editing ? `Edit Customer — CUST-${String(customerId).padStart(4, '0')}` : 'Add Customer'}</h2>
          <button class="modal-close" id="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="field"><label>First name</label><input type="text" id="m-first" value="${c ? c.first_name : ''}"></div>
            <div class="field"><label>Last name</label><input type="text" id="m-last" value="${c ? c.last_name : ''}"></div>
            <div class="field full"><label>Email</label><input type="email" id="m-email" value="${c ? c.email : ''}"></div>
            <div class="field"><label>Phone</label><input type="text" id="m-phone" value="${c ? c.phone : ''}"></div>
            <div class="field"><label>City</label><input type="text" id="m-city" value="${c ? c.city : ''}"></div>
            <div class="field"><label>Annual income (₹)</label><input type="number" id="m-income" value="${c ? c.annual_income : ''}"></div>
            <div class="field"><label>Credit score</label><input type="number" id="m-score" min="300" max="900" value="${c ? c.credit_score : 650}"></div>
            <div class="field">
              <label>Segment</label>
              <select id="m-segment">
                ${['RETAIL', 'PREMIUM', 'CORPORATE', 'STUDENT'].map(s => `<option value="${s}" ${c && c.segment === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label>KYC status</label>
              <select id="m-kyc">
                ${['VERIFIED', 'PENDING', 'REJECTED'].map(s => `<option value="${s}" ${c && c.kyc_status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
          <button class="btn btn-primary" id="modal-save">${editing ? 'Save Changes' : 'Add Customer'}</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', () => saveCustomer(customerId));
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.remove();
}

function saveCustomer(customerId) {
  const first = document.getElementById('m-first').value.trim();
  const last = document.getElementById('m-last').value.trim();
  const email = document.getElementById('m-email').value.trim();
  if (!first || !last || !email) {
    alert('First name, last name, and email are required.');
    return;
  }

  const payload = {
    first_name: first,
    last_name: last,
    email: email,
    phone: document.getElementById('m-phone').value.trim(),
    city: document.getElementById('m-city').value.trim(),
    annual_income: Number(document.getElementById('m-income').value) || 0,
    credit_score: Number(document.getElementById('m-score').value) || 650,
    segment: document.getElementById('m-segment').value,
    kyc_status: document.getElementById('m-kyc').value,
  };

  if (customerId !== null) {
    const idx = db.customers.findIndex(c => c.customer_id === customerId);
    db.customers[idx] = { ...db.customers[idx], ...payload };
    toast('Customer updated');
  } else {
    const newId = db._next.customer_id++;
    db.customers.push({
      customer_id: newId,
      ...payload,
      date_of_birth: '1990-01-01',
      gender: 'Other',
      address: '',
      state: '',
      occupation: '',
      created_at: new Date().toISOString().slice(0, 10),
    });
    toast('Customer added');
  }
  saveDB(db);
  closeModal();
  renderTable();
}

function deleteCustomer(customerId) {
  if (!confirm(`Delete CUST-${String(customerId).padStart(4, '0')}? This cannot be undone.`)) return;
  db.customers = db.customers.filter(c => c.customer_id !== customerId);
  saveDB(db);
  toast('Customer deleted');
  renderTable();
}

/* ---------------- View details modal ---------------- */
function viewCustomer(customerId) {
  const c = db.customers.find(x => x.customer_id === customerId);
  const accounts = db.accounts.filter(a => a.customer_id === customerId);
  const loans = db.loans.filter(l => l.customer_id === customerId);
  const seg = db.customer_segments.find(s => s.customer_id === customerId);
  const score = db.credit_scores.find(s => s.customer_id === customerId);

  const modalHtml = `
    <div class="modal-overlay open" id="modal-overlay">
      <div class="modal" style="max-width:600px;">
        <div class="modal-head">
          <h2>${c.first_name} ${c.last_name} — CUST-${String(c.customer_id).padStart(4, '0')}</h2>
          <button class="modal-close" id="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid" style="margin-bottom:16px;">
            <div><div class="stat-label">Email</div><div>${c.email}</div></div>
            <div><div class="stat-label">Phone</div><div class="mono">${c.phone}</div></div>
            <div><div class="stat-label">City</div><div>${c.city}</div></div>
            <div><div class="stat-label">Segment</div><div><span class="pill pill-slate">${c.segment}</span></div></div>
            <div><div class="stat-label">Annual Income</div><div class="mono">${fmtINR(c.annual_income)}</div></div>
            <div><div class="stat-label">Credit Score</div><div class="mono">${c.credit_score}${score ? ' · ' + score.risk_category : ''}</div></div>
          </div>
          <h3>Accounts (${accounts.length})</h3>
          ${accounts.length ? `<div class="table-wrap" style="margin-bottom:16px;"><table><thead><tr><th>Account No</th><th>Type</th><th class="num">Balance</th><th>Status</th></tr></thead><tbody>
            ${accounts.map(a => `<tr><td class="mono">${a.account_number}</td><td>${a.account_type}</td><td class="num">${fmtINR(a.balance)}</td><td><span class="pill ${a.status === 'ACTIVE' ? 'pill-ok' : 'pill-warn'}">${a.status}</span></td></tr>`).join('')}
          </tbody></table></div>` : `<p class="muted">No accounts on file.</p>`}
          <h3>Loans (${loans.length})</h3>
          ${loans.length ? `<div class="table-wrap"><table><thead><tr><th>Loan ID</th><th>Type</th><th class="num">Principal</th><th>Status</th></tr></thead><tbody>
            ${loans.map(l => `<tr><td class="mono">LN-${String(l.loan_id).padStart(4, '0')}</td><td>${l.loan_type}</td><td class="num">${fmtINR(l.principal_amount)}</td><td><span class="pill ${l.status === 'ACTIVE' ? 'pill-ok' : l.status === 'DEFAULTED' ? 'pill-bad' : 'pill-slate'}">${l.status}</span></td></tr>`).join('')}
          </tbody></table>` : `<p class="muted">No loans on file.</p>`}
          ${seg ? `<h3 style="margin-top:16px;">AI Segment</h3><p>${seg.segment_label.replace('_', ' ')} · churn risk ${fmtPct(seg.churn_probability)}</p>` : ''}
        </div>
        <div class="modal-foot">
          <button class="btn btn-secondary" id="modal-cancel">Close</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
}
