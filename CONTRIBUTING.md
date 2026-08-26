# Guia de Contribuição

Agradecemos o seu interesse em contribuir com o **Link**! 🎉  
Este documento define as diretrizes para desenvolvimento, boas práticas de código, convenções de commits e o processo de abertura de Pull Requests.

---

## 🚀 Como Começar

### Pré-requisitos

- **Node.js**: versão 20.x ou 22.x (LTS recomendada)
- **npm**: versão 10+
- **MongoDB**: Instância local rodando (`mongodb://localhost:27017`) ou conexão com MongoDB Atlas
- **Git**: instalado e configurado

### Passo a Passo Local

1. **Faça um Fork** do repositório no GitHub.
2. **Clone** o seu fork localmente:
   ```bash
   git clone https://github.com/SEU_USUARIO/link.git
   cd link
   ```
3. **Crie uma branch** para sua alteração a partir da `main`:
   ```bash
   git checkout -b feat/minha-melhoria
   ```
4. **Instale as dependências**:
   ```bash
   npm install
   ```
5. **Configure as variáveis de ambiente**:
   ```bash
   cp .env.example .env.local
   ```
   Edite o `.env.local` com as configurações do seu ambiente de teste local.
6. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 📋 Regras de Commits e Branches

Adotamos a especificação [Conventional Commits](COMMIT_CONVENTION.md).

### Nomenclatura de Branches

- `feat/<nome-da-feature>`
- `fix/<descricao-do-bug>`
- `refactor/<nome-do-modulo>`
- `docs/<pagina-ou-assunto>`
- `chore/<tarefa-de-manutencao>`

### Exemplos de Commits

```txt
feat(qr-code): adicionar presets de cores predefinidas
fix(links): corrigir validacao de url sem protocolo
docs(api): atualizar documentacao de endpoints de métricas
```

Para mais detalhes e lista de tipos/escopos, consulte o arquivo [COMMIT_CONVENTION.md](COMMIT_CONVENTION.md).

---

## 🧪 Validação e Qualidade de Código

Antes de abrir um Pull Request, garanta que todos os testes e verificações estáticas passam localmente:

```bash
# 1. Verificar regras de linting (ESLint)
npm run lint

# 2. Validar tipagem do TypeScript
npm run typecheck

# 3. Validar build de produção do Next.js
npm run build
```

> [!IMPORTANT]
> Pull Requests com falhas no `lint`, `typecheck` ou `build` não serão aprovados na esteira de CI.

---

## 🔒 Regras de Segurança e Privacidade

- **Nunca comite arquivos de ambiente** (`.env`, `.env.local`, `.env.production`).
- **Nunca inclua credenciais reais** (tokens de OAuth, `AUTH_SECRET`, `API_KEY_SECRET`, strings de conexão do MongoDB Atlas com usuário/senha).
- Utilize sempre `crypto` / `bcryptjs` / `jose` para manipulação de senhas e tokens criptografados.
- Se encontrar uma vulnerabilidade de segurança, siga as orientações em [SECURITY.md](SECURITY.md).

---

## 🔄 Fluxo de Pull Request (PR)

1. Mantenha sua branch sincronizada com a `main` mais recente antes de abrir o PR:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
2. Abra o Pull Request no GitHub utilizando o template padrão fornecido.
3. Preencha todos os campos do template:
   - Resumo das alterações
   - Tipo de mudança
   - Passos para testar
   - Evidências visuais (prints ou vídeos) para alterações na UI
   - Checklist de qualidade
4. Aguarde a validação automatizada das GitHub Actions (CI).
5. Responda aos comentários da revisão de código (Code Review) se solicitadas melhorias.

---

## 💬 Comunicação e Resolução de Dúvidas

- Dúvidas sobre código ou sugestões podem ser abertas na aba de **Issues** ou **Discussions**.
- Para bugs, abra uma issue utilizando o template de [Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml).
- Para ideias de novas funcionalidades, use o template de [Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml).

Todos os participantes devem aderir ao nosso [Código de Conduta](CODE_OF_CONDUCT.md).
