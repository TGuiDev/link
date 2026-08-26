# Política de Segurança

A segurança do **Link** e a proteção dos dados dos nossos usuários são prioridades fundamentais. Este documento descreve as diretrizes de segurança, o processo de reporte de vulnerabilidades e as melhores práticas para colaboradores e mantenedores.

---

## 🛡️ Versões Suportadas

Apenas a versão mais recente da branch `main` e releases ativas recebem patches de segurança.

| Versão | Suportada | Notas |
| :--- | :--- | :--- |
| `2.x` (main) | :white_check_mark: | Versão ativa de desenvolvimento (Link v2.0) |
| `< 2.0.0` | :x: | Não suportada |

---

## 🔒 Relatando uma Vulnerabilidade de Segurança

> [!CAUTION]
> **NUNCA** abra uma issue pública no GitHub para relatar uma vulnerabilidade de segurança explorável ou vazamento de credenciais.

Se você identificou uma potencial falha de segurança no projeto:

1. **GitHub Security Advisories (Recomendado)**:
   Acesse a aba **Security** > **Advisories** > **Report a vulnerability** no repositório do GitHub.
2. **Contato Privado**:
   Envie uma mensagem direta para o mantenedor principal através dos canais de contato listados no perfil do GitHub ([@TGuiDev](https://github.com/TGuiDev)).

### O que incluir no seu relatório:

- Descrição detalhada da vulnerabilidade encontrada.
- Tipo de falha (ex: Autenticação JWT, Injeção NoSQL, XSS, Quebra de Controle de Acesso, Exposição de Segredos).
- Passos reproduzíveis ou Prova de Conceito (PoC) simples.
- Impacto potencial estimado.
- Sugestão de correção (caso já possua uma ideia).

### Prazo de Resposta (SLA)

- **Confirmação inicial de recebimento**: até 48 horas.
- **Avaliação e triagem do impacto**: até 5 dias úteis.
- **Disponibilização de correção / patch**: prioritária de acordo com a severidade (CVSS).

---


## 🔑 Gerenciamento de Credenciais e Segredos

### Variáveis Críticas de Ambiente

| Variável | Finalidade | Restrição |
| :--- | :--- | :--- |
| `AUTH_SECRET` | Assinatura e verificação de tokens JWT de sessão | **Nunca expor.** Gerar string aleatória com 32+ bytes |
| `API_KEY_SECRET` | Assinatura e validação de chaves de API | **Nunca expor.** Manter em segredo no backend |
| `MONGODB_URI` | String de conexão com o banco de dados | **Nunca expor.** Não commitar com usuário/senha |
| `AUTH_GOOGLE_SECRET` | Segredo OAuth da aplicação Google Cloud | Manter exclusivo no ambiente do servidor |
| `AUTH_GITHUB_SECRET` | Segredo OAuth do GitHub Developer App | Manter exclusivo no ambiente do servidor |
| `AUTH_DISCORD_SECRET`| Segredo OAuth do Discord Developer Portal | Manter exclusivo no ambiente do servidor |

> [!IMPORTANT]
> Se qualquer segredo for acidentalmente commitado ou exposto em logs públicos:
> 1. Revogue o segredo imediatamente no provedor (Atlas, Google Cloud, GitHub, etc.).
> 2. Gere uma nova credencial.
> 3. Reescreva o histórico do Git se necessário ou rotacione as variáveis nas plataformas de deploy.

---

## 🧩 Melhores Práticas de Desenvolvimento Seguro

1. **Higienização de Inputs e Validação**:
   - Todas as URLs submetidas devem passar por validação de protocolo (`http://` ou `https://`) e bloqueio de esquemas perigosos (`javascript:`, `data:`, `file:`).
   - Slugs devem conter apenas caracteres alfanuméricos e hífens (`/^[a-zA-Z0-9_-]+$/`), prevenindo ataques de injeção ou conflitos de rotas.
2. **Autenticação & Sessões**:
   - Senhas são hasheadas com `bcryptjs` utilizando salt rounds adequados.
   - Tokens JWT são assinados usando `jose` com algoritmos criptográficos robustos (`HS256`/`A256GCM`) e tempos de expiração bem definidos.
   - Cookies de sessão devem ter os atributos `HttpOnly`, `SameSite=Lax` (ou `Strict`) e `Secure` (em produção).
3. **Controle de Acesso e Isolamento**:
   - Usuários só têm permissão para consultar, atualizar ou excluir links que pertençam ao seu próprio `userId`.
   - Endpoints autenticados validam a identidade a cada requisição.
4. **Proteção contra NoSQL Injection**:
   - Todas as queries MongoDB utilizam parâmetros tipados, evitando concatenação direta de payloads de requisição.
5. **Rate Limiting & DoS**:
   - Implementação de limites de requisições em endpoints públicos de redirecionamento e criação de links.
