"use client";
// Builder: tambah/edit/hapus pertanyaan + ubah urutan dengan drag-and-drop HTML5 DnD.
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Question, QuestionType, Conditional } from "@/lib/form";
import { newQuestionId } from "@/lib/form";
import QuestionField from "@/app/components/QuestionField";

const TYPES: { value: QuestionType; label: string }[] = [
  { value: "text", label: "Teks singkat" },
  { value: "textarea", label: "Teks panjang" },
  { value: "number", label: "Angka" },
  { value: "radio", label: "Pilihan ganda (radio)" },
  { value: "checkbox", label: "Kotak centang (checkbox)" },
  { value: "select", label: "Dropdown (select)" },
  { value: "date", label: "Tanggal" },
  { value: "rating", label: "Rating (1–5)" },
];

const HAS_OPTIONS: QuestionType[] = ["radio", "checkbox", "select"];

const blankQuestion = (type: QuestionType): Question => ({
  id: newQuestionId(),
  type,
  label: "",
  required: false,
  ...(HAS_OPTIONS.includes(type) ? { options: ["Opsi 1", "Opsi 2"] } : {}),
});

export default function BuilderPage({ params }: { params: { id: string } }) {
  const formId = params.id;
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [responseLimit, setResponseLimit] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [newType, setNewType] = useState<QuestionType>("text");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [publicUrl, setPublicUrl] = useState("");

  useEffect(() => {
    fetch(`/api/forms/${formId}`)
      .then((r) => r.json())
      .then((f) => {
        setTitle(f.title);
        setDescription(f.description || "");
        setResponseLimit(f.responseLimit != null ? String(f.responseLimit) : "");
        setIsPublished(Boolean(f.isPublished));
        setQuestions(f.schema || []);
        if (typeof window !== "undefined") setPublicUrl(`${window.location.origin}/f/${f.id}`);
      })
      .finally(() => setLoading(false));
  }, [formId]);

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(""), 2500);
  }

  async function save(published?: boolean) {
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/forms/${formId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        schema: questions,
        responseLimit: responseLimit.trim() === "" ? null : Number(responseLimit),
        ...(published !== undefined ? { isPublished: published } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      flash(data.error || "Gagal menyimpan.");
      return;
    }
    if (published !== undefined) setIsPublished(published);
    flash("Tersimpan ✓");
  }

  async function removeForm() {
    if (!confirm("Hapus form ini beserta semua responsnya?")) return;
    const res = await fetch(`/api/forms/${formId}`, { method: "DELETE" });
    if (res.ok) window.location.href = "/";
  }

  function updateQuestion(id: string, patch: Partial<Question>) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  // --- drag & drop ---
  function onDragStart(e: React.DragEvent, idx: number) {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIdx === null || dragIdx === idx) return;
    setQuestions((qs) => {
      const next = [...qs];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIdx(idx);
  }
  function onDragEnd() {
    setDragIdx(null);
  }

  function move(idx: number, dir: -1 | 1) {
    setQuestions((qs) => {
      const next = [...qs];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return next;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }

  if (loading) return <main className="p-10 text-center text-sm text-slate-500">Memuat…</main>;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-500 hover:underline">← Daftar Form</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Builder: {title}</h1>
        <div className="flex gap-2 text-sm">
          <button onClick={() => save()} disabled={saving} className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
          <button
            onClick={() => save(!isPublished)}
            disabled={saving}
            className={`rounded px-4 py-2 font-semibold ${isPublished ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-green-600 text-white hover:bg-green-700"}`}
          >
            {isPublished ? "Jadikan Draf" : "Publikasikan"}
          </button>
        </div>
      </div>
      {msg && <p className="mt-2 text-sm text-green-700">{msg}</p>}
      {isPublished && publicUrl && (
        <p className="mt-2 rounded bg-green-50 px-3 py-2 text-sm text-green-800">
          Tautan publik: <a href={publicUrl} target="_blank" rel="noreferrer" className="underline">{publicUrl}</a>
        </p>
      )}

      {/* Pengaturan form */}
      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Pengaturan</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Judul</label>
            <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Batas respons (kosong = tanpa batas)</label>
            <input type="number" min={1} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={responseLimit} onChange={(e) => setResponseLimit(e.target.value)} />
          </div>
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-slate-600">Deskripsi</label>
          <textarea className="w-full rounded border border-slate-300 px-3 py-2 text-sm" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </section>

      {/* Daftar pertanyaan */}
      <section className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Pertanyaan ({questions.length})</h2>
          <div className="flex gap-2">
            <select className="rounded border border-slate-300 px-2 py-1.5 text-sm" value={newType} onChange={(e) => setNewType(e.target.value as QuestionType)}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button
              onClick={() => {
                const q = blankQuestion(newType);
                setQuestions((qs) => [...qs, q]);
                setEditing(q.id);
              }}
              className="rounded bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-900"
            >
              + Tambah
            </button>
          </div>
        </div>

        {questions.length === 0 && (
          <p className="rounded border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Belum ada pertanyaan. Tambahkan pertanyaan pertama.
          </p>
        )}

        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              draggable
              onDragStart={(e) => onDragStart(e, idx)}
              onDragOver={(e) => onDragOver(e, idx)}
              onDragEnd={onDragEnd}
              className={`rounded-lg border bg-white ${dragIdx === idx ? "border-blue-400 opacity-60" : "border-slate-200"}`}
            >
              <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2">
                <span className="cursor-grab select-none text-slate-400" title="Seret untuk memindah">⠿</span>
                <span className="text-xs font-medium text-slate-500">#{idx + 1} · {TYPES.find((t) => t.value === q.type)?.label}</span>
                {q.conditional && <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] text-purple-700">bersyarat</span>}
                {q.required && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700">wajib</span>}
                <div className="ml-auto flex gap-1 text-xs">
                  <button onClick={() => move(idx, -1)} disabled={idx === 0} className="rounded border px-2 py-1 hover:bg-slate-50 disabled:opacity-30" title="Pindah ke atas">↑</button>
                  <button onClick={() => move(idx, 1)} disabled={idx === questions.length - 1} className="rounded border px-2 py-1 hover:bg-slate-50 disabled:opacity-30" title="Pindah ke bawah">↓</button>
                  <button onClick={() => setEditing(editing === q.id ? null : q.id)} className="rounded border px-2 py-1 hover:bg-slate-50">
                    {editing === q.id ? "Tutup" : "Edit"}
                  </button>
                  <button
                    onClick={() => { if (confirm("Hapus pertanyaan ini?")) setQuestions((qs) => qs.filter((x) => x.id !== q.id)); }}
                    className="rounded border border-red-200 px-2 py-1 text-red-600 hover:bg-red-50"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              {editing === q.id ? (
                <QuestionEditor q={q} others={questions.filter((x) => x.id !== q.id)} onChange={(patch) => updateQuestion(q.id, patch)} />
              ) : (
                <div className="p-4">
                  <p className="mb-3 text-sm font-medium">{q.label || <em className="text-slate-400">(tanpa label)</em>}</p>
                  <div className="pointer-events-none opacity-80">
                    <QuestionField q={q} value={undefined} onChange={() => {}} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 flex justify-between border-t border-slate-200 pt-4">
        <button onClick={removeForm} className="rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
          Hapus Form Ini
        </button>
        <Link href={`/forms/${formId}/summary`} className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900">
          Lihat Ringkasan →
        </Link>
      </div>
    </main>
  );
}

function QuestionEditor({ q, others, onChange }: { q: Question; others: Question[]; onChange: (p: Partial<Question>) => void }) {
  const v = q.validation ?? {};
  const c = q.conditional;
  return (
    <div className="space-y-3 p-4 text-sm">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Label pertanyaan</label>
          <input className="w-full rounded border border-slate-300 px-3 py-2" value={q.label} onChange={(e) => onChange({ label: e.target.value })} placeholder="Contoh: Nama lengkap" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Tipe</label>
          <select className="w-full rounded border border-slate-300 px-3 py-2" value={q.type} onChange={(e) => onChange({ type: e.target.value as QuestionType })}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={q.required} onChange={(e) => onChange({ required: e.target.checked })} />
        Wajib diisi
      </label>

      {HAS_OPTIONS.includes(q.type) && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Opsi (satu per baris)</label>
          <textarea
            className="w-full rounded border border-slate-300 px-3 py-2"
            rows={3}
            value={(q.options ?? []).join("\n")}
            onChange={(e) => onChange({ options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
          />
        </div>
      )}

      {(q.type === "text" || q.type === "textarea" || q.type === "number") && (
        <div className="rounded border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold text-slate-600">Validasi</p>
          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <label className="text-xs text-slate-500">{q.type === "number" ? "Nilai min" : "Panjang min"}</label>
              <input type="number" className="w-full rounded border border-slate-300 px-2 py-1.5" value={v.min ?? ""} onChange={(e) => onChange({ validation: { ...v, min: e.target.value === "" ? undefined : Number(e.target.value) } })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">{q.type === "number" ? "Nilai maks" : "Panjang maks"}</label>
              <input type="number" className="w-full rounded border border-slate-300 px-2 py-1.5" value={v.max ?? ""} onChange={(e) => onChange({ validation: { ...v, max: e.target.value === "" ? undefined : Number(e.target.value) } })} />
            </div>
            {(q.type === "text" || q.type === "textarea") && (
              <div>
                <label className="text-xs text-slate-500">Pola regex</label>
                <input className="w-full rounded border border-slate-300 px-2 py-1.5 font-mono text-xs" value={v.pattern ?? ""} onChange={(e) => onChange({ validation: { ...v, pattern: e.target.value || undefined } })} placeholder="^[A-Z]+$" />
              </div>
            )}
          </div>
          <div className="mt-2">
            <label className="text-xs text-slate-500">Pesan error kustom</label>
            <input className="w-full rounded border border-slate-300 px-2 py-1.5" value={v.message ?? ""} onChange={(e) => onChange({ validation: { ...v, message: e.target.value || undefined } })} />
          </div>
        </div>
      )}

      <div className="rounded border border-purple-200 bg-purple-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-purple-800">Logika bersyarat</p>
          {c && <button onClick={() => onChange({ conditional: undefined })} className="text-xs text-purple-600 underline">hapus kondisi</button>}
        </div>
        {others.length === 0 ? (
          <p className="text-xs text-purple-600">Tambahkan pertanyaan lain dulu untuk membuat kondisi.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-3">
            <select
              className="rounded border border-slate-300 px-2 py-1.5"
              value={c?.dependsOnQuestionId ?? ""}
              onChange={(e) => {
                const id = e.target.value;
                if (!id) { onChange({ conditional: undefined }); return; }
                const cur: Conditional = c ?? { dependsOnQuestionId: id, operator: "equals", value: "" };
                onChange({ conditional: { ...cur, dependsOnQuestionId: id } });
              }}
            >
              <option value="">— Tampilkan selalu —</option>
              {others.map((o) => <option key={o.id} value={o.id}>{o.label || o.id}</option>)}
            </select>
            {c && (
              <>
                <select
                  className="rounded border border-slate-300 px-2 py-1.5"
                  value={c.operator}
                  onChange={(e) => onChange({ conditional: { ...c, operator: e.target.value as Conditional["operator"] } })}
                >
                  <option value="equals">sama dengan</option>
                  <option value="not_equals">tidak sama dengan</option>
                  <option value="contains">mengandung</option>
                </select>
                <input
                  className="rounded border border-slate-300 px-2 py-1.5"
                  placeholder="nilai pembanding"
                  value={c.value}
                  onChange={(e) => onChange({ conditional: { ...c, value: e.target.value } })}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
