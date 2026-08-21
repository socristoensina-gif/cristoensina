export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-petrol)]">
        Política de Privacidade
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink)]/60">
        Última atualização: {new Date().toLocaleDateString("pt-BR")}
      </p>

      <div className="prose mt-8 max-w-none space-y-6 text-[var(--color-ink)]/90">
        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-petrol)]">
            1. Quem somos
          </h2>
          <p>
            O Jesus Ensina é um projeto de ensino cristão liderado pelo Pastor João Luiz
            Silva. Este site (jesusensina.com.br) é o canal oficial de distribuição de
            conteúdo, e-books e recebimento de ofertas do projeto.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-petrol)]">
            2. Quais dados coletamos
          </h2>
          <ul className="list-disc pl-6">
            <li>Nome e e-mail, quando você baixa um material gratuito ou faz uma compra</li>
            <li>Telefone, cidade e estado, quando você preenche o formulário de contato</li>
            <li>Dados de pagamento — processados diretamente pelo Mercado Pago, nunca armazenados por nós</li>
            <li>Dados de navegação básicos, para o funcionamento do site e do carrinho de compras</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-petrol)]">
            3. Para que usamos seus dados
          </h2>
          <ul className="list-disc pl-6">
            <li>Enviar o material gratuito ou comprado que você solicitou</li>
            <li>Responder mensagens enviadas pelo formulário de contato</li>
            <li>Enviar conteúdo e novidades do projeto, quando você autoriza o recebimento</li>
            <li>Cumprir obrigações legais e fiscais relacionadas às vendas realizadas</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-petrol)]">
            4. Com quem compartilhamos
          </h2>
          <p>
            Não vendemos nem alugamos seus dados a terceiros. Compartilhamos informações
            estritamente necessárias com prestadores de serviço que operam o site
            (Supabase, para armazenamento; Mercado Pago, para pagamentos; Resend, para
            envio de e-mails), cada um sujeito às suas próprias políticas de segurança.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-petrol)]">
            5. Seus direitos (LGPD)
          </h2>
          <p>
            Você pode solicitar, a qualquer momento, a confirmação, correção, exclusão
            ou portabilidade dos seus dados pessoais, entrando em contato pela nossa{" "}
            <a href="/contato" className="underline">página de contato</a>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-petrol)]">
            6. Cookies
          </h2>
          <p>
            Usamos cookies essenciais para manter o funcionamento do carrinho de compras
            e da área administrativa. Não usamos cookies de rastreamento publicitário.
          </p>
        </section>

        <p className="text-sm text-[var(--color-ink)]/60">
          Este documento é um texto padrão de referência e não substitui a orientação de
          um advogado. Recomendamos revisão jurídica antes de qualquer uso comercial em
          maior escala.
        </p>
      </div>
    </div>
  );
}
