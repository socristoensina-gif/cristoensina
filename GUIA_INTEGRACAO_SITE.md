# SITE COMPLETO "JESUS ENSINA" — GUIA DE INTEGRAÇÃO

## O que foi construído hoje

| Página | Caminho | Função |
|---|---|---|
| Início | `/` | Hero, anúncios (lives/campanhas), vídeos recentes, e-books em destaque, CTA de oferta |
| Vídeos | `/videos` | Grade com os vídeos do canal do YouTube (via RSS, sem precisar de API key) |
| Redes Sociais | `/redes` | Lista de todas as redes com link direto |
| Loja | `/loja` | Catálogo completo, com filtro por tema |
| Ficha do e-book | `/loja/[slug]` | Descrição + botão de download grátis ou compra |
| Materiais Grátis | `/gratis` | Só os e-books gratuitos, para captura de lista |
| Oferta | `/oferta` | QR Code Pix real (gerado no navegador, padrão oficial do Banco Central) |
| Contato | `/contato` | Formulário com as 5 categorias (convite p/ pregar, oração, aconselhamento, ajuda, doação) |
| Obrigado | `/obrigado` | Retorno pós-pagamento do Mercado Pago |
| Download | `/download/[token]` | Redireciona para a Edge Function que entrega o arquivo |

**Tema:** sempre claro — `color-scheme: light only` no CSS bloqueia qualquer tema escuro automático do navegador/celular do visitante.

---

## PASSO 1 — Rodar o SQL adicional
No SQL Editor do Supabase, cole e rode o conteúdo de `sql/002_contact_and_announcements.sql` (cria as tabelas `contact_messages` e `announcements`, que ainda não existiam no schema de ontem).

## PASSO 2 — Instalar as dependências novas
Dentro de `H:\PRODUCAO-MENSAL\cristo-ensina-site`:
```powershell
npm install @supabase/ssr qrcode --legacy-peer-deps
npm install --save-dev @types/qrcode --legacy-peer-deps
```

## PASSO 3 — Copiar os arquivos para o projeto
Copie (substituindo se já existir) estas pastas/arquivos do pacote entregue para dentro do seu projeto:
```
app/            → substitui inteiro (inclui layout.tsx e globals.css novos)
components/     → nova pasta
lib/            → nova pasta
public/logo.png → sua logo
sql/            → guardar como referência, não faz parte do site em si
```

**Atenção:** isso substitui o `app/page.tsx` padrão do Next.js pela nova página inicial — é esperado, é para isso mesmo.

## PASSO 4 — Configurar `next.config.ts`
As imagens vêm de fora (YouTube, Supabase Storage) — o Next.js bloqueia isso por padrão. Edite `next.config.ts` na raiz do projeto:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
```

## PASSO 5 — Variáveis de ambiente
Adicione estas ao `.env.local` (PC, para testar) **e** ao painel da Vercel (Settings > Environment Variables):

```
# Já devem existir (verificar se a integração Vercel-Supabase já criou):
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Novas — redes sociais (preencha com os links reais)
NEXT_PUBLIC_YOUTUBE_URL=https://youtube.com/@seucanal
NEXT_PUBLIC_FACEBOOK_URL=https://facebook.com/pastorjoaoluizsilva
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/JesusEnsina_Oficial
NEXT_PUBLIC_TIKTOK_URL=https://tiktok.com/@seuusuario
NEXT_PUBLIC_KWAI_URL=https://kwai.com/@seuusuario
NEXT_PUBLIC_WHATSAPP_URL=https://wa.me/5521XXXXXXXXX

# Novo — ID do canal do YouTube (não é o @handle!)
# Como achar: abra seu canal no navegador > "Sobre" > copie o link que aparece
# em "Compartilhar canal" — o ID começa com "UC..."
YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxxxxxx

# Novo — dados do Pix (aparecem no QR Code)
NEXT_PUBLIC_PIX_KEY=sua_chave_pix_aqui
NEXT_PUBLIC_PIX_MERCHANT_NAME=JESUS ENSINA
NEXT_PUBLIC_PIX_MERCHANT_CITY=RIO DE JANEIRO
```

**Sobre a chave Pix:** pode ser CPF, CNPJ, e-mail, telefone ou chave aleatória — a mesma que você já usa na sua conta do Mercado Pago ou banco. `PIX_MERCHANT_NAME` e `PIX_MERCHANT_CITY` são exigências do formato oficial do Banco Central (sem acento, sem caracteres especiais — o código já trata isso automaticamente).

## PASSO 6 — Cadastrar pelo menos 1 tema e 2 e-books de teste
```sql
insert into themes (slug, title) values ('perdao-familiar', 'Perdão dentro de casa');

insert into ebooks (theme_id, slug, title, description, file_path, price_cents, status)
select id, 'perdao-familiar-gratis', 'Perdão: o primeiro passo', 'Um guia rápido sobre perdão em família.', 'teste/perdao-gratis.pdf', 0, 'published'
from themes where slug = 'perdao-familiar';

insert into ebooks (theme_id, slug, title, description, file_path, price_cents, status)
select id, 'perdao-familiar-completo', 'Perdão: o caminho completo', 'Aprofundamento completo sobre perdão, com aplicação prática.', 'teste/perdao-pago.pdf', 1000, 'published'
from themes where slug = 'perdao-familiar';
```
*(depois, suba um PDF de teste em cada `file_path` correspondente, pela interface do Storage no Supabase)*

## PASSO 7 — Cadastrar 1 anúncio de teste (live ou campanha)
```sql
insert into announcements (type, title, description, link_url, is_active)
values ('live', 'Live de Oração — Toda Quinta às 20h', 'Momento de oração ao vivo com a comunidade Jesus Ensina.', 'https://youtube.com/@seucanal/live', true);
```

## PASSO 8 — Rodar local e testar
```powershell
npm run dev
```
Abra `http://localhost:3000` e confira: página inicial carregando, `/loja` mostrando os 2 e-books de teste, `/contato` enviando mensagem, `/oferta` mostrando o QR Code.

## PASSO 9 — Publicar
```powershell
git add .
git commit -m "site completo: home, loja, videos, contato, oferta"
git push
```
A Vercel publica automaticamente a cada push — não precisa fazer nada manual lá.

---

## Pendências conhecidas (não travam o lançamento, mas valem resolver em breve)
- [ ] Trocar `YOUTUBE_CHANNEL_ID` pelo ID real do seu canal
- [ ] Preencher os links reais de todas as redes sociais
- [ ] Confirmar a chave Pix real (a que você já usa no Mercado Pago ou banco)
- [ ] Substituir os e-books de teste pelos primeiros e-books reais + capas
- [ ] Um painel administrativo simples para você mesmo cadastrar e-books/anúncios sem precisar mexer em SQL toda vez (posso construir isso numa próxima sessão)
