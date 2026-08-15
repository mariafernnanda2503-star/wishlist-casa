import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O Next regenera AGENTS.md e CLAUDE.md a cada build, sobrescrevendo o que a
  // gente escrever neles. As instruções do projeto ficam no README.
  agentRules: false,

  // `got-scraping` lê arquivos JSON do próprio pacote em runtime (as tabelas de
  // cabeçalho do `header-generator`). Empacotado, o caminho relativo quebra e o
  // servidor estoura ENOENT — precisa resolver de node_modules como um módulo
  // normal, tanto em dev quanto no deploy.
  serverExternalPackages: ["got-scraping", "header-generator", "got", "header-generator-hooks"],
};

export default nextConfig;
