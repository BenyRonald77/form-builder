"use client";
// Formulir publik: render pertanyaan dari JSON + logika bersyarat client-side + validasi per field.
import { useMemo, useState } from "react";
import type { Question, Answers } from "@/lib/form";
import { isQuestionVisible } from "@/lib/form";
import QuestionField from "@/app/components/QuestionField";

interface Props {
  formId: number;
  questions: Question[];
}

export default function PublicForm({ formId, questions }: Props) {
  const [answers, setAnswers] = useState<Answers>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [globalError, setGlobalError] = useState("");

  const visible = useMemo(() => questions.filter((q) => isQuestionVisible(q, answers)), [questions, answers]);

  const setAnswer = (id: string, value: unknown) => {
    setAnswers((a) => ({ ...a, [id]: value }));
    setFieldErrors((e) => ({ ...e, [id]: "" }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setGlobalError("");
    const res = await fetch(`/api/forms/${formId}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setStatus("done");
      setAnswers({});
      return;
    }
    setStatus("error");
    if (data.fields) {
      setFieldErrors(data.fields);
      setGlobalError("Ada isian yang belum valid. Periksa kembali formulir.");
    } else {
      setGlobalError(data.error || "Gagal mengirim jawaban.");
    }
  }

  if (status === "done")
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
        <p className="text-lg font-semibold text-green-800">Terima kasih! Jawaban Anda sudah terkirim.</p>
        <button onClick={() => setStatus("idle")} className="mt-4 rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700">
          Isi lagi
        </button>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-4">
      {visible.map((q) => (
        <QuestionField key={q.id} q={q} value={answers[q.id]} onChange={setAnswer} error={fieldErrors[q.id] || undefined} />
      ))}
      {globalError && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{globalError}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {status === "sending" ? "Mengirim…" : "Kirim Jawaban"}
      </button>
    </form>
  );
}
