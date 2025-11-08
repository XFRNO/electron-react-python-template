// used only inside node.ts

import path from "path";
import { fileURLToPath } from "url";

let ROOTPATH = "";
let resolveFromRoot = (...segments: string[]) => "";

if (typeof process !== "undefined" && process.versions?.node) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  ROOTPATH = path.resolve(__dirname, "../../../");
  resolveFromRoot = (...segments: string[]) => path.join(ROOTPATH, ...segments);
}

export { ROOTPATH, resolveFromRoot };
