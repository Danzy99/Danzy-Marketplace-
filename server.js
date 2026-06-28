
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors());

// Koneksi ke MongoDB
mongoose.connect('mongodb://localhost:27017/danzymarket')
  .then(() => console.log('Terhubung ke MongoDB DanzyMarket'))
  .catch(err => console.error('Gagal koneksi database:', err));

// Kunci Rahasia Admin (Ubah sesuai kebutuhan)
const ADMIN_SECRET = 'DANZY_ADMIN_SECRET_2026';

// ════════════════ MONGODB SCHEMAS ════════════════

// Schema untuk Akun Game yang dijual
const AccountSchema = new mongoose.Schema({
  game: { type: String, required: true }, // MLBB, PUBG, VALORANT, FF, dll.
  title: { type: String, required: true }, // Contoh: "Mythic Glory 100 Skin Max"
  price: { type: Number, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  loginInfo: { type: String, required: true }, // Login via Moonton, Gmail, Riot, dll.
  notes: { type: String, default: '' },
  status: { type: String, enum: ['AVAILABLE', 'SOLD'], default: 'AVAILABLE' }
}, { timestamps: true });

const Account = mongoose.model('Account', AccountSchema);

// Schema untuk Transaksi / Invoice Pembayaran
const TransactionSchema = new mongoose.Schema({
  invoiceId: { type: String, unique: true, required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  customerEmail: { type: String, required: true },
  paymentMethod: { type: String, enum: ['QRIS', 'DANA', 'E-WALLET'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'PAID', 'EXPIRED'], default: 'PENDING' }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', TransactionSchema);


// ════════════════ API MARKETPLACE ════════════════

// 1. Ambil list semua akun yang bersetatus AVAILABLE (Sembunyikan kredensial rahasia)
app.get('/api/marketplace/accounts', async (req, res) => {
  try {
    const accounts = await Account.find({ status: 'AVAILABLE' })
      .select('-email -password -loginInfo -notes'); // PROTEKSI AMAN: Sembunyikan data sensitif
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// 2. Proses Checkout & Buat Invoice Unik
app.post('/api/marketplace/checkout', async (req, res) => {
  try {
    const { accountId, customerEmail, paymentMethod } = req.body;

    const account = await Account.findOne({ _id: accountId, status: 'AVAILABLE' });
    if (!account) return res.status(404).json({ message: 'Akun game tidak tersedia atau sudah terjual!' });

    // Generate Invoice unik (Contoh: DNZ-20260628-XXXX)
    const uniqueHash = crypto.randomBytes(3).toString('hex').toUpperCase();
    const invoiceId = `DNZ-${Date.now().toString().slice(-6)}-${uniqueHash}`;

    const transaction = new Transaction({
      invoiceId,
      accountId: account._id,
      customerEmail,
      paymentMethod,
      amount: account.price,
      status: 'PENDING'
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Invoice berhasil dibuat',
      invoiceId,
      amount: transaction.amount,
      paymentMethod,
      // Simulasi data bayar (Misal string QRIS otomatis)
      paymentQrData: paymentMethod === 'QRIS' ? `00020101021226380010ID.CO.QRIS.WWW011893600522011893600522510200520400005303360540${transaction.amount}5802ID` : null
    });

  } catch (error) {
    res.status(500).json({ message: 'Gagal memproses checkout' });
  }
});

// 3. Ambil Detail Invoice (Hanya tampilkan Password & Kredensial JIKA Status = PAID)
app.get('/api/marketplace/invoice/:invoiceId', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ invoiceId: req.params.invoiceId }).populate('accountId');
    if (!transaction) return res.status(404).json({ message: 'Invoice tidak ditemukan' });

    const invoiceData = {
      invoiceId: transaction.invoiceId,
      game: transaction.accountId.game,
      title: transaction.accountId.title,
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod,
      status: transaction.status,
      customerEmail: transaction.customerEmail
    };

    // JIKA LUNAS: Lakukan Auto-Delivery kredensial login akun
    if (transaction.status === 'PAID') {
      invoiceData.delivery = {
        email: transaction.accountId.email,
        password: transaction.accountId.password,
        loginInfo: transaction.accountId.loginInfo,
        notes: transaction.accountId.notes
      };
    } else {
      invoiceData.delivery = { message: "🔒 Kredensial terkunci. Selesaikan pembayaran terlebih dahulu." };
    }

    res.json(invoiceData);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data invoice' });
  }
});


// ════════════════ WEBHOOK SYSTEM ════════════════

// Webhook Callback dari Payment Gateway Simulator
app.post('/api/webhook/payment-callback', async (req, res) => {
  try {
    const { invoiceId, status } = req.body; // Status yang diharapkan: 'PAID' atau 'PENDING'

    const transaction = await Transaction.findOne({ invoiceId });
    if (!transaction) return res.status(404).json({ message: 'Invoice tidak valid' });

    if (status === 'PAID' && transaction.status !== 'PAID') {
      // 1. Ambil akun game yang dipesan
      const account = await Account.findById(transaction.accountId);
      
      if (account && account.status === 'AVAILABLE') {
        // 2. Ubah status akun menjadi SOLD
        account.status = 'SOLD';
        await account.save();

        // 3. Ubah status transaksi menjadi PAID
        transaction.status = 'PAID';
        await transaction.save();

        console.log(`[WEBHOOK SUCCESS] Invoice ${invoiceId} berhasil diproses otomatis. Status akun diubah ke SOLD.`);
        return res.json({ success: true, message: 'Callback Berhasil, produk otomatis terkirim!' });
      } else {
        return res.status(400).json({ message: 'Akun game sudah tidak tersedia lagi' });
      }
    }

    res.json({ success: true, message: 'Status pembayaran dipertahankan (PENDING/NO CHANGE)' });
  } catch (error) {
    res.status(500).json({ message: 'Sistem webhook error' });
  }
});


// ════════════════ SYSTEM ADMIN PANEL ════════════════

// Middleware Proteksi Admin Tervalidasi
const verifyAdmin = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  if (token === ADMIN_SECRET) {
    next();
  } else {
    res.status(403).json({ message: 'Akses Ditolak! Proteksi Admin Tidak Valid.' });
  }
};

// Admin: Upload / Tambah Stok Akun Baru
app.post('/api/admin/accounts', verifyAdmin, async (req, res) => {
  try {
    const newAccount = new Account(req.body);
    await newAccount.save();
    res.json({ success: true, message: 'Akun game berhasil ditambahkan ke database!', data: newAccount });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengupload akun game' });
  }
});

// Admin: Lihat Semua Histori Transaksi & Pembayaran
app.get('/api/admin/transactions', verifyAdmin, async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('accountId').sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat daftar transaksi' });
  }
});

// Admin: Lihat Semua Stok Akun (Termasuk yang Terjual & Password Lengkap)
app.get('/api/admin/accounts', verifyAdmin, async (req, res) => {
  try {
    const allAccounts = await Account.find().sort({ createdAt: -1 });
    res.json(allAccounts);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat database stok' });
  }
});

// Jalankan Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server Danzy Market running on port ${PORT}`));
