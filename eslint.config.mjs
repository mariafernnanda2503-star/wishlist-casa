import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

// As cores do app vivem como tokens em app/globals.css. Cor literal do Tailwind
// (bg-green-600, text-gray-500...) sai do sistema e quebra a consistência visual.
const noHardcodedPalette = {
  selector:
    "Literal[value=/\\b(?:text|bg|border|from|via|to|ring|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-|\\/|\\b)/]",
  message: "Use um token semântico de app/globals.css em vez de uma cor literal do Tailwind.",
};

const preferSizeUtility = {
  selector: 'Literal[value=/\\bh-([^\\s"]+)\\s+w-\\1\\b|\\bw-([^\\s"]+)\\s+h-\\2\\b/]',
  message: "Use size-* quando altura e largura forem iguais.",
};

/** @type {import('eslint').Linter.FlatConfig[]} */
const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "coverage/**",
      "next-env.d.ts",
      "src/shared/types/database.ts",
      // Artefatos que o Supabase CLI gera ao rodar `pnpm db:start`.
      "supabase/.temp/**",
      "supabase/.branches/**",
    ],
  },

  ...nextVitals,
  ...nextTs,

  // Arquivos de config não estão no tsconfig, então ficam fora do lint tipado.
  { ignores: ["*.mjs", "*.cjs", "postcss.config.*", "next.config.*"] },

  {
    plugins: { "@typescript-eslint": tsPlugin },
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: "./tsconfig.json" },
    },
    settings: {
      "import/resolver": { typescript: { project: "./tsconfig.json" } },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          pathGroups: [{ pattern: "@/**", group: "internal", position: "before" }],
          pathGroupsExcludedImportTypes: ["builtin"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-duplicates": "error",
      "no-restricted-syntax": ["error", noHardcodedPalette, preferSizeUtility],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/features/*/components/*",
                "@/features/*/hooks/*",
                "@/features/*/lib/*",
                "@/features/*/schemas/*",
                "@/ui/primitives/*",
              ],
              message: "Importe pela API pública da pasta (index.ts).",
            },
          ],
        },
      ],
    },
  },

  // Prettier por último: desliga as regras de formatação que conflitam com ele.
  prettier,
];

export default eslintConfig;
