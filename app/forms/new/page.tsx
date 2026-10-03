"use client";
// Form "Form Baru": judul + deskripsi, POST ke API lalu arahkan ke builder.
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewFormPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    const res = await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Gagal membuat form.");
      setSending(false);
      return;
    }
    router.push(`/forms/${data.id}/builder`);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <Link href="/" className="text-sm text-slate-500 hover:underline">← Daftar Form</Link>
      <h1 className="mt-4 text-xl font-bold">Form Baru</h1>
      <form onSubmit={submit} className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Judul <span className="text-red-600">*</span></label>
          <input
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Formulir Pendaftaran"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Deskripsi</label>
          <textarea className="w-full rounded border border-slate-300 px-3 py-2 text-sm" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={sending} className="rounded bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {sending ? "Membuat…" : "Buat & Buka Builder"}
        </button>
      </form>
    </main>
  );
}
