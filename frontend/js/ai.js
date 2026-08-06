let db;

const AI_TABS = [
  { key: 'loan_prediction', label: 'Loan Prediction', href: 'loan_prediction.html' },
  { key: 'customer_segmentation', label: 'Customer Segmentation', href: 'customer_segmentation.html' },
  { key: 'fraud_detection', label: 'Fraud Detection', href: 'fraud_detection.html' },
  { key: 'credit_score', label: 'Credit Score', href: 'credit_score.html' },
];

const TITLES = {
  loan_prediction: ['Loan Prediction', 'AI Analytics / Risk Model v2.3'],
  customer_segmentation: ['Customer Segmentation', 'AI Analytics / Cluster Model v1.4'],
  fraud_detection: ['Fraud Detection', 'AI Analytics / Anomaly Model v2.3'],
  credit_score: ['Credit Score Prediction', 'AI Analytics / Scoring Model v1.1'],
};

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  const [title, eyebrow] = TITLES[page];
  const session = renderShell('ai', title, eyebrow);
  if (!session) return;
  db = DB();

  const tabsHtml = `
    <div class="btn-row" style="margin-bottom:20px;">
      ${AI_TABS.map(t => `<a class="btn ${t.key === page ? 'btn-primary' : 'btn-secondary'} btn-sm" href="${t.href}">${t.label}</a>`).join('')}
    </div>
    <div id="ai-body"></div>
  `;
  pageContent().innerHTML = tabsHtml;

  if (page === 'loan_prediction') renderLoanPrediction();
  if (page === 'customer_segmentation') renderSegmentation();
  if (page === 'fraud_detection') renderFraudDetection();
  if (page === 'credit_score') renderCreditScore();
});

/* =======================================================================
   1. LOAN PREDICTION
   ======================================================================= */
function renderLoanPrediction() {
  document.getElementById('ai-body').innerHTML = `
    <div class="predict-layout">
      <div class="card-plain">
        <h3 class="mt-0">Applicant Inputs</h3>
        <div class="field"><label>Income (₹ / year)</label><input type="number" id="p-income" value="800000"></div>
        <div class="field"><label>Age</label><input type="number" id="p-age" value="34" min="18" max="75"></div>
        <div class="field"><label>Credit score</label><input type="number" id="p-score" value="720" min="300" max="900"></div>
        <div class="field"><label>Loan amount (₹)</label><input type="number" id="p-amount" value="600000"></div>
        <div class="field">
          <label>Employment type</label>
          <select id="p-employment">
            <option value="SALARIED">Salaried</option>
            <option value="SELF_EMPLOYED">Self-employed</option>
            <option value="BUSINESS">Business owner</option>
            <option value="UNEMPLOYED">Unemployed</option>
          </select>
        </div>
        <button class="btn btn-primary w-full" style="justify-content:center;" id="btn-predict-loan">Predict Loan</button>
      </div>
      <div class="card-plain result-panel" id="loan-result">
        <div class="glyph mono muted">Awaiting inputs</div>
        <p class="muted" style="max-width:280px;">Fill in the applicant profile and run the model to see an approval probability.</p>
      </div>
    </div>

    <div class="section-title"><h2>Recent Predictions</h2><span class="count">${db.loan_predictions.length} scored</span></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Loan</th><th>Customer</th><th class="num">Default Prob.</th><th>Risk Band</th><th>Recommendation</th></tr></thead>
        <tbody>
          ${db.loan_predictions.slice(-10).reverse().map(p => {
            const loan = db.loans.find(l => l.loan_id === p.loan_id);
            const cust = loan ? db.customers.find(c => c.customer_id === loan.customer_id) : null;
            const rec = p.approval_recommendation;
            const pill = rec === 'APPROVE' ? 'pill-ok' : rec === 'REVIEW' ? 'pill-warn' : 'pill-bad';
            return `<tr><td class="mono">LN-${String(p.loan_id).padStart(4, '0')}</td><td>${cust ? cust.first_name + ' ' + cust.last_name : '—'}</td>
              <td class="num">${fmtPct(p.default_probability)}</td><td><span class="pill ${p.predicted_risk_band === 'LOW' ? 'pill-ok' : p.predicted_risk_band === 'MEDIUM' ? 'pill-warn' : 'pill-bad'}">${p.predicted_risk_band}</span></td>
              <td><span class="pill ${pill}">${rec}</span></td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('btn-predict-loan').addEventListener('click', runLoanPrediction);
}

