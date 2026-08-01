import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { fontFamily: { sans: ["var(--font-archivo)", "Helvetica Neue", "Arial", "sans-serif"], mono: ["var(--font-mono)", "ui-monospace", "monospace"] } } }, plugins: [] } satisfies Config;
