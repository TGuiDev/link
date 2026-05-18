# Link

Encurtador de links sem login feito com Next.js, Tailwind e Supabase.

## Setup

1. Crie um projeto no Supabase.
2. Rode o SQL em `database/schema.sql` no SQL Editor.
3. Crie `.env.local` com:

```bash
NEXT_PUBLIC_APP_URL=https://link.guidev.site
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. Instale e rode:

```bash
npm install
npm run dev
```

## API

Base URL:

```txt
https://link.guidev.site
```

Todos os endpoints recebem e retornam JSON. Nao precisa de login nem token.

### Criar link

`POST /api/links`

Body:

| Campo | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| `url` | `string` | Sim | URL original. Se nao tiver protocolo, o sistema assume `https://`. |
| `slug` | `string` | Nao | Slug customizado com 3 a 48 caracteres. Aceita letras, numeros, `_` e `-`. |
| `customSlug` | `string` | Nao | Alternativa para `slug`, caso prefira esse nome no payload. |

Criar link randomico:

```bash
curl -X POST https://link.guidev.site/api/links \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://guidev.site\"}"
```

Criar link customizado:

```bash
curl -X POST https://link.guidev.site/api/links \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://guidev.site\",\"slug\":\"portfolio\"}"
```

Exemplo com JavaScript:

```ts
const response = await fetch("https://link.guidev.site/api/links", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    url: "https://guidev.site",
    slug: "portfolio"
  })
});

const link = await response.json();
console.log(link.shortUrl);
```

Resposta de sucesso (`201`):

```json
{
  "slug": "portfolio",
  "url": "https://guidev.site/",
  "shortUrl": "https://link.guidev.site/portfolio",
  "clicks": 0
}
```

Erros possiveis:

| Status | Motivo |
| --- | --- |
| `400` | URL invalida ou slug customizado fora do formato aceito. |
| `409` | Slug customizado ja esta em uso. |
| `500` | Erro inesperado no servidor ou Supabase sem configuracao. |
| `503` | Nao foi possivel gerar um slug randomico unico. |

### Consultar link

`GET /api/links/{slug}`

```bash
curl https://link.guidev.site/api/links/portfolio
```

Resposta de sucesso (`200`):

```json
{
  "slug": "portfolio",
  "url": "https://guidev.site/",
  "shortUrl": "https://link.guidev.site/portfolio",
  "clicks": 0
}
```

Resposta quando nao existe (`404`):

```json
{
  "error": "Link nao encontrado."
}
```

### Redirecionar

`GET /{slug}`

Abre o link encurtado e redireciona para a URL original.

```txt
https://link.guidev.site/portfolio
```

Cada acesso ao redirect chama a funcao `increment_link_clicks` no Supabase e incrementa o contador `clicks`.

## Deploy

Na Vercel, configure as mesmas variaveis de ambiente e aponte o dominio `link.guidev.site`.
