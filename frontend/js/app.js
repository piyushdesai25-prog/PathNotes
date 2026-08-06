/* =====================================================================
   app.js — shared data layer, auth guard, nav, and utilities
   Mirrors the SQL schema (02_create_tables.sql) so swapping this
   in-browser store for real API calls later is a straight port.
   ===================================================================== */

const DB_KEY = 'aiban_db_v1';
const SESSION_KEY = 'aiban_session_v1';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: 'dashboard.html', icon: '01' },
  { key: 'customers', label: 'Customers', href: 'customers.html', icon: '02' },
  { key: 'accounts', label: 'Accounts', href: 'accounts.html', icon: '03' },
  { key: 'transactions', label: 'Transactions', href: 'transactions.html', icon: '04' },
  { key: 'loans', label: 'Loans', href: 'loans.html', icon: '05' },
  { key: 'ai', label: 'AI Analytics', href: 'loan_prediction.html', icon: '06' },
  { key: 'reports', label: 'Reports', href: 'reports.html', icon: '07' },
  { key: 'admin', label: 'Admin', href: 'admin.html', icon: '08' },
  { key: 'profile', label: 'Profile', href: 'profile.html', icon: '09' },
];

/* ---------------------------------------------------------------------
   Seed data generation (deterministic-ish, realistic INR banking data)
   --------------------------------------------------------------------- */
