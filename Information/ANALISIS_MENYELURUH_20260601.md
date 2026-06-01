# Analisis Menyeluruh Proyek (Read-Only)

**Tanggal:** 1 Juni 2026  
**Mode:** Analisis dulu (tanpa perubahan fungsional tambahan)  
**Ruang lingkup:** Frontend PWA/offline queue + integrasi backend notifikasi

---

## 1) Kesimpulan Utama

Proyek kamu **sudah sangat kuat** di fondasi: RBAC, modul lengkap, optimasi performa, caching, dan PWA sudah terpasang.  
Perubahan terakhir pada `sw.js` **bukan penghapusan fitur**, melainkan konsolidasi supaya logic service worker tidak ganda.

### Kenapa konsolidasi SW itu penting?
Sebelumnya ada 2 implementasi SW (`sw.js` dan `service-worker.js`) dengan strategi cache/sync berbeda. Ini rawan:
- perilaku inkonsisten antar browser/device,
- sulit debug saat update,
- risiko regressi saat release.

Sekarang `sw.js` hanya jadi **compatibility entrypoint** ke `service-worker.js`:
- endpoint lama tetap hidup,
- source of truth jadi satu,
- maintenance jangka panjang lebih aman.

---

## 2) Temuan Arsitektur (Fakta dari Codebase)

## A. PWA Initialization
- `frontend/src/components/PWAInitializer.jsx` mendaftarkan SW ke `'/service-worker.js'`.
- Listener message `sync-queue-request` sudah ada untuk memicu queue processing.

**Status:** ✅ Baik

## B. Service Worker Layer
- `frontend/public/service-worker.js` memegang logic utama: cache, fetch strategy, push, sync, message channel.
- `frontend/public/sw.js` kini shim: `importScripts('/service-worker.js')`.

**Status:** ✅ Arah benar (single source)

## C. Offline Queue
- `frontend/src/services/offlineQueueService.js` sudah:
  - queue saat offline/network failure,
  - replay otomatis saat online,
  - auth header saat replay,
  - event feedback (`queue-processing`, `queue-processed`, `queue-error`).

**Status:** ✅ Baik, sudah operasional

## D. Sync UI
- `frontend/src/components/SyncStatus.jsx` sudah menampilkan:
  - online/offline,
  - pending queue,
  - last sync,
  - manual sync + hasil sinkronisasi.

**Status:** ✅ User visibility bagus

## E. Push Notification Endpoint Reality Check
- Frontend push service memanggil:
  - `POST /api/v1/notifications/subscribe`
  - `POST /api/v1/notifications/unsubscribe`
- Di backend `notification.routes.js` saat ini **belum ada route subscribe/unsubscribe** (hanya CRUD notifikasi user).

**Status:** ⚠️ Belum terhubung penuh (fitur push subscription belum final end-to-end)

---

## 3) Risiko dan Dampak

## Risiko Tinggi
1. **Push subscribe/unsubscribe belum ada di backend**
   - Dampak: browser bisa subscribe lokal, tapi server-side push registry gagal.

## Risiko Menengah
2. **Legacy lint debt di file lama lain**
   - Tidak selalu break build, tapi bisa menimbulkan bug halus di masa depan.

3. **Konflik data saat replay queue**
   - Contoh: data sudah berubah di server saat request antrean diproses.

## Risiko Rendah
4. **Duplikasi hook lama `usePWA.js`**
   - Saat ini tidak dipakai langsung pada flow terbaru, tapi sebaiknya ditandai deprecated agar tim tidak bingung.

---

## 4) Rekomendasi Tindakan (Urutan Aman)

## Prioritas 1 (Wajib)
1. Tambahkan backend endpoint:
   - `POST /api/v1/notifications/subscribe`
   - `POST /api/v1/notifications/unsubscribe`
2. Simpan subscription per user (DB) + validasi token + idempotent update.

## Prioritas 2 (Stabilitas)
3. Tambahkan reason code saat replay gagal:
   - 401/403 auth,
   - 404 resource not found,
   - 409 conflict.
4. Tambah retry policy khusus per error type (mis. 4xx tidak retry agresif).

## Prioritas 3 (Operasional)
5. Buat mini “Queue Inspector” (admin/dev mode):
   - pending count,
   - failed count,
   - retry one/clear one.

## Prioritas 4 (Kebersihan Code)
6. Tandai `usePWA.js` sebagai deprecated (atau hapus setelah verifikasi tidak dipakai).
7. Rapikan lint debt bertahap modul-per-modul, bukan sekaligus.

---

## 5) Validasi yang Disarankan (Checklist QA)

- [ ] Offline create/update/delete di: Kunjungan, Loans, Items, Schedules, Departments
- [ ] Kembali online -> auto sync berhasil
- [ ] Manual sync menampilkan summary benar
- [ ] Token expired saat replay -> error terbaca jelas
- [ ] Push permission granted -> subscribe request masuk backend
- [ ] Push unsubscribe -> registry backend terhapus

---

## 6) Jawaban langsung atas kekhawatiranmu

Kamu benar untuk minta analisis dulu. Dan berdasarkan audit ini:
- perubahan `sw.js` **tidak merusak fondasi**,
- justru **mengurangi risiko jangka panjang** dengan satu sumber logic SW,
- yang perlu dikejar berikutnya adalah **backend push subscription endpoint** agar fitur push benar-benar lengkap.

---

## 7) Status Saat Ini

**Proyek:** Stabil dan berkembang sehat  
**PWA/Offline:** Sudah usable  
**Gap paling penting:** Push subscription backend belum final

