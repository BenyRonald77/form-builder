// Agregasi ringkasan untuk dipakai API maupun halaman summary (tanpa duplikasi logika).

import { parseSchema, visibleQuestionIds, type Question, type Answers } from "./form";

export interface ChoiceStat { option: string; count: number; pct: number }
export interface NumberStat { count: number; min: number; max: number; avg: number }
export interface QuestionSummary {
  id: string;
  label: string;
  type: string;
  totalAnswers: number;
  choices?: ChoiceStat[];
  stats?: NumberStat;
  samples?: string[];
}

export function computeSummary(questions: Question[], responses: Answers[]): QuestionSummary[] {
  return questions.map((q) => {
    const values: unknown[] = [];
    for (const ans of responses) {
      const v = ans[q.id];
      if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
      values.push(v);
    }
    const base = { id: q.id, label: q.label, type: q.type, totalAnswers: values.length };

    if (["radio", "select", "checkbox"].includes(q.type)) {
      const counts = new Map<string, number>();
      for (const v of values) {
        const arr = Array.isArray(v) ? v.map(String) : [String(v)];
        for (const o of arr) counts.set(o, (counts.get(o) ?? 0) + 1);
      }
      const denom = values.length || 1;
      const options = (q.options && q.options.length > 0)
        ? q.options
        : [...counts.keys()].sort();
      return {
        ...base,
        choices: options.map((o) => ({
          option: o,
          count: counts.get(o) ?? 0,
          pct: Math.round(((counts.get(o) ?? 0) / denom) * 1000) / 10,
        })),
      };
    }
    if (["number", "rating"].includes(q.type)) {
      const nums = values.map(Number).filter(Number.isFinite);
      if (nums.length === 0) return { ...base, stats: { count: 0, min: 0, max: 0, avg: 0 } };
      const sum = nums.reduce((a, b) => a + b, 0);
      return {
        ...base,
        stats: {
          count: nums.length,
          min: Math.min(...nums),
          max: Math.max(...nums),
          avg: Math.round((sum / nums.length) * 100) / 100,
        },
      };
    }
    return { ...base, samples: values.slice(0, 10).map(String) };
  });
}

export function buildCsv(questions: Question[], rows: { id: number; submittedAt: string; answers: Answers }[]): string {
  const esc = (v: unknown): string => {
    const s = Array.isArray(v) ? v.map(String).join(", ") : String(v ?? "");
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ["id_respons", "waktu_submit", ...questions.map((q) => q.label || q.id)];
  const lines = [header.map(esc).join(";")];
  for (const r of rows) {
    lines.push(
      [r.id, r.submittedAt, ...questions.map((q) => r.answers[q.id])].map(esc).join(";")
    );
  }
  return "\uFEFF" + lines.join("\r\n"); // BOM agar Excel membuka UTF-8 dengan benar
}

export { parseSchema, visibleQuestionIds };
