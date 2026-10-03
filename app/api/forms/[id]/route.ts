import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/format";

function row(f: { schema: string }) {
  return { ...f, schema: JSON.parse(f.schema || "[]") };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const form = await prisma.form.findUnique({ where: { id: Number(params.id) } });
  if (!form) return NextResponse.json({ error: "Form tidak ditemukan." }, { status: 404 });
  const count = await prisma.response.count({ where: { formId: form.id } });
  return NextResponse.json({ ...row(form), responseCount: count });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const form = await prisma.form.findUnique({ where: { id: Number(params.id) } });
  if (!form) return NextResponse.json({ error: "Form tidak ditemukan." }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) {
    const t = String(body.title).trim();
    if (!t) return NextResponse.json({ error: "Judul tidak boleh kosong." }, { status: 400 });
    data.title = t;
  }
  if (body.description !== undefined) data.description = String(body.description);
  if (body.schema !== undefined) {
    if (!Array.isArray(body.schema)) return NextResponse.json({ error: "Schema harus array." }, { status: 400 });
    data.schema = JSON.stringify(body.schema);
  }
  if (body.responseLimit !== undefined) {
    if (body.responseLimit === null) data.responseLimit = null;
    else {
      const lim = Number(body.responseLimit);
      if (!Number.isInteger(lim) || lim < 1)
        return NextResponse.json({ error: "Batas respons harus bilangan bulat >= 1." }, { status: 400 });
      data.responseLimit = lim;
    }
  }
  if (body.isPublished !== undefined) data.isPublished = Boolean(body.isPublished);
  data.updatedAt = nowIso();

  const updated = await prisma.form.update({ where: { id: form.id }, data: data as never });
  return NextResponse.json(row(updated));
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const form = await prisma.form.findUnique({ where: { id: Number(params.id) } });
  if (!form) return NextResponse.json({ error: "Form tidak ditemukan." }, { status: 404 });
  await prisma.form.delete({ where: { id: form.id } });
  return NextResponse.json({ ok: true });
}
