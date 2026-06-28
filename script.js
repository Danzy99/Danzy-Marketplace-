// 1. MOCK DATABASE SCHEMA
let accountsCollection = [
  { id: "ACC-001", game: "Free Fire", image: "", title: "FF Sultan Rare Old", description: "Akun tua berkelas dari season 2. Koleksi bundle legendaris melimpah ruah cocok untuk kolektor game kompetitif.", level: 72, rank: "Heroic", skin: "Elite Pass S2, M1887 Rapper", price: 350000, email_login: "sultanff@gmail.com", password_login: "freefire2026", login_info: "Login FB, Akun aman jaminan 100%", status: "AVAILABLE" },
  { id: "ACC-002", game: "Mobile Legends", image: "", title: "MLBB Mythical Glory Full Skin KOF", description: "Winrate gagah mantap 68%. All skin KOF komplit skin prime aman terkendali tinggal main langsung di ranked tier tinggi.", level: 90, rank: "Mythical Glory", skin: "Skin Chou KOF, Gusion Cosmic", price: 750000, email_login: "mlbbkof@gmail.com", password_login: "kofprime99", login_info: "Login Moonton Sepaket Email", status: "AVAILABLE" },
  { id: "ACC-003", game: "Valorant", image: "", title: "Valorant Diamond Kuronami Vandal", description: "bundle premium kuronami vandal max upgrade skin mevvah efek suara gokil abis siap tempur di server kompetitif asia.", level: 45, rank: "Diamond 3", skin: "Kuronami Vandal, Reaver Knife", price: 520000, email_login: "valorkuro@gmail.com", password_login: "vandal2026", login_info: "Riot Games ID Login Instan", status: "AVAILABLE" },
  { id: "ACC-004", game: "Roblox", image: "", title: "Roblox Korblox & Headless Account", description: "Akun Sultan Roblox berisikan bundle sultan paling dicari Korblox Deathspeaker dan Headless Horseman siap pamer.", level: 120, rank: "Premium Member", skin: "Headless, Korblox Leg, Limited Accessories", price: 1250000, email_login: "robloxsultan@gmail.com", password_login: "robloxrich", login_info: "Login Username Roblox, bypass pin aktif", status: "AVAILABLE" },
  { id: "ACC-005", game: "PUBG Mobile", image: "", title: "PUBGM Glacier M416 Max Level", description: "Efek loot crate es membeku m416 glacier level max paling ikonik di pubg mobile beserta setelan jubah mitik keren.", level: 68, rank: "Ace Master", skin: "M416 Glacier Max, Pharaoh Set", price: 890000, email_login: "pubgmglacier@gmail.com", password_login: "glacierice", login_info: "Login Link Twitter Bersih", status: "AVAILABLE" }
];

let transactionsCollection = [
  { invoice: "INV-1001", buyer: "Budi Santoso (08123456789)", account: "ACC-001", price: 350000, payment: "QRIS", status: "SUCCESS", created_at: "2026-06-28 12:00" }
];

const targetGames = [
  { name: "Free Fire", icon: "🔥" },
  { name: "Mobile Legends", icon: "⚔️" },
  { name: "Roblox", icon: "🎮" },
  { name: "PUBG Mobile", icon: "🎯" },
  { name: "Valorant", icon: "💎" }
];

let logoClicks = 0;
let selectedPaymentMethod = 'QRIS';

// 2. LIFECYCLE INITIALIZER
window.addEventListener('DOMContentLoaded', () => {
  renderCategories();
  renderHomeAccounts();
});

// 3. SPA ROUTING ENGINE
function showPage(pageId, element = null) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const activePage = document.getElementById(`page-${pageId}`);
  if(activePage) activePage.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if(element) element.classList.add('active');
  
  closeMobileMenu();
  window.scrollTo(0, 0);
}

function toggleMobileMenu() {
  document.getElementById('navLinks').classList.toggle('mobile-open');
}

