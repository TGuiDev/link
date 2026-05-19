# Contribuindo

Obrigado por considerar contribuir com o Link.

## Como começar

1. Faça um fork do repositório.
2. Crie uma branch a partir da `main`.
3. Instale as dependências com `npm install`.
4. Configure o `.env.local` usando `.env.example` como base.
5. Rode o projeto com `npm run dev`.

## Antes de abrir um PR

Rode:

```bash
npm run lint
npm run build
```

Também confira:

- Não incluiu `.env`, tokens ou chaves reais.
- A UI continua responsiva.
- Mudanças de API foram refletidas na documentação.
- Mudanças de banco foram adicionadas em `database/schema.sql`.

## Padrão de commits

Prefira commits curtos e claros:

```txt
feat: add QR code presets
fix: prevent dashboard realtime duplicate channel
docs: update API setup guide
```

## Abrindo issues

Use os templates disponíveis:

- Bug report para problemas
- Feature request para melhorias

Inclua prints, logs e passos de reprodução sempre que possível.
