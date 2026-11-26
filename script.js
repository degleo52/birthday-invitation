// ================= 1. KONFIGURASI FIREBASE DATABASE =================
const FIREBASE_URL = "https://party-invitation-bfd26-default-rtdb.asia-southeast1.firebasedatabase.app/rsvp.json";
const LOCAL_KEY = "sweet17_tiktok_guestbook_2026";

// ================= 2. BUKA SAMPUL & KONTROL MUSIK =================
const bgMusic = document.getElementById('bgMusic');
const musicIcon = document.getElementById('musicIcon');
const musicText = document.getElementById('musicText');
let isPlaying = false;

function updateMusicUI(playing) {
  isPlaying = playing;
  musicIcon.textContent = playing ? '🔊' : '🔇';
  musicText.textContent = playing ? 'Musik Aktif' : 'Musik Dijeda';
}

function bukaUndangan() {
  const flash = document.getElementById('whiteFlash');
  if (flash) flash.classList.add('flash');

  setTimeout(() => {
    document.getElementById('coverScreen').classList.add('opened');
    document.getElementById('mainApp').classList.add('visible');
    document.getElementById('floatingControls').classList.add('visible');
    if (flash) flash.classList.remove('flash');
  }, 260);

  bgMusic.volume = 0.7;
  bgMusic.play()
    .then(() => updateMusicUI(true))
    .catch(() => updateMusicUI(false));
}

function toggleMusic() {
  if (isPlaying) {
    bgMusic.pause();
    updateMusicUI(false);
  } else {
    bgMusic.play().then(() => updateMusicUI(true));
  }
}

// ================= 3. PARAMETER URL DINAMIS (?to=...) =================
const urlParams = new URLSearchParams(window.location.search);
const paramNama = urlParams.get('to') || urlParams.get('nama');
const paramOrg  = urlParams.get('instansi') || urlParams.get('org');

if (paramNama) {
  document.getElementById('coverNama').textContent = paramNama;
  document.getElementById('nama').value = paramNama;
}
if (paramOrg) {
  document.getElementById('coverInstansi').textContent = paramOrg;
  document.getElementById('instansi').value = paramOrg;
}

// ================= 4. COUNTDOWN TIMER REAL-TIME =================
const targetDate = new Date("December 19, 2026 18:30:00").getTime();

setInterval(() => {
  const distance = targetDate - Date.now();
  if (distance <= 0) return;

  document.getElementById("days").textContent = String(Math.floor(distance / 86400000)).padStart(2, '0');
  document.getElementById("hours").textContent = String(Math.floor((distance % 86400000) / 3600000)).padStart(2, '0');
  document.getElementById("minutes").textContent = String(Math.floor((distance % 3600000) / 60000)).padStart(2, '0');
  document.getElementById("seconds").textContent = String(Math.floor((distance % 60000) / 1000)).padStart(2, '0');
}, 1000);

// ================= 5. COPY TO CLIPBOARD & TOAST =================
function copyText(text, message) {
  navigator.clipboard.writeText(text)
    .then(() => showToast(message))
    .catch(() => {
      const temp = document.createElement('input');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      showToast(message);
    });
}

function showToast(msg) {
  const toast = document.getElementById('toastNotif');
  toast.textContent = "✅ " + msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ================= 6. SCROLL ANIMATION =================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ================= 7. RSVP & LIVE GUESTBOOK (FIREBASE) =================
const form = document.getElementById('rsvpForm');
const btnSubmit = document.getElementById('btnSubmit');
const alertBox = document.getElementById('alertBox');
const guestbookList = document.getElementById('guestbookList');
const guestCount = document.getElementById('guestCount');

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function renderGuestbook(entries) {
  if (!entries || entries.length === 0) {
    guestCount.textContent = "0 Ucapan";
    guestbookList.innerHTML = '<p class="empty-msg">Belum ada ucapan. Jadilah yang pertama mengirim doa!</p>';
    return;
  }

  guestCount.textContent = `${entries.length} Ucapan`;
  guestbookList.innerHTML = entries.map(item => `
    <div class="wish-item">
      <div class="wish-top">
        <div>
          <strong>${escapeHTML(item.nama)}</strong>
          <span class="wish-org"> • ${escapeHTML(item.instansi || '')}</span>
        </div>
        <span class="wish-badge ${item.kehadiran === 'Hadir' ? 'hadir' : 'tidak'}">
          ${escapeHTML(item.kehadiran)}
        </span>
      </div>
      <p class="wish-text">${escapeHTML(item.pesan)}</p>
      <small class="wish-time">${escapeHTML(item.waktu || '')}</small>
    </div>
  `).join('');
}

function loadGuestbook() {
  fetch(FIREBASE_URL)
    .then(res => res.json())
    .then(data => {
      const entries = data ? Object.values(data).reverse() : [];
      localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
      renderGuestbook(entries);
    })
    .catch(() => {
      renderGuestbook(JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"));
    });
}

form.addEventListener('submit', function(e) {
  e.preventDefault();
  btnSubmit.disabled = true;
  btnSubmit.textContent = "Menyimpan...";
  alertBox.style.display = "none";

  const dataTamu = {
    nama: document.getElementById('nama').value.trim(),
    instansi: document.getElementById('instansi').value.trim(),
    kehadiran: document.getElementById('kehadiran').value,
    pesan: document.getElementById('pesan').value.trim(),
    waktu: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
  };

  const localData = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  localData.unshift(dataTamu);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(localData));

  fetch(FIREBASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dataTamu)
  })
  .then(res => {
    if (!res.ok) throw new Error();
    return res.json();
  })
  .then(() => {
    alertBox.className = "alert-box success";
    alertBox.textContent = "✅ Terima kasih! Konfirmasi & ucapan Anda berhasil tersimpan.";
    alertBox.style.display = "block";
    document.getElementById('pesan').value = "";
    loadGuestbook();
  })
  .catch(() => {
    renderGuestbook(localData);
    alertBox.className = "alert-box success";
    alertBox.textContent = "✅ Ucapan Anda berhasil tersimpan.";
    alertBox.style.display = "block";
  })
  .finally(() => {
    btnSubmit.disabled = false;
    btnSubmit.textContent = "Kirim Konfirmasi";
  });
});

loadGuestbook();