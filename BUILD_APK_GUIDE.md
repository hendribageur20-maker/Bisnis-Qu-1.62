# Panduan Konfigurasi GitHub Actions Build Android APK (Bengkel Qu 1.60)

File konfigurasi workflow GitHub Actions telah dibuat di:  
📁 `.github/workflows/build-apk.yml`

---

## 🛠️ Fitur-Fitur Utama yang Disematkan

1. **Node.js 22 & Java JDK 17 & Gradle**:
   - Menyiapkan environment **Node.js 22** (sesuai persyaratan `@capacitor/cli` v7+) dan **Java 17 (Temurin)** serta Android SDK bawaan GitHub Runner untuk mengompilasi APK debug via Gradle (`./gradlew assembleDebug`).
2. **Pengecekan File `.env` Otomatis**:
   - Skrip memeriksa ketersediaan file `.env`. Jika belum ada, skrip akan otomatis menyalin dari `.env.example` agar build web tidak gagal karena variabel hilang.
3. **Otomatis Deteksi & Buat `debug.keystore`**:
   - Skrip mendeteksi apakah `~/.android/debug.keystore` sudah ada. Jika belum, skrip otomatis membuat keystore baru menggunakan `keytool` bawaan JDK dengan alias `androiddebugkey` dan password `android`.
4. **Hak Akses `chmod +x` untuk `gradlew`**:
   - Memastikan file `gradlew` memiliki izin eksekusi (*executable*) sebelum perintah kompilasi Gradle dijalankan agar terhindar dari error *Permission Denied*.
5. **Penyimpanan Berkas via `actions/upload-artifact@v4`**:
   - Hasil build APK disimpan menggunakan action artifact terbaru (`v4`) dengan nama **`BengkelQu-1.60-Android-APK-Debug`** (tersedia untuk diunduh langsung selama 30 hari).

---

## 🚀 Cara Menjalankan Build APK di GitHub

### Opsi A: Jalankan Manual (1-Klik via GitHub Actions)
1. Buka repositori proyek Anda di **GitHub**.
2. Klik tab **Actions** di menu atas.
3. Di panel kiri, klik **`Build Android APK (Debug)`**.
4. Klik tombol **Run workflow** lalu pilih branch (misal: `main` atau `master`).
5. Klik **Run workflow**.

### Opsi B: Otomatis Saat `git push`
Setiap kali Anda melakukan push ke branch `main`, `master`, atau push tag versi (misal: `v1.60`), GitHub Actions akan otomatis memulai proses build.

---

## 📥 Cara Mengunduh File APK Hasil Build

1. Buka riwayat proses build yang sudah selesai (bertanda centang hijau ✅).
2. Gulir ke bawah ke bagian **Artifacts**.
3. Klik artifact **`BengkelQu-1.60-APK`** untuk mengunduh file zip yang berisi:
   - 📱 **`BengkelQu-1.60.apk`**
4. Kirim dan instal file `.apk` tersebut langsung di ponsel Android Anda!