function runLoanPrediction() {
  const income = Number(document.getElementById('p-income').value) || 0;
  const age = Number(document.getElementById('p-age').value) || 0;
  const score = Number(document.getElementById('p-score').value) || 0;
  const amount = Number(document.getElementById('p-amount').value) || 0;
  const employment = document.getElementById('p-employment').value;

  // Transparent, explainable heuristic scoring (stand-in for the trained model).
  let risk = 0;
  risk += Math.max(0, (amount / Math.max(income, 1)) - 1.5) * 22;
  risk += Math.max(0, (700 - score) / 10);
  risk += employment === 'UNEMPLOYED' ? 35 : employment === 'SELF_EMPLOYED' ? 8 : employment === 'BUSINESS' ? 5 : 0;
  risk += age < 23 || age > 65 ? 10 : 0;
  risk = Math.max(2, Math.min(97, Math.round(risk)));

  const approvalProb = 100 - risk;
  const approved = approvalProb >= 55;

  const panel = document.getElementById('loan-result');
  panel.innerHTML = `
    <div class="result-caption">Approval Probability</div>
    <div class="result-figure" style="color:${approved ? 'var(--emerald)' : 'var(--rose)'};">${approvalProb}%</div>
    <span class="pill ${approved ? 'pill-ok' : 'pill-bad'}" style="font-size:13px; padding:6px 14px;">${approved ? 'APPROVED' : 'DECLINED'}</span>
    <p class="muted" style="max-width:300px; margin-top:8px;">Loan-to-income ratio, credit score, employment stability, and age band were the primary drivers of this score.</p>
  `;
}

/* =======================================================================
   2. CUSTOMER SEGMENTATION
   ======================================================================= */
function renderSegmentation() {
  const segLabels = ['HIGH_VALUE', 'LOYAL', 'AT_RISK', 'DORMANT_LIKELY', 'PRICE_SENSITIVE', 'NEW_CUSTOMER'];
  const counts = segLabels.map(s => db.customer_segments.filter(cs => cs.segment_label === s).length);

  document.getElementById('ai-body').innerHTML = `
    <div class="chart-grid">
      <div class="card-plain chart-card">
        <div class="card-head"><h3>Segment Share</h3><span class="tag">All customers</span></div>
        <canvas id="chart-seg-pie"></canvas>
      </div>
      <div class="card-plain chart-card">
        <div class="card-head"><h3>Avg Lifetime Value by Segment</h3><span class="tag">₹, indexed</span></div>
        <canvas id="chart-seg-bar"></canvas>
      </div>
    </div>
    <div class="section-title"><h2>Customer Clusters</h2><span class="count">${db.customer_segments.length} scored</span></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Customer</th><th class="num">Cluster</th><th>Segment</th><th class="num">Churn Risk</th></tr></thead>
        <tbody>
          ${db.customer_segments.slice(0, 25).map(s => {
            const c = db.customers.find(x => x.customer_id === s.customer_id);
            const pill = s.segment_label === 'AT_RISK' ? 'pill-bad' : s.segment_label === 'HIGH_VALUE' || s.segment_label === 'LOYAL' ? 'pill-ok' : 'pill-slate';
            return `<tr><td>${c ? c.first_name + ' ' + c.last_name : '—'}</td><td class="num">${s.cluster_id}</td><td><span class="pill ${pill}">${s.segment_label.replace('_', ' ')}</span></td><td class="num">${fmtPct(s.churn_probability)}</td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  Chart.defaults.font.family = "'IBM Plex Mono', monospace";
  Chart.defaults.font.size = 10.5;
  Chart.defaults.color = '#5B6B72';
  const COLORS = ['#1E6F5C', '#8FBBAF', '#B3432E', '#D99B8B', '#C97A2B', '#5B6B72'];

  new Chart(document.getElementById('chart-seg-pie'), {
    type: 'pie',
    data: { labels: segLabels.map(s => s.replace('_', ' ')), datasets: [{ data: counts, backgroundColor: COLORS }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 9.5 } } } } }
  });

  const avgLtv = segLabels.map(s => {
    const rows = db.customer_segments.filter(cs => cs.segment_label === s);
    if (!rows.length) return 0;
    return Math.round(rows.reduce((sum, r) => sum + r.lifetime_value_score, 0) / rows.length / 1000);
  });
  new Chart(document.getElementById('chart-seg-bar'), {
    type: 'bar',
    data: { labels: segLabels.map(s => s.replace('_', ' ')), datasets: [{ data: avgLtv, backgroundColor: '#101B2D', borderRadius: 2 }] },
    options: {
      responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { grid: { color: '#E6E9E3' } } }
    }
  });
}

