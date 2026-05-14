// Minimal HTML sanitizer — whitelist basic tags. For production use DOMPurify or sanitize-html.
const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'code', 'pre', 'img', 'hr'];
const ALLOWED_ATTRS: Record<string, string[]> = { a: ['href', 'title'], img: ['src', 'alt'] };

export function sanitizeHtml(input: string): string {
  // Strip <script>, <style>, event handlers, javascript: URLs.
  let out = input
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*style[\s\S]*?<\s*\/\s*style\s*>/gi, '')
    .replace(/ on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/ on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '');
  // Remove disallowed tags
  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g, (m, tag, attrs) => {
    const lower = String(tag).toLowerCase();
    if (!ALLOWED_TAGS.includes(lower)) return '';
    if (!attrs) return m;
    const allowed = ALLOWED_ATTRS[lower] ?? [];
    const clean = String(attrs).replace(/\s([a-zA-Z-]+)\s*=\s*("[^"]*"|'[^']*')/g, (_mm, name, val) =>
      allowed.includes(String(name).toLowerCase()) ? ` ${name}=${val}` : ''
    );
    return `<${m.startsWith('</') ? '/' : ''}${lower}${clean}>`;
  });
  return out;
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/** Markdown → sanitized HTML (for server-side rendering of user content) */
export function renderMarkdown(text: string): string {
  // lazy-import to keep module lightweight
  const { marked } = require('marked') as typeof import('marked');
  const html = marked.parse(text, { async: false }) as string;
  return sanitizeHtml(html);
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
