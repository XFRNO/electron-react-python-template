// packages/constants/src/paths.ts
let ROOTPATH = "";
let resolveFromRoot = (...segments: string[]) => "";

if (typeof process !== "undefined" && process.versions?.node) {
  const path = await import("path");
  const { fileURLToPath } = await import("url");

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  ROOTPATH = path.resolve(__dirname, "../../../");
  resolveFromRoot = (...segments: string[]) => path.join(ROOTPATH, ...segments);
}

export { ROOTPATH, resolveFromRoot };
