# Form Builder

Aplikasi pembuat formulir dinamis ala Google Forms: buat form, susun pertanyaan
dengan drag-and-drop, publikasikan, bagikan tautan publik `/f/[id]`, terima
jawaban dengan validasi server-side, lihat ringkasan statistik (grafik SVG
buatan sendiri), dan ekspor CSV.

## Cara Menjalankan

```bash
npm install --ignore-scripts   # VM ini: unduhan engine Prisma gagal, lihat di bawah
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Catatan khusus VM ini (un-duhan `binaries.prisma.sh` selalu gagal): setelah
`npm install --ignore-scripts`, salin `schema-engine-debian-openssl-3.0.x` dan
`libquery_engine-debian-openssl-3.0.x.so.node` dari direktori engine cadangan ke
`node_modules/@prisma/engines/`.

## Halaman

- `/` — daftar form (status publik/draf, jumlah respons, batas).
- `/forms/new` — buat form baru.
- `/forms/[id]/builder` — builder: tambah/edit/hapus pertanyaan, ubah urutan
  dengan drag-and-drop (atau tombol ↑/↓), pengaturan (judul, deskripsi, batas
  respons), publish/unpublish, tautan publik.
- `/forms/[id]/summary` — ringkasan: grafik batang/pie SVG per pertanyaan
  pilihan, statistik (rata-rata/min/maks) untuk angka & rating, tabel semua
  respons, tombol unduh CSV.
- `/f/[id]` — formulir publik: render dari JSON, logika bersyarat client-side,
  validasi per field.

## API

- `GET/POST /api/forms` — daftar & buat form.
- `GET/PATCH/DELETE /api/forms/[id]` — detail, ubah (judul/deskripsi/schema/
  responseLimit/isPublished), hapus.
- `PATCH /api/forms/[id]/publish` — `{ published: boolean }`.
- `GET/POST /api/forms/[id]/responses` — daftar respons & submit jawaban.
  Submit: hanya form terbit (403), validasi server-side (400), batas respons
  tercapai → 409 (insert atomik satu statement SQL).
- `GET /api/forms/[id]/summary` — agregasi ringkasan per pertanyaan.
- `GET /api/forms/[id]/export` — CSV (`;` sebagai pemisah, BOM UTF-8).

## Tipe pertanyaan

`text | textarea | number | radio | checkbox | select | date | rating`.
Validasi per field: required, min/max (nilai atau panjang), pola regex,
opsi harus sesuai daftar, rating 1–5, format tanggal `YYYY-MM-DD`.
Logika bersyarat: pertanyaan tampil jika jawaban pertanyaan lain memenuhi
operator `equals | not_equals | contains`. Pertanyaan yang disembunyikan tidak
divalidasi required-nya.
