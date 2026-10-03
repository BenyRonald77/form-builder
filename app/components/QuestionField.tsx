"use client";
// Merender satu pertanyaan berdasarkan tipenya, dipakai di halaman publik & pratinjau builder.
import type { Question, Answers } from "@/lib/form";

interface Props {
  q: Question;
  value: unknown;
  onChange: (id: string, value: unknown) => void;
  error?: string;
}

const inputCls = (err?: string) =>
  `w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
    err ? "border-red-500 focus:ring-red-200" : "border-slate-300 focus:ring-blue-200"
  }`;

export default function QuestionField({ q, value, onChange, error }: Props) {
  const v = value as never;
  const set = (val: unknown) => onChange(q.id, val);
  const label = (
    <label className="mb-1 block text-sm font-medium text-slate-800">
      {q.label} {q.required && <span className="text-red-600">*</span>}
    </label>
  );

  let field: React.ReactNode = null;
  switch (q.type) {
    case "text":
      field = <input className={inputCls(error)} value={(v as string) ?? ""} onChange={(e) => set(e.target.value)} placeholder={q.label} />;
      break;
    case "textarea":
      field = <textarea className={inputCls(error)} rows={4} value={(v as string) ?? ""} onChange={(e) => set(e.target.value)} />;
      break;
    case "number":
      field = <input type="number" className={inputCls(error)} value={(v as number) ?? ""} onChange={(e) => set(e.target.value === "" ? "" : Number(e.target.value))} />;
      break;
    case "date":
      field = <input type="date" className={inputCls(error)} value={(v as string) ?? ""} onChange={(e) => set(e.target.value)} />;
      break;
    case "rating":
      field = (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => set(n)}
              className={`h-10 w-10 rounded-full border text-sm font-semibold transition ${
                (v as number) === n ? "border-amber-500 bg-amber-400 text-white" : "border-slate-300 bg-white hover:border-amber-400"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      );
      break;
    case "radio":
      field = (
        <div className="space-y-1">
          {(q.options ?? []).map((o) => (
            <label key={o} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name={q.id} checked={(v as string) === o} onChange={() => set(o)} />
              {o}
            </label>
          ))}
        </div>
      );
      break;
    case "checkbox": {
      const arr = Array.isArray(v) ? (v as string[]) : [];
      field = (
        <div className="space-y-1">
          {(q.options ?? []).map((o) => (
            <label key={o} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={arr.includes(o)}
                onChange={(e) => set(e.target.checked ? [...arr, o] : arr.filter((x) => x !== o))}
              />
              {o}
            </label>
          ))}
        </div>
      );
      break;
    }
    case "select":
      field = (
        <select className={inputCls(error)} value={(v as string) ?? ""} onChange={(e) => set(e.target.value)}>
          <option value="">— Pilih —</option>
          {(q.options ?? []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
      break;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      {label}
      {field}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
