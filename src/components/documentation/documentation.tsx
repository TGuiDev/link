"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Code2,
  Copy,
  Globe,
  HelpCircle,
  KeyRound,
  Layers,
  Lock,
  Search,
  Shield,
  Sparkles,
  Zap
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { getCachedNavbarUser, loadNavbarUser, type NavbarUser } from "@/lib/navbar-user";

type Theme = "light" | "dark";
type Language = "curl" | "javascript" | "python" | "php";

const baseUrl = "https://link.guidev.site";

interface DocNavCategory {
  title: string;
  items: {
    id: string;
    label: string;
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    icon?: ReactNode;
  }[];
}

const docNavigation: DocNavCategory[] = [
  {
    title: "Primeiros Passos",
    items: [
      { id: "visao-geral", label: "Visão Geral", icon: <Sparkles size={14} /> },
      { id: "autenticacao", label: "Autenticação", icon: <KeyRound size={14} /> },
      { id: "boas-praticas", label: "Boas Práticas & Headers", icon: <Shield size={14} /> }
    ]
  },
  {
    title: "Endpoints de Links",
    items: [
      { id: "criar-link", label: "Criar Link Curto", method: "POST" },
      { id: "consultar-link", label: "Consultar Link", method: "GET" },
      { id: "atualizar-link", label: "Atualizar / Editar Link", method: "PATCH" },
      { id: "excluir-link", label: "Excluir Link", method: "DELETE" }
    ]
  },
  {
    title: "Métricas & Painel",
    items: [
      { id: "obter-dashboard", label: "Dashboard & Analytics", method: "GET" },
      { id: "stats-publicas", label: "Estatísticas Públicas", method: "GET" }
    ]
  },
  {
    title: "Segurança & Redirecionamento",
    items: [
      { id: "resetar-api-key", label: "Resetar Chave de API", method: "POST" },
      { id: "redirecionamento", label: "Motor de Redirecionamento", method: "GET" }
    ]
  },
  {
    title: "Referência",
    items: [
      { id: "status-erros", label: "Erros & Códigos HTTP", icon: <HelpCircle size={14} /> }
    ]
  }
];

