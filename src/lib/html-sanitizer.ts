import DOMPurify from 'dompurify';

// Safe HTML configuration - allows styling but NO scripts
const SAFE_HTML_CONFIG = {
  ALLOWED_TAGS: [
    // Text formatting
    'p', 'br', 'span', 'div',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins',
    'sub', 'sup', 'mark',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Lists
    'ul', 'ol', 'li',
    // Tables
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    // Links and media
    'a', 'img', 'embed', 'object', 'iframe',
    // Quotes and code
    'blockquote', 'pre', 'code',
    // Semantic
    'article', 'section', 'header', 'footer', 'aside', 'nav', 'main',
    'figure', 'figcaption',
    // Other
    'hr', 'abbr', 'address', 'cite', 'q',
  ],
  ALLOWED_ATTR: [
    // Global attributes
    'class', 'id', 'style', 'title', 'lang', 'dir',
    // Links
    'href', 'target', 'rel',
    // Images
    'src', 'alt', 'width', 'height', 'loading',
    // Embed/iframe for PDF
    'type', 'allowfullscreen', 'frameborder', 'allow', 'sandbox',
    // Tables
    'colspan', 'rowspan', 'scope', 'headers',
    // Data attributes (for styling)
    'data-*',
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|blob|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  // Block dangerous elements - but allow embed/iframe for PDF viewing
  FORBID_TAGS: ['script', 'style', 'form', 'input', 'button', 'textarea', 'select'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
  // Remove scripts completely
  ADD_TAGS: [],
  ADD_ATTR: [],
  // Sanitize style attribute (remove JS expressions)
  SANITIZE_DOM: true,
  KEEP_CONTENT: true,
};

// Full HTML configuration - for admin/trusted content only (like interactive games)
const FULL_HTML_CONFIG = {
  ADD_TAGS: ['iframe', 'style', 'script', 'canvas', 'meta'],
  ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'charset', 'type', 'async', 'defer'],
  // Still block inline event handlers for safety
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  // Allow scripts for interactive content
  FORCE_BODY: true,
};

/**
 * Sanitize HTML content for safe rendering
 * Use this for USER-GENERATED content
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, SAFE_HTML_CONFIG);
}

/**
 * Render trusted HTML with minimal sanitization
 * Use this ONLY for ADMIN-CREATED content (library content)
 * This allows scripts for interactive games/quizzes
 */
export function renderTrustedHtml(html: string): string {
  if (!html) return '';
  
  // For library content with scripts, return as-is (trusted admin content)
  // Check if it has script/canvas (interactive content)
  if (/<script|<canvas|<style/.test(html)) {
    // Return raw HTML for interactive content from trusted source
    // Only remove dangerous inline event handlers
    return html
      .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove inline handlers
      .replace(/javascript:/gi, ''); // Remove javascript: URLs
  }
  
  // Still sanitize non-interactive content
  return DOMPurify.sanitize(html, FULL_HTML_CONFIG);
}

/**
 * Check if content is from admin/trusted source
 * You can extend this based on your data structure
 */
export function isAdminContent(content: {
  source?: string;
  isAdminContent?: boolean;
  createdBy?: string;
}): boolean {
  // Check if explicitly marked as admin content
  if (content.isAdminContent === true) return true;
  if (content.source === 'admin' || content.source === 'library') return true;
  return false;
}

/**
 * Smart sanitize - automatically chooses safe or full based on source
 */
export function smartSanitize(
  html: string,
  options?: {
    isAdmin?: boolean;
    source?: string;
  }
): string {
  if (!html) return '';
  
  // If explicitly admin content, use full rendering
  if (options?.isAdmin || options?.source === 'admin' || options?.source === 'library') {
    return renderTrustedHtml(html);
  }
  
  // Default: safe sanitization for user content
  return sanitizeHtml(html);
}

export default {
  sanitizeHtml,
  renderTrustedHtml,
  isAdminContent,
  smartSanitize,
};
