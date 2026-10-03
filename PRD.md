# PRD: Form Builder ala Google Forms

## Ringkasan
Aplikasi web untuk membuat formulir dinamis (mirip Google Forms): pengguna membuat form,
menambah/mengatur pertanyaan, mempublikasikan, membagikan tautan publik `/f/[id]`,
menerima jawaban, melihat ringkasan statistik, dan mengekspor CSV.

## Stack
Next.js 14 (App Router) + TypeScript + Prisma 5.22 + SQLite + Tailwind CSS.
ID: Int autoincrement. Timestamp TEXT ISO.

## Model Data
- **Form** { id, title, description, schema JSON, responseLimit Int?, isPublished Bool, createdAt, updatedAt }
- **Response** { id, formId, answers JSON, submittedAt }
- **Question** disimpan dalam `schema` JSON: `{ id, type, label, required, validation: {min,max,pattern,message}, options[], conditional: {dependsOnQuestionId, operator, value} }`
- Tipe pertanyaan: `text | textarea | number | radio | checkbox | select | date | rating`

## Fungsionalitas
- **F0**: scaffold + PRD.md + schema Prisma + seed (1 form contoh dengan conditional logic + validasi + beberapa respons).
- **F1**: Builder UI (`/forms/[id]/builder`): tambah/edit/hapus pertanyaan, ubah urutan dengan drag-and-drop HTML5 DnD, panel pengaturan (judul, deskripsi, batas respons, status publish).
- **F2**: API CRUD form + publish/unpublish (`PATCH /api/forms/[id]/publish`); enforcement batas respons (409 jika `responseLimit` tercapai); validasi jawaban server-side per field (required, min/max, regex pattern).
- **F3**: Halaman publik `/f/[id]`: render form dari JSON, logika bersyarat client-side (pertanyaan tampil/sembunyi berdasar jawaban sebelumnya — dihitung berurutan dari atas), validasi per field.
- **F4**: Ringkasan (`/forms/[id]/summary`): distribusi jawaban per pertanyaan dalam grafik SVG buatan sendiri (batang untuk pilihan, lingkaran/pie untuk proporsi), ringkasan statistik untuk number/rating (rata-rata, min, maks), tabel semua respons.
- **F5**: Ekspor CSV semua respons (`GET /api/forms/[id]/export`) — kolom: id respons, waktu submit, lalu satu kolom per pertanyaan.

## Aturan Bisnis
1. Hanya form `isPublished = true` yang dapat menerima jawaban publik (selain itu 403).
2. `responseLimit` tercapai → submit baru ditolak dengan 409 (dihitung secara atomik; conditional update).
3. Validasi server-side wajib: required, min/max (number & panjang teks), pattern regex.
4. Pertanyaan dengan `conditional` hanya tampil bila kondisi terpenuhi; pertanyaan yang disembunyikan boleh dikosongkan walau `required`.
5. Rating: nilai 1–5.
6. CSV memakai pemisah `;` (kompatibel Excel Indonesia) dan escaping kutip.

## Halaman
- `/` — daftar form (kartu: judul, jumlah respons, status, batas).
- `/forms/[id]/builder` — builder (client component).
- `/forms/[id]/summary` — ringkasan + tabel respons + tombol unduh CSV.
- `/f/[id]` — formulir publik.

## API
- `GET/POST /api/forms` — daftar & buat form.
- `GET/PATCH/DELETE /api/forms/[id]` — detail, ubah, hapus.
- `PATCH /api/forms/[id]/publish` — publish/unpublish.
- `GET/POST /api/forms/[id]/responses` — daftar respons & submit jawaban (validasi + limit).
- `GET /api/forms/[id]/summary` — agregasi ringkasan.
- `GET /api/forms/[id]/export` — CSV.

## Test (curl)
Buat form, submit valid, submit invalid (required/pattern) → 400, pertanyaan bersyarat yang disembunyikan tetap lolos, limit tercapai → 409, ringkasan 200, CSV 200.
