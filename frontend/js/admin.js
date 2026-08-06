let db;
let activeTab = 'employees';

document.addEventListener('DOMContentLoaded', () => {
  const session = renderShell('admin', 'Admin Panel', 'System / Configuration');
  if (!session) return;
  if (session.role !== 'Administrator') {
    pageContent().innerHTML = `<div class="card-plain empty-state"><div class="glyph">403</div>Your role (${session.role}) does not have Admin Panel access.<br>Sign in as <span class="mono">admin</span> to manage system records.</div>`;
    return;
  }
  db = DB();
  renderPage();
});

function renderPage() {
  pageContent().innerHTML = `
    <div class="btn-row" style="margin-bottom:20px;">
      <button class="btn ${activeTab === 'employees' ? 'btn-primary' : 'btn-secondary'}" id="tab-employees">Employees</button>
      <button class="btn ${activeTab === 'branches' ? 'btn-primary' : 'btn-secondary'}" id="tab-branches">Branches</button>
      <a class="btn btn-secondary" href="customers.html">Customers →</a>
      <a class="btn btn-secondary" href="accounts.html">Accounts →</a>
      <a class="btn btn-secondary" href="reports.html">Reports →</a>
    </div>
    <div id="admin-body"></div>
  `;
  document.getElementById('tab-employees').addEventListener('click', () => { activeTab = 'employees'; renderPage(); });
  document.getElementById('tab-branches').addEventListener('click', () => { activeTab = 'branches'; renderPage(); });

  if (activeTab === 'employees') renderEmployees();
  else renderBranches();
}

function branchName(id) {
  const b = db.branches.find(x => x.branch_id === id);
  return b ? b.branch_name : `Branch ${id}`;
}

function renderEmployees() {
  const body = document.getElementById('admin-body');
  body.innerHTML = `
    <div class="toolbar"><div></div><button class="btn btn-primary" id="btn-add-emp">+ Add Employee</button></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Employee ID</th><th>Name</th><th>Branch</th><th>Role</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${db.employees.map(e => `
            <tr class="row-stripe ${e.status === 'ACTIVE' ? 'ok' : ''}">
              <td class="mono">EMP-${String(e.employee_id).padStart(3, '0')}</td>
              <td>${e.first_name} ${e.last_name}</td>
              <td>${branchName(e.branch_id)}</td>
              <td>${e.role}</td>
              <td>${e.email}</td>
              <td><span class="pill ${e.status === 'ACTIVE' ? 'pill-ok' : 'pill-slate'}">${e.status}</span></td>
              <td><button class="btn btn-secondary btn-sm" id="tog-${e.employee_id}">${e.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</button></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
  db.employees.forEach(e => {
    document.getElementById(`tog-${e.employee_id}`).addEventListener('click', () => {
      const idx = db.employees.findIndex(x => x.employee_id === e.employee_id);
      db.employees[idx].status = db.employees[idx].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      saveDB(db);
      toast('Employee status updated');
      renderEmployees();
    });
  });
  document.getElementById('btn-add-emp').addEventListener('click', openEmployeeModal);
}

function openEmployeeModal() {
  const branchOptions = db.branches.map(b => `<option value="${b.branch_id}">${b.branch_name}</option>`).join('');
  const modalHtml = `
    <div class="modal-overlay open" id="modal-overlay">
      <div class="modal">
        <div class="modal-head"><h2>Add Employee</h2><button class="modal-close" id="modal-close">✕</button></div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="field"><label>First name</label><input type="text" id="m-first"></div>
            <div class="field"><label>Last name</label><input type="text" id="m-last"></div>
            <div class="field full"><label>Email</label><input type="email" id="m-email"></div>
            <div class="field"><label>Branch</label><select id="m-branch">${branchOptions}</select></div>
            <div class="field">
              <label>Role</label>
              <select id="m-role">
                <option>Branch Manager</option><option>Loan Officer</option><option>Teller</option>
                <option>Relationship Manager</option><option>Compliance Officer</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-foot"><button class="btn btn-secondary" id="modal-cancel">Cancel</button><button class="btn btn-primary" id="modal-save">Add Employee</button></div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', () => {
    const first = document.getElementById('m-first').value.trim();
    const last = document.getElementById('m-last').value.trim();
    const email = document.getElementById('m-email').value.trim();
    if (!first || !last || !email) { alert('First name, last name, and email are required.'); return; }
    const newId = db.employees.length ? Math.max(...db.employees.map(e => e.employee_id)) + 1 : 1;
    db.employees.push({
      employee_id: newId, branch_id: Number(document.getElementById('m-branch').value),
      first_name: first, last_name: last, role: document.getElementById('m-role').value,
      email, hire_date: new Date().toISOString().slice(0, 10), status: 'ACTIVE',
    });
    saveDB(db);
    closeModal();
    toast('Employee added');
    renderEmployees();
  });
}

function renderBranches() {
  const body = document.getElementById('admin-body');
  body.innerHTML = `
    <div class="section-title"><span></span><span class="count">${db.branches.length} branches</span></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Branch ID</th><th>Name</th><th>IFSC</th><th>City</th><th>State</th><th class="num">Employees</th><th class="num">Accounts</th></tr></thead>
        <tbody>
          ${db.branches.map(b => `
            <tr>
              <td class="mono">BR-${String(b.branch_id).padStart(2, '0')}</td>
              <td>${b.branch_name}</td>
              <td class="mono">${b.ifsc_code}</td>
              <td>${b.city}</td>
              <td>${b.state}</td>
              <td class="num">${db.employees.filter(e => e.branch_id === b.branch_id).length}</td>
              <td class="num">${db.accounts.filter(a => a.branch_id === b.branch_id).length}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.remove();
}
