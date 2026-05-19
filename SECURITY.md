# Segurança

Se encontrar uma vulnerabilidade, evite abrir uma issue pública com detalhes sensíveis.

## Dados sensíveis

Nunca compartilhe:

- `SUPABASE_SERVICE_ROLE_KEY`
- `API_KEY_SECRET`
- tokens de sessão
- arquivos `.env`
- dados privados de usuários

## Boas práticas para deploy

- Use um `API_KEY_SECRET` forte em produção.
- Mantenha `SUPABASE_SERVICE_ROLE_KEY` apenas no servidor.
- Revise as policies de RLS no Supabase.
- Troque chaves imediatamente se alguma for exposta.

## Reportando

Abra uma issue sem detalhes exploráveis ou entre em contato diretamente com o mantenedor do projeto.
