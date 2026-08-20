"use server";

import { createClient } from "@/lib/supabase/server";

export interface ContactFormState {
  success: boolean;
  error?: string;
}

const BRAZIL_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const category = formData.get("category")?.toString() ?? "";
  const name = formData.get("name")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim() ?? "";
  const phone = formData.get("phone")?.toString().trim() ?? "";
  const city = formData.get("city")?.toString().trim() ?? "";
  const state = formData.get("state")?.toString().trim() ?? "";
  const message = formData.get("message")?.toString().trim() ?? "";

  if (!name || !email || !message) {
    return { success: false, error: "Nome, e-mail e mensagem são obrigatórios." };
  }

  const validCategories = [
    "convite_pregar",
    "pedido_oracao",
    "aconselhamento",
    "oferta_ajuda",
    "doacao",
    "outro",
  ];
  if (!validCategories.includes(category)) {
    return { success: false, error: "Selecione uma categoria válida." };
  }

  if (state && !BRAZIL_STATES.includes(state.toUpperCase())) {
    return { success: false, error: "Estado inválido." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("contact_messages").insert({
    category,
    name,
    email,
    phone: phone || null,
    city: city || null,
    state: state ? state.toUpperCase() : null,
    message,
  });

  if (error) {
    return { success: false, error: "Não foi possível enviar. Tente novamente em instantes." };
  }

  return { success: true };
}
