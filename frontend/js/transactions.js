let db;
let filterState = { date: '', customer: '', amount: '', type: '' };

document.addEventListener('DOMContentLoaded', () => {
  const session = renderShell('transactions', 'Transaction Management', 'Ledger / All Branches');
  if (!session) return;
  db = DB();
  renderPage();
});

function renderPage() {
  const customerOptions = db.customers
    .sort((a, b) => a.first_name.localeCompare(b.first_name))
    .map(c => `<option value="${c.customer_id}">${c.first_name} ${c.last_name}</option>`).join('');

  pageContent().innerHTML = `
    <div class="quick-actions">
      <button class="btn btn-primary" id="qa-deposit">+ Deposit</button>
      <button class="btn btn-secondary" id="qa-withdraw">− Withdraw</button>
      <button class="btn btn-secondary" id="qa-transfer">⇄ Transfer</button>
    </div>

    <div class="toolbar">
      <div class="toolbar-filters">
        <input type="date" id="f-date">
        <select id="f-customer"><option value="">All customers</option>${customerOptions}</select>
        <input type="number" id="f-amount" placeholder="Min amount ₹" style="width:130px;">
        <select id="f-type">
          <option value="">All types</option>
          <option value="DEPOSIT">Deposit</option>
          <option value="WITHDRAWAL">Withdrawal</option>
          <option value="TRANSFER_IN">Transfer In</option>
          <option value="TRANSFER_OUT">Transfer Out</option>
          <option value="BILL_PAYMENT">Bill Payment</option>
          <option value="POS_PURCHASE">POS Purchase</option>
          <option value="ATM_WITHDRAWAL">ATM Withdrawal</option>
        </select>
      </div>
    </div>
    <div id="tx-table-wrap"></div>
  `;

  document.getElementById('f-date').addEventListener('change', e => { filterState.date = e.target.value; renderTable(); });
  document.getElementById('f-customer').addEventListener('change', e => { filterState.customer = e.target.value; renderTable(); });
  document.getElementById('f-amount').addEventListener('input', e => { filterState.amount = e.target.value; renderTable(); });
  document.getElementById('f-type').addEventListener('change', e => { filterState.type = e.target.value; renderTable(); });

  document.getElementById('qa-deposit').addEventListener('click', () => openTxModal('DEPOSIT'));
  document.getElementById('qa-withdraw').addEventListener('click', () => openTxModal('WITHDRAWAL'));
  document.getElementById('qa-transfer').addEventListener('click', () => openTxModal('TRANSFER'));

  renderTable();
}

function accountsWithOwners() {
  return db.accounts.map(a => {
    const c = db.customers.find(x => x.customer_id === a.customer_id);
    return { ...a, ownerName: c ? `${c.first_name} ${c.last_name}` : '—' };
  });
}

