# Link

Encurtador de links feito com Next.js, MongoDB e Tailwind CSS. O projeto inclui criação de links curtos, slugs customizados, dashboard autenticado, métricas, API com chave, documentação e QR Codes customizáveis.

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
- Autenticação própria com email/senha e providers sociais (Google, GitHub e Discord)

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- MongoDB (Database)
- Jose & Bcryptjs (Autenticação JWT segura & Hash de senhas)
- lucide-react

## Rodando Localmente

Clone o projeto e instale as dependências:

```bash
git clone https://github.com/TGuiDev/link.git
cd link
npm install
```

Crie um arquivo `.env` ou `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Conexão MongoDB (Atlas ou Local)
MONGODB_URI=mongodb://localhost:27017/link
MONGODB_DB=link

# Chaves Secretas
AUTH_SECRET=use-a-long-random-secret-for-jwt-session
API_KEY_SECRET=use-a-long-random-secret-for-api-keys

# OAuth (Opcional)
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_DISCORD_ID=
AUTH_DISCORD_SECRET=
```

Inicie o servidor:

```bash
npm run dev
```

Acesse:

```txt
http://localhost:3000
```

## Configurando OAuth (Google, GitHub, Discord)

Para habilitar login social, crie as aplicações nos consoles de desenvolvedores e adicione as Redirect/Callback URLs:

- **Google**: `http://localhost:3000/api/auth/oauth/google/callback`
- **GitHub**: `http://localhost:3000/api/auth/oauth/github/callback`
- **Discord**: `http://localhost:3000/api/auth/oauth/discord/callback`

Em produção, troque `http://localhost:3000` pelo seu domínio principal (ex: `https://link.guidev.site/api/auth/oauth/google/callback`).

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
src/lib/              Regras de domínio, MongoDB, Auth, API keys e helpers
database/             Scripts de configuração e índices do MongoDB
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
  "id": "673f4e29...",
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

O deploy recomendado é na Vercel com banco MongoDB Atlas.

Configure as variáveis de ambiente no painel da Vercel:

```bash
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/link?retryWrites=true&w=majority
MONGODB_DB=link
AUTH_SECRET=sua-chave-secreta-forte
API_KEY_SECRET=sua-chave-secreta-forte
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
AUTH_DISCORD_ID=...
AUTH_DISCORD_SECRET=...
```

## Segurança

Antes de publicar o repositório:

- Nunca commite `.env` ou `.env.local`
- Rode `git status` antes do commit
- Troque chaves expostas acidentalmente
- Use um `AUTH_SECRET` e `API_KEY_SECRET` fortes em produção

## Scripts

```bash
npm run dev      # inicia o app localmente
npm run build    # build de produção
npm run start    # roda o build
npm run lint     # lint do projeto
```

## Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.
