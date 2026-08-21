export default function TermosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-petrol)]">
        Termos de Uso
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink)]/60">
        Última atualização: {new Date().toLocaleDateString("pt-BR")}
      </p>

      <div className="prose mt-8 max-w-none space-y-6 text-[var(--color-ink)]/90">
        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-petrol)]">
            1. Sobre o site
          </h2>
          <p>
            Este site é operado pelo projeto Jesus Ensina, liderado pelo Pastor João Luiz
            Silva, e distribui conteúdo cristão em formato de vídeo e e-book, tanto
            gratuito quanto pago.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-petrol)]">
            2. Materiais gratuitos
          </h2>
          <p>
            Os e-books identificados como "Grátis" são oferecidos sem custo, mediante
            cadastro de e-mail. O acesso é feito por link de download com validade
            limitada, enviado por e-mail.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-petrol)]">
            3. E-books pagos
          </h2>
          <p>
            Os e-books pagos são vendidos como oferta simbólica para sustento do projeto,
            no valor indicado em cada página de produto. O pagamento é processado com
            segurança pelo Mercado Pago. Após a confirmação do pagamento, o material é
            entregue automaticamente por e-mail, em formato PDF, com link de validade
            limitada.
          </p>
          <p>
            Por se tratar de conteúdo digital entregue imediatamente após a confirmação
            do pagamento, não há direito de arrependimento após o download do material,
            conforme praxe de mercado para produtos digitais. Em caso de problema técnico
            no recebimento, entre em contato pela nossa página de contato.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-petrol)]">
            4. Ofertas e doações via Pix
          </h2>
          <p>
            As ofertas realizadas na página "Oferta" são doações voluntárias para
            sustento do projeto, sem contrapartida de produto ou serviço. Doações não
            são reembolsáveis, salvo erro comprovado de valor ou duplicidade de
            transação.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-petrol)]">
            5. Uso do conteúdo
          </h2>
          <p>
            Os vídeos, textos e e-books produzidos pelo Jesus Ensina são protegidos por
            direitos autorais. O compartilhamento dos links originais é incentivado; a
            reprodução comercial do conteúdo sem autorização não é permitida.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-petrol)]">
            6. Contato
          </h2>
          <p>
            Dúvidas sobre estes termos podem ser enviadas pela nossa{" "}
            <a href="/contato" className="underline">página de contato</a>.
          </p>
        </section>

        <p className="text-sm text-[var(--color-ink)]/60">
          Este documento é um texto padrão de referência e não substitui a orientação de
          um advogado ou contador. Recomendamos revisão jurídica e fiscal antes de
          qualquer uso comercial em maior escala, especialmente quanto ao enquadramento
          tributário das vendas.
        </p>
      </div>
    </div>
  );
}
