# ATUALIZAÇÃO DO SITE — GUIA DE INTEGRAÇÃO

## O que mudou hoje

1. **Menu com "Início"** — link explícito no Header, além do clique na logo
2. **Foto do pastor na home** — troca do logo grande pela foto circular (`/public/pastor.jpg`)
3. **Botões de compartilhamento** — WhatsApp, Facebook, X, compartilhar nativo e copiar link
4. **Carrinho de compras** — múltiplos e-books numa só compra (`/carrinho`)
5. **Pix sem valor fixo** — campo de valor livre + opção "Sem valor definido" na página `/oferta`
6. **Painel administrativo** (`/admin`) — login + cadastro de e-books com upload de PDF e capa direto do navegador, sem precisar mexer em SQL
7. **Aviso de área de membros** — banner na home ("em breve")
8. **Aviso de cookies + Política de Privacidade + Termos de Uso**

---

## PASSO 1 — Copiar os arquivos
Extraia o zip e copie por cima do projeto (substituindo quando perguntado):
```
app/          → substitui (novas páginas: carrinho, privacidade, termos, admin/*)
components/   → substitui
lib/          → substitui (novo lib/supabase/admin.ts)
middleware.ts → novo arquivo, vai na RAIZ do projeto (mesmo nível de package.json)
supabase/functions/create-order/index.ts → substitui (agora aceita carrinho)
```

**Sua foto:** confirme que `public/pastor.jpg` já está na pasta `public/` do projeto (você mencionou já ter colocado — só confirme o nome exato do arquivo bate com `pastor.jpg`, incluindo a extensão).

## PASSO 2 — Adicionar 1 variável de ambiente nova (crítica para o admin funcionar)
No `.env.local` **e** no painel da Vercel:
```
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico_do_supabase
```
**Onde pegar:** Supabase > Project Settings > API > "service_role" (a chave secreta, diferente da "anon"). **Nunca** coloque o prefixo `NEXT_PUBLIC_` nela — precisa ficar invisível para o navegador.

## PASSO 3 — Criar seu usuário administrador
- [ ] No Supabase, vá em **Authentication > Users > Add user**
- [ ] Crie com seu e-mail e uma senha forte
- [ ] Marque **"Auto Confirm User"** (evita precisar clicar em link de confirmação)
- [ ] **Importante:** vá em **Authentication > Settings** e **desative "Allow new users to sign up"** — isso impede que qualquer pessoa se cadastre sozinha e acesse `/admin`

## PASSO 4 — Deploy da Edge Function atualizada
```powershell
supabase functions deploy create-order
```

## PASSO 5 — Instalar, testar local e publicar
```powershell
npm install
npm run build
```
Se o build passar sem erro:
```powershell
git add .
git commit -m "carrinho, admin, pix livre, compartilhamento, paginas legais"
git push
```

## PASSO 6 — Testar o painel admin
- [ ] Acesse `jesusensina.com.br/admin` (ou `localhost:3000/admin` local)
- [ ] Faça login com o usuário criado no Passo 3
- [ ] Cadastre um e-book de teste com PDF e capa reais
- [ ] Confira se ele aparece em `/loja`

---

## Pendências que ainda dependem de você preencher
- [ ] As variáveis de redes sociais (`NEXT_PUBLIC_FACEBOOK_URL` etc.) — sem isso os ícones do rodapé/página de redes continuam sem link real
- [ ] `NEXT_PUBLIC_PIX_KEY`, `NEXT_PUBLIC_PIX_MERCHANT_NAME`, `NEXT_PUBLIC_PIX_MERCHANT_CITY` — sua chave Pix real
- [ ] `YOUTUBE_CHANNEL_ID` — para a página `/videos` funcionar

## O que ficou de fora por hoje (próxima sessão, se quiser)
- Edição de e-book já publicado (hoje só dá para publicar/despublicar — para editar texto/preço, ainda é via SQL ou recriar)
- Área de membros com culto/escola dominical ao vivo (hoje é só o aviso "em breve")
- Confirmação de e-mail duplicado no formulário de contato
