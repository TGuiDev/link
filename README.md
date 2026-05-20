# Link

Encurtador de links feito com Next.js, Supabase e Tailwind CSS. O projeto inclui criação de links curtos, slugs customizados, dashboard autenticado, métricas, API com chave, documentação e QR Codes customizáveis.

![Link preview](public/meta-banner/link.png)

## Recursos

- Links curtos randômicos ou personalizados
- Criação pública pela home
- Dashboard autenticado para gerenciar links
- Contagem de cliques e eventos recentes
- Rankings por localidade e origem/referrer
- API key por usuário
- Documentação visual em `/documentacao`
- QR Code com presets, logo central, texto, moldura e download em PNG
- Metadata Open Graph/Twitter para previews sociais
- Supabase Auth com email/senha e providers sociais

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase Auth, Database e Realtime
- lucide-react

## Rodando Localmente

Clone o projeto e instale as dependências:

```bash
git clone https://github.com/TGuiDev/link.git
cd link
npm install
```

Crie um projeto no Supabase e execute o SQL em [database/schema.sql](database/schema.sql) pelo SQL Editor.

Depois crie um arquivo `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
API_KEY_SECRET=use-a-long-random-secret
```

Inicie o servidor:

```bash
npm run dev
```

Acesse:

```txt
http://localhost:3000
```

## Configurando o Supabase

No Supabase, habilite Authentication com email/senha. Em desenvolvimento, configure:

```txt
Site URL:
http://localhost:3000

Redirect URLs:
http://localhost:3000/auth/callback
http://localhost:3000/nova-senha
```

Em produção, adicione também:

```txt
https://seu-dominio.com/auth/callback
https://seu-dominio.com/nova-senha
```

Para login social, habilite os providers desejados em Authentication > Providers. O app já funciona com o fluxo do Supabase; cada provider precisa do client id/secret criado no console correspondente.

## Rotas

```txt
/                       Home para criar links
/login                  Login
/cadastro               Cadastro
/recuperar-senha        Recuperação de senha
/nova-senha             Definição de nova senha
/dashboard              Dashboard autenticado
/documentacao           Documentação da API
/{slug}                 Redirect do link curto
```

## Estrutura

```txt
src/app/              Rotas, páginas e endpoints do Next.js
src/components/       Componentes de interface reutilizados pelas telas
src/components/dashboard/ Dashboard autenticado
src/components/documentation/ Documentação visual da API
src/lib/              Regras de domínio, Supabase, API keys e helpers
database/             Schema SQL do Supabase
public/               Logos, imagens de preview e assets estáticos
.github/              Templates de issue e pull request
```

## Dashboard

Links criados no dashboard ficam vinculados ao usuário autenticado. O painel possui seções para:

- Visão geral
- Links
- API
- Conta

As métricas de localização dependem dos headers enviados pela hospedagem. Na Vercel, o app lê:

```txt
x-vercel-ip-country
x-vercel-ip-country-region
x-vercel-ip-city
```

## API

Base URL em produção:

```txt
https://link.guidev.site
```

Em desenvolvimento:

```txt
http://localhost:3000
```

### Autenticação

Alguns endpoints podem ser usados publicamente, mas integrações devem usar a API key disponível no dashboard.

Headers aceitos:

```txt
X-API-Key: link_sua_api_key
```

ou:

```txt
Authorization: Bearer link_sua_api_key
```

### Criar Link

```txt
POST /api/links
```

Body:

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `url` | `string` | Sim | URL original. Se não tiver protocolo, assume `https://`. |
| `slug` | `string` | Não | Slug customizado com 3 a 48 caracteres. |
| `customSlug` | `string` | Não | Alias de `slug`. |

Exemplo:

```bash
curl -X POST https://link.guidev.site/api/links \
  -H "Content-Type: application/json" \
  -H "X-API-Key: link_sua_api_key" \
  -d "{\"url\":\"https://guidev.site\",\"slug\":\"portfolio\"}"
```

Resposta:

```json
{
  "id": "4f5b1d1a-7f26-4e49-9f4d-1f6b10e7725d",
  "slug": "portfolio",
  "url": "https://guidev.site/",
  "shortUrl": "https://link.guidev.site/portfolio",
  "clicks": 0
}
```

### Consultar Link

```txt
GET /api/links/{slug}
```

```bash
curl https://link.guidev.site/api/links/portfolio
```

### Dashboard

```txt
GET /api/dashboard
```

```bash
curl https://link.guidev.site/api/dashboard \
  -H "X-API-Key: link_sua_api_key"
```

### Estatísticas Públicas

```txt
GET /api/stats
```

Retorna o total público de links criados.

## QR Code

No dashboard, cada link pode gerar um QR Code customizado com:

- Presets visuais
- Cor do QR
- Cor de fundo
- Moldura
- Texto em cima ou embaixo
- Logo central
- Download em PNG
- Aviso de legibilidade para evitar QR Codes difíceis de escanear

## Deploy

O deploy recomendado é na Vercel.

Configure as variáveis de ambiente no painel da Vercel:

```bash
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
API_KEY_SECRET=use-a-long-random-secret
```

Depois configure no Supabase:

```txt
Site URL:
https://seu-dominio.com

Redirect URLs:
https://seu-dominio.com/auth/callback
https://seu-dominio.com/nova-senha
```

## Segurança

Antes de publicar o repositório:

- Nunca commite `.env` ou `.env.local`
- Rode `git status` antes do commit
- Troque chaves expostas acidentalmente
- Mantenha `SUPABASE_SERVICE_ROLE_KEY` apenas no servidor
- Use um `API_KEY_SECRET` forte em produção

## Scripts

```bash
npm run dev      # inicia o app localmente
npm run build    # build de produção
npm run start    # roda o build
npm run lint     # lint do projeto
```

## Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.