function closeMobileMenu() {
  document.getElementById('navLinks').classList.remove('mobile-open');
}

function openSupport() {
  window.open('https://wa.me/6281234567890?text=Halo%20Danzy%20Market.', '_blank');
}

function handleLogoClick() {
  logoClicks++;
  if(logoClicks >= 5) {
    logoClicks = 0;
    showPage('admin-login');
    alert("Portal Admin Tersembunyi Terbuka!");
  }
}

// 4. RENDER PROCEDURES
function renderCategories() {
  const container = document.getElementById('homeCategories');
  if(!container) return;
  container.innerHTML = '';
  targetGames.forEach(g => {
    container.innerHTML += `
      <div class="category-card glass-panel smooth" onclick="loadGameCatalog('${g.name}')">
        <span class="category-icon">${g.icon}</span>
        <span class="category-name">${g.name}</span>
      </div>
    `;
  });
}

function renderHomeAccounts() {
  const container = document.getElementById('featuredAccounts');
  if(!container) return;
  container.innerHTML = '';
  const available = accountsCollection.filter(a => a.status === 'AVAILABLE');
  
  if(available.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted)">Semua akun sedang habis terjual.</p>`;
    return;
  }

  available.slice(0, 4).forEach(a => {
    container.innerHTML += createAccountCardMarkup(a);
  });
}

function createAccountCardMarkup(a) {
  return `
    <div class="account-card glass-panel smooth">
      <div class="account-img-wrapper">
        <div class="account-img-placeholder">DANZY MARKET IMAGE</div>
        <span class="game-badge">${a.game}</span>
      </div>
      <div class="account-info">
        <h3 class="account-title">${a.title}</h3>
        <ul class="account-specs">
          <li>LV: <strong>${a.level}</strong></li>
          <li>Rank: <strong>${a.rank}</strong></li>
          <li style="grid-column: 1/-1">Skin: <strong>${a.skin.substring(0, 24)}...</strong></li>
        </ul>
        <div class="account-footer">
          <span class="account-price">Rp ${a.price.toLocaleString('id-ID')}</span>
          <button class="detail-btn smooth" onclick="loadAccountDetail('${a.id}')">LIHAT DETAIL</button>
        </div>
      </div>
    </div>
  `;
}

function loadGameCatalog(gameName) {
  const grid = document.getElementById('catalogGrid');
  document.getElementById('catalogTitle').innerText = `Katalog Akun ${gameName}`;
  grid.innerHTML = '';
  
  const filtered = accountsCollection.filter(a => a.game.toLowerCase() === gameName.toLowerCase());
  
  if(filtered.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">Belum ada stock akun tersedia untuk kategori game ini.</p>`;
  } else {
    filtered.forEach(a => grid.innerHTML += createAccountCardMarkup(a));
  }
  showPage('game');
}

