import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/format";
import { parseSchema, validateAnswers, ValidationError, type Answers } from "@/lib/form";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const form = await prisma.form.findUnique({ where: { id: Number(params.id) } });
  if (!form) return NextResponse.json({ error: "Form tidak ditemukan." }, { status: 404 });
  const rows = await prisma.response.findMany({
    where: { formId: form.id },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(rows.map((r) => ({ ...r, answers: JSON.parse(r.answers || "{}") })));
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const form = await prisma.form.findUnique({ where: { id: Number(params.id) } });
  if (!form) return NextResponse.json({ error: "Form tidak ditemukan." }, { status: 404 });
  if (!form.isPublished)
    return NextResponse.json({ error: "Form belum dipublikasikan." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const answers: Answers = body && typeof body.answers === "object" && body.answers ? body.answers : {};
  const questions = parseSchema(JSON.parse(form.schema || "[]"));

  try {
    validateAnswers(questions, answers);
  } catch (e) {
    if (e instanceof ValidationError)
      return NextResponse.json({ error: "Validasi gagal.", fields: e.fields }, { status: 400 });
    throw e;
  }

  // Insert atomik: hanya berhasil bila jumlah respons masih di bawah batas (satu statement SQL).
  const now = nowIso();
  if (form.responseLimit !== null && form.responseLimit !== undefined) {
    const inserted = await prisma.$executeRawUnsafe(
      `INSERT INTO "responses" ("formId", "answers", "submittedAt")
       SELECT ?, ?, ? WHERE (SELECT COUNT(*) FROM "responses" WHERE "formId" = ?) < ?`,
      form.id,
      JSON.stringify(answers),
      now,
      form.id,
      form.responseLimit
    );
    if (Number(inserted) === 0)
      return NextResponse.json({ error: "Batas jumlah respons tercapai." }, { status: 409 });
  } else {
    await prisma.response.create({ data: { formId: form.id, answers: JSON.stringify(answers), submittedAt: now } });
  }
  return NextResponse.json({ ok: true, submittedAt: now }, { status: 201 });
}