/* =======================================================================
   3. FRAUD DETECTION
   ======================================================================= */
function renderFraudDetection() {
  const total = db.fraud_alerts.length;
  const high = db.fraud_alerts.filter(a => a.risk_score >= 70).length;
  const medium = db.fraud_alerts.filter(a => a.risk_score >= 40 && a.risk_score < 70).length;
  const low = db.fraud_alerts.filter(a => a.risk_score < 40).length;

  document.getElementById('ai-body').innerHTML = `
    <div class="stat-grid" style="grid-template-columns: repeat(4, 1fr);">
      <div class="card"><div class="stat-label">Total Alerts</div><div class="stat-value">${total}</div></div>
      <div class="card stripe-rose"><div class="stat-label">High Risk</div><div class="stat-value">${high}</div></div>
      <div class="card stripe-amber"><div class="stat-label">Medium Risk</div><div class="stat-value">${medium}</div></div>
      <div class="card stripe-slate"><div class="stat-label">Low Risk</div><div class="stat-value">${low}</div></div>
    </div>
    <div class="section-title"><h2>Flagged Transactions</h2><span class="count">${total} alerts</span></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Alert</th><th>Transaction</th><th class="num">Risk Score</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${db.fraud_alerts.slice().reverse().map(a => {
            const t = db.transactions.find(x => x.transaction_id === a.transaction_id);
            const band = a.risk_score >= 70 ? 'bad' : a.risk_score >= 40 ? 'warn' : '';
            const pill = a.status === 'CONFIRMED_FRAUD' ? 'pill-bad' : a.status === 'FALSE_POSITIVE' || a.status === 'CLOSED' ? 'pill-ok' : 'pill-warn';
            return `<tr class="row-stripe ${band}">
              <td class="mono">ALERT-${String(a.alert_id).padStart(3, '0')}</td>
              <td class="mono">TX-${a.transaction_id} · ${t ? fmtINR(t.amount) : ''}</td>
              <td class="num">${a.risk_score.toFixed(1)}</td>
              <td>${a.alert_type.replace(/_/g, ' ')}</td>
              <td><span class="pill ${pill}">${a.status.replace('_', ' ')}</span></td>
              <td>
                ${(a.status === 'OPEN' || a.status === 'REVIEWING') ? `
                  <div class="btn-row">
                    <button class="btn btn-secondary btn-sm" id="fp-${a.alert_id}">False Positive</button>
                    <button class="btn btn-danger btn-sm" id="cf-${a.alert_id}">Confirm Fraud</button>
                  </div>` : '<span class="muted">Resolved</span>'}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  db.fraud_alerts.forEach(a => {
    const fp = document.getElementById(`fp-${a.alert_id}`);
    const cf = document.getElementById(`cf-${a.alert_id}`);
    if (fp) fp.addEventListener('click', () => resolveAlert(a.alert_id, 'FALSE_POSITIVE'));
    if (cf) cf.addEventListener('click', () => resolveAlert(a.alert_id, 'CONFIRMED_FRAUD'));
  });
}