// 5. DETAIL ACCOUNT & CHECKOUT FLOW
function loadAccountDetail(accountId) {
  const target = accountsCollection.find(a => a.id === accountId);
  if(!target) return;

  const container = document.getElementById('detailContainer');
  container.innerHTML = `
    <div class="detail-main-panel glass-panel">
      <div class="detail-gallery">SS / SCREENSHOT GALERI AKUN : ${target.title}</div>
      <h2 style="font-family: 'Orbitron', sans-serif; margin-bottom: 8px;">${target.title}</h2>
      <span class="game-badge" style="position: static; display: inline-block; margin-bottom: 16px;">${target.game}</span>
      
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0;">
        <div style="background: var(--bg-input); padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 11px; color: var(--text-muted)">LEVEL</div>
          <div style="font-weight: 700; color: #fff;">${target.level}</div>
        </div>
        <div style="background: var(--bg-input); padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 11px; color: var(--text-muted)">RANK</div>
          <div style="font-weight: 700; color: #fff;">${target.rank}</div>
        </div>
        <div style="background: var(--bg-input); padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 11px; color: var(--text-muted)">STATUS</div>
          <div style="font-weight: 700; color: var(--neon-cyan);">${target.status}</div>
        </div>
      </div>

      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;"><strong>Skins/Items Detail:</strong> ${target.skin}</p>
      <div class="detail-description">
        <strong>Deskripsi Produk:</strong><br>${target.description}
      </div>
      <p style="color: var(--neon-orange); font-size: 11px; margin-top: 20px; font-weight: 600;">⚠️ DATA LOGIN AKUN RAHASIA AKAN OTOMATIS TERKIRIM DAN TERBUKA SETELAH PEMBAYARAN DIKONFIRMASI OLEH SISTEM GATEWAY.</p>
    </div>

    <div class="checkout-sidebar glass-panel">
      <div class="sidebar-title">Secure Billing Checkout</div>
      <div class="form-group">
        <label>Nama Pembeli</label>
        <input type="text" id="buyerName" class="form-input" placeholder="Masukkan nama Anda">
      </div>
      <div class="form-group">
        <label>Email Aktif</label>
        <input type="email" id="buyerEmail" class="form-input" placeholder="pembeli@gmail.com">
      </div>
      <div class="form-group">
        <label>Nomor WhatsApp</label>
        <input type="text" id="buyerWA" class="form-input" placeholder="08XXXXXXXXXX">
      </div>

      <label class="form-group label" style="display:block; margin-bottom: 6px; font-size:11px; color: var(--text-muted);">Pilih Pembayaran Gateway</label>
      <div class="payment-options">
        <div class="payment-method selected" id="pm-QRIS" onclick="selectPayment('QRIS')"><span>🔳 QRIS (Instan Link Otoris)</span></div>
        <div class="payment-method" id="pm-DANA" onclick="selectPayment('DANA')"><span>💙 DANA Wallet</span></div>
        <div class="payment-method" id="pm-E-Wallet" onclick="selectPayment('E-Wallet')"><span>📱 E-Wallet OVO / ShopeePay</span></div>
      </div>

      <div class="price-checkout-row">
        <span style="font-size: 13px; color: var(--text-muted);">Harga Produk</span>
        <span style="font-family: 'Orbitron', sans-serif; font-size: 20px; font-weight: 900; color: var(--neon-cyan)">Rp ${target.price.toLocaleString('id-ID')}</span>
      </div>

      <button class="buy-now-btn" onclick="executeOrderProcess('${target.id}')">BELI SEKARANG ⚡</button>
    </div>
  `;
  
  selectedPaymentMethod = 'QRIS';
  showPage('detail');
}

function selectPayment(pmId) {
  selectedPaymentMethod = pmId;
  document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
  document.getElementById(`pm-${pmId}`).classList.add('selected');
}

function executeOrderProcess(accountId) {
  const name = document.getElementById('buyerName').value.trim();
  const email = document.getElementById('buyerEmail').value.trim();
  const wa = document.getElementById('buyerWA').value.trim();
  
  if(!name || !email || !wa) {
    alert("Harap lengkapi formulir informasi data pembeli!");
    return;
  }

  const acc = accountsCollection.find(a => a.id === accountId);
  if(acc.status !== 'AVAILABLE') {
    alert("Maaf, akun ini tidak lagi tersedia.");
    return;
  }

  const invId = "INV-" + Math.floor(1000 + Math.random() * 9000);
  const newTx = {
    invoice: invId,
    buyer: `${name} (${wa})`,
    account: accountId,
    price: acc.price,
    payment: selectedPaymentMethod,
    status: "PENDING",
    created_at: new Date().toISOString().slice(0,16).replace('T',' ')
  };

  acc.status = "RESERVED";
  transactionsCollection.push(newTx);
  
  alert(`Invoice ${invId} Berhasil Dibuat Otomatis!`);
  
  document.getElementById('searchInvoiceInput').value = invId;
  handleInvoiceSearch();
  showPage('order');
}

