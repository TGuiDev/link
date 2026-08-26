# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Added
- Estrutura completa de governança do repositório (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `COMMIT_CONVENTION.md`, `ARCHITECTURE.md`).
- Pipeline de CI/CD automatizada com GitHub Actions para Lint, TypeScript Typecheck e Next.js Build.
- Esteira de auditoria contínua de segurança de dependências (`security-audit.yml`) e CodeQL (`codeql.yml`).
- Configuração do Dependabot para monitoramento de dependências npm e GitHub Actions.
- Padronização de ambiente de desenvolvimento com `.editorconfig`, `.gitattributes` e `.vscode/`.
- Script `npm run typecheck` para validação estática de tipos.
- Mapeamento de responsáveis com `.github/CODEOWNERS`.
- Formulários estruturados de Issue e Pull Request.

### Changed
- Atualização da licença do projeto de MIT para **GNU AGPLv3** (Affero General Public License v3.0) para proteger contra uso comercial fechado e derivados de SaaS concorrentes.

---

## [2.0.0] - 2026-08-26

### Added
- Lançamento da nova geração (v2.0) do encurtador de links com slugs aleatórios ou personalizados.
- Criação pública e criação autenticada vinculada ao usuário.
- Painel de controle (Dashboard) com visualização e gerenciamento de links.
- Métricas e estatísticas em tempo real (contagem de cliques, origem/referrer e geolocalização).
- Gerador e editor de QR Codes customizáveis com presets, molduras e exportação em PNG.
- Autenticação própria com JWT (via `jose` e `bcryptjs`) e provedores sociais (Google, GitHub, Discord).
- Gestão de chaves de API (`link_*`) para integração com serviços externos.
- Documentação interativa da API na rota `/documentacao`.
- Página pública de novidades e histórico de lançamentos na rota `/changelog`.
- Suporte para deploy via Vercel e Nixpacks (`nixpacks.toml`).

[Unreleased]: https://github.com/TGuiDev/link/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/TGuiDev/link/releases/tag/v2.0.0
