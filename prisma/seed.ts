import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const n = await prisma.form.count();
  if (n > 0) {
    console.log("seed dilewati (sudah ada data)");
    return;
  }
  const schema = JSON.stringify([
    {
      id: "q_nama",
      type: "text",
      label: "Nama lengkap",
      required: true,
      validation: { min: 3, max: 100, message: "Nama minimal 3 karakter." },
    },
    {
      id: "q_email",
      type: "text",
      label: "Email",
      required: true,
      validation: {
        pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
        message: "Format email tidak valid.",
      },
    },
    {
      id: "q_umur",
      type: "number",
      label: "Umur",
      required: true,
      validation: { min: 17, max: 99, message: "Umur harus antara 17–99 tahun." },
    },
    {
      id: "q_jenis",
      type: "radio",
      label: "Jenis peserta",
      required: true,
      options: ["Mahasiswa", "Umum"],
    },
    {
      id: "q_nim",
      type: "text",
      label: "NIM",
      required: true,
      validation: {
        pattern: "^[A-Z0-9]{8}$",
        message: "NIM harus 8 karakter huruf kapital/angka.",
      },
      conditional: { dependsOnQuestionId: "q_jenis", operator: "equals", value: "Mahasiswa" },
    },
    {
      id: "q_minat",
      type: "checkbox",
      label: "Minat workshop",
      required: false,
      options: ["Web", "Data", "Desain"],
    },
    {
      id: "q_hari",
      type: "select",
      label: "Hari pilihan",
      required: true,
      options: ["Senin", "Rabu", "Jumat"],
      conditional: { dependsOnQuestionId: "q_jenis", operator: "not_equals", value: "Mahasiswa" },
    },
    {
      id: "q_rating",
      type: "rating",
      label: "Seberapa puas Anda dengan pendaftaran ini?",
      required: false,
    },
    {
      id: "q_saran",
      type: "textarea",
      label: "Saran",
      required: false,
      validation: { max: 500 },
    },
    {
      id: "q_tanggal",
      type: "date",
      label: "Tanggal lahir",
      required: false,
    },
  ]);

  const form = await prisma.form.create({
    data: {
      title: "Formulir Pendaftaran Workshop",
      description: "Contoh formulir dengan logika bersyarat (NIM hanya untuk Mahasiswa) dan validasi.",
      schema,
      responseLimit: null,
      isPublished: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  const responses = [
    {
      q_nama: "Andi Saputra",
      q_email: "andi@example.com",
      q_umur: 20,
      q_jenis: "Mahasiswa",
      q_nim: "A1B2C3D4",
      q_minat: ["Web", "Data"],
      q_rating: 5,
      q_saran: "Semangat!",
      q_tanggal: "2006-01-15",
    },
    {
      q_nama: "Budi Santoso",
      q_email: "budi@example.com",
      q_umur: 25,
      q_jenis: "Umum",
      q_minat: ["Desain"],
      q_hari: "Rabu",
      q_rating: 4,
    },
    {
      q_nama: "Citra Lestari",
      q_email: "citra@example.com",
      q_umur: 19,
      q_jenis: "Mahasiswa",
      q_nim: "X9Y8Z7W6",
      q_minat: ["Web", "Desain"],
      q_rating: 5,
      q_tanggal: "2007-05-20",
    },
  ];

  for (const answers of responses) {
    await prisma.response.create({
      data: {
        formId: form.id,
        answers: JSON.stringify(answers),
        submittedAt: new Date().toISOString(),
      },
    });
  }
  console.log(`seed selesai: 1 form, ${responses.length} respons`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
