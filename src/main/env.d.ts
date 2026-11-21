// Vite `?raw` imports: the file's text, bundled at build time (spec 016 plan D-1)
declare module '*.md?raw' {
  const text: string
  export default text
}
