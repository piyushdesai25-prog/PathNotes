let db;
let activeReport = 'customers';

const REPORTS = {
  customers: {
    label: 'Customer Report',
    headers: ['Customer ID', 'Name', 'City', 'Segment', 'Income', 'Credit Score', 'KYC Status'],
    rows: () => db.customers.map(c => [
      `CUST-${String(c.customer_id).padStart(4, '0')}`, `${c.first_name} ${c.last_name}`, c.city,
      c.segment, c.annual_income, c.credit_score, c.kyc_status
    ]),
  },
  loans: {
    label: 'Loan Report',
    headers: ['Loan ID', 'Customer', 'Type', 'Principal', 'Outstanding', 'Status'],
    rows: () => db.loans.map(l => {
      const c = db.customers.find(x => x.customer_id === l.customer_id);
      return [`LN-${String(l.loan_id).padStart(4, '0')}`, c ? `${c.first_name} ${c.last_name}` : '—', l.loan_type, l.principal_amount, l.outstanding_amount, l.status];
    }),
  },
  fraud: {
    label: 'Fraud Report',
    headers: ['Alert ID', 'Transaction ID', 'Risk Score', 'Alert Type', 'Status'],
    rows: () => db.fraud_alerts.map(a => [`ALERT-${String(a.alert_id).padStart(3, '0')}`, `TX-${a.transaction_id}`, a.risk_score, a.alert_type, a.status]),
  },
  transactions: {
    label: 'Transactions Report',
    headers: ['Transaction ID', 'Account', 'Type', 'Amount', 'Channel', 'Status', 'Date'],
    rows: () => db.transactions.slice(0, 300).map(t => {
      const acct = db.accounts.find(a => a.account_id === t.account_id);
      return [`TX-${t.transaction_id}`, acct ? acct.account_number : t.account_id, t.transaction_type, t.amount, t.channel, t.status, t.transaction_date];
    }),
  },
};

document.addEventListener('DOMContentLoaded', () => {
  const session = renderShell('reports', 'Reports', 'Export / All Branches');
  if (!session) return;
  db = DB();
  renderPage();
});

function renderPage() {
  pageContent().innerHTML = `
    <div class="btn-row" style="margin-bottom:20px;">
      ${Object.entries(REPORTS).map(([key, r]) => `<button class="btn ${key === activeReport ? 'btn-primary' : 'btn-secondary'}" id="rep-${key}">${r.label}</button>`).join('')}
    </div>

    <div class="card-plain" style="margin-bottom:20px;">
      <div class="flex" style="justify-content:space-between; margin-bottom:14px;">
        <h3 class="mt-0">${REPORTS[activeReport].label} — Download</h3>
        <div class="btn-row">
          <button class="btn btn-secondary btn-sm" id="dl-pdf">Download PDF</button>
          <button class="btn btn-secondary btn-sm" id="dl-csv">Download CSV</button>
          <button class="btn btn-secondary btn-sm" id="dl-xls">Download Excel</button>
        </div>
      </div>
      <p class="muted" style="margin:0;">Preview reflects live data currently in the system. ${REPORTS[activeReport].rows().length} rows.</p>
    </div>

    <div class="table-wrap">
      <table>
        <thead><tr>${REPORTS[activeReport].headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${REPORTS[activeReport].rows().slice(0, 30).map(row => `<tr>${row.map(cell => `<td class="mono">${cell}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;

  Object.keys(REPORTS).forEach(key => {
    document.getElementById(`rep-${key}`).addEventListener('click', () => { activeReport = key; renderPage(); });
  });
  document.getElementById('dl-csv').addEventListener('click', downloadCSV);
  document.getElementById('dl-xls').addEventListener('click', downloadExcel);
  document.getElementById('dl-pdf').addEventListener('click', downloadPDF);
}

function downloadCSV() {
  const rep = REPORTS[activeReport];
  const rows = [rep.headers, ...rep.rows()];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  triggerDownload(csv, `${activeReport}_report.csv`, 'text/csv');
  toast('CSV download started');
}

function downloadExcel() {
  const rep = REPORTS[activeReport];
  const rows = [rep.headers, ...rep.rows()];
  const html = `<table><thead><tr>${rep.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>
    ${rep.rows().map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}
  </tbody></table>`;
  triggerDownload(html, `${activeReport}_report.xls`, 'application/vnd.ms-excel');
  toast('Excel download started');
}

function downloadPDF() {
  const rep = REPORTS[activeReport];
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>${rep.label}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px;color:#16232E;}
      h1{font-size:18px;margin-bottom:4px;}
      .sub{color:#5B6B72;font-size:11px;margin-bottom:16px;}
      table{width:100%;border-collapse:collapse;font-size:11px;}
      th,td{border:1px solid #D8DDD6;padding:6px 8px;text-align:left;}
      th{background:#FAFAF8;}
    </style></head><body>
    <h1>${rep.label}</h1>
    <div class="sub">AI Banking Analytics · Generated ${new Date().toLocaleString('en-IN')}</div>
    <table><thead><tr>${rep.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>
    ${rep.rows().map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}
    </tbody></table>
    </body></html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

function triggerDownload(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
