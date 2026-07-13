/**
 * Pure theme constants + CSS builder — NO database imports, so this is safe to
 * import from client components. DB access lives in lib/theme.ts.
 */

export type FontChoice = "sans" | "serif" | "system"

/** Editable design tokens, in form order. Keys map to CSS vars consumed by Tailwind. */
export const THEME_TOKENS: { key: string; label: string }[] = [
  { key: "background", label: "გვერდის ფონი" },
  { key: "foreground", label: "ჩვეულებრივი ტექსტი" },
  { key: "primary", label: "მთავარი ღილაკის ფონი" },
  { key: "primary-foreground", label: "მთავარი ღილაკის ტექსტი" },
  { key: "secondary", label: "მეორადი ღილაკის ფონი" },
  { key: "secondary-foreground", label: "მეორადი ღილაკის ტექსტი" },
  { key: "accent", label: "მონიშვნის/ბეჯის ფონი" },
  { key: "accent-foreground", label: "მონიშვნის/ბეჯის ტექსტი" },
  { key: "muted", label: "მქრქალი ფონი" },
  { key: "muted-foreground", label: "მქრქალი (დამატებითი) ტექსტი" },
  { key: "card", label: "ბარათის ფონი" },
  { key: "card-foreground", label: "ბარათის ტექსტი" },
  { key: "border", label: "ხაზის/ჩარჩოს ფერი" },
  { key: "input", label: "ინფუთის ველის ჩარჩო" },
  { key: "ring", label: "ფოკუსის რგოლი" },
  { key: "destructive", label: "საფრთხის/წაშლის ფერი" },
]

/**
 * Groups THEME_TOKENS by where they actually show up on the site, each with a
 * live-rendered sample so the admin can see the effect of a color without
 * guessing what "accent" or "ring" means. previewType picks which sample
 * renderer ThemePanel uses.
 */
export const TOKEN_GROUPS: {
  title: string
  description: string
  keys: string[]
  previewType: "bg-text" | "button" | "badge" | "muted" | "card" | "border" | "destructive"
  sampleLabel?: string
}[] = [
  {
    title: "ფონი და ტექსტი",
    description: "მთელი გვერდის ფონი და ჩვეულებრივი ტექსტის ფერი.",
    keys: ["background", "foreground"],
    previewType: "bg-text",
  },
  {
    title: "მთავარი ღილაკი",
    description: "ყველაზე მნიშვნელოვანი ღილაკები, მაგ. \"შესვლა\", \"გაგზავნა\".",
    keys: ["primary", "primary-foreground"],
    previewType: "button",
    sampleLabel: "მთავარი ღილაკი",
  },
  {
    title: "მეორადი ღილაკი",
    description: "ნაკლებად მნიშვნელოვანი ღილაკები და ფონები.",
    keys: ["secondary", "secondary-foreground"],
    previewType: "button",
    sampleLabel: "მეორადი ღილაკი",
  },
  {
    title: "მონიშვნა და ბეჯები",
    description: "გამოკვეთილი ელემენტები, ბეჯები, ტეგები.",
    keys: ["accent", "accent-foreground"],
    previewType: "badge",
    sampleLabel: "ბეჯის მაგალითი",
  },
  {
    title: "მქრქალი ტექსტი",
    description: "ნაკლებად მნიშვნელოვანი, დამატებითი ტექსტი და ფონები (მაგ. აღწერები).",
    keys: ["muted", "muted-foreground"],
    previewType: "muted",
  },
  {
    title: "ბარათი",
    description: "ბარათების ფონი და ტექსტი — მაგ. სერვისის ბარათები მთავარ გვერდზე.",
    keys: ["card", "card-foreground"],
    previewType: "card",
  },
  {
    title: "ჩარჩოები და ველები",
    description: "ხაზები, ინფუთის ველის ჩარჩო და კლავიატურით ფოკუსის რგოლი.",
    keys: ["border", "input", "ring"],
    previewType: "border",
  },
  {
    title: "საფრთხის ფერი",
    description: "შეცდომები და წაშლის ღილაკები.",
    keys: ["destructive"],
    previewType: "destructive",
    sampleLabel: "წაშლა",
  },
]

export const FONT_CHOICES: { value: FontChoice; label: string }[] = [
  { value: "sans", label: "Noto Sans Georgian (sans-serif)" },
  { value: "serif", label: "Noto Serif Georgian (serif)" },
  { value: "system", label: "სისტემური (System UI)" },
]

export const DEFAULT_LIGHT: Record<string, string> = {
  background: "#FAF8F3", foreground: "#10182B",
  primary: "#0B1220", "primary-foreground": "#FFFFFF",
  secondary: "#F3E6C4", "secondary-foreground": "#0B1220",
  accent: "#F2D89A", "accent-foreground": "#0B1220",
  muted: "#F3E6C4", "muted-foreground": "#5E6674",
  card: "#FFF7E6", "card-foreground": "#10182B",
  border: "#E8D9AE", input: "#E8D9AE", ring: "#0B1220",
  destructive: "#B3261E",
}

export const DEFAULT_DARK: Record<string, string> = {
  background: "#0B1220", foreground: "#F3EFE4",
  primary: "#24344A", "primary-foreground": "#FFFFFF",
  secondary: "#16202F", "secondary-foreground": "#F3EFE4",
  accent: "#1B2636", "accent-foreground": "#F3EFE4",
  muted: "#16202F", "muted-foreground": "#93A0B3",
  card: "#142132", "card-foreground": "#F3EFE4",
  border: "#22314A", input: "#22314A", ring: "#F5C24D",
  destructive: "#E5484D",
}

export type ThemeConfigData = {
  light: Record<string, string>
  dark: Record<string, string>
  radius: string
  baseFontSize: number
  fontFamily: FontChoice
}

export const DEFAULT_THEME: ThemeConfigData = {
  light: DEFAULT_LIGHT,
  dark: DEFAULT_DARK,
  radius: "0.625rem",
  baseFontSize: 16,
  fontFamily: "sans",
}

function fontStack(choice: FontChoice): string {
  if (choice === "serif") return "var(--font-noto-serif), Georgia, serif"
  if (choice === "system") return "system-ui, -apple-system, 'Segoe UI', sans-serif"
  return "var(--font-noto-sans), system-ui, sans-serif"
}

function tokenVars(tokens: Record<string, string>): string {
  return THEME_TOKENS.map((t) => {
    const v = tokens[t.key]
    return v ? `  --${t.key}: ${v};` : null
  })
    .filter(Boolean)
    .join("\n")
}

/**
 * Build the CSS injected in the root layout. Targets :root / .dark with the same
 * specificity as globals.css; because it renders after the stylesheet in source
 * order it wins, overriding the default oklch palette with the admin's hex tokens.
 */
export function buildThemeCss(cfg: ThemeConfigData): string {
  const font = fontStack(cfg.fontFamily)
  return [
    ":root{",
    tokenVars(cfg.light),
    `  --radius: ${cfg.radius};`,
    `  --font-georgian: ${font};`,
    "}",
    ".dark{",
    tokenVars(cfg.dark),
    "}",
    `html{ font-size: ${cfg.baseFontSize}px; }`,
  ].join("\n")
}
