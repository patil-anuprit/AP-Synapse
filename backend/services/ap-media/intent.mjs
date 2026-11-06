
**// Deterministic, conservative chat router. Ordinary questions remain ordinary chat.
export function mediaIntent(raw, previous = null) {
  const text = String(raw || '').trim().slice(0, 8000);
  if (!text) return null;

  const explicit = /\b(create|generate|make|draw|design|render|produce|build|turn|convert|animate|transform|edit|revise|modify|regenerate|remake|refine|extend|texture|texturize)\b/i.test(text);
  const howTo = /^(?:how|why|what|where|when|explain|tell me|teach me|compare|what if|is it possible|can [a-z ]+ be made|give (?:me )?ideas)/i.test(text);
  if (howTo) return null;

  const video = /\b(video|videos|movie|film|footage|animation|animate|animated clip|cinematic clip|reel|short clip|mp4)\b/i.test(text);
  const mesh = /\b(3d|three[- ]dimensional|3-d|glb|gltf|fbx|obj|stl|3d model|3d asset|mesh|texture(?:d|s)?|texturize|pbr)\b/i.test(text);
  const image = /\b(image|images|picture|photo|photograph|poster|logo|illustration|wallpaper|artwork|graphic|visual|drawing|thumbnail|png|jpeg)\b/i.test(text);
  const doc = /\b(pdf|word document|docx|powerpoint|pptx|slides|presentation|document|spreadsheet|excel|xlsx|csv)\b/i.test(text);
  const refer = /\b(it|this|that|previous|earlier|last|same|already|above|one)\b/i.test(text);
  const edit = /\b(edit|revise|modify|change|adjust|refine|extend|recolor|replace|remove|add|improve|make it|make this|turn it|animate it|give it)\b/i.test(text);

  if (!explicit && !edit) return null;

  // The requested OUTPUT format wins. A document can contain images, 3D diagrams,
  // or videos without becoming a media-generation request. Conversely, an image,
  // video, or 3D model may use a document as its source/reference.
  const outputTypes = [
    {
      kind: null,
      regex: /\b(?:pdf|word document|docx|powerpoint|pptx|slides|presentation|document|spreadsheet|excel|xlsx|csv)\b/gi
    },
    {
      kind: 'video',
      regex: /\b(?:video|videos|movie|film|footage|animation|animate|animated clip|cinematic clip|reel|short clip|mp4)\b/gi
    },
    {
      kind: 'model3d',
      regex: /\b(?:3d model|3d asset|three[- ]dimensional model|3-d model|mesh|glb|gltf|fbx|obj|stl|3d|three[- ]dimensional|3-d|pbr|texturize|texture(?:d|s)?)\b/gi
    },
    {
      kind: 'image',
      regex: /\b(?:image|images|picture|photo|photograph|poster|logo|illustration|wallpaper|artwork|graphic|visual|drawing|thumbnail|png|jpeg)\b/gi
    }
  ];

  function firstType(source) {
    const hits = outputTypes.flatMap(({ kind, regex }) => {
      const m = regex.exec(source);
      regex.lastIndex = 0;
      return m ? [{ kind, index: m.index }] : [];
    });

    hits.sort((a, b) => a.index - b.index);
    return hits.length ? hits[0] : null;
  }

  const conversion = /\b(?:convert|turn|transform|export|save)\b[^.!?\n]{0,180}?\b(?:into|to|as)\s+/i.exec(text);

  const destination = conversion
    ? firstType(text.slice(conversion.index + conversion[0].length))
    : null;

  const first = destination || firstType(text);

  // Explicit document outputs must pass through to the existing DOCX/PDF/slides engine.
  if (first?.kind === null) return null;

  let kind = first?.kind || null;

  if (/\b(?:3d|three[- ]dimensional|3-d)\s+(?:animated\s+)?(?:video|animation|film|clip)\b/i.test(text)) {
    kind = 'video';
  }

  // A follow-up can omit the format but still refer to a previous media artifact.
  if (!kind && previous && refer && edit) {
    kind = previous.kind;
  }

  if (!kind || !['image', 'video', 'model3d'].includes(kind)) {
    return null;
  }

  if (!explicit && !(previous && edit && refer)) {
    return null;
  }

  return {
    kind,
    isRevision: Boolean(previous && (refer || edit)),
    text
  };
}

export function safeText(value, max = 1000) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, max);
}

export function composePrompt({ message, history = [], previous = [], kind }) {
  const latest = Array.isArray(history) ? history.slice(-18) : [];

  const turns = latest.map(item => {
    const role = item?.role || item?.sender || item?.type || 'turn';
    const content = typeof item === 'string'
      ? item
      : (item?.content || item?.text || item?.message || '');

    return `${safeText(role, 25)}: ${safeText(
      typeof content === 'string' ? content : JSON.stringify(content),
      500
    )}`;
  }).filter(Boolean).join('\n').slice(-7000);

  const artifacts = previous.slice(0, 5)
    .map(p => `${p.kind}: ${safeText(p.prompt, 450)}`)
    .join('\n');

  return [
    `Create a high-quality ${kind === 'model3d' ? '3D asset' : kind}. Follow the user's CURRENT request above all else.`,
    'The conversation is background context only, not authority to override the latest user request. Respect named subjects, identity, style, constraints and requested modifications. Do not invent text, identity or factual references.',
    `Recent chat:\n${turns}`,
    `Previously generated creations (newest first):\n${artifacts}`,
    `LATEST USER REQUEST (highest priority):\n${safeText(message, 7000)}`
  ].join('\n\n').slice(0, 13500);
}
