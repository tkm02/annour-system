// ESLint (configuration « flat ») — Next 16 n'a plus `next lint` : lancer `npm run lint`.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

const config = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "public/**", "next-env.d.ts", "tsconfig.tsbuildinfo"],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Journaux interdits en production (données personnelles) ; console.error toléré pour les erreurs techniques
      "no-console": ["error", { allow: ["error"] }],
      // Code historique typé en `any` : signalé sans bloquer, à réduire progressivement
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Règles « React Compiler » (eslint-plugin-react-hooks 6) : signalées sans bloquer.
      // - set-state-in-effect vise le chargement de données dans useEffect, schéma utilisé dans tout le projet ;
      // - static-components / immutability / purity / refs : dette des pages historiques (badges, bulletins,
      //   certificats, attributions…) dont la refonte dépasse le périmètre actuel. À ramener en "error".
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
    },
  },
  {
    // Composants générés (shadcn/ui) : non modifiés à la main
    files: ["components/ui/**", "hooks/use-mobile.ts", "hooks/use-toast.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
]

export default config