function seedDatabase() {
  const cities = [
    ['Mumbai', 'Maharashtra'], ['Pune', 'Maharashtra'], ['Bengaluru', 'Karnataka'],
    ['Chennai', 'Tamil Nadu'], ['Hyderabad', 'Telangana'], ['Delhi', 'Delhi'],
    ['Ahmedabad', 'Gujarat'], ['Kolkata', 'West Bengal'], ['Jaipur', 'Rajasthan'],
    ['Lucknow', 'Uttar Pradesh']
  ];

  const branches = cities.slice(0, 6).map((c, i) => ({
    branch_id: i + 1,
    branch_name: `${c[0]} Main Branch`,
    ifsc_code: `AIBK000${String(i + 1).padStart(3, '0')}`,
    city: c[0], state: c[1],
    opened_date: `20${10 + i}-0${(i % 9) + 1}-1${i}`,
  }));

  const empFirst = ['Aarav', 'Vihaan', 'Ishaan', 'Diya', 'Ananya', 'Kabir', 'Meera', 'Rohan', 'Priya', 'Sanya', 'Aditya', 'Neha'];
  const empLast = ['Sharma', 'Verma', 'Iyer', 'Reddy', 'Nair', 'Gupta', 'Kapoor', 'Menon', 'Chatterjee', 'Rao'];
  const roles = ['Branch Manager', 'Loan Officer', 'Teller', 'Relationship Manager', 'Compliance Officer'];
  const employees = Array.from({ length: 14 }, (_, i) => ({
    employee_id: i + 1,
    branch_id: (i % branches.length) + 1,
    first_name: empFirst[i % empFirst.length],
    last_name: empLast[(i * 3) % empLast.length],
    role: roles[i % roles.length],
    email: `${empFirst[i % empFirst.length].toLowerCase()}.${empLast[(i * 3) % empLast.length].toLowerCase()}@aibank.in`,
    hire_date: `20${15 + (i % 8)}-0${(i % 9) + 1}-1${i % 9}`,
    status: i % 11 === 0 ? 'INACTIVE' : 'ACTIVE',
  }));

  const custFirst = ['Arjun', 'Kavya', 'Rahul', 'Sneha', 'Vikram', 'Pooja', 'Karan', 'Isha', 'Manish', 'Ritu',
    'Siddharth', 'Tanvi', 'Nikhil', 'Divya', 'Amitabh', 'Shreya', 'Varun', 'Lakshmi', 'Gaurav', 'Nandini',
    'Rajesh', 'Sunita', 'Deepak', 'Anjali', 'Harsh'];
  const custLast = ['Patel', 'Singh', 'Joshi', 'Malhotra', 'Bose', 'Pillai', 'Agarwal', 'Desai', 'Mehta', 'Chauhan'];
  const occupations = ['Software Engineer', 'Business Owner', 'Doctor', 'Teacher', 'Government Employee', 'Consultant', 'Architect', 'Freelancer', 'Student', 'Retired'];
  const segments = ['RETAIL', 'RETAIL', 'RETAIL', 'PREMIUM', 'CORPORATE', 'STUDENT'];

  const customers = Array.from({ length: 25 }, (_, i) => {
    const city = cities[i % cities.length];
    const income = 300000 + (i * 47000) % 2200000;
    const score = 300 + ((i * 37) % 601);
    return {
      customer_id: i + 1,
      first_name: custFirst[i], last_name: custLast[i % custLast.length],
      date_of_birth: `19${70 + (i % 30)}-0${(i % 9) + 1}-1${i % 9}`,
      gender: i % 3 === 0 ? 'F' : (i % 3 === 1 ? 'M' : 'Other'),
      email: `${custFirst[i].toLowerCase()}.${custLast[i % custLast.length].toLowerCase()}${i}@mail.com`,
      phone: `9${(800000000 + i * 12345).toString().slice(0, 9)}`,
      city: city[0], state: city[1],
      occupation: occupations[i % occupations.length],
      annual_income: income,
      kyc_status: i % 9 === 0 ? 'PENDING' : (i % 13 === 0 ? 'REJECTED' : 'VERIFIED'),
      credit_score: score,
      segment: segments[i % segments.length],
      created_at: `202${2 + (i % 4)}-0${(i % 9) + 1}-1${i % 9}`,
    };
  });

  const acctTypes = ['SAVINGS', 'SAVINGS', 'CURRENT', 'FIXED_DEPOSIT', 'SALARY'];
  const accounts = customers.flatMap((c, i) => {
    const n = i % 5 === 0 ? 2 : 1;
    return Array.from({ length: n }, (_, j) => ({
      account_id: i * 2 + j + 1,
      customer_id: c.customer_id,
      branch_id: (i % branches.length) + 1,
      account_number: `AIB${(100000000 + i * 37 + j).toString()}`,
      account_type: acctTypes[(i + j) % acctTypes.length],
      balance: 5000 + ((i * 91337 + j * 5000) % 850000),
      currency: 'INR',
      status: (i % 17 === 0) ? 'DORMANT' : (i % 23 === 0 ? 'FROZEN' : 'ACTIVE'),
      opened_date: `202${1 + (i % 5)}-0${(i % 9) + 1}-1${(i + j) % 9}`,
    }));
  });

  const txTypes = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'BILL_PAYMENT', 'POS_PURCHASE', 'ATM_WITHDRAWAL'];
  const channels = ['ATM', 'ONLINE', 'MOBILE_APP', 'BRANCH', 'POS', 'UPI'];
  const merchants = ['Amazon', 'Swiggy', 'Zomato', 'Flipkart', 'IRCTC', 'BigBasket', 'Reliance Digital', null, null];
  const months = ['2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'];
  const transactions = [];
  let txId = 1;
  accounts.forEach((a, ai) => {
    const count = 3 + (ai % 5);
    for (let k = 0; k < count; k++) {
      const month = months[(ai + k) % months.length];
      const day = String(1 + ((ai * 7 + k * 3) % 27)).padStart(2, '0');
      const type = txTypes[(ai + k) % txTypes.length];
      const amount = Math.round((150 + ((ai * 311 + k * 977) % 48000)) / 10) * 10;
      transactions.push({
        transaction_id: txId,
        account_id: a.account_id,
        transaction_type: type,
        amount: amount,
        channel: channels[(ai + k) % channels.length],
        merchant_name: (type === 'POS_PURCHASE' || type === 'BILL_PAYMENT') ? merchants[(ai + k) % merchants.length] : null,
        transaction_date: `${month}-${day}T${String(9 + (k % 10)).padStart(2, '0')}:${String((k * 13) % 60).padStart(2, '0')}:00`,
        description: `${type.replace('_', ' ')} via ${channels[(ai + k) % channels.length]}`,
        status: (txId % 29 === 0) ? 'FLAGGED' : (txId % 41 === 0 ? 'FAILED' : (txId % 37 === 0 ? 'PENDING' : 'SUCCESS')),
        balance_after: a.balance,
      });
      txId++;
    }
  });

  const loanTypes = ['HOME', 'AUTO', 'PERSONAL', 'EDUCATION', 'BUSINESS'];
  const loanStatuses = ['ACTIVE', 'ACTIVE', 'CLOSED', 'ACTIVE', 'DEFAULTED', 'ACTIVE'];
  const loans = customers.filter((c, i) => i % 2 === 0).map((c, i) => {
    const principal = [500000, 1200000, 250000, 800000, 3500000, 150000][i % 6];
    const rate = [8.5, 9.2, 11.5, 7.8, 10.2][i % 5];
    const tenure = [60, 84, 36, 120, 240][i % 5];
    return {
      loan_id: i + 1,
      customer_id: c.customer_id,
      branch_id: (i % branches.length) + 1,
      loan_type: loanTypes[i % loanTypes.length],
      principal_amount: principal,
      interest_rate: rate,
      tenure_months: tenure,
      emi_amount: Math.round(principal / tenure * (1 + rate / 100)),
      disbursed_date: `202${2 + (i % 4)}-0${(i % 9) + 1}-1${i % 9}`,
      status: loanStatuses[i % loanStatuses.length],
      outstanding_amount: Math.round(principal * (0.3 + (i % 6) * 0.11)),
    };
  });

  const cardNetworks = ['VISA', 'MASTERCARD', 'RUPAY', 'AMEX'];
  const cards = accounts.filter((a, i) => i % 2 === 0).map((a, i) => ({
    card_id: i + 1,
    customer_id: a.customer_id,
    account_id: a.account_id,
    card_type: i % 3 === 0 ? 'CREDIT' : 'DEBIT',
    card_network: cardNetworks[i % cardNetworks.length],
    card_number_masked: `**** **** **** ${(1000 + i * 37) % 9000 + 1000}`.slice(-19),
    credit_limit: i % 3 === 0 ? 50000 + (i % 8) * 25000 : null,
    issue_date: `202${2 + (i % 3)}-0${(i % 9) + 1}-1${i % 9}`,
    expiry_date: `202${8 + (i % 3)}-0${(i % 9) + 1}-1${i % 9}`,
    status: i % 19 === 0 ? 'BLOCKED' : 'ACTIVE',
  }));

  const alertTypes = ['UNUSUAL_AMOUNT', 'VELOCITY_CHECK', 'LOCATION_MISMATCH', 'DEVICE_MISMATCH', 'KNOWN_FRAUD_PATTERN'];
  const alertStatuses = ['OPEN', 'REVIEWING', 'CONFIRMED_FRAUD', 'FALSE_POSITIVE', 'CLOSED'];
  const flagged = transactions.filter(t => t.status === 'FLAGGED' || t.transaction_id % 11 === 0).slice(0, 18);
  const fraud_alerts = flagged.map((t, i) => ({
    alert_id: i + 1,
    transaction_id: t.transaction_id,
    risk_score: Math.round((30 + ((i * 971) % 70)) * 100) / 100,
    alert_type: alertTypes[i % alertTypes.length],
    model_version: 'v2.3',
    status: alertStatuses[i % alertStatuses.length],
    created_at: t.transaction_date,
  }));

  const riskBands = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];
  const loan_predictions = loans.map((l, i) => {
    const prob = Math.round(((i * 613) % 92 + 3)) / 100;
    const band = prob < 0.2 ? 'LOW' : prob < 0.45 ? 'MEDIUM' : prob < 0.7 ? 'HIGH' : 'VERY_HIGH';
    return {
      prediction_id: i + 1,
      loan_id: l.loan_id,
      model_version: 'v2.3',
      default_probability: prob,
      predicted_risk_band: band,
      approval_recommendation: prob < 0.35 ? 'APPROVE' : prob < 0.65 ? 'REVIEW' : 'REJECT',
      prediction_date: l.disbursed_date + 'T10:00:00',
      actual_outcome: l.status === 'CLOSED' ? 'REPAID' : l.status === 'DEFAULTED' ? 'DEFAULTED' : 'ACTIVE',
    };
  });

  const segLabels = ['HIGH_VALUE', 'LOYAL', 'AT_RISK', 'DORMANT_LIKELY', 'PRICE_SENSITIVE', 'NEW_CUSTOMER'];
  const customer_segments = customers.map((c, i) => ({
    segment_record_id: i + 1,
    customer_id: c.customer_id,
    model_version: 'v1.4',
    segment_label: segLabels[i % segLabels.length],
    cluster_id: i % 6,
    lifetime_value_score: Math.round(c.annual_income * (0.08 + (i % 5) * 0.03)),
    churn_probability: Math.round(((i * 431) % 80 + 5)) / 100,
    computed_date: '2026-07-15',
  }));

  const credit_scores = customers.map((c, i) => {
    const cat = c.credit_score >= 800 ? 'EXCELLENT' : c.credit_score >= 740 ? 'VERY_GOOD' : c.credit_score >= 670 ? 'GOOD' : c.credit_score >= 580 ? 'FAIR' : 'POOR';
    return {
      score_id: i + 1,
      customer_id: c.customer_id,
      score_value: c.credit_score,
      score_source: i % 4 === 0 ? 'BUREAU' : 'INTERNAL_MODEL',
      model_version: 'v1.1',
      risk_category: cat,
      score_date: '2026-07-20',
    };
  });

  return {
    branches, employees, customers, accounts, transactions, loans, cards,
    fraud_alerts, loan_predictions, customer_segments, credit_scores,
    _next: {
      customer_id: customers.length + 1,
      account_id: accounts.length + 1,
      transaction_id: txId,
      loan_id: loans.length + 1,
    }
  };
}

