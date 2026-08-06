let db;
let filterState = { status: '', type: '' };

document.addEventListener('DOMContentLoaded', () => {
  const session = renderShell('loans', 'Loan Management', 'Portfolio / All Branches');
  if (!session) return;
  db = DB();
  renderPage();
});

function customerName(id) {
  const c = db.customers.find(x => x.customer_id === id);
  return c ? `${c.first_name} ${c.last_name}` : `Customer ${id}`;
}

function renderPage() {
  pageContent().innerHTML = `
    <div class="toolbar">
      <div class="toolbar-filters">
        <select id="f-status">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
          <option value="DEFAULTED">Defaulted</option>
          <option value="WRITTEN_OFF">Written Off</option>
        </select>
        <select id="f-type">
          <option value="">All types</option>
          <option value="HOME">Home</option>
          <option value="AUTO">Auto</option>
          <option value="PERSONAL">Personal</option>
          <option value="EDUCATION">Education</option>
          <option value="BUSINESS">Business</option>
        </select>
      </div>
      <button class="btn btn-primary" id="btn-apply">+ Apply Loan</button>
    </div>
    <div id="loan-table-wrap"></div>
  `;
  document.getElementById('f-status').addEventListener('change', e => { filterState.status = e.target.value; renderTable(); });
  document.getElementById('f-type').addEventListener('change', e => { filterState.type = e.target.value; renderTable(); });
  document.getElementById('btn-apply').addEventListener('click', openApplyModal);
  renderTable();
}

function filteredLoans() {
  return db.loans.filter(l => {
    if (filterState.status && l.status !== filterState.status) return false;
    if (filterState.type && l.loan_type !== filterState.type) return false;
    return true;
  }).sort((a, b) => b.loan_id - a.loan_id);
}

function renderTable() {
  const list = filteredLoans();
  const wrap = document.getElementById('loan-table-wrap');
  if (!list.length) {
    wrap.innerHTML = `<div class="table-wrap"><div class="empty-state"><div class="glyph">— · —</div>No loans match these filters.</div></div>`;
    return;
  }
  wrap.innerHTML = `
    <div class="section-title"><span></span><span class="count">${list.length} loan${list.length === 1 ? '' : 's'}</span></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Loan ID</th><th>Customer</th><th>Type</th><th class="num">Amount</th><th class="num">Outstanding</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${list.map(rowHtml).join('')}</tbody>
      </table>
    </div>`;
  list.forEach(l => {
    document.getElementById(`view-${l.loan_id}`).addEventListener('click', () => viewLoan(l.loan_id));
    const closeBtn = document.getElementById(`close-${l.loan_id}`);
    if (closeBtn) closeBtn.addEventListener('click', () => setLoanStatus(l.loan_id, 'CLOSED'));
  });
}

function rowHtml(l) {
  const pill = l.status === 'ACTIVE' ? 'pill-ok' : l.status === 'DEFAULTED' || l.status === 'WRITTEN_OFF' ? 'pill-bad' : 'pill-slate';
  const stripe = l.status === 'ACTIVE' ? 'ok' : l.status === 'DEFAULTED' || l.status === 'WRITTEN_OFF' ? 'bad' : '';
  return `
    <tr class="row-stripe ${stripe}">
      <td class="mono">LN-${String(l.loan_id).padStart(4, '0')}</td>
      <td>${customerName(l.customer_id)}</td>
      <td>${l.loan_type}</td>
      <td class="num">${fmtINR(l.principal_amount)}</td>
      <td class="num">${fmtINR(l.outstanding_amount)}</td>
      <td><span class="pill ${pill}">${l.status}</span></td>
      <td>
        <div class="btn-row">
          <button class="btn btn-secondary btn-sm" id="view-${l.loan_id}">Details</button>
          ${l.status === 'ACTIVE' ? `<button class="btn btn-danger btn-sm" id="close-${l.loan_id}">Mark Closed</button>` : ''}
        </div>
      </td>
    </tr>`;
}

function setLoanStatus(loanId, status) {
  const idx = db.loans.findIndex(l => l.loan_id === loanId);
  db.loans[idx].status = status;
  if (status === 'CLOSED') db.loans[idx].outstanding_amount = 0;
  saveDB(db);
  toast('Loan status updated');
  renderTable();
}

