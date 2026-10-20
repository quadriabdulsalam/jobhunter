document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('studio-status');
  const profileEl = document.getElementById('profile-name');

  try {
    const res = await fetch('http://localhost:3000/api/profile');
    if (res.ok) {
      const data = await res.json();
      statusEl.className = 'badge';
      statusEl.innerHTML = '<span class="dot"></span> Online';
      profileEl.textContent = data.profile?.contact?.name || 'Profile Loaded';
    } else {
      statusEl.className = 'badge offline';
      statusEl.innerHTML = '<span class="dot"></span> Needs Setup';
      profileEl.textContent = 'No Profile Yet';
    }
  } catch {
    statusEl.className = 'badge offline';
    statusEl.innerHTML = '<span class="dot"></span> Offline';
    profileEl.textContent = 'Server not running';
  }
});