// 6. CHECK ORDER ENGINE
function handleInvoiceSearch() {
  const invId = document.getElementById('searchInvoiceInput').value.trim();
  const output = document.getElementById('orderResultArea');
  
  const tx = transactionsCollection.find(t => t.invoice.toLowerCase() === invId.toLowerCase());
  if(!tx) {
    output.innerHTML = `<p style="text-align: center; color: red;">Nomor Invoice ${invId} tidak ditemukan.</p>`;
    return;
  }

  const targetAcc = accountsCollection.find(a => a.id === tx.account);

  let deliveryMarkup = '';
  if(tx.status === 'SUCCESS' || tx.status === 'PAID') {
    deliveryMarkup = `
      <div class="delivery-box">
        <h3 style="font-family: 'Orbitron', sans-serif; color: var(--neon-cyan); margin-bottom: 12px; font-size:16px;">🚀 PEMBELIAN BERHASIL (AUTO-DELIVERY)</h3>
        <p style="font-size:12px; margin-bottom:12px; color: var(--text-muted)">Gunakan kredensial otentikasi di bawah ini untuk mengakses akun game Anda:</p>
        <div class="credential-row"><span>Email Login:</span> <strong>${targetAcc.email_login}</strong></div>
        <div class="credential-row"><span>Password Login:</span> <strong>${targetAcc.password_login}</strong></div>
        <div class="credential-row"><span>Petunjuk Akses:</span> <span style="font-size:12px;">${targetAcc.login_info}</span></div>
      </div>
    `;
  } else {
    deliveryMarkup = `
      <div style="background: rgba(255,108,0,0.05); border: 1px dashed var(--neon-orange); padding: 16px; border-radius: 8px; margin-top:20px; text-align:center;">
        <p style="font-size:13px; color: var(--neon-orange)">Menunggu pembayaran terdeteksi di modul Payment Gateway webhook.</p>
        <p style="font-size:11px; color: var(--text-muted); margin-top:6px;">[Simulasi Pro] Silakan buka konsol Admin Rahasia untuk menembakkan Webhook PAID.</p>
      </div>
    `;
  }

  output.innerHTML = `
    <div class="glass-panel order-result-panel">
      <div class="invoice-header">
        <div>
          <h3 style="font-family:'Orbitron',sans-serif;">${tx.invoice}</h3>
          <span style="font-size:12px; color: var(--text-muted)">Waktu: ${tx.created_at}</span>
        </div>
        <span class="status-badge ${tx.status === 'SUCCESS' ? 'status-success' : 'status-pending'}">${tx.status}</span>
      </div>
      
      <div style="font-size:14px; display:flex; flex-direction:column; gap:8px;">
        <div>Pembeli: <strong>${tx.buyer}</strong></div>
        <div>Item Pembelian: <strong>${targetAcc.game} — ${targetAcc.title}</strong></div>
        <div>Metode Gateway: <strong>${tx.payment}</strong></div>
        <div style="margin-top:8px; font-size:16px;">Total Tagihan: <strong style="color:var(--neon-orange)">Rp ${tx.price.toLocaleString('id-ID')}</strong></div>
      </div>

      ${deliveryMarkup}
    </div>
  `;
}

function toggleFaq(el) {
  el.classList.toggle('open');
}

// 7. ADMIN PRIVATE CONTROL PANEL
function handleAdminLogin() {
  const u = document.getElementById('admUser').value;
  const p = document.getElementById('admPass').value;
  if(u === 'admin' && p === 'rahasia') {
    showPage('admin-dashboard');
    renderAdminManageTable();
    renderAdminTxTable();
  } else {
    alert("Kredensial Admin Salah!");
  }
}

