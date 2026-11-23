#!/usr/bin/env node
// Hook PreToolUse de Claude Code (déclaré dans .claude/settings.json).
// Refuse à l'assistant tout accès aux fichiers de secrets ou d'exports de données, quel que soit l'outil
// (Read, Edit, Write, Grep, Glob, Bash, PowerShell) : .env réels (.env.example reste autorisé), clés et
// certificats, exports de données personnelles. Protection complémentaire des règles « deny » : elle ne voit
// que les chemins nommés (une recherche récursive sur « . » n'est pas détectée), la règle humaine reste la
// protection principale (CLAUDE.md §7).
// Code de sortie 2 = appel refusé (message renvoyé à l'assistant) ; 0 = autorisé.

const ENV_FILE = /(^|[^\w.-])\.env(\.(?!example(?![\w-]))[\w.-]+)?(?![\w.-])/i;
const KEY_FILE = /\.(pem|key|p12|pfx|cms)(?![\w.-])/i;
const DATA_EXPORT = /\.(xlsx|xls|csv)(?![\w.-])/i;

function fieldsToCheck(toolName, input) {
  if (!input || typeof input !== "object") return [];
  switch (toolName) {
    case "Bash":
    case "PowerShell":
      return [[input.command, false]];
    case "Grep":
      return [[input.path, true], [input.glob, true]];
    case "Glob":
      return [[input.path, true], [input.pattern, true]];
    default: // Read, Edit, Write, NotebookEdit…
      return [[input.file_path, true], [input.notebook_path, true], [input.path, true]];
  }
}

function blockedReason(value, isPath) {
  if (typeof value !== "string" || value === "") return null;
  if (ENV_FILE.test(value)) return "fichier d'environnement réel (.env*) — seul .env.example est autorisé";
  if (KEY_FILE.test(value)) return "clé, certificat ou sauvegarde chiffrée";
  if (isPath && DATA_EXPORT.test(value)) return "export de données (xlsx/xls/csv)";
  if (!isPath && /\.(xlsx|xls)(?![\w.-])/i.test(value)) return "export de données (xlsx/xls)";
  return null;
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { raw += chunk; });
process.stdin.on("end", () => {
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    process.stderr.write("protect-secrets : entrée illisible, contrôle ignoré.\n");
    process.exit(1); // erreur non bloquante
  }
  for (const [value, isPath] of fieldsToCheck(event.tool_name, event.tool_input)) {
    const reason = blockedReason(value, isPath);
    if (reason) {
      process.stderr.write(
        `Accès refusé par .claude/hooks/protect-secrets : ${reason}. ` +
        "Ne jamais lire ni modifier ces fichiers (CLAUDE.md §7) ; demander à un humain si nécessaire.\n"
      );
      process.exit(2);
    }
  }
  process.exit(0);
});
