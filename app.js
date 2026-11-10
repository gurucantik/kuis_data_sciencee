// --- KONFIGURASI FIREBASE ANDA ---
const firebaseConfig = {
    apiKey: "MASUKKAN_API_KEY_ANDA_DISINI",
    authDomain: "MASUKKAN_AUTH_DOMAIN_ANDA_DISINI",
    projectId: "MASUKKAN_PROJECT_ID_ANDA_DISINI",
    storageBucket: "MASUKKAN_STORAGE_BUCKET_ANDA_DISINI",
    messagingSenderId: "MASUKKAN_MESSAGING_SENDER_ID_ANDA_DISINI",
    appId: "MASUKKAN_APP_ID_ANDA_DISINI"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentUser = { id: '', nama: '', nim: '', score: 0, rank: 0 };
let currentQuestionIndex = 0;
let userScore = 0;
let currentCertDataUrl = ""; // Variabel untuk menyimpan gambar sertifikat hasil render

let timerInterval;
const TIME_LIMIT = 15;
let timeLeft = TIME_LIMIT;

const questions = [
    { q: "Apa yang dimaksud dengan data berdasarkan konsep Data Science?", options: ["Informasi yang sudah siap pakai", "Sekumpulan fakta, angka, atau simbol hasil pengamatan", "Hasil akhir dari laporan penelitian", "Program komputer untuk mengolah sistem"], answer: 1 },
    { q: "Berikut ini yang merupakan contoh dari data berbentuk angka adalah...", options: ["Nama dan alamat rumah", "Foto kegiatan sekolah", "Nilai ujian dan tinggi badan", "Video rekaman pembelajaran"], answer: 2 },
    { q: "Bidang ilmu yang mempelajari cara mengumpulkan, mengolah, menganalisis, dan memahami data disebut...", options: ["Data Science", "Web Development", "Software Engineering", "Artificial Intelligence"], answer: 0 },
    { q: "Manakah urutan 4 tahapan yang benar dalam Data Science?", options: ["Mengolah - Menganalisis - Mengumpulkan - Memahami", "Mengumpulkan - Mengolah - Menganalisis - Memahami", "Menganalisis - Memahami - Mengolah - Mengumpulkan", "Memahami - Mengumpulkan - Menganalisis - Mengolah"], answer: 1 },
    { q: "Tahap di mana data dibersihkan, disusun dalam tabel, dan diperbaiki bila ada kesalahan penulisan disebut tahap...", options: ["Mengumpulkan", "Mengolah", "Menganalisis", "Memahami"], answer: 1 },
    { q: "Data yang berbentuk angka dan dapat dihitung atau diukur (contoh: tinggi badan 165 cm), disebut...", options: ["Data Kategorikal", "Data Tidak Terstruktur", "Data Numerik", "Data Terstruktur"], answer: 2 },
    { q: "Data seperti jurusan (Teknik Komputer dan Jaringan), jenis kelamin, dan warna kesukaan termasuk jenis...", options: ["Data Kategorikal", "Data Numerik", "Data Terstruktur", "Data Tidak Terstruktur"], answer: 0 },
    { q: "Data yang disusun rapi dalam bentuk tabel, baris, dan kolom (misalnya di aplikasi Excel) disebut...", options: ["Data Tidak Terstruktur", "Data Kategorikal", "Data Numerik", "Data Terstruktur"], answer: 3 },
    { q: "Foto kegiatan sekolah, video, dan rekaman suara merupakan contoh dari...", options: ["Data Terstruktur", "Data Numerik", "Data Tidak Terstruktur", "Data Kategorikal"], answer: 2 },
    { q: "Bagaimana toko online (e-commerce) memanfaatkan data penjualan sehari-hari?", options: ["Mencatat suhu prakiraan cuaca", "Mengetahui produk terlaris dan kapan stok ditambah", "Mencari teman baru di media sosial", "Mengetahui siswa yang butuh bimbingan"], answer: 1 }
];

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function startQuiz() {
    const nama = document.getElementById('nama').value.trim();
    const nim = document.getElementById('nim').value.trim();
    
    if (!nama || !nim) {
        alert("Nama dan NIM/NIS harus diisi untuk memulai!");
        return;
    }
    
    // Set ID unik berbasis string agar kompatibel dengan Firestore ID dokumen
    currentUser.id = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    currentUser.nama = nama;
    currentUser.nim = nim;
    currentQuestionIndex = 0;
    userScore = 0;
    
    showPage('quiz-page');
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        finishQuiz();
        return;
    }

    const q = questions[currentQuestionIndex];
    // Menampilkan skor per soal (10 Poin)
    document.getElementById('question-count').innerHTML = `Soal ${currentQuestionIndex + 1} / ${questions.length} <br><small style="color:#0066cc; font-size:12px;">(Nilai: 10 Poin)</small>`;
    document.getElementById('question-text').innerText = q.q;
    document.getElementById('score-display').innerText = `Skor: ${userScore}`;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => selectAnswer(idx);
        optionsContainer.appendChild(btn);
    });

    startTimer();
}

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = TIME_LIMIT;
    
    const timeLeftDisplay = document.getElementById('time-left');
    const timeBar = document.getElementById('time-bar');
    
    timeLeftDisplay.innerText = timeLeft;
    timeBar.style.width = '100%';
    timeBar.style.background = '#e74c3c'; 
    
    timeBar.style.transition = 'none';
    setTimeout(() => {
        timeBar.style.transition = 'width 1s linear';
    }, 50);
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timeLeftDisplay.innerText = timeLeft;
        
        let percentage = (timeLeft / TIME_LIMIT) * 100;
        timeBar.style.width = percentage + '%';
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            selectAnswer(-1); // Salah karena kehabisan waktu
        }
    }, 1000);
}

