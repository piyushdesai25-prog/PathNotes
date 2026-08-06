document.addEventListener('DOMContentLoaded', () => {
  const session = renderShell('profile', 'Profile', 'Account / Settings');
  if (!session) return;

  pageContent().innerHTML = `
    <div class="card-plain" style="max-width:520px; margin-bottom:18px;">
      <div class="flex" style="margin-bottom:20px; gap:14px;">
        <div class="user-avatar" style="width:52px;height:52px;font-size:18px;">${initials(session.name.split(' ')[0], session.name.split(' ')[1])}</div>
        <div>
          <h2 style="margin-bottom:2px;">${session.name}</h2>
          <div class="muted">${session.role}</div>
        </div>
      </div>
      <div class="form-grid">
        <div><div class="stat-label">Name</div><div>${session.name}</div></div>
        <div><div class="stat-label">Username</div><div class="mono">${session.username}</div></div>
        <div><div class="stat-label">Email</div><div>${session.username}@aibank.in</div></div>
        <div><div class="stat-label">Role</div><div>${session.role}</div></div>
      </div>
    </div>

    <div class="card-plain" style="max-width:520px;">
      <h3 class="mt-0">Change Password</h3>
      <div class="field"><label>Current password</label><input type="password" id="cp-current"></div>
      <div class="field"><label>New password</label><input type="password" id="cp-new"></div>
      <div class="field"><label>Confirm new password</label><input type="password" id="cp-confirm"></div>
      <button class="btn btn-primary" id="btn-change-pw">Update Password</button>
    </div>
  `;

  document.getElementById('btn-change-pw').addEventListener('click', () => {
    const cur = document.getElementById('cp-current').value;
    const next = document.getElementById('cp-new').value;
    const confirm = document.getElementById('cp-confirm').value;
    if (!cur || !next) { alert('Fill in all password fields.'); return; }
    if (next !== confirm) { alert('New password and confirmation do not match.'); return; }
    toast('Password updated');
    document.getElementById('cp-current').value = '';
    document.getElementById('cp-new').value = '';
    document.getElementById('cp-confirm').value = '';
  });
});
