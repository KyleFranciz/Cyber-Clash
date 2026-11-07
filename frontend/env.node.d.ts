// Minimal `process` declaration so vite.config.ts typechecks without pulling in
// @types/node. Vite runs the config in Node, where `process.env` always exists.
declare const process: { env: Record<string, string | undefined> };
