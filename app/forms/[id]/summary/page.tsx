import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseSchema, computeSummary } from "@/lib/summary";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

function BarChart({ choices }: { choices: { option: string; count: number; pct: number }[] }) {
  const max = Math.max(1, ...choices.map((c) => c.count));
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];
  return (
    <div className="space-y-1.5">
      {choices.map((c, i) => (
        <div key={c.option} className="flex items-center gap-2 text-xs">
          <span className="w-32 truncate text-slate-600" title={c.option}>{c.option}</span>
          <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
            <div className="h-full rounded" style={{ width: `${(c.count / max) * 100}%`, backgroundColor: colors[i % colors.length] }} />
          </div>
          <span className="w-20 text-right text-slate-600">{c.count} ({c.pct}%)</span>
        </div>
      ))}
    </div>
  );
}

function PieChart({ choices }: { choices: { option: string; count: number; pct: number }[] }) {
  const total = choices.reduce((a, c) => a + c.count, 0) || 1;
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];
  let angle = 0;
  const R = 50;
  const arcs = choices.filter((c) => c.count > 0).map((c, i) => {
    const frac = c.count / total;
    const start = angle;
    angle += frac * 360;
    const end = angle;
    const large = end - start > 180 ? 1 : 0;
    const rad = (a: number) => ((a - 90) * Math.PI) / 180;
    const x1 = R + R * Math.cos(rad(start)), y1 = R + R * Math.sin(rad(start));
    const x2 = R + R * Math.cos(rad(end)), y2 = R + R * Math.sin(rad(end));
    const d = frac >= 1 ? "" : `M ${R} ${R} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
    return { c, d, color: colors[i % colors.length], full: frac >= 1 };
  });
  return (
    <div className="flex items-center gap-4">
      <svg width="120" height="120" viewBox="0 0 100 100">
        {arcs.map((a, i) =>
          a.full ? (
            <circle key={i} cx={R} cy={R} r={R} fill={a.color} />
          ) : (
            <path key={i} d={a.d} fill={a.color} stroke="#fff" strokeWidth="1" />
          )
        )}
      </svg>
      <ul className="space-y-1 text-xs">
        {choices.map((c, i) => (
          <li key={c.option} className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-slate-700">{c.option}: {c.count} ({c.pct}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function SummaryPage({ params }: { params: { id: string } }) {
  const form = await prisma.form.findUnique({ where: { id: Number(params.id) } });
  if (!form) notFound();
  const rows = await prisma.response.findMany({ where: { formId: form.id }, orderBy: { id: "asc" } });
  const questions = parseSchema(JSON.parse(form.schema || "[]"));
  const answers = rows.map((r) => JSON.parse(r.answers || "{}") as Record<string, unknown>);
  const summary = computeSummary(questions, answers);

  const valStr = (qId: string, v: unknown) =>
    Array.isArray(v) ? v.map(String).join(", ") : String(v ?? "");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-500 hover:underline">← Daftar Form</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Ringkasan: {form.title}</h1>
          <p className="text-sm text-slate-500">{rows.length} respons{form.responseLimit != null ? ` (batas ${form.responseLimit})` : ""}</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href={`/forms/${form.id}/builder`} className="rounded border border-slate-300 px-3 py-2 hover:bg-slate-50">Builder</Link>
          <a href={`/api/forms/${form.id}/export`} className="rounded bg-green-600 px-3 py-2 font-semibold text-white hover:bg-green-700">Unduh CSV</a>
        </div>
      </div>

      {questions.length === 0 ? (
        <p className="mt-4 rounded border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Belum ada pertanyaan.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {summary.map((s) => (
            <section key={s.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-semibold">{s.label || s.id}</h2>
              <p className="mb-3 text-xs text-slate-500">{s.totalAnswers} jawaban terisi · tipe {s.type}</p>
              {s.choices && (s.type === "radio" || s.type === "select") && <PieChart choices={s.choices} />}
              {s.choices && s.type === "checkbox" && <BarChart choices={s.choices} />}
              {s.stats && (
                <div className="flex flex-wrap gap-4 text-sm">
                  <Stat label="Jumlah" value={String(s.stats.count)} />
                  <Stat label="Rata-rata" value={String(s.stats.avg)} />
                  <Stat label="Min" value={String(s.stats.min)} />
                  <Stat label="Maks" value={String(s.stats.max)} />
                </div>
              )}
              {s.samples && (
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {s.samples.map((t, i) => <li key={i} className="line-clamp-2">{t || <em className="text-slate-400">—</em>}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      <h2 className="mt-8 font-bold">Semua Respons ({rows.length})</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Belum ada respons.</p>
      ) : (
        <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-max text-left text-xs">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Waktu</th>
                {questions.map((q) => <th key={q.id} className="px-3 py-2">{q.label || q.id}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const ans = JSON.parse(r.answers || "{}") as Record<string, unknown>;
                return (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{r.id}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{fmtDateTime(r.submittedAt)}</td>
                    {questions.map((q) => (
                      <td key={q.id} className="max-w-60 truncate px-3 py-2" title={valStr(q.id, ans[q.id])}>
                        {valStr(q.id, ans[q.id])}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 px-4 py-2 text-center">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
