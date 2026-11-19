// Installation des hooks Git (script npm « prepare »).
// Ignorée en CI, en production (NODE_ENV=production), avec HUSKY=0 et quand Husky est absent (installation sans
// devDependencies) : elle ne doit jamais faire échouer une installation de déploiement (Vercel, Netlify, Docker).
const ci = (process.env.CI ?? "").toLowerCase();
if ((ci && ci !== "0" && ci !== "false") || process.env.NODE_ENV === "production" || process.env.HUSKY === "0") {
  process.exit(0);
}
try {
  const husky = (await import("husky")).default;
  const message = husky();
  if (message) console.error(message);
} catch {
  console.error("husky absent : hooks Git non installés (installation sans devDependencies).");
}
