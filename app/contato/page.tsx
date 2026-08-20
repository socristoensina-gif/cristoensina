import ContactForm from "./ContactForm";

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-center text-3xl font-semibold text-[var(--color-petrol)]">
        Fale Conosco
      </h1>
      <p className="mt-2 text-center text-[var(--color-ink)]/75">
        Convite para pregar, pedido de oração, aconselhamento ou qualquer outro assunto —
        estamos aqui para ouvir.
      </p>

      <div className="mt-10">
        <ContactForm />
      </div>
    </div>
  );
}
