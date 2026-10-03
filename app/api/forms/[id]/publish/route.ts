import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/format";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const form = await prisma.form.findUnique({ where: { id: Number(params.id) } });
  if (!form) return NextResponse.json({ error: "Form tidak ditemukan." }, { status: 404 });
  const body = await req.json().catch(() => null);
  const published = Boolean(body?.published);
  const updated = await prisma.form.update({
    where: { id: form.id },
    data: { isPublished: published, updatedAt: nowIso() },
  });
  return NextResponse.json({ id: updated.id, isPublished: updated.isPublished });
}