function selectAnswer(selectedIndex) {
    clearInterval(timerInterval);
    
    if (currentQuestionIndex >= questions.length) {
        return;
    }
    
    const correctIndex = questions[currentQuestionIndex].answer;
    
    if (selectedIndex === correctIndex) {
        userScore += 10; // Setiap soal bernilai 10 poin
    }
    
    currentQuestionIndex++;
    
    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        finishQuiz();
    }
}

// SIMPAN KE FIREBASE FIRESTORE SECARA REAL-TIME
async function finishQuiz() {
    currentUser.score = userScore;
    
    document.getElementById('final-score').innerText = `Skor Akhir: ${userScore}`;
    document.getElementById('rank-message').innerText = `Menyimpan data ke server...`;

    try {
        // Simpan data siswa ke koleksi Firestore 'leaderboard'
        await db.collection('leaderboard').doc(currentUser.id).set({
            id: currentUser.id,
            nama: currentUser.nama,
            nim: currentUser.nim,
            score: currentUser.score,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Ambil data terbaru dari Firestore untuk menentukan peringkat secara real-time
        const snapshot = await db.collection('leaderboard').orderBy('score', 'desc').get();
        let leaderboardData = [];
        snapshot.forEach(doc => {
            leaderboardData.push(doc.data());
        });
        
        // Cari peringkat user saat ini
        currentUser.rank = leaderboardData.findIndex(u => u.id === currentUser.id) + 1;
        document.getElementById('rank-message').innerText = `Anda meraih Peringkat ke-${currentUser.rank}`;
        
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '';
        
        // Render Papan Peringkat Real-time dari Firebase
        leaderboardData.forEach((u, i) => {
            const li = document.createElement('li');
            if (u.id === currentUser.id) {
                li.className = 'current-user';
            }
            
            let medal = "";
            if(i === 0) medal = "🥇";
            else if (i === 1) medal = "🥈";
            else if (i === 2) medal = "🥉";
            
            li.innerHTML = `<span>${medal} #${i+1} ${u.nama}</span> <span>${u.score} pts</span>`;
            list.appendChild(li);
        });
        
        // Logika Sertifikat: Hanya Peringkat 1, 2, dan 3 yang mendapatkan tombol unduh
        if (currentUser.rank <= 3) {
            document.getElementById('certificate-action').style.display = 'block';
            
            document.getElementById('cert-name').innerText = currentUser.nama;
            document.getElementById('cert-nim').innerText = `NIM: ${currentUser.nim}`;
            document.getElementById('cert-rank').innerText = `Juara ${currentUser.rank}`;
            
            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            document.getElementById('cert-date').innerText = new Date().toLocaleDateString('id-ID', options);
        } else {
            // Sembunyikan jika di luar 3 besar
            document.getElementById('certificate-action').style.display = 'none';
        }

    } catch (error) {
        console.error("Gagal menyimpan ke Firebase: ", error);
        alert("Terjadi kesalahan saat menyimpan skor ke server.");
    }
    
    showPage('result-page');
}

// Fungsi untuk memunculkan Pratinjau Sertifikat (Modal) tanpa glitch di balik card
function showCertificate() {
    const btn = document.querySelector('#certificate-action button');
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ Sedang memuat...";
    
    const certElement = document.getElementById('certificate-template');
    
    html2canvas(certElement, { scale: 2 }).then(canvas => {
        currentCertDataUrl = canvas.toDataURL('image/png');
        
        // Masukkan ke tag img di dalam modal pratinjau
        document.getElementById('cert-preview-img').src = currentCertDataUrl;
        document.getElementById('cert-modal').style.display = 'flex';
        
        btn.innerHTML = originalText;
    });
}

function closeModal() {
    document.getElementById('cert-modal').style.display = 'none';
}

function downloadCertificate() {
    const link = document.createElement('a');
    link.download = `Sertifikat_Juara${currentUser.rank}_${currentUser.nama.replace(/\s+/g, '_')}.png`;
    link.href = currentCertDataUrl;
    link.click();
}

// RESET LEADERBOARD DI FIREBASE (KHUSUS INSTRUKTUR)
async function resetLeaderboard() {
    let pass = prompt("Menu Khusus Instruktur\nMasukkan password untuk mereset data peringkat:");
    if(pass === "admin123") {
        try {
            const snapshot = await db.collection('leaderboard').get();
            const batch = db.batch();
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            alert("Data Papan Peringkat online berhasil dihapus! Halaman akan dimuat ulang.");
            location.reload();
        } catch (error) {
            alert("Gagal mereset data: " + error.message);
        }
    } else if (pass !== null) {
        alert("Password salah! Anda tidak memiliki izin untuk mereset data.");
    }
}