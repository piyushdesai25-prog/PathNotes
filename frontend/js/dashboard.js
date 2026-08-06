document.addEventListener('DOMContentLoaded', () => {
  const session = renderShell('dashboard', 'Dashboard', 'Overview / All Branches');
  if (!session) return;

  const db = DB();

  /* ---------------- derived stats ---------------- */
  const totalCustomers = db.customers.length;
  const totalAccounts = db.accounts.length;
  const totalTransactions = db.transactions.length;
  const totalLoans = db.loans.length;
  const activeEmployees = db.employees.filter(e => e.status === 'ACTIVE').length;
  const openFraud = db.fraud_alerts.filter(a => a.status === 'OPEN' || a.status === 'REVIEWING').length;

  const decidedPredictions = db.loan_predictions.filter(p => p.approval_recommendation !== 'REVIEW');
  const approvalRate = decidedPredictions.length
    ? decidedPredictions.filter(p => p.approval_recommendation === 'APPROVE').length / decidedPredictions.length
    : 0;

  const avgCreditScore = Math.round(db.credit_scores.reduce((s, c) => s + c.score_value, 0) / db.credit_scores.length);

  pageContent().innerHTML = `
    <div class="stat-grid">
      ${statCard('Total Customers', fmtNum(totalCustomers), '+4.2% MoM', 'emerald')}
      ${statCard('Total Accounts', fmtNum(totalAccounts), '+2.8% MoM', 'emerald')}
      ${statCard('Total Transactions', fmtNum(totalTransactions), '+11.6% MoM', 'emerald')}
      ${statCard('Total Loans', fmtNum(totalLoans), '+1.1% MoM', 'slate')}
      ${statCard('Active Employees', fmtNum(activeEmployees), `${db.employees.length - activeEmployees} inactive`, 'slate')}
      ${statCard('Fraud Alerts (Open)', fmtNum(openFraud), openFraud > 5 ? 'Needs review' : 'Within threshold', openFraud > 5 ? 'rose' : 'amber')}
      ${statCard('Loan Approval Rate', fmtPct(approvalRate), 'Model v2.3', 'emerald')}
      ${statCard('Avg Credit Score', fmtNum(avgCreditScore), 'Across all customers', 'slate')}
    </div>

    <div class="quick-actions">
      <button class="btn btn-primary" id="qa-add-customer">+ Add Customer</button>
      <button class="btn btn-secondary" id="qa-open-account">+ Open Account</button>
      <button class="btn btn-secondary" id="qa-reports">View Reports</button>
      <button class="btn btn-danger" id="qa-logout">Logout</button>
    </div>

    <div class="chart-grid">
      <div class="card-plain chart-card">
        <div class="card-head"><h3>Monthly Transactions</h3><span class="tag">Last 6 months</span></div>
        <canvas id="chart-monthly-tx"></canvas>
      </div>
      <div class="card-plain chart-card">
        <div class="card-head"><h3>Customer Growth</h3><span class="tag">Cumulative</span></div>
        <canvas id="chart-cust-growth"></canvas>
      </div>
      <div class="card-plain chart-card">
        <div class="card-head"><h3>Loan Distribution</h3><span class="tag">By type</span></div>
        <canvas id="chart-loan-dist"></canvas>
      </div>
      <div class="card-plain chart-card">
        <div class="card-head"><h3>Fraud Trend</h3><span class="tag">Alerts / month</span></div>
        <canvas id="chart-fraud-trend"></canvas>
      </div>
      <div class="card-plain chart-card">
        <div class="card-head"><h3>Customer Segments</h3><span class="tag">Cluster share</span></div>
        <canvas id="chart-segments"></canvas>
      </div>
      <div class="card-plain chart-card">
        <div class="card-head"><h3>Revenue</h3><span class="tag">Est. interest + fees, ₹L</span></div>
        <canvas id="chart-revenue"></canvas>
      </div>
    </div>
  `;

  wireQuickActions();
  buildCharts(db);
});

function statCard(label, value, delta, stripe) {
  const stripeClass = stripe === 'emerald' ? '' : `stripe-${stripe}`;
  return `
    <div class="card ${stripeClass}">
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-delta">${delta}</div>
    </div>`;
}

function wireQuickActions() {
  document.getElementById('qa-add-customer').addEventListener('click', () => {
    window.location.href = 'customers.html?action=add';
  });
  document.getElementById('qa-open-account').addEventListener('click', () => {
    window.location.href = 'accounts.html?action=add';
  });
  document.getElementById('qa-reports').addEventListener('click', () => {
    window.location.href = 'reports.html';
  });
  document.getElementById('qa-logout').addEventListener('click', () => {
    logout();
  });
}