function switchAdminTab(tabId) {
  document.querySelectorAll('.admin-menu-item').forEach(m => m.classList.remove('active'));
  document.querySelectorAll('.admin-content-section').forEach(s => s.classList.remove('active'));
  
  document.getElementById(`tabBtn-${tabId}`).classList.add('active');
  document.getElementById(`admin-sec-${tabId}`).classList.add('active');
}

function adminSubmitAccount() {
  const game = document.getElementById('addGame').value;
  const title = document.getElementById('addTitle').value.trim();
  const level = parseInt(document.getElementById('addLevel').value) || 0;
  const rank = document.getElementById('addRank').value.trim();
  const skin = document.getElementById('addSkin').value.trim();
  const price = parseInt(document.getElementById('addPrice').value) || 0;
  const description = document.getElementById('addDesc').value.trim();
  const email_login = document.getElementById('addEmail').value.trim();
  const password_login = document.getElementById('addPass').value.trim();
  const login_info = document.getElementById('addLoginInfo').value.trim();

  if(!title || !price || !email_login || !password_login) {
    alert("Semua data mandatori wajib diisi!");
    return;
  }

  const id = "ACC-00" + (accountsCollection.length + 1);
  const newAcc = { id, game, image: "", title, description, level, rank, skin, price, email_login, password_login, login_info, status: "AVAILABLE" };
  
  accountsCollection.push(newAcc);
  alert("Akun berhasil tersimpan!");
  
  document.getElementById('addTitle').value = '';
  document.getElementById('addPrice').value = '';
  document.getElementById('addEmail').value = '';
  
  renderAdminManageTable();
  renderHomeAccounts();
}

function renderAdminManageTable() {
  const tbody = document.getElementById('adminManageTableBody');
  if(!tbody) return;
  tbody.innerHTML = '';
  accountsCollection.forEach(a => {
    tbody.innerHTML += `
      <tr>
        <td>${a.game}</td>
        <td><strong>${a.title}</strong></td>
        <td>Rp ${a.price.toLocaleString('id-ID')}</td>
        <td><span style="color:${a.status === 'AVAILABLE' ? 'var(--neon-cyan)' : 'gray'}">${a.status}</span></td>
        <td>
          <button class="action-badge-btn danger" onclick="adminDeleteAccount('${a.id}')">Hapus</button>
        </td>
      </tr>
    `;
  });
}

function adminDeleteAccount(id) {
  accountsCollection = accountsCollection.filter(a => a.id !== id);
  renderAdminManageTable();
  renderHomeAccounts();
}

function renderAdminTxTable() {
  const tbody = document.getElementById('adminTxTableBody');
  if(!tbody) return;
  tbody.innerHTML = '';
  transactionsCollection.forEach(t => {
    const isPending = t.status === 'PENDING';
    tbody.innerHTML += `
      <tr>
        <td><strong>${t.invoice}</strong></td>
        <td>${t.buyer}</td>
        <td>${t.account}</td>
        <td>Rp ${t.price.toLocaleString('id-ID')}</td>
        <td>${t.status}</td>
        <td>
          ${isPending ? `<button class="action-badge-btn" style="border-color:var(--neon-cyan); color:var(--neon-cyan);" onclick="triggerMockWebhookPaid('${t.invoice}')">Simulasi Webhook PAID</button>` : '—'}
        </td>
      </tr>
    `;
  });
}

function triggerMockWebhookPaid(invoiceId) {
  const tx = transactionsCollection.find(t => t.invoice === invoiceId);
  if(!tx) return;

  tx.status = "SUCCESS";
  const targetAcc = accountsCollection.find(a => a.id === tx.account);
  if(targetAcc) {
    targetAcc.status = "SOLD";
  }

  alert(`[WEBHOOK] Status ${invoiceId} sukses diubah ke PAID. Akun otomatis dikirim.`);
  renderAdminTxTable();
  renderAdminManageTable();
  renderHomeAccounts();
}