function viewLoan(loanId) {
  const l = db.loans.find(x => x.loan_id === loanId);
  const pred = db.loan_predictions.find(p => p.loan_id === loanId);
  const modalHtml = `
    <div class="modal-overlay open" id="modal-overlay">
      <div class="modal">
        <div class="modal-head"><h2>Loan LN-${String(l.loan_id).padStart(4, '0')}</h2><button class="modal-close" id="modal-close">✕</button></div>
        <div class="modal-body">
          <div class="form-grid">
            <div><div class="stat-label">Customer</div><div>${customerName(l.customer_id)}</div></div>
            <div><div class="stat-label">Type</div><div>${l.loan_type}</div></div>
            <div><div class="stat-label">Principal</div><div class="mono">${fmtINR(l.principal_amount)}</div></div>
            <div><div class="stat-label">Interest rate</div><div class="mono">${l.interest_rate}% p.a.</div></div>
            <div><div class="stat-label">Tenure</div><div class="mono">${l.tenure_months} months</div></div>
            <div><div class="stat-label">EMI</div><div class="mono">${fmtINR(l.emi_amount)}</div></div>
            <div><div class="stat-label">Disbursed</div><div class="mono">${fmtDate(l.disbursed_date)}</div></div>
            <div><div class="stat-label">Outstanding</div><div class="mono">${fmtINR(l.outstanding_amount)}</div></div>
          </div>
          ${pred ? `
          <h3 style="margin-top:18px;">AI Risk Assessment</h3>
          <div class="form-grid">
            <div><div class="stat-label">Default Probability</div><div class="mono">${fmtPct(pred.default_probability)}</div></div>
            <div><div class="stat-label">Risk Band</div><div><span class="pill ${pred.predicted_risk_band === 'LOW' ? 'pill-ok' : pred.predicted_risk_band === 'MEDIUM' ? 'pill-warn' : 'pill-bad'}">${pred.predicted_risk_band}</span></div></div>
          </div>` : ''}
        </div>
        <div class="modal-foot"><button class="btn btn-secondary" id="modal-cancel">Close</button></div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.remove();
}

function openApplyModal() {
  const customerOptions = db.customers.sort((a, b) => a.first_name.localeCompare(b.first_name))
    .map(c => `<option value="${c.customer_id}">${c.first_name} ${c.last_name}</option>`).join('');
  const branchOptions = db.branches.map(b => `<option value="${b.branch_id}">${b.branch_name}</option>`).join('');

  const modalHtml = `
    <div class="modal-overlay open" id="modal-overlay">
      <div class="modal">
        <div class="modal-head"><h2>Apply for Loan</h2><button class="modal-close" id="modal-close">✕</button></div>
        <div class="modal-body">
          <div class="field"><label>Customer</label><select id="m-customer">${customerOptions}</select></div>
          <div class="field"><label>Branch</label><select id="m-branch">${branchOptions}</select></div>
          <div class="form-grid">
            <div class="field">
              <label>Loan type</label>
              <select id="m-type">
                <option value="HOME">Home</option><option value="AUTO">Auto</option>
                <option value="PERSONAL">Personal</option><option value="EDUCATION">Education</option>
                <option value="BUSINESS">Business</option>
              </select>
            </div>
            <div class="field"><label>Principal (₹)</label><input type="number" id="m-principal" value="500000"></div>
            <div class="field"><label>Interest rate (% p.a.)</label><input type="number" step="0.1" id="m-rate" value="9.5"></div>
            <div class="field"><label>Tenure (months)</label><input type="number" id="m-tenure" value="60"></div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
          <button class="btn btn-primary" id="modal-save">Submit Application</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', submitLoan);
}

function submitLoan() {
  const principal = Number(document.getElementById('m-principal').value);
  const rate = Number(document.getElementById('m-rate').value);
  const tenure = Number(document.getElementById('m-tenure').value);
  if (!principal || !rate || !tenure) { alert('Fill in all loan terms.'); return; }

  const newId = db._next.loan_id++;
  db.loans.push({
    loan_id: newId,
    customer_id: Number(document.getElementById('m-customer').value),
    branch_id: Number(document.getElementById('m-branch').value),
    loan_type: document.getElementById('m-type').value,
    principal_amount: principal,
    interest_rate: rate,
    tenure_months: tenure,
    emi_amount: Math.round(principal / tenure * (1 + rate / 100)),
    disbursed_date: new Date().toISOString().slice(0, 10),
    status: 'ACTIVE',
    outstanding_amount: principal,
  });
  saveDB(db);
  closeModal();
  toast('Loan application submitted');
  renderTable();
}
