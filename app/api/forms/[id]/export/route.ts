import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSchema, buildCsv } from "@/lib/summary";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const form = await prisma.form.findUnique({ where: { id: Number(params.id) } });
  if (!form) return NextResponse.json({ error: "Form tidak ditemukan." }, { status: 404 });
  const rows = await prisma.response.findMany({ where: { formId: form.id }, orderBy: { id: "asc" } });
  const questions = parseSchema(JSON.parse(form.schema || "[]"));
  const data = rows.map((r) => ({ id: r.id, submittedAt: r.submittedAt, answers: JSON.parse(r.answers || "{}") }));
  const csv = buildCsv(questions, data);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="form-${form.id}-respons.csv"`,
    },
  });
}
