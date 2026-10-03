import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSchema, computeSummary } from "@/lib/summary";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const form = await prisma.form.findUnique({ where: { id: Number(params.id) } });
  if (!form) return NextResponse.json({ error: "Form tidak ditemukan." }, { status: 404 });
  const rows = await prisma.response.findMany({ where: { formId: form.id }, orderBy: { id: "asc" } });
  const questions = parseSchema(JSON.parse(form.schema || "[]"));
  const answers = rows.map((r) => JSON.parse(r.answers || "{}"));
  const summary = computeSummary(questions, answers);
  return NextResponse.json({ totalResponses: rows.length, questions: summary });
}