function DB() {
  let raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const seeded = seedDatabase();
    localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
  return JSON.parse(raw);
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function resetDB() {
  localStorage.removeItem(DB_KEY);
  return DB();
}

/* ---------------------------------------------------------------------
   Auth
   --------------------------------------------------------------------- */
const DEMO_USERS = [
  { username: 'admin', password: 'admin123', name: 'Priya Sharma', role: 'Administrator' },
  { username: 'manager', password: 'manager123', name: 'Rohan Verma', role: 'Branch Manager' },
];

function login(username, password, remember) {
  const user = DEMO_USERS.find(u => u.username === username && u.password === password);
  if (!user) return false;
  const session = { name: user.name, role: user.role, username: user.username, loggedInAt: Date.now() };
  if (remember) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return true;
}

function getSession() {
  const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = 'login.html';
}

function requireAuth() {
  const session = getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

/* ---------------------------------------------------------------------
   Formatting helpers
   --------------------------------------------------------------------- */
function fmtINR(n) {
  if (n === null || n === undefined) return '—';
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
function fmtNum(n) {
  return Number(n).toLocaleString('en-IN');
}
function fmtPct(n) {
  return (Number(n) * 100).toFixed(1) + '%';
}
function fmtDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function initials(first, last) {
  return ((first || '')[0] || '').toUpperCase() + ((last || '')[0] || '').toUpperCase();
}

/* ---------------------------------------------------------------------
   Layout: sidebar + topbar injection
   --------------------------------------------------------------------- */
function renderShell(activeKey, pageTitle, eyebrow) {
  const session = requireAuth();
  if (!session) return null;

  const navHtml = NAV_ITEMS.map(item => `
    <li class="nav-item ${item.key === activeKey ? 'active' : ''}">
      <a href="${item.href}"><span class="nav-icon">${item.icon}</span>${item.label}</a>
    </li>`).join('');

  const shellHtml = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-mark">AIBank</span>
          <span class="brand-sub">Ledger</span>
        </div>
        <ul class="nav-list">${navHtml}</ul>
        <div class="sidebar-foot">Model v2.3 · Live<br>© 2026 AI Banking Analytics</div>
      </aside>
      <main class="main">
        <div class="topbar">
          <div>
            <div class="eyebrow">${eyebrow || ''}</div>
            <h1>${pageTitle}</h1>
          </div>
          <div class="topbar-right">
            <span class="pill pill-ok" id="sync-pill">SYNCED</span>
            <div class="user-chip">
              <div class="user-avatar">${initials(session.name.split(' ')[0], session.name.split(' ')[1])}</div>
              <div>
                <div style="font-weight:600;">${session.name}</div>
                <div class="muted" style="font-size:11px;">${session.role}</div>
              </div>
            </div>
          </div>
        </div>
        <div id="page-content"></div>
      </main>
    </div>
    <div class="toast" id="toast"></div>
  `;
  document.body.insertAdjacentHTML('afterbegin', shellHtml);
  return session;
}

function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

function pageContent() {
  return document.getElementById('page-content');
}
