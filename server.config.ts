export default {
  type: "module",
  compilerOptions: {
    module: "ESNext",
    moduleResolution: "node",
    target: "ESNext",
    sourceMap: true,
    outDir: "./dist",
    esModuleInterop: true,
    strict: true,
    skipLibCheck: true,
    allowJs: true,
  },
  include: ["server.js", "src/**/*"],
  exclude: ["node_modules"]
}