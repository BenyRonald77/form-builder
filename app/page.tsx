import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const forms = await prisma.form.findMany({ orderBy: { id: "desc" } });
  const counts = await prisma.response.groupBy({ by: ["formId"], _count: { _all: true } });
  const countMap = new Map(counts.map((c) => [c.formId, c._count._all]));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Form Builder</h1>
          <p className="text-sm text-slate-500">Buat formulir, bagikan tautan, pantau jawaban.</p>
        </div>
        <Link href="/forms/new" className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          + Form Baru
        </Link>
      </div>

      {forms.length === 0 ? (
        <div className="rounded border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Belum ada form. Klik “Form Baru” untuk mulai.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {forms.map((f) => {
            const count = countMap.get(f.id) ?? 0;
            return (
              <div key={f.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{f.title}</h2>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${f.isPublished ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {f.isPublished ? "Publik" : "Draf"}
                  </span>
                </div>
                {f.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{f.description}</p>}
                <p className="mt-2 text-xs text-slate-500">
                  {count} respons{f.responseLimit != null ? ` / batas ${f.responseLimit}` : ""} · {fmtDateTime(f.updatedAt)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Link href={`/forms/${f.id}/builder`} className="rounded border border-slate-300 px-3 py-1.5 hover:bg-slate-50">Builder</Link>
                  <Link href={`/forms/${f.id}/summary`} className="rounded border border-slate-300 px-3 py-1.5 hover:bg-slate-50">Ringkasan</Link>
                  {f.isPublished && (
                    <Link href={`/f/${f.id}`} className="rounded border border-blue-300 px-3 py-1.5 text-blue-700 hover:bg-blue-50">Lihat Publik</Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
