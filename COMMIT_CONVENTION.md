# Convenção de Commits e Padrões Git

Este projeto segue a especificação [Conventional Commits v1.0.0](https://www.conventionalcommits.org/pt-br/v1.0.0/) para manter um histórico de commits legível, rastreável e preparado para versionamento semântico automatizado.

---

## 1. Estrutura da Mensagem de Commit

Cada mensagem de commit deve seguir a seguinte estrutura:

```txt
<tipo>(<escopo opcional>): <descrição curta no imperativo/presente>

[corpo opcional explicando o motivo e contexto da mudança]

[rodapé(s) opcional(is) referenciando issues ou breaking changes]
```

### Exemplo Básico

```txt
feat(qr-code): adicionar opção de exportação em SVG e PNG transparente
```

### Exemplo Completo com Corpo e Rodapé

```txt
fix(auth): invalidar token de sessão ao trocar de senha

Garante que sessões ativas em outros navegadores sejam encerradas
imediatamente após a alteração de credenciais do usuário.

Closes #42
```

---

## 2. Tipos de Commit Permitidos

| Tipo | Descrição | Exemplo |
| :--- | :--- | :--- |
| **`feat`** | Adiciona uma nova funcionalidade ou recurso ao produto | `feat(api): adicionar endpoint de estatísticas por UTM` |
| **`fix`** | Corrige um bug ou comportamento inesperado | `fix(redirect): tratar slugs com caracteres maiúsculos` |
| **`docs`** | Alterações exclusivamente em documentação | `docs: atualizar instruções de deploy com nixpacks` |
| **`style`** | Alterações puramente visuais/formatação sem alteração de lógica (espaços, ponto e vírgula, css cosmetic) | `style(dashboard): ajustar espaçamento dos cards de métricas` |
| **`refactor`** | Refatoração de código sem adicionar funcionalidade nem corrigir bug | `refactor(db): extrair conexão singleton do MongoDB` |
| **`perf`** | Melhorias focadas exclusivamente em desempenho | `perf(links): adicionar índice composto para buscas por usuário` |
| **`test`** | Adição ou correção de testes automatizados | `test(jwt): adicionar testes de expiração de token` |
| **`build`** | Mudanças que afetam o sistema de build ou dependências externas | `build: atualizar next para versão 16.2.6` |
| **`ci`** | Alterações em arquivos e scripts de CI/CD (GitHub Actions) | `ci: adicionar workflow de verificação de segurança` |
| **`chore`** | Tarefas de manutenção, ferramentas, configurações que não afetam src ou testes | `chore: atualizar .gitignore e editorconfig` |
| **`revert`** | Reverte um commit anterior | `revert: feat(auth): reverter login via sms` |

---

## 3. Escopos Recomendados

O escopo contextualiza a parte do sistema afetada:

- **`auth`**: Autenticação, sessões, JWT, login social, senhas.
- **`links`**: Criação, edição, exclusão e busca de links.
- **`redirect`**: Middleware de redirecionamento e captura de métricas.
- **`analytics`**: Contagem de cliques, rankings, geolocalização, referrers.
- **`qr-code`**: Geração, customização, presets e download de QR Codes.
- **`dashboard`**: Telas internas do painel do usuário.
- **`api`**: Endpoints REST públicos e privados (`/api/*`).
- **`db`**: Conexão com MongoDB, schemas, coleções e índices.
- **`ui`**: Componentes compartilhados, design system, modais, botões.
- **`deps`**: Atualização ou gerenciamento de dependências.

---

## 4. Breaking Changes (Mudanças Incompatíveis)

Sempre que uma mudança quebrar compatibilidade com versões anteriores da API ou do banco de dados:

1. Adicione uma exclamação `!` logo após o tipo/escopo.
2. Adicione a seção `BREAKING CHANGE:` no rodapé detalhando o que quebrou e como migrar.

### Exemplo de Breaking Change

```txt
feat(api)!: renomear campo `customSlug` para `slug` no payload do POST /api/links

BREAKING CHANGE: O campo `customSlug` foi descontinuado e não será mais aceito. Use exclusivamente `slug`.
```

---

## 5. Padrão de Nomenclatura de Branches

Para manter consistência com as regras de commit, utilize o seguinte padrão para criação de branches:

```txt
<categoria>/<descricao-curta-kebab-case>
```

### Prefixos de Branch

- **`feat/`**: Nova funcionalidade (`feat/qr-code-presets`, `feat/export-csv`)
- **`fix/`**: Correção de bug (`fix/jwt-expiration`, `fix/redirect-trailing-slash`)
- **`refactor/`**: Melhoria estrutural de código (`refactor/mongo-client`)
- **`docs/`**: Melhorias na documentação (`docs/api-guide`)
- **`chore/`**: Manutenção geral (`chore/bump-dependencies`)
- **`perf/`**: Otimização de performance (`perf/links-caching`)

---

## 6. Boas Práticas ao Commitar

1. **Commits Atômicos**: Cada commit deve representar uma única unidade lógica de trabalho. Evite commitar 10 alterações diferentes em um só commit.
2. **Mensagem Clara**: Use o infinitivo ou presente imperativo no título (ex: `feat: adicionar...` ou `feat: add...`).
3. **Nunca comite credenciais**: Verifique com `git status` e `git diff` antes de commitar arquivos que possam conter tokens, senhas ou `.env`.
4. **Valide antes de commitar**: Execute `npm run lint` e `npm run typecheck` localmente antes de enviar suas branches para o repositório remoto.