export function Documentation() {
  const cachedNavbarUser = getCachedNavbarUser();
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const savedTheme = window.localStorage.getItem("link-theme");
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
    return "dark";
  });

  const [activeSection, setActiveSection] = useState("visao-geral");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedText, setCopiedText] = useState("");
  const [navbarUser, setNavbarUser] = useState<NavbarUser | null>(cachedNavbarUser ?? null);

  useEffect(() => {
    if (cachedNavbarUser === undefined) {
      loadNavbarUser().then((user) => {
        setNavbarUser(user);
      });
    }
  }, [cachedNavbarUser]);

  // Observer de rolagem para destacar a seção ativa no menu lateral
  useEffect(() => {
    const handleScroll = () => {
      const allSections = docNavigation.flatMap((cat) => cat.items.map((item) => item.id));
      const scrollPosition = window.scrollY + 200;

      for (const sectionId of allSections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    window.localStorage.setItem("link-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedText(text);
    window.setTimeout(() => setCopiedText(""), 2000);
  }

  const filteredNav = useMemo(() => {
    if (!searchQuery.trim()) return docNavigation;
    const query = searchQuery.toLowerCase();

    return docNavigation
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.id.toLowerCase().includes(query) ||
            item.method?.toLowerCase().includes(query)
        )
      }))
      .filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  return (
    <main className={theme === "dark" ? "dark" : ""}>
      <section className="min-h-screen bg-zinc-50/70 text-zinc-950 transition-colors duration-200 ease-out dark:bg-zinc-950 dark:text-zinc-100">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 md:px-8">
          <Navbar theme={theme} onToggleTheme={toggleTheme} user={navbarUser} />

          {/* Header Compacto da Documentação */}
          <div className="mt-8 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200/80 dark:border-zinc-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
                  Documentação da API
                </h1>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  v2.0
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Referência técnica e especificações completas de endpoints REST.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-zinc-950 px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                <KeyRound size={13} />
                <span>Minha API Key</span>
              </Link>
              <a
                href="https://github.com/TGuiDev/link"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-bold text-zinc-700 shadow-2xs transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <Code2 size={13} />
                <span>GitHub</span>
              </a>
            </div>
          </div>

          {/* Grid Principal: Sidebar + Conteúdo */}
          <div className="grid gap-10 lg:grid-cols-[280px_1fr] pb-16">
            {/* Sidebar Esquerda Fixa com Busca e Navegação */}
            <aside className="relative">
              <div className="sticky top-24 space-y-5">
                {/* Campo de Busca Rápida na Doc */}
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Buscar endpoints ou guias..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/10"
                  />
                </div>

                {/* Lista de Seções Categorizadas */}
                <nav className="max-h-[calc(100vh-180px)] space-y-6 overflow-y-auto pr-2">
                  {filteredNav.map((category) => (
                    <div key={category.title} className="space-y-1.5">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2.5">
                        {category.title}
                      </h4>
                      <div className="space-y-0.5">
                        {category.items.map((item) => {
                          const isActive = activeSection === item.id;
                          return (
                            <a
                              key={item.id}
                              href={`#${item.id}`}
                              onClick={() => setActiveSection(item.id)}
                              className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold transition ${
                                isActive
                                  ? "bg-zinc-950 text-white shadow-xs dark:bg-white dark:text-zinc-950"
                                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {item.icon}
                                <span className="truncate">{item.label}</span>
                              </div>
                              {item.method && (
                                <MethodBadge method={item.method} isSmall isActive={isActive} />
                              )}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Conteúdo Principal com Documentação Ricamente Detalhada */}
            <div className="min-w-0 space-y-16">
              {/* 1. VISÃO GERAL */}
              <DocSection
                id="visao-geral"
                tag="Introdução"
                title="Visão Geral da API"
                description="A API REST do Link foi projetada sobre arquitetura stateless de alta velocidade, fornecendo respostas estruturadas em JSON com suporte nativo a CORS."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FeatureBox
                    icon={<Zap size={16} className="text-emerald-500" />}
                    title="Alta Performance"
                    description="Redirecionamentos executados em Edge Computing com latência zero."
                  />
                  <FeatureBox
                    icon={<Globe size={16} className="text-cyan-500" />}
                    title="GeoIP & Device Tracking"
                    description="Resolução automática de país, sistema operacional, navegador e parâmetros UTM."
                  />
                  <FeatureBox
                    icon={<Shield size={16} className="text-indigo-500" />}
                    title="Segurança e Isolamento"
                    description="Cada link pertence à sua chave privada com garantia de unicidade de slugs."
                  />
                  <FeatureBox
                    icon={<Layers size={16} className="text-amber-500" />}
                    title="QR Code Automático"
                    description="Geração instantânea de imagem escaneável PNG em alta definição."
                  />
                </div>
              </DocSection>

              {/* 2. AUTENTICAÇÃO */}
              <DocSection
                id="autenticacao"
                tag="Segurança"
                title="Autenticação por API Key"
                description="Para acessar recursos privados, vincular links à sua conta ou consultar seu dashboard, inclua sua chave de API nas requisições HTTP."
              >
                <div className="space-y-4">
                  <p className="text-xs font-medium leading-relaxed text-zinc-600 dark:text-zinc-300">
                    Você pode enviar a sua API Key de duas formas padronizadas:
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">Opção 1: Header Customizado</p>
                      <code className="mt-2 block rounded-lg bg-zinc-100 p-2 font-mono text-xs text-emerald-700 dark:bg-zinc-950 dark:text-emerald-400">
                        X-API-Key: link_sua_chave_aqui
                      </code>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">Opção 2: Authorization Bearer</p>
                      <code className="mt-2 block rounded-lg bg-zinc-100 p-2 font-mono text-xs text-emerald-700 dark:bg-zinc-950 dark:text-emerald-400">
                        Authorization: Bearer link_sua_chave_aqui
                      </code>
                    </div>
                  </div>

                  <AlertBox type="warning">
                    <strong>Mantenha sua API Key em segredo.</strong> Nunca exponha sua chave em repositórios públicos ou no código client-side do navegador. Se sua chave for comprometida, você pode resetá-la a qualquer momento no Painel.
                  </AlertBox>
                </div>
              </DocSection>

              {/* 3. BOAS PRÁTICAS & HEADERS */}
              <DocSection
                id="boas-praticas"
                tag="Diretrizes"
                title="Boas Práticas & Headers HTTP"
                description="Recomendações técnicas para garantir máxima estabilidade e compatibilidade em ambientes de produção."
              >
                <div className="space-y-4">
                  <ParamTable
                    params={[
                      {
                        name: "Content-Type",
                        type: "string",
                        required: true,
                        description: "Deve ser configurado como 'application/json' em requisições POST e PATCH."
                      },
                      {
                        name: "Accept",
                        type: "string",
                        required: false,
                        description: "Recomendado 'application/json' para garantir que o cliente aceite respostas estruturadas."
                      },
                      {
                        name: "User-Agent",
                        type: "string",
                        required: false,
                        description: "Identifique o seu serviço ou aplicação nas chamadas de API (ex: 'MinhaApp/1.0')."
                      }
                    ]}
                  />
                </div>
              </DocSection>

              {/* 4. CRIAR LINK */}
              <DocSection
                id="criar-link"
                tag="Endpoints"
                title="Criar Link Curto"
                description="Encurta uma URL de destino gerando um código aleatório ou utilizando um slug customizado exclusivo."
              >
                <EndpointCard
                  method="POST"
                  path="/api/links"
                  authType="Opcional / Recomendado"
                  description="Se a chave for enviada, o link ficará vinculado à sua conta no painel com métricas detalhadas."
                  params={[
                    {
                      name: "url",
                      type: "string",
                      required: true,
                      description: "URL original de destino completa (ex: 'https://seusite.com/artigo')."
                    },
                    {
                      name: "slug",
                      type: "string",
                      required: false,
                      description: "Identificador personalizado (3 a 48 caracteres: letras, números, hífen e underline)."
                    },
                    {
                      name: "customSlug",
                      type: "string",
                      required: false,
                      description: "Alias alternativo para 'slug', útil para compatibilidade com outros clientes."
                    }
                  ]}
                  curlSnippet={`curl -X POST ${baseUrl}/api/links \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: link_sua_chave" \\
  -d '{\n    "url": "https://guidev.site/projetos",\n    "slug": "projetos"\n  }'`}
                  jsSnippet={`const response = await fetch("${baseUrl}/api/links", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "X-API-Key": "link_sua_chave"\n  },\n  body: JSON.stringify({\n    url: "https://guidev.site/projetos",\n    slug: "projetos"\n  })\n});\n\nconst data = await response.json();\nconsole.log(data);`}
                  pythonSnippet={`import requests\n\nurl = "${baseUrl}/api/links"\nheaders = {\n    "Content-Type": "application/json",\n    "X-API-Key": "link_sua_chave"\n}\npayload = {\n    "url": "https://guidev.site/projetos",\n    "slug": "projetos"\n}\n\nresponse = requests.post(url, json=payload, headers=headers)\nprint(response.json())`}
                  phpSnippet={`<?php\n$ch = curl_init("${baseUrl}/api/links");\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n    "Content-Type: application/json",\n    "X-API-Key: link_sua_chave"\n]);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([\n    "url" => "https://guidev.site/projetos",\n    "slug" => "projetos"\n]));\n\n$response = curl_exec($ch);\ncurl_close($ch);\necho $response;`}
                  responseStatus={201}
                  responseSnippet={`{\n  "id": "67bc924192b0c1e897a1b412",\n  "slug": "projetos",\n  "url": "https://guidev.site/projetos",\n  "shortUrl": "${baseUrl}/projetos",\n  "clicks": 0\n}`}
                  copiedText={copiedText}
                  onCopy={handleCopy}
                />
              </DocSection>

              {/* 5. CONSULTAR LINK */}
              <DocSection
                id="consultar-link"
                tag="Endpoints"
                title="Consultar Link por Slug"
                description="Retorna as informações públicas e contagem de cliques de um link existente."
              >
                <EndpointCard
                  method="GET"
                  path="/api/links/{slug}"
                  authType="Público"
                  description="Qualquer cliente pode consultar os dados básicos de um link sem necessidade de autenticação."
                  pathParams={[
                    {
                      name: "slug",
                      type: "string",
                      required: true,
                      description: "O código identificador do link a ser consultado."
                    }
                  ]}
                  curlSnippet={`curl ${baseUrl}/api/links/projetos`}
                  jsSnippet={`const response = await fetch("${baseUrl}/api/links/projetos");\nconst link = await response.json();\nconsole.log(link);`}
                  pythonSnippet={`import requests\n\nresponse = requests.get("${baseUrl}/api/links/projetos")\nprint(response.json())`}
                  phpSnippet={`<?php\n$response = file_get_contents("${baseUrl}/api/links/projetos");\necho $response;`}
                  responseStatus={200}
                  responseSnippet={`{\n  "slug": "projetos",\n  "url": "https://guidev.site/projetos",\n  "shortUrl": "${baseUrl}/projetos",\n  "clicks": 142,\n  "createdAt": "2026-08-25T14:30:00.000Z"\n}`}
                  copiedText={copiedText}
                  onCopy={handleCopy}
                />
              </DocSection>

              {/* 6. ATUALIZAR LINK */}
              <DocSection
                id="atualizar-link"
                tag="Endpoints"
                title="Atualizar ou Renomear Link"
                description="Edita a URL de destino ou altera o slug personalizado de um link pertencente à sua conta."
              >
                <EndpointCard
                  method="PATCH"
                  path="/api/links/{slug}"
                  authType="API Key Obrigatória"
                  description="Apenas o proprietário do link pode alterar seus parâmetros."
                  pathParams={[
                    {
                      name: "slug",
                      type: "string",
                      required: true,
                      description: "Slug atual do link que será modificado."
                    }
                  ]}
                  params={[
                    {
                      name: "url",
                      type: "string",
                      required: false,
                      description: "Nova URL de destino."
                    },
                    {
                      name: "slug",
                      type: "string",
                      required: false,
                      description: "Novo slug personalizado desejado (não pode conflitar com outro existente)."
                    }
                  ]}
                  curlSnippet={`curl -X PATCH ${baseUrl}/api/links/projetos \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: link_sua_chave" \\
  -d '{\n    "url": "https://guidev.site/novo-portfolio",\n    "slug": "portfolio-2026"\n  }'`}
                  jsSnippet={`const response = await fetch("${baseUrl}/api/links/projetos", {\n  method: "PATCH",\n  headers: {\n    "Content-Type": "application/json",\n    "X-API-Key": "link_sua_chave"\n  },\n  body: JSON.stringify({\n    url: "https://guidev.site/novo-portfolio",\n    slug: "portfolio-2026"\n  })\n});\n\nconst data = await response.json();\nconsole.log(data);`}
                  pythonSnippet={`import requests\n\nurl = "${baseUrl}/api/links/projetos"\nheaders = {\n    "Content-Type": "application/json",\n    "X-API-Key": "link_sua_chave"\n}\npayload = {\n    "url": "https://guidev.site/novo-portfolio",\n    "slug": "portfolio-2026"\n}\n\nresponse = requests.patch(url, json=payload, headers=headers)\nprint(response.json())`}
                  phpSnippet={`<?php\n$ch = curl_init("${baseUrl}/api/links/projetos");\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PATCH");\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n    "Content-Type: application/json",\n    "X-API-Key: link_sua_chave"\n]);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([\n    "url" => "https://guidev.site/novo-portfolio",\n    "slug" => "portfolio-2026"\n]));\n\n$response = curl_exec($ch);\ncurl_close($ch);\necho $response;`}
                  responseStatus={200}
                  responseSnippet={`{\n  "id": "67bc924192b0c1e897a1b412",\n  "slug": "portfolio-2026",\n  "url": "https://guidev.site/novo-portfolio",\n  "shortUrl": "${baseUrl}/portfolio-2026",\n  "clicks": 142,\n  "message": "Link atualizado com sucesso."\n}`}
                  copiedText={copiedText}
                  onCopy={handleCopy}
                />
              </DocSection>

              {/* 7. EXCLUIR LINK */}
              <DocSection
                id="excluir-link"
                tag="Endpoints"
                title="Excluir Link Permanentemente"
                description="Remove um link encurtado e todos os seus eventos de rastreamento históricos."
              >
                <EndpointCard
                  method="DELETE"
                  path="/api/links/{slug}"
                  authType="API Key Obrigatória"
                  description="Essa ação é irreversível e libera o slug para ser reutilizado."
                  pathParams={[
                    {
                      name: "slug",
                      type: "string",
                      required: true,
                      description: "Slug do link a ser removido."
                    }
                  ]}
                  curlSnippet={`curl -X DELETE ${baseUrl}/api/links/portfolio-2026 \\
  -H "X-API-Key: link_sua_chave"`}
                  jsSnippet={`const response = await fetch("${baseUrl}/api/links/portfolio-2026", {\n  method: "DELETE",\n  headers: {\n    "X-API-Key": "link_sua_chave"\n  }\n});\n\nconst data = await response.json();\nconsole.log(data);`}
                  pythonSnippet={`import requests\n\nresponse = requests.delete(\n    "${baseUrl}/api/links/portfolio-2026",\n    headers={"X-API-Key": "link_sua_chave"}\n)\nprint(response.json())`}
                  phpSnippet={`<?php\n$ch = curl_init("${baseUrl}/api/links/portfolio-2026");\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ["X-API-Key: link_sua_chave"]);\n\n$response = curl_exec($ch);\ncurl_close($ch);\necho $response;`}
                  responseStatus={200}
                  responseSnippet={`{\n  "message": "Link removido com sucesso."\n}`}
                  copiedText={copiedText}
                  onCopy={handleCopy}
                />
              </DocSection>

              {/* 8. OBTER DASHBOARD & ANALYTICS */}
              <DocSection
                id="obter-dashboard"
                tag="Métricas"
                title="Obter Dashboard & Métricas Completas"
                description="Retorna os dados consolidados da conta, métricas de tráfego, rankings agregados e os eventos de cliques recentes."
              >
                <EndpointCard
                  method="GET"
                  path="/api/dashboard"
                  authType="API Key Obrigatória"
                  description="Fornece visão completa em tempo real para painéis administrativos personalizados."
                  curlSnippet={`curl ${baseUrl}/api/dashboard \\
  -H "X-API-Key: link_sua_chave"`}
                  jsSnippet={`const response = await fetch("${baseUrl}/api/dashboard", {\n  headers: {\n    "X-API-Key": "link_sua_chave"\n  }\n});\n\nconst dashboard = await response.json();\nconsole.log(dashboard);`}
                  pythonSnippet={`import requests\n\nresponse = requests.get(\n    "${baseUrl}/api/dashboard",\n    headers={"X-API-Key": "link_sua_chave"}\n)\nprint(response.json())`}
                  phpSnippet={`<?php\n$ch = curl_init("${baseUrl}/api/dashboard");\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ["X-API-Key: link_sua_chave"]);\n\n$response = curl_exec($ch);\ncurl_close($ch);\necho $response;`}
                  responseStatus={200}
                  responseSnippet={`{\n  "user": {\n    "id": "67bc920092b0c1e897a1b410",\n    "name": "Guilherme Portilho",\n    "email": "dev@guidev.site"\n  },\n  "summary": {\n    "links": 12,\n    "clicks": 4830,\n    "trackedEvents": 4830\n  },\n  "links": [\n    {\n      "id": "67bc924192b0c1e897a1b412",\n      "slug": "projetos",\n      "url": "https://guidev.site/projetos",\n      "shortUrl": "${baseUrl}/projetos",\n      "clicks": 142,\n      "createdAt": "2026-08-25T14:30:00.000Z"\n    }\n  ],\n  "analytics": {\n    "countries": [{ "name": "Brasil", "clicks": 3410 }],\n    "referrers": [{ "name": "Google", "clicks": 2100 }],\n    "devices": [{ "name": "Mobile", "clicks": 3100 }],\n    "operatingSystems": [{ "name": "Android", "clicks": 2400 }],\n    "browsers": [{ "name": "Chrome", "clicks": 3600 }],\n    "totalClicks": 4830\n  },\n  "baseUrl": "${baseUrl}"\n}`}
                  copiedText={copiedText}
                  onCopy={handleCopy}
                />
              </DocSection>

              {/* 9. STATS PÚBLICAS */}
              <DocSection
                id="stats-publicas"
                tag="Métricas"
                title="Estatísticas Públicas Globais"
                description="Endpoint de contagem total de links encurtados pela plataforma inteira."
              >
                <EndpointCard
                  method="GET"
                  path="/api/stats"
                  authType="Público"
                  curlSnippet={`curl ${baseUrl}/api/stats`}
                  jsSnippet={`const res = await fetch("${baseUrl}/api/stats");\nconst stats = await res.json();\nconsole.log(stats);`}
                  pythonSnippet={`import requests\n\nresponse = requests.get("${baseUrl}/api/stats")\nprint(response.json())`}
                  phpSnippet={`<?php\necho file_get_contents("${baseUrl}/api/stats");`}
                  responseStatus={200}
                  responseSnippet={`{\n  "links": 1420\n}`}
                  copiedText={copiedText}
                  onCopy={handleCopy}
                />
              </DocSection>

              {/* 10. RESETAR API KEY */}
              <DocSection
                id="resetar-api-key"
                tag="Segurança"
                title="Resetar Chave de API"
                description="Revoga imediatamente a chave de API anterior e gera uma nova chave segura com prefixo 'link_'."
              >
                <EndpointCard
                  method="POST"
                  path="/api/auth/reset-api-key"
                  authType="Sessão ou API Key"
                  description="Importante: Após a execução, qualquer integração anterior deixará de funcionar imediatamente."
                  curlSnippet={`curl -X POST ${baseUrl}/api/auth/reset-api-key \\
  -H "X-API-Key: link_sua_chave_atual"`}
                  jsSnippet={`const response = await fetch("${baseUrl}/api/auth/reset-api-key", {\n  method: "POST",\n  headers: {\n    "X-API-Key": "link_sua_chave_atual"\n  }\n});\n\nconst data = await response.json();\nconsole.log("Nova API Key:", data.apiKey);`}
                  pythonSnippet={`import requests\n\nresponse = requests.post(\n    "${baseUrl}/api/auth/reset-api-key",\n    headers={"X-API-Key": "link_sua_chave_atual"}\n)\nprint(response.json())`}
                  phpSnippet={`<?php\n$ch = curl_init("${baseUrl}/api/auth/reset-api-key");\ncurl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ["X-API-Key: link_sua_chave_atual"]);\n\necho curl_exec($ch);\ncurl_close($ch);`}
                  responseStatus={200}
                  responseSnippet={`{\n  "apiKey": "link_9f82a1c4b7d5e6f3a2b1c0d9e8f7a6b5",\n  "message": "Nova chave de API gerada com sucesso."\n}`}
                  copiedText={copiedText}
                  onCopy={handleCopy}
                />
              </DocSection>

              {/* 11. REDIRECIONAMENTO & TRACKER */}
              <DocSection
                id="redirecionamento"
                tag="Mecanismo"
                title="Motor de Redirecionamento & Tracker"
                description="Entenda como funciona o redirecionamento com 0 delay e a coleta de telemetria inteligente."
              >
                <div className="space-y-4">
                  <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/70">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-3">
                      Fluxo de Execução do Tracker
                    </h4>
                    <ol className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
                      <li className="flex gap-3">
                        <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white dark:bg-white dark:text-zinc-900">1</span>
                        <span><strong>Requisição do Usuário</strong>: O visitante acessa <code className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{baseUrl}/meu-link</code>.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white dark:bg-white dark:text-zinc-900">2</span>
                        <span><strong>Redirecionamento 307</strong>: O servidor responde imediatamente com HTTP 307 Redirect para a URL de destino em &lt; 10ms.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white dark:bg-white dark:text-zinc-900">3</span>
                        <span><strong>Telemetria Assíncrona</strong>: Em background, o sistema extrai GeoIP (País, Cidade), Sistema Operacional, Dispositivo, Navegador, Origem Social (Instagram, TikTok, Google) e parâmetros UTM sem bloquear a navegação.</span>
                      </li>
                    </ol>
                  </div>
                </div>
              </DocSection>

              {/* 12. STATUS HTTP & ERROS */}
              <DocSection
                id="status-erros"
                tag="Referência"
                title="Erros & Códigos de Status HTTP"
                description="Todas as respostas de erro retornam códigos de status HTTP apropriados acompanhados de um payload JSON explicativo."
              >
                <div className="space-y-6">
                  <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-zinc-100 bg-zinc-50 font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
                        <tr>
                          <th className="py-3 px-4 w-28">Status</th>
                          <th className="py-3 px-4 w-40">Motivo</th>
                          <th className="py-3 px-4">Descrição & Solução</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                        <tr>
                          <td className="py-3.5 px-4"><StatusCodeBadge code={200} /></td>
                          <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">OK</td>
                          <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">Requisição atendida com sucesso.</td>
                        </tr>
                        <tr>
                          <td className="py-3.5 px-4"><StatusCodeBadge code={201} /></td>
                          <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">Created</td>
                          <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">Novo link curto cadastrado e ativado com sucesso.</td>
                        </tr>
                        <tr>
                          <td className="py-3.5 px-4"><StatusCodeBadge code={400} /></td>
                          <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">Bad Request</td>
                          <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">URL inválida ou slug fora dos parâmetros permitidos (3 a 48 caracteres).</td>
                        </tr>
                        <tr>
                          <td className="py-3.5 px-4"><StatusCodeBadge code={401} /></td>
                          <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">Unauthorized</td>
                          <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">API Key ausente, expirada ou inválida.</td>
                        </tr>
                        <tr>
                          <td className="py-3.5 px-4"><StatusCodeBadge code={403} /></td>
                          <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">Forbidden</td>
                          <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">Você não tem permissão para editar ou excluir links de outro usuário.</td>
                        </tr>
                        <tr>
                          <td className="py-3.5 px-4"><StatusCodeBadge code={404} /></td>
                          <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">Not Found</td>
                          <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">Link ou slug não encontrado no banco de dados.</td>
                        </tr>
                        <tr>
                          <td className="py-3.5 px-4"><StatusCodeBadge code={409} /></td>
                          <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">Conflict</td>
                          <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">O slug customizado informado já está em uso por outro link.</td>
                        </tr>
                        <tr>
                          <td className="py-3.5 px-4"><StatusCodeBadge code={500} /></td>
                          <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">Internal Error</td>
                          <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">Erro interno inesperado no servidor.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Exemplo de Resposta de Erro */}
                  <div className="rounded-xl border border-red-200/80 bg-red-50/50 p-4 dark:border-red-500/20 dark:bg-red-950/20">
                    <p className="text-xs font-bold text-red-900 dark:text-red-300 mb-2">Estrutura de Erro Padrão:</p>
                    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                      <HighlightedCodeBlock code={`{\n  "error": "Esse slug já está em uso por outro link."\n}`} lang="json" />
                    </div>
                  </div>
                </div>
              </DocSection>
            </div>
          </div>

          {/* Rodapé da Documentação */}
          <footer className="mt-12 flex flex-col gap-4 border-t border-zinc-200/80 py-6 text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="font-bold text-zinc-900 dark:text-white">Link API</span>
              <span>•</span>
              <span>
                Documentação desenvolvida por{" "}
                <a
                  className="font-bold text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition hover:text-emerald-600 dark:text-white dark:decoration-white/20 dark:hover:text-emerald-300"
                  href="https://guidev.site"
                  target="_blank"
                  rel="noreferrer"
                >
                  GUI.DEV
                </a>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 font-semibold">
              <Link className="transition hover:text-zinc-950 dark:hover:text-white" href="/">
                Início
              </Link>
              <Link className="transition hover:text-zinc-950 dark:hover:text-white" href="/dashboard">
                Painel
              </Link>
              <a
                className="transition hover:text-zinc-950 dark:hover:text-white"
                href="https://github.com/TGuiDev/link"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}

// -------------------------------------------------------------
// Componentes Auxiliares & Estilização
// -------------------------------------------------------------

function DocSection({
  children,
  description,
  id,
  tag,
  title
}: {
  id: string;
  tag: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div className="space-y-1.5">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          {tag}
        </span>
        <h2 className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
          {title}
        </h2>
        <p className="text-xs sm:text-sm font-medium leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-3xl">
          {description}
        </p>
      </div>

      <div className="pt-2">{children}</div>
    </section>
  );
}



function FeatureBox({
  description,
  icon,
  title
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <h3 className="text-xs font-bold text-zinc-900 dark:text-white">{title}</h3>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}

function AlertBox({
  children,
  type
}: {
  type: "warning" | "info";
  children: ReactNode;
}) {
  const isWarning = type === "warning";
  return (
    <div
      className={`rounded-2xl border p-4 text-xs font-medium leading-relaxed ${
        isWarning
          ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/30 dark:text-amber-200"
          : "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/20 dark:bg-blue-950/30 dark:text-blue-200"
      }`}
    >
      {children}
    </div>
  );
}

interface ParamItem {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

function ParamTable({ params }: { params: ParamItem[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-zinc-100 bg-zinc-50 font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
          <tr>
            <th className="py-2.5 px-4 w-40">Parâmetro</th>
            <th className="py-2.5 px-4 w-28">Tipo</th>
            <th className="py-2.5 px-4 w-28">Obrigatório</th>
            <th className="py-2.5 px-4">Descrição</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {params.map((param) => (
            <tr key={param.name}>
              <td className="py-3 px-4 font-mono font-bold text-zinc-950 dark:text-white">
                {param.name}
              </td>
              <td className="py-3 px-4 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                {param.type}
              </td>
              <td className="py-3 px-4">
                {param.required ? (
                  <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                    Sim
                  </span>
                ) : (
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    Opcional
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">{param.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MethodBadge({
  isActive = false,
  isSmall = false,
  method
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  isSmall?: boolean;
  isActive?: boolean;
}) {
  const colors: Record<string, string> = {
    GET: isActive
      ? "bg-sky-500/20 text-sky-300"
      : "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
    POST: isActive
      ? "bg-emerald-500/20 text-emerald-300"
      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
    PATCH: isActive
      ? "bg-amber-500/20 text-amber-300"
      : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    DELETE: isActive
      ? "bg-rose-500/20 text-rose-300"
      : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
  };

  return (
    <span
      className={`rounded-md font-mono font-black ${
        isSmall ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      } ${colors[method]}`}
    >
      {method}
    </span>
  );
}

function StatusCodeBadge({ code }: { code: number }) {
  const is2xx = code >= 200 && code < 300;
  const is4xx = code >= 400 && code < 500;
  return (
    <span
      className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold ${
        is2xx
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
          : is4xx
          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
          : "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
      }`}
    >
      {code}
    </span>
  );
}

// -------------------------------------------------------------
// Componente de Destaque de Código com Cores Vivas (Syntax Highlighting)
// -------------------------------------------------------------

function HighlightedCodeBlock({
  code,
  lang
}: {
  code: string;
  lang: Language | "json";
}) {
  const lines = useMemo(() => code.split("\n"), [code]);

  return (
    <div className="font-mono text-xs leading-relaxed overflow-x-auto select-text selection:bg-emerald-500/30">
      {lines.map((line, idx) => (
        <div key={idx} className="table-row">
          <span className="table-cell select-none pr-4 text-right text-[11px] text-zinc-600 dark:text-zinc-600 w-8">
            {idx + 1}
          </span>
          <span className="table-cell whitespace-pre">
            {renderTokenizedLine(line, lang)}
          </span>
        </div>
      ))}
    </div>
  );
}

function renderTokenizedLine(line: string, lang: Language | "json"): ReactNode {
  if (!line.trim()) {
    return <span>&nbsp;</span>;
  }

  // Comentários
  if (line.trim().startsWith("//") || line.trim().startsWith("#")) {
    return <span className="text-zinc-500 italic">{line}</span>;
  }

  if (lang === "json") {
    // Regex para destacar chaves e valores JSON
    const jsonKeyMatch = line.match(/^(\s*)(".*?")(\s*:\s*)(.*)$/);
    if (jsonKeyMatch) {
      const [, indent, key, colon, value] = jsonKeyMatch;
      return (
        <span>
          {indent}
          <span className="text-sky-300 font-semibold">{key}</span>
          <span className="text-zinc-400">{colon}</span>
          {renderJsonValue(value)}
        </span>
      );
    }
    return <span className="text-zinc-400">{line}</span>;
  }

  if (lang === "curl") {
    return (
      <span>
        {line.split(/(\s+|"[\s\S]*?"|'[\s\S]*?'|\\)/).map((part, i) => {
          if (part === "curl") return <span key={i} className="text-purple-400 font-bold">{part}</span>;
          if (part.startsWith("-")) return <span key={i} className="text-cyan-400 font-bold">{part}</span>;
          if (["POST", "GET", "PATCH", "DELETE"].includes(part)) {
            return <span key={i} className="text-amber-400 font-bold">{part}</span>;
          }
          if (part.startsWith("http://") || part.startsWith("https://")) {
            return <span key={i} className="text-emerald-400">{part}</span>;
          }
          if (part.startsWith('"') || part.startsWith("'")) {
            return <span key={i} className="text-emerald-300">{part}</span>;
          }
          if (part === "\\") return <span key={i} className="text-zinc-500">{part}</span>;
          return <span key={i} className="text-zinc-200">{part}</span>;
        })}
      </span>
    );
  }

  if (lang === "javascript") {
    return (
      <span>
        {line.split(/(\s+|"[\s\S]*?"|'[\s\S]*?'|[(),:;.{}[\]=]|\/\/.*)/).map((part, i) => {
          if (["const", "let", "var", "await", "async", "return", "function"].includes(part)) {
            return <span key={i} className="text-purple-400 font-semibold">{part}</span>;
          }
          if (["fetch", "json", "log", "stringify"].includes(part)) {
            return <span key={i} className="text-blue-400 font-medium">{part}</span>;
          }
          if (["JSON", "console", "response", "data", "link"].includes(part)) {
            return <span key={i} className="text-amber-300">{part}</span>;
          }
          if (["url", "slug", "method", "headers", "body"].includes(part)) {
            return <span key={i} className="text-sky-300">{part}</span>;
          }
          if (part.startsWith('"') || part.startsWith("'")) {
            return <span key={i} className="text-emerald-400">{part}</span>;
          }
          if (["=", ":", ",", ";", ".", "(", ")", "{", "}", "[", "]"].includes(part)) {
            return <span key={i} className="text-zinc-400">{part}</span>;
          }
          return <span key={i} className="text-zinc-200">{part}</span>;
        })}
      </span>
    );
  }

  if (lang === "python") {
    return (
      <span>
        {line.split(/(\s+|"[\s\S]*?"|'[\s\S]*?'|[(),:;.{}[\]=]|#.*)/).map((part, i) => {
          if (["import", "from", "def", "return", "as"].includes(part)) {
            return <span key={i} className="text-purple-400 font-semibold">{part}</span>;
          }
          if (["requests", "post", "get", "patch", "delete", "json", "print"].includes(part)) {
            return <span key={i} className="text-blue-400 font-medium">{part}</span>;
          }
          if (["url", "headers", "json", "payload", "response"].includes(part)) {
            return <span key={i} className="text-sky-300">{part}</span>;
          }
          if (part.startsWith('"') || part.startsWith("'")) {
            return <span key={i} className="text-emerald-400">{part}</span>;
          }
          if (["=", ":", ",", "(", ")", "{", "}", "[", "]"].includes(part)) {
            return <span key={i} className="text-zinc-400">{part}</span>;
          }
          return <span key={i} className="text-zinc-200">{part}</span>;
        })}
      </span>
    );
  }

  if (lang === "php") {
    return (
      <span>
        {line.split(/(\s+|"[\s\S]*?"|'[\s\S]*?'|[(),:;.{}[\]=]|\/\/.*)/).map((part, i) => {
          if (["<?php", "echo", "return", "true", "false"].includes(part)) {
            return <span key={i} className="text-purple-400 font-semibold">{part}</span>;
          }
          if (["curl_init", "curl_setopt", "curl_exec", "curl_close", "json_encode", "file_get_contents"].includes(part)) {
            return <span key={i} className="text-blue-400 font-medium">{part}</span>;
          }
          if (part.startsWith("CURLOPT_")) {
            return <span key={i} className="text-amber-400 font-semibold">{part}</span>;
          }
          if (part.startsWith("$")) {
            return <span key={i} className="text-sky-300 font-medium">{part}</span>;
          }
          if (part.startsWith('"') || part.startsWith("'")) {
            return <span key={i} className="text-emerald-400">{part}</span>;
          }
          if (["=", ":", ",", ";", "(", ")", "{", "}", "[", "]", "=>"].includes(part)) {
            return <span key={i} className="text-zinc-400">{part}</span>;
          }
          return <span key={i} className="text-zinc-200">{part}</span>;
        })}
      </span>
    );
  }

  return <span className="text-zinc-200">{line}</span>;
}

function renderJsonValue(value: string): ReactNode {
  const trimmed = value.trim();
  if (trimmed.startsWith('"')) {
    const isComma = trimmed.endsWith(",");
    const str = isComma ? trimmed.slice(0, -1) : trimmed;
    return (
      <span>
        <span className="text-emerald-400">{str}</span>
        {isComma && <span className="text-zinc-400">,</span>}
      </span>
    );
  }
  if (!isNaN(Number(trimmed.replace(",", "")))) {
    const isComma = trimmed.endsWith(",");
    const num = isComma ? trimmed.slice(0, -1) : trimmed;
    return (
      <span>
        <span className="text-amber-300 font-bold">{num}</span>
        {isComma && <span className="text-zinc-400">,</span>}
      </span>
    );
  }
  if (trimmed === "true," || trimmed === "true" || trimmed === "false," || trimmed === "false" || trimmed === "null," || trimmed === "null") {
    return <span className="text-purple-400 font-bold">{value}</span>;
  }
  return <span className="text-zinc-300">{value}</span>;
}

// -------------------------------------------------------------
// Card de Endpoint Interativo: Código em Cima + Resposta JSON em Baixo
// -------------------------------------------------------------

function EndpointCard({
  authType,
  copiedText,
  curlSnippet,
  description,
  jsSnippet,
  method,
  onCopy,
  params,
  path,
  pathParams,
  phpSnippet,
  pythonSnippet,
  responseSnippet,
  responseStatus = 200
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  authType: string;
  description?: string;
  pathParams?: ParamItem[];
  params?: ParamItem[];
  curlSnippet: string;
  jsSnippet: string;
  pythonSnippet: string;
  phpSnippet: string;
  responseSnippet: string;
  responseStatus?: number;
  copiedText: string;
  onCopy: (text: string) => void;
}) {
  const [selectedLang, setSelectedLang] = useState<Language>("curl");

  const currentSnippet = useMemo(() => {
    switch (selectedLang) {
      case "javascript":
        return jsSnippet;
      case "python":
        return pythonSnippet;
      case "php":
        return phpSnippet;
      case "curl":
      default:
        return curlSnippet;
    }
  }, [selectedLang, curlSnippet, jsSnippet, pythonSnippet, phpSnippet]);

  return (
    <div className="rounded-3xl border border-zinc-200/90 bg-white/90 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80 overflow-hidden">
      {/* Header do Endpoint */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-100 bg-zinc-50/70 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950/40">
        <div className="flex items-center gap-3 min-w-0">
          <MethodBadge method={method} />
          <code className="font-mono text-sm font-bold text-zinc-950 dark:text-white truncate">
            {path}
          </code>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <Lock size={11} className="text-zinc-400" />
            <span>{authType}</span>
          </span>
        </div>
      </div>

      {description && (
        <div className="px-5 pt-4 pb-2 text-xs text-zinc-600 dark:text-zinc-400">
          {description}
        </div>
      )}

      {/* Tabelas de Parâmetros de Rota & Body */}
      <div className="p-5 space-y-6">
        {pathParams && pathParams.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Parâmetros de Rota (Path)
            </h4>
            <ParamTable params={pathParams} />
          </div>
        )}

        {params && params.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Corpo da Requisição (JSON Body)
            </h4>
            <ParamTable params={params} />
          </div>
        )}

        {/* 1. Bloco de Código de Exemplo (cURL, JS, Python, PHP) Colorido */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Exemplo de Requisição
            </h4>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-950 overflow-hidden dark:border-zinc-800 shadow-md">
            {/* Abas das Linguagens */}
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs">
              <div className="flex items-center gap-1">
                {(["curl", "javascript", "python", "php"] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold transition ${
                      selectedLang === lang
                        ? "bg-zinc-800 text-white shadow-xs"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
              <button
                onClick={() => onCopy(currentSnippet)}
                className="inline-flex items-center gap-1 rounded-lg bg-zinc-800/80 px-2.5 py-1 text-[11px] font-bold text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
                type="button"
              >
                {copiedText === currentSnippet ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>
            </div>

            {/* Código Colorido */}
            <div className="p-4">
              <HighlightedCodeBlock code={currentSnippet} lang={selectedLang} />
            </div>
          </div>
        </div>

        {/* 2. Bloco de Resposta JSON Colorido (Embaixo do Código) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Resposta do Servidor
            </h4>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-950 overflow-hidden dark:border-zinc-800 shadow-md">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[11px] font-bold text-zinc-300">
                  Status: {responseStatus} {responseStatus === 201 ? "Created" : "OK"} (application/json)
                </span>
              </div>
              <button
                onClick={() => onCopy(responseSnippet)}
                className="inline-flex items-center gap-1 rounded-lg bg-zinc-800/80 px-2.5 py-1 text-[11px] font-bold text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
                type="button"
              >
                {copiedText === responseSnippet ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copiar JSON</span>
                  </>
                )}
              </button>
            </div>

            {/* JSON Colorido com Destaque de Sintaxe */}
            <div className="p-4">
              <HighlightedCodeBlock code={responseSnippet} lang="json" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