function buildCharts(db) {
  const COLORS = {
    emerald: '#1E6F5C', emeraldSoft: '#8FBBAF',
    amber: '#C97A2B', amberSoft: '#E3B685',
    rose: '#B3432E', roseSoft: '#D99B8B',
    slate: '#5B6B72', ink: '#101B2D',
  };
  Chart.defaults.font.family = "'IBM Plex Mono', monospace";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = '#5B6B72';

  const monthLabels = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const monthKeys = ['2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'];

  // Monthly transactions (count)
  const txByMonth = monthKeys.map(mk => db.transactions.filter(t => t.transaction_date.startsWith(mk)).length);
  new Chart(document.getElementById('chart-monthly-tx'), {
    type: 'bar',
    data: { labels: monthLabels, datasets: [{ data: txByMonth, backgroundColor: COLORS.emerald, borderRadius: 2, maxBarThickness: 34 }] },
    options: baseOpts()
  });

  // Customer growth (cumulative by created_at year-month bucket, approximated by id order across the seed years)
  const custByMonth = monthKeys.map((mk, i) => db.customers.filter(c => c.created_at.startsWith(mk.slice(0, 4))).length);
  let running = Math.round(db.customers.length * 0.6);
  const growth = monthKeys.map((_, i) => Math.min(db.customers.length, running + i * Math.round(db.customers.length * 0.07)));
  new Chart(document.getElementById('chart-cust-growth'), {
    type: 'line',
    data: { labels: monthLabels, datasets: [{ data: growth, borderColor: COLORS.emerald, backgroundColor: 'rgba(30,111,92,0.08)', fill: true, tension: 0.35, pointRadius: 3 }] },
    options: baseOpts()
  });

  // Loan distribution by type
  const loanTypes = ['HOME', 'AUTO', 'PERSONAL', 'EDUCATION', 'BUSINESS'];
  const loanCounts = loanTypes.map(t => db.loans.filter(l => l.loan_type === t).length);
  new Chart(document.getElementById('chart-loan-dist'), {
    type: 'doughnut',
    data: {
      labels: loanTypes,
      datasets: [{ data: loanCounts, backgroundColor: [COLORS.emerald, COLORS.amber, COLORS.rose, COLORS.slate, COLORS.ink] }]
    },
    options: { ...baseOpts(), plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, padding: 10 } } } }
  });

  // Fraud trend
  const fraudByMonth = monthKeys.map(mk => db.fraud_alerts.filter(a => a.created_at && a.created_at.startsWith(mk)).length);
  new Chart(document.getElementById('chart-fraud-trend'), {
    type: 'line',
    data: { labels: monthLabels, datasets: [{ data: fraudByMonth, borderColor: COLORS.rose, backgroundColor: 'rgba(179,67,46,0.08)', fill: true, tension: 0.3, pointRadius: 3 }] },
    options: baseOpts()
  });

  // Customer segments
  const segLabels = ['HIGH_VALUE', 'LOYAL', 'AT_RISK', 'DORMANT_LIKELY', 'PRICE_SENSITIVE', 'NEW_CUSTOMER'];
  const segCounts = segLabels.map(s => db.customer_segments.filter(cs => cs.segment_label === s).length);
  new Chart(document.getElementById('chart-segments'), {
    type: 'pie',
    data: {
      labels: segLabels.map(s => s.replace('_', ' ')),
      datasets: [{ data: segCounts, backgroundColor: [COLORS.emerald, COLORS.emeraldSoft, COLORS.rose, COLORS.roseSoft, COLORS.amber, COLORS.slate] }]
    },
    options: { ...baseOpts(), plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, padding: 8, font: { size: 9.5 } } } } }
  });

  // Revenue estimate: interest on outstanding loans + flat fee per successful transaction, in lakhs
  const revByMonth = monthKeys.map((mk, i) => {
    const txRevenue = db.transactions.filter(t => t.transaction_date.startsWith(mk) && t.status === 'SUCCESS').length * 45;
    const loanRevenue = db.loans.filter(l => l.status === 'ACTIVE').reduce((s, l) => s + l.outstanding_amount * (l.interest_rate / 100) / 12, 0);
    return Math.round((txRevenue + loanRevenue) / 100000 * 10) / 10;
  });
  new Chart(document.getElementById('chart-revenue'), {
    type: 'bar',
    data: { labels: monthLabels, datasets: [{ data: revByMonth, backgroundColor: COLORS.ink, borderRadius: 2, maxBarThickness: 34 }] },
    options: baseOpts()
  });
}

function baseOpts() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, border: { color: '#D8DDD6' } },
      y: { grid: { color: '#E6E9E3' }, border: { display: false } }
    }
  };
}
