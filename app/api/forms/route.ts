import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/format";

function formRow(f: { schema: string }) {
  return { ...f, schema: JSON.parse(f.schema || "[]") };
}

export async function GET() {
  const forms = await prisma.form.findMany({ orderBy: { id: "desc" } });
  const counts = await prisma.response.groupBy({ by: ["formId"], _count: { _all: true } });
  const countMap = new Map(counts.map((c) => [c.formId, c._count._all]));
  return NextResponse.json(
    forms.map((f) => ({ ...formRow(f), responseCount: countMap.get(f.id) ?? 0 }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Judul form wajib diisi." }, { status: 400 });
  if (body?.responseLimit !== undefined && body?.responseLimit !== null) {
    const lim = Number(body.responseLimit);
    if (!Number.isInteger(lim) || lim < 1)
      return NextResponse.json({ error: "Batas respons harus bilangan bulat >= 1." }, { status: 400 });
  }
  const now = nowIso();
  const created = await prisma.form.create({
    data: {
      title,
      description: String(body?.description ?? ""),
      schema: JSON.stringify(Array.isArray(body?.schema) ? body.schema : []),
      responseLimit: body?.responseLimit == null ? null : Number(body.responseLimit),
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    },
  });
  return NextResponse.json(formRow(created), { status: 201 });
}
