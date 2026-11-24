// Scans visible copy in src (pages, components, emails, data) for hyphens and dashes,
// and for banned filler words. Run: npm run check:copy
import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import ts from "typescript"

const ROOT = path.resolve(import.meta.dirname, "../src")
const SKIP_DIRS = ["components/ui", "app/api", "lib/server"]
const DASH = /[-‐-―−]/
const BANNED = /\b(elevate|unleash|seamless|cutting edge|revolutioni[sz]e|game changer|effortless|delve|unlock|next level|in today's world)\b/i

// Attributes and object keys whose values are not visible copy
const NON_COPY_ATTRS = new Set([
  "className", "href", "src", "id", "key", "type", "name", "htmlFor", "role", "rel", "target", "accept",
  "autoComplete", "inputMode", "layoutId", "viewBox", "d", "path", "fill", "stroke", "strokeLinecap",
  "strokeLinejoin", "style", "data-testid", "preserveAspectRatio", "transform", "mode", "variant", "size",
  "as", "align", "position", "attribute", "defaultTheme", "storageKey", "color", "form", "lang",
  "autoCapitalize", "content", "property", "x", "y", "width", "height", "aria-hidden", "dur", "repeatCount",
  "rotate", "strokeDasharray", "query", "allow", "sizes",
])
const NON_COPY_KEYS = new Set([
  "id", "slug", "image", "href", "icon", "src", "category", "status", "code", "url", "path", "span",
  "className", "contentType", "readout", "fontFamily", "background", "border", "borderTop", "padding",
  "margin", "letterSpacing", "lineHeight", "color", "textDecoration", "borderRadius", "display",
])
const VISIBLE_ATTRS = new Set(["placeholder", "aria-label", "alt", "title", "label", "description", "hint"])

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f)
    const rel = path.relative(ROOT, p)
    if (statSync(p).isDirectory()) {
      if (!SKIP_DIRS.some((s) => rel.startsWith(s))) walk(p, out)
    } else if (/\.(tsx|ts)$/.test(f)) out.push(p)
  }
  return out
}

const looksLikeCode = (s) =>
  /^[a-z0-9_.:/@#\[\]()=%,+\s-]*$/.test(s) && !/\s[a-z]+\s[a-z]+/.test(s) && !/^[A-Z]/.test(s)

const isClassList = (s) => {
  const t = s.trim().split(/\s+/)
  return t.length >= 3 && t.filter((x) => /[-:\[]/.test(x) && /^[\w\[\]#/.:%()&>*,'=!-]+$/.test(x)).length / t.length > 0.5
}
const insideNonCopyAttr = (node) => {
  const a = ts.findAncestor(node, ts.isJsxAttribute)
  return Boolean(a && (NON_COPY_ATTRS.has(a.name.getText()) || a.name.getText().startsWith("data-")))
}

const problems = []
for (const file of walk(ROOT)) {
  const text = readFileSync(file, "utf8")
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const report = (node, value, why) => {
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart())
    problems.push(`${path.relative(process.cwd(), file)}:${line + 1}  ${why}: ${JSON.stringify(value.trim().slice(0, 90))}`)
  }
  const check = (node, value, visibleHint) => {
    if (!value.trim()) return
    if (!visibleHint && looksLikeCode(value)) return
    if (DASH.test(value)) report(node, value, "dash")
    if (BANNED.test(value)) report(node, value, "filler word")
  }
  const visit = (node) => {
    if (ts.isJsxText(node)) check(node, node.text, true)
    else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const parent = node.parent
      if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) || ts.isExternalModuleReference(parent)) return
      if (ts.isExpressionStatement(parent)) return // "use client"
      if (ts.isPropertyAssignment(parent) && parent.name === node) return // object keys like "Content-Type"
      if (ts.isNewExpression(parent)) return // new Intl.NumberFormat("en-NG")
      if (insideNonCopyAttr(node)) return
      if (isClassList(node.text)) return
      const decl = ts.findAncestor(node, ts.isVariableDeclaration)
      if (decl && /class|base|font|mono|locale/i.test(decl.name.getText())) return
      let attr = null
      if (ts.isJsxAttribute(parent)) attr = parent.name.getText()
      else if (ts.isJsxExpression(parent) && ts.isJsxAttribute(parent.parent)) attr = parent.parent.name.getText()
      if (attr) {
        if (NON_COPY_ATTRS.has(attr) || attr.startsWith("data-")) return
        return check(node, node.text, VISIBLE_ATTRS.has(attr))
      }
      if (ts.isPropertyAssignment(parent) && parent.initializer === node) {
        const key = parent.name.getText().replace(/["']/g, "")
        if (NON_COPY_KEYS.has(key)) return
      }
      // Call arguments like cn("..."), fetch("/api/..."), cva(...) are code
      if (ts.isCallExpression(parent) && !/toast|setError|setMsg|Error|addIssue|message/.test(parent.expression.getText())) return
      if (ts.isElementAccessExpression(parent) || ts.isBinaryExpression(parent) && /===|!==|==/.test(parent.operatorToken.getText())) return
      if (ts.isCaseClause(parent) || ts.isLiteralTypeNode(parent)) return
      check(node, node.text, false)
    } else if (ts.isTemplateExpression(node)) {
      const parts = [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join(" ")
      let p = node.parent
      if (ts.isJsxExpression(p) && ts.isJsxAttribute(p.parent) && NON_COPY_ATTRS.has(p.parent.name.getText())) return
      if (ts.isCallExpression(p) && !/toast|whatsappLink|message/.test(p.expression.getText())) return
      if (/^\s*(\/|https?:|AF|\$|#)/.test(node.head.text) || /^[\w./-]*$/.test(parts.replace(/\s/g, ""))) return
      check(node, parts, false)
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
}

if (problems.length) {
  console.log(`Found ${problems.length} copy issue(s):\n` + problems.join("\n"))
  process.exit(1)
}
console.log("Copy check passed: no hyphens, dashes or filler words in visible text.")
