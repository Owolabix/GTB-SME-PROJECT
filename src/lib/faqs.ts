import { supabase } from "@/integrations/supabase/client";

export type MerchantFaq = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  merchant_scoped_id: string | null;
};

export async function loadMerchantFaqs(userId: string): Promise<MerchantFaq[]> {
  const { data, error } = await supabase
    .from("faqs")
    .select("id, question, answer, category, merchant_scoped_id")
    .eq("merchant_scoped_id", userId)
    .order("question", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as MerchantFaq[];
}

export async function createMerchantFaq(
  userId: string,
  fields: { question: string; answer: string; category?: string },
): Promise<{ ok: boolean; error?: string }> {
  const question = fields.question.trim();
  const answer = fields.answer.trim();
  if (!question || !answer) {
    return { ok: false, error: "Question and answer are required." };
  }

  const { error } = await supabase.from("faqs").insert({
    merchant_scoped_id: userId,
    question,
    answer,
    category: fields.category?.trim() || null,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateMerchantFaq(
  userId: string,
  id: string,
  fields: { question: string; answer: string; category?: string },
): Promise<{ ok: boolean; error?: string }> {
  const question = fields.question.trim();
  const answer = fields.answer.trim();
  if (!question || !answer) {
    return { ok: false, error: "Question and answer are required." };
  }

  const { error } = await supabase
    .from("faqs")
    .update({
      question,
      answer,
      category: fields.category?.trim() || null,
    })
    .eq("id", id)
    .eq("merchant_scoped_id", userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteMerchantFaq(
  userId: string,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("faqs").delete().eq("id", id).eq("merchant_scoped_id", userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