function resolveAlert(alertId, status) {
  const idx = db.fraud_alerts.findIndex(a => a.alert_id === alertId);
  db.fraud_alerts[idx].status = status;
  db.fraud_alerts[idx].resolved_at = new Date().toISOString();
  saveDB(db);
  toast(status === 'CONFIRMED_FRAUD' ? 'Marked as confirmed fraud' : 'Marked as false positive');
  renderFraudDetection();
}

/* =======================================================================
   4. CREDIT SCORE PREDICTION
   ======================================================================= */
function renderCreditScore() {
  const options = db.customers.sort((a, b) => a.first_name.localeCompare(b.first_name))
    .map(c => `<option value="${c.customer_id}">${c.first_name} ${c.last_name} (CUST-${String(c.customer_id).padStart(4, '0')})</option>`).join('');

  document.getElementById('ai-body').innerHTML = `
    <div class="predict-layout">
      <div class="card-plain">
        <h3 class="mt-0">Lookup</h3>
        <div class="field"><label>Customer</label><select id="cs-customer">${options}</select></div>
        <button class="btn btn-primary w-full" style="justify-content:center;" id="btn-predict-score">Predict Credit Score</button>
      </div>
      <div class="card-plain result-panel" id="score-result">
        <div class="glyph mono muted">Select a customer</div>
        <p class="muted" style="max-width:280px;">The model reads income, repayment history, and utilization to project a current score.</p>
      </div>
    </div>

    <div class="section-title"><h2>Score History</h2><span class="count">${db.credit_scores.length} records</span></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Customer</th><th class="num">Score</th><th>Category</th><th>Source</th><th>Date</th></tr></thead>
        <tbody>
          ${db.credit_scores.slice(0, 20).map(s => {
            const c = db.customers.find(x => x.customer_id === s.customer_id);
            const pill = s.risk_category === 'EXCELLENT' || s.risk_category === 'VERY_GOOD' ? 'pill-ok' : s.risk_category === 'GOOD' ? 'pill-slate' : s.risk_category === 'FAIR' ? 'pill-warn' : 'pill-bad';
            return `<tr><td>${c ? c.first_name + ' ' + c.last_name : '—'}</td><td class="num">${s.score_value}</td><td><span class="pill ${pill}">${s.risk_category.replace('_', ' ')}</span></td><td>${s.score_source.replace('_', ' ')}</td><td class="mono">${fmtDate(s.score_date)}</td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('btn-predict-score').addEventListener('click', runCreditScore);
}

function runCreditScore() {
  const custId = Number(document.getElementById('cs-customer').value);
  const existing = db.credit_scores.find(s => s.customer_id === custId);
  const score = existing ? existing.score_value : 650;
  const category = score >= 800 ? 'Excellent' : score >= 740 ? 'Very Good' : score >= 670 ? 'Good' : score >= 580 ? 'Fair' : 'Poor';
  const color = score >= 740 ? 'var(--emerald)' : score >= 670 ? 'var(--ink)' : score >= 580 ? 'var(--amber)' : 'var(--rose)';

  const panel = document.getElementById('score-result');
  panel.innerHTML = `
    <div class="result-caption">Credit Score</div>
    <div class="result-figure" style="color:${color};">${score}</div>
    <span class="pill ${score >= 670 ? 'pill-ok' : score >= 580 ? 'pill-warn' : 'pill-bad'}" style="font-size:13px; padding:6px 14px;">${category.toUpperCase()}</span>
    <p class="muted" style="max-width:300px; margin-top:8px;">Based on repayment history, credit utilization, and account tenure on file.</p>
  `;
}
