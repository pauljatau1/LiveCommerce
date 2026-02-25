/**
 * HTML sanitizer utility using DOMPurify
 * Enterprise-grade XSS protection with high performance
 */

import DOMPurify from 'dompurify';

// Cache for sanitized content to avoid re-processing
const sanitizeCache = new Map<string, string>();
const plainTextCache = new Map<string, string>();
const CACHE_SIZE_LIMIT = 100; // Prevent memory leaks

// DOMPurify configuration for product descriptions
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id'
  ],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false
};

export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  // Check cache first
  if (sanitizeCache.has(html)) {
    return sanitizeCache.get(html)!;
  }
  
  // Sanitize using DOMPurify
  const sanitized = DOMPurify.sanitize(html, SANITIZE_CONFIG);
  
  // Cache the result (with size limit)
  if (sanitizeCache.size >= CACHE_SIZE_LIMIT) {
    // Clear oldest entries (simple FIFO)
    const firstKey = sanitizeCache.keys().next().value;
    if (firstKey) {
      sanitizeCache.delete(firstKey);
    }
  }
  sanitizeCache.set(html, sanitized);
  
  return sanitized;
};

/**
 * Extract plain text from HTML content, removing all tags and normalizing whitespace
 * This eliminates line breaks, paragraph breaks, and other HTML formatting
 */
export const extractPlainText = (html: string): string => {
  if (!html) return '';
  
  // Check cache first
  if (plainTextCache.has(html)) {
    return plainTextCache.get(html)!;
  }
  
  // First sanitize to prevent XSS
  const sanitized = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  
  // Extract text content and normalize whitespace
  const plainText = sanitized
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .trim(); // Remove leading/trailing whitespace
  
  // Cache the result (with size limit)
  if (plainTextCache.size >= CACHE_SIZE_LIMIT) {
    // Clear oldest entries (simple FIFO)
    const firstKey = plainTextCache.keys().next().value;
    if (firstKey) {
      plainTextCache.delete(firstKey);
    }
  }
  plainTextCache.set(html, plainText);
  
  return plainText;
};

/**
 * Alternative: Strip all HTML tags and return plain text
 * Use this if you want to display HTML content as plain text
 */
export const stripHtml = (html: string): string => {
  if (!html) return '';
  
  // Use DOMPurify to strip all HTML tags
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
};
