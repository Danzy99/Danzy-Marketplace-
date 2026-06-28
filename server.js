const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Account = require('./models/Account');
const Transaction = require('./models/Transaction');

const app = express();
app.use(express.json());
app.use(cors());

// Konfigurasi Environment & Database[span_9](start_span)[span_9](end_span)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/danzymarket';
const JWT_SECRET = 'SUPER_SECRET_NEON_DANZY_2026';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Database Danzy Market Terhubung.'))
  .catch(err => console.error(err));

// ================= PUBLIC PLATFORM ROUTING =================

// Ambil Akun Sesuai Kategori Game (Data Sensitif Otomatis Dihapus Dari Respon JSON)[span_10](start_span)[span_10](end_span)
app.get('/api/marketplace/accounts', async (req, res) => {
  try {
    const { game } = req.query;
    const query = { status: 'AVAILABLE' };
    if (game) query.game = game;

    const data = await Account.find(query).select('-email_login -password_login');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Proses Pembuatan Invoice Otomatis[span_11](start_span)[span_11](end_span)[span_12](start_span)[span_12](end_span)
app.post('/api/marketplace/checkout', async (req, res) => {
  try {
    const { account_id, name, email, whatsapp, payment } = req.body;

    const targetAccount = await Account.findOne({ _id: account_id, status: 'AVAILABLE' });
    if (!targetAccount) return res.status(400).json({ success: false, message: 'Akun game tidak lagi tersedia.' });

    // Generate Invoice ID unik[span_13](start_span)[span_13](end_span)
    const invId = `DNZ-${Date.now().toString().slice(-5)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTransaction = new Transaction({
      invoice_id: invId,
      buyer: { name, email, whatsapp },
      game: targetAccount.game,
      account_id: targetAccount._id,
      harga: targetAccount.price,
      payment,
      status: 'PENDING'
    });

    await newTransaction.save();
    res.json({ success: true, invoice: newTransaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cek Pesanan / Detail Invoice[span_14](start_span)[span_14](end_span)[span_15](start_span)[span_15](end_span)
app.get('/api/marketplace/order/:invoice_id', async (req, res) => {
  try {
    const tx = await Transaction.findOne({ invoice_id: req.params.invoice_id }).populate('account_id');
    if (!tx) return res.status(404).json({ message: 'Invoice tidak ditemukan' });

    const payload = {
      invoice_id: tx.invoice_id,
      buyer: tx.buyer,
      game: tx.game,
      harga: tx.harga,
      payment: tx.payment,
      status: tx.status
    };

    // Keamanan Berlapis: Hanya kirim data login jika status PAID[span_16](start_span)[span_16](end_span)
    if (tx.status === 'PAID' || tx.status === 'SUCCESS') {
      payload.account_details = {
        email_login: tx.account_id.email_login,
        password_login: tx.account_id.password_login,
        login_info: tx.account_id.login_info
      };
    }
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= PAYMENT GATEWAY WEBHOOK[span_17](start_span)[span_17](end_span)[span_18](start_span)[span_18](end_span) =================
app.post('/api/webhook/payment-callback', async (req, res) => {
  try {
    const { invoice_id, status } = req.body; // Ekspektasi status: 'PAID[span_19](start_span)[span_20](start_span)'[span_19](end_span)[span_20](end_span)

    const tx = await Transaction.findOne({ invoice_id });
    if (!tx) return res.status(404).json({ message: 'Invoice tidak valid' });

    if (status === 'PAID' && tx.status === 'PENDING') {
      tx.status = 'PAID';
      await tx.save();

      // Perbarui status ketersediaan akun di marketplace[span_21](start_span)[span_21](end_span)[span_22](start_span)[span_22](end_span)
      await Account.findByIdAndUpdate(tx.account_id, { status: 'SOLD' });

      console.log(`[INSTANT DELIVERY] Akun Terjual otomatis pada invoice ${invoice_id}`);
      return res.json({ message: 'Auto-delivery terpicu berkat pembayaran tervalidasi.' });
    }
    res.json({ message: 'Status tidak berubah.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= PRIVATE ADMIN SYSTEM (HIDDEN ROUTE)[span_23](start_span)[span_23](end_span)[span_24](start_span)[span_24](end_span) =================

// Middleware Keamanan Validasi Token Admin JWT[span_25](start_span)[span_25](end_span)
const adminAuth = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Akses Dilarang!' });
  try {
    const verified = jwt.verify(token.split(' ')[1], JWT_SECRET);
    req.admin = verified;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token kedaluwarsa atau tidak sah.' });
  }
};

// Endpoint Login Rahasia Admin (Akses Manual via Postman/Client Endpoint)[span_26](start_span)[span_26](end_span)
app.post('/api/secret-admin-login', async (req, res) => {
  const { username, password } = req.body;
  // Kredensial Statis Sesuai Permintaan Dokumen[span_27](start_span)[span_27](end_span)
  if (username === 'admin' && password === 'rahasia') {
    const token = jwt.sign({ role: 'superadmin' }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ success: true, token });
  }
  res.status(400).json({ success: false, message: 'Kredensial Admin Salah!' });
});

// Admin Dashboard: Menambahkan Stok Akun Game Baru[span_28](start_span)[span_28](end_span)[span_29](start_span)[span_29](end_span)
app.post('/api/admin/accounts', adminAuth, async (req, res) => {
  try {
    const newAcc = new Account(req.body);
    await newAcc.save();
    res.json({ success: true, data: newAcc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Dashboard: Melihat Seluruh Data Transaksi yang Masuk[span_30](start_span)[span_30](end_span)[span_31](start_span)[span_31](end_span)
app.get('/api/admin/transactions', adminAuth, async (req, res) => {
  try {
    const list = await Transaction.find().sort({ tanggal: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend Server running on port ${PORT}`));

