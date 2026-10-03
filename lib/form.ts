// Logika domain form builder: tipe pertanyaan, validasi jawaban, logika bersyarat.

export type QuestionType =
  | "text" | "textarea" | "number" | "radio" | "checkbox" | "select" | "date" | "rating";

export interface Validation {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

export interface Conditional {
  dependsOnQuestionId: string;
  operator: "equals" | "not_equals" | "contains";
  value: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  validation?: Validation;
  options?: string[];
  conditional?: Conditional;
}

export type Answers = Record<string, unknown>;

export function parseSchema(raw: unknown): Question[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (q): q is Question =>
      q && typeof q === "object" && typeof (q as Question).id === "string" && typeof (q as Question).type === "string"
  );
}

/** Apakah pertanyaan tampil berdasarkan jawaban yang sudah ada. */
export function isQuestionVisible(q: Question, answers: Answers): boolean {
  const c = q.conditional;
  if (!c) return true;
  const dep = answers[c.dependsOnQuestionId];
  if (c.operator === "contains") {
    if (Array.isArray(dep)) return dep.includes(c.value);
    return String(dep ?? "").includes(c.value);
  }
  const depStr = Array.isArray(dep) ? dep.join(",") : String(dep ?? "");
  if (c.operator === "equals") return depStr === c.value;
  return depStr !== c.value;
}

/** Daftar id pertanyaan yang tampil (dihitung berurutan). */
export function visibleQuestionIds(questions: Question[], answers: Answers): Set<string> {
  const out = new Set<string>();
  for (const q of questions) {
    if (isQuestionVisible(q, answers)) out.add(q.id);
  }
  return out;
}

export class ValidationError extends Error {
  fields: Record<string, string>;
  constructor(fields: Record<string, string>) {
    super("Validasi jawaban gagal");
    this.fields = fields;
  }
}

function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/** Validasi jawaban server-side. Melempar ValidationError bila gagal. */
export function validateAnswers(questions: Question[], answers: Answers): void {
  const errors: Record<string, string> = {};
  const visible = visibleQuestionIds(questions, answers);
  const answerObj = answers && typeof answers === "object" ? answers : {};

  for (const q of questions) {
    if (!visible.has(q.id)) continue; // pertanyaan tersembunyi tidak divalidasi
    const v = answerObj[q.id];
    const label = q.label || q.id;

    if (q.required && isEmpty(v)) {
      errors[q.id] = `${label} wajib diisi.`;
      continue;
    }
    if (isEmpty(v)) continue;

    const val = q.validation ?? {};
    const msg = val.message || `Isian ${label} tidak valid.`;

    switch (q.type) {
      case "number": {
        const n = Number(v);
        if (!Number.isFinite(n)) { errors[q.id] = msg; break; }
        if (val.min !== undefined && n < val.min) { errors[q.id] = msg; break; }
        if (val.max !== undefined && n > val.max) { errors[q.id] = msg; break; }
        break;
      }
      case "rating": {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 1 || n > 5) { errors[q.id] = msg; break; }
        break;
      }
      case "text":
      case "textarea": {
        const s = String(v);
        if (val.min !== undefined && s.length < val.min) { errors[q.id] = msg; break; }
        if (val.max !== undefined && s.length > val.max) { errors[q.id] = msg; break; }
        if (val.pattern) {
          let re: RegExp;
          try { re = new RegExp(val.pattern); } catch { errors[q.id] = msg; break; }
          if (!re.test(s)) { errors[q.id] = msg; break; }
        }
        break;
      }
      case "radio":
      case "select": {
        if (q.options && q.options.length > 0 && !q.options.includes(String(v))) {
          errors[q.id] = msg; break;
        }
        break;
      }
      case "checkbox": {
        const arr = Array.isArray(v) ? v.map(String) : [String(v)];
        if (q.options && q.options.length > 0 && arr.some((o) => !q.options!.includes(o))) {
          errors[q.id] = msg; break;
        }
        break;
      }
      case "date": {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v))) { errors[q.id] = msg; break; }
        break;
      }
    }
  }

  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
}

/** Buat id pertanyaan unik. */
export function newQuestionId(): string {
  return "q" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