function filteredTx() {
  const minAmt = Number(filterState.amount) || 0;
  return db.transactions.filter(t => {
    if (filterState.date && !t.transaction_date.startsWith(filterState.date)) return false;
    if (filterState.type && t.transaction_type !== filterState.type) return false;
    if (minAmt && t.amount < minAmt) return false;
    if (filterState.customer) {
      const acct = db.accounts.find(a => a.account_id === t.account_id);
      if (!acct || String(acct.customer_id) !== filterState.customer) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
}

function renderTable() {
  const list = filteredTx().slice(0, 200);
  const wrap = document.getElementById('tx-table-wrap');
  if (!list.length) {
    wrap.innerHTML = `<div class="table-wrap"><div class="empty-state"><div class="glyph">— · —</div>No transactions match these filters.</div></div>`;
    return;
  }
  const accts = accountsWithOwners();
  wrap.innerHTML = `
    <div class="section-title"><span></span><span class="count">Showing ${list.length} of ${filteredTx().length}</span></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Account</th><th>Customer</th><th>Type</th><th>Channel</th><th class="num">Amount</th><th>Status</th></tr></thead>
        <tbody>
          ${list.map(t => {
            const acct = accts.find(a => a.account_id === t.account_id);
            const isCredit = ['DEPOSIT', 'TRANSFER_IN'].includes(t.transaction_type);
            const stripe = t.status === 'FLAGGED' ? 'bad' : t.status === 'PENDING' ? 'warn' : t.status === 'FAILED' ? 'bad' : '';
            const pill = t.status === 'SUCCESS' ? 'pill-ok' : t.status === 'PENDING' ? 'pill-warn' : 'pill-bad';
            return `<tr class="row-stripe ${stripe}">
              <td class="mono">${fmtDate(t.transaction_date)}</td>
              <td class="mono">${acct ? acct.account_number : t.account_id}</td>
              <td>${acct ? acct.ownerName : '—'}</td>
              <td>${t.transaction_type.replace('_', ' ')}</td>
              <td>${t.channel}</td>
              <td class="num" style="color:${isCredit ? 'var(--emerald)' : 'var(--text)'};">${isCredit ? '+' : '−'}${fmtINR(t.amount)}</td>
              <td><span class="pill ${pill}">${t.status}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ---------------- Deposit / Withdraw / Transfer modal ---------------- */
function openTxModal(kind) {
  const accts = accountsWithOwners().filter(a => a.status === 'ACTIVE');
  const acctOptions = accts.map(a => `<option value="${a.account_id}">${a.account_number} — ${a.ownerName} (${fmtINR(a.balance)})</option>`).join('');

  const title = kind === 'DEPOSIT' ? 'Deposit Funds' : kind === 'WITHDRAWAL' ? 'Withdraw Funds' : 'Transfer Funds';

  const bodyHtml = kind === 'TRANSFER' ? `
      <div class="field"><label>From account</label><select id="m-from">${acctOptions}</select></div>
      <div class="field"><label>To account</label><select id="m-to">${acctOptions}</select></div>
      <div class="field"><label>Amount (₹)</label><input type="number" id="m-amount" min="1" value="1000"></div>
    ` : `
      <div class="field"><label>Account</label><select id="m-from">${acctOptions}</select></div>
      <div class="field"><label>Amount (₹)</label><input type="number" id="m-amount" min="1" value="1000"></div>
      <div class="field"><label>Channel</label>
        <select id="m-channel">
          <option value="BRANCH">Branch</option>
          <option value="ONLINE">Online</option>
          <option value="MOBILE_APP">Mobile App</option>
          <option value="ATM">ATM</option>
          <option value="UPI">UPI</option>
        </select>
      </div>
    `;

  const modalHtml = `
    <div class="modal-overlay open" id="modal-overlay">
      <div class="modal">
        <div class="modal-head"><h2>${title}</h2><button class="modal-close" id="modal-close">✕</button></div>
        <div class="modal-body">${bodyHtml}</div>
        <div class="modal-foot">
          <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
          <button class="btn btn-primary" id="modal-save">Confirm ${title.split(' ')[0]}</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', () => submitTx(kind));
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.remove();
}

function submitTx(kind) {
  const amount = Number(document.getElementById('m-amount').value);
  if (!amount || amount <= 0) { alert('Enter a valid amount.'); return; }

  const fromId = Number(document.getElementById('m-from').value);
  const fromIdx = db.accounts.findIndex(a => a.account_id === fromId);

  if (kind === 'DEPOSIT') {
    db.accounts[fromIdx].balance += amount;
    pushTx(fromId, 'DEPOSIT', amount, document.getElementById('m-channel').value, db.accounts[fromIdx].balance);
  } else if (kind === 'WITHDRAWAL') {
    if (db.accounts[fromIdx].balance < amount) { alert('Insufficient balance.'); return; }
    db.accounts[fromIdx].balance -= amount;
    pushTx(fromId, 'WITHDRAWAL', amount, document.getElementById('m-channel').value, db.accounts[fromIdx].balance);
  } else if (kind === 'TRANSFER') {
    const toId = Number(document.getElementById('m-to').value);
    if (toId === fromId) { alert('Choose two different accounts.'); return; }
    if (db.accounts[fromIdx].balance < amount) { alert('Insufficient balance in source account.'); return; }
    const toIdx = db.accounts.findIndex(a => a.account_id === toId);
    db.accounts[fromIdx].balance -= amount;
    db.accounts[toIdx].balance += amount;
    pushTx(fromId, 'TRANSFER_OUT', amount, 'ONLINE', db.accounts[fromIdx].balance);
    pushTx(toId, 'TRANSFER_IN', amount, 'ONLINE', db.accounts[toIdx].balance);
  }

  saveDB(db);
  closeModal();
  toast(`${kind.charAt(0) + kind.slice(1).toLowerCase()} recorded`);
  renderTable();
}

function pushTx(accountId, type, amount, channel, balanceAfter) {
  const id = db._next.transaction_id++;
  db.transactions.push({
    transaction_id: id, account_id: accountId, transaction_type: type,
    amount: amount, channel: channel || 'BRANCH', merchant_name: null,
    transaction_date: new Date().toISOString().slice(0, 19),
    description: `${type.replace('_', ' ')} via ${channel || 'BRANCH'}`,
    status: 'SUCCESS', balance_after: balanceAfter,
  });
}
