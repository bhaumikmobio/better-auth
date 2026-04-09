import fs from "node:fs";
import path from "node:path";

const clientPath = path.join(process.cwd(), "src", "generated", "prisma", "client.ts");

if (!fs.existsSync(clientPath)) {
  console.error(`Prisma client not found at ${clientPath}`);
  process.exit(1);
}

const before = fs.readFileSync(clientPath, "utf8");

const after = before
  .replaceAll("import * as path from 'node:path'\n", "")
  .replaceAll("import { fileURLToPath } from 'node:url'\n", "")
  .replaceAll("globalThis['__dirname'] = path.dirname(fileURLToPath(import.meta.url))\n", "globalThis['__dirname'] = __dirname\n");

if (after === before) {
  // Nothing to patch; exit successfully.
  process.exit(0);
}

fs.writeFileSync(clientPath, after, "utf8");
console.log("Patched src/generated/prisma/client.ts to avoid import.meta.url in CJS builds.");

