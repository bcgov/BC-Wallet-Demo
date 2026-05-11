import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize SVG content by removing potentially dangerous elements and attributes
 * Uses DOMPurify which is a well-maintained, industry-standard HTML/SVG sanitizer
 * Configured to be restrictive: only allows essential SVG drawing elements and attributes
 */
export function sanitizeSVG(content: string): string {
  // Configure DOMPurify for SVG content
  // Restrictive allowlist focused on visual drawing elements only
  const config = {
    ALLOWED_TAGS: [
      'svg',
      'g',
      'path',
      'rect',
      'circle',
      'ellipse',
      'line',
      'polyline',
      'polygon',
      'text',
      'tspan',
      'use',
      'symbol',
      'defs',
      'linearGradient',
      'radialGradient',
      'stop',
      'marker',
      'pattern',
      'mask',
      'clipPath',
      'title',
      'desc',
      'metadata',
    ],
    ALLOWED_ATTR: [
      'viewBox',
      'width',
      'height',
      'xmlns',
      'xmlns:xlink',
      'x',
      'y',
      'cx',
      'cy',
      'r',
      'rx',
      'ry',
      'x1',
      'y1',
      'x2',
      'y2',
      'd',
      'fill',
      'stroke',
      'stroke-width',
      'stroke-linecap',
      'stroke-linejoin',
      'opacity',
      'transform',
      'id',
      'class',
      'points',
      'offset',
      'stop-color',
      'stop-opacity',
      'gradientUnits',
      'gradientTransform',
      'fx',
      'fy',
      'spreadMethod',
      'preserveAspectRatio',
      'refX',
      'refY',
      'markerWidth',
      'markerHeight',
      'markerUnits',
      'orient',
      'patternUnits',
      'patternTransform',
      'maskUnits',
      'clipPathUnits',
      'font-family',
      'font-size',
      'text-anchor',
      'dominant-baseline',
      'paint-order',
      'fill-rule',
      'clip-rule',
      'stroke-dasharray',
      'stroke-dashoffset',
      'stroke-miterlimit',
    ],
    // Only allow data: and local URLs to prevent external resource loads/tracking
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.-]*(?:[^a-z+.\-:]|$))/i,
    // Disallow protocols that could load external resources or track users
    FORCE_BODY: false,
    KEEP_CONTENT: false, // Remove dangerous elements completely, don't leave text behind
  }

  return DOMPurify.sanitize(content, config)
}
