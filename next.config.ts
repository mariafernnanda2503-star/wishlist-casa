import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O Next regenera AGENTS.md e CLAUDE.md a cada build, sobrescrevendo o que a
  // gente escrever neles. As instruções do projeto ficam no README.
  agentRules: false,
};

export default nextConfig;
