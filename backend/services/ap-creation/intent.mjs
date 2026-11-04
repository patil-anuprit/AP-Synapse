// This recognizes explicit artifact requests; ordinary discussion is left to normal chat.
const MAKE = /\b(create|generate|make|design|draw|render|build|produce|prepare|export|turn\s+(?:this|it)\s+into|convert)\b/i;
const CHANGE = /\b(change|edit|revise|update|modify|improve|remove|replace|enhance|redo|make\s+it|turn\s+it)\b/i;
const IMAGE = /\b(image|picture|photo|poster|logo|banner|thumbnail|illustration|wallpaper|artwork|visual|graphic|drawing)\b/i;
const SLIDES = /\b(pptx?|powerpoint|slides?|slide\s*deck|presentation)\b/i;
const PDF = /\b(pdf|pdf\s*file)\b/i;
const DOC = /\b(docx|word\s+document|editable\s+document|document)\b/i;
const REPORT = /\b(report|study\s+notes|handout)\b/i;
const EXPLAIN = /^\s*(?:what|why|how|explain|tell\s+me|is\s+it|where|can\s+i|could\s+i)\b/i;
export function routeIntent(message, priorKind = null) {
  const s = String(message || '').slice(0, 8000);
  if (!s.trim() || EXPLAIN.test(s)) return null;
  if (!MAKE.test(s) && !CHANGE.test(s)) return null;
  if (/\bto\s+(?:an?\s+)?(?:docx|word\s+document|editable\s+document)\b/i.test(s)) return 'docx';
  if (/\bto\s+(?:an?\s+)?(?:pptx?|powerpoint|slides?|presentation)\b/i.test(s)) return 'slides';
  if (/\bto\s+(?:an?\s+)?pdf\b/i.test(s)) return 'pdf';
  if (SLIDES.test(s)) return 'slides';
  if (PDF.test(s)) return 'pdf';
  if (DOC.test(s)) return 'docx';
  if (IMAGE.test(s)) return 'image';
  if (REPORT.test(s) && MAKE.test(s)) return 'pdf';
  if (CHANGE.test(s) && priorKind && /\b(it|this|same|previous|earlier)\b/i.test(s)) return priorKind;
  return null;
}
export function cleanText(s, max=8000) {
  return String(s ?? '').replace(/\u0000/g,'').slice(0,max).trim();
}
