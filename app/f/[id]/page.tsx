import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseSchema } from "@/lib/form";
import PublicForm from "@/app/components/PublicForm";

export const dynamic = "force-dynamic";

export default async function PublicFormPage({ params }: { params: { id: string } }) {
  const form = await prisma.form.findUnique({ where: { id: Number(params.id) } });
  if (!form || !form.isPublished) notFound();
  const questions = parseSchema(JSON.parse(form.schema || "[]"));

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-sm text-slate-500 hover:underline">← Form Builder</Link>
      <div className="mt-4 rounded-t-xl bg-blue-600 p-6 text-white">
        <h1 className="text-2xl font-bold">{form.title}</h1>
        {form.description && <p className="mt-2 text-sm text-blue-100">{form.description}</p>}
      </div>
      <div className="rounded-b-xl border border-t-0 border-slate-200 bg-slate-50 p-6">
        {questions.length === 0 ? (
          <p className="text-sm text-slate-500">Form ini belum memiliki pertanyaan.</p>
        ) : (
          <PublicForm formId={form.id} questions={questions} />
        )}
      </div>
    </main>
  );
}
