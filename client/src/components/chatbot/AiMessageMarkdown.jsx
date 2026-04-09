import React from 'react';

/**
 * Markdown nhẹ cho tin AI — không phụ thuộc react-markdown (tránh Vite 500 khi deps nặng / lệch phiên bản).
 * Hỗ trợ: xuống dòng, **đậm**, *nghiêng*, `code`, [link](url), list -/*, list 1., > trích
 */
function parseInline(raw, keyBase = 'i') {
  if (raw == null || raw === '') return null;
  const text = String(raw);
  const out = [];
  let k = 0;
  const key = () => `${keyBase}-${k++}`;

  let i = 0;
  while (i < text.length) {
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end !== -1) {
        out.push(
          <code
            key={key()}
            className="rounded bg-slate-100 px-1 py-0.5 text-sm font-mono text-slate-800"
          >
            {text.slice(i + 1, end)}
          </code>
        );
        i = end + 1;
        continue;
      }
    }
    if (text[i] === '[') {
      const rb = text.indexOf(']', i);
      if (rb !== -1 && text[rb + 1] === '(') {
        const rp = text.indexOf(')', rb + 2);
        if (rp !== -1) {
          const label = text.slice(i + 1, rb);
          const href = text.slice(rb + 2, rp);
          out.push(
            <a
              key={key()}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-700 underline decoration-emerald-300/80 underline-offset-2 hover:text-emerald-800"
            >
              {parseInline(label, `${keyBase}l`)}
            </a>
          );
          i = rp + 1;
          continue;
        }
      }
    }
    if (text[i] === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2);
      if (end !== -1) {
        out.push(
          <strong key={key()} className="font-semibold text-slate-900">
            {parseInline(text.slice(i + 2, end), `${keyBase}b`)}
          </strong>
        );
        i = end + 2;
        continue;
      }
    }
    if (text[i] === '*' && text[i + 1] !== '*') {
      const end = text.indexOf('*', i + 1);
      if (end !== -1) {
        out.push(
          <em key={key()} className="italic text-slate-700">
            {parseInline(text.slice(i + 1, end), `${keyBase}e`)}
          </em>
        );
        i = end + 1;
        continue;
      }
    }

    let j = i + 1;
    while (j < text.length) {
      const c = text[j];
      if (c === '`' || c === '[') break;
      if (c === '*' && text[j + 1] === '*') break;
      if (c === '*' && (j === 0 || text[j - 1] !== '*')) break;
      j += 1;
    }
    if (j > i) {
      out.push(text.slice(i, j));
    } else {
      out.push(text[i]);
      j = i + 1;
    }
    i = j;
  }

  return out;
}

const UL = /^[-*]\s+(.+)$/;
const OL = /^(\d+)\.\s+(.+)$/;

function renderBlock(lines, blockIdx) {
  if (!lines.length) return null;

  const allQuote = lines.every((l) => /^\s*>/.test(l));
  if (allQuote) {
    const inner = lines.map((l) => l.replace(/^\s*>\s?/, '')).join('\n');
    return (
      <blockquote
        key={`bq-${blockIdx}`}
        className="my-2 border-l-2 border-emerald-300/80 pl-3 text-base text-slate-600 italic"
      >
        {renderParagraphLines(inner.split(/\r?\n/), `qb-${blockIdx}`)}
      </blockquote>
    );
  }

  const ulM = lines.map((l) => l.match(UL));
  if (ulM.every(Boolean)) {
    return (
      <ul
        key={`ul-${blockIdx}`}
        className="my-2.5 list-disc space-y-1.5 pl-4 text-base leading-relaxed text-slate-700 marker:text-emerald-600"
      >
        {lines.map((line, li) => (
          <li key={li} className="pl-0.5">
            {parseInline(line.replace(/^[-*]\s+/, ''), `uli-${blockIdx}-${li}`)}
          </li>
        ))}
      </ul>
    );
  }

  const olM = lines.map((l) => l.match(OL));
  if (olM.every(Boolean)) {
    return (
      <ol
        key={`ol-${blockIdx}`}
        className="my-2.5 list-decimal space-y-1.5 pl-4 text-base leading-relaxed text-slate-700 marker:font-medium marker:text-slate-500"
      >
        {lines.map((line, li) => (
          <li key={li} className="pl-0.5">
            {parseInline(line.replace(/^\d+\.\s+/, ''), `oli-${blockIdx}-${li}`)}
          </li>
        ))}
      </ol>
    );
  }

  return renderParagraphLines(lines, `p-${blockIdx}`);
}

function renderParagraphLines(lineArr, keyBase) {
  const nodes = [];
  lineArr.forEach((line, idx) => {
    if (idx > 0) {
      nodes.push(<br key={`${keyBase}-br-${idx}`} />);
    }
    const parsed = parseInline(line, `${keyBase}-ln-${idx}`);
    if (parsed != null) {
      nodes.push(<React.Fragment key={`${keyBase}-f-${idx}`}>{parsed}</React.Fragment>);
    }
  });
  return (
    <p className="mb-3 last:mb-0 text-base leading-[1.65] text-slate-700" key={keyBase}>
      {nodes}
    </p>
  );
}

function splitBlocks(text) {
  const lines = String(text || '').split(/\r?\n/);
  const blocks = [];
  let cur = [];
  for (const line of lines) {
    if (line.trim() === '') {
      if (cur.length) {
        blocks.push(cur);
        cur = [];
      }
    } else {
      cur.push(line);
    }
  }
  if (cur.length) blocks.push(cur);
  return blocks;
}

export default function AiMessageMarkdown({ text }) {
  const blocks = splitBlocks(text);
  if (!blocks.length) {
    return <p className="text-base text-slate-700">&nbsp;</p>;
  }

  return (
    <div className="ai-message-md">
      {blocks.map((lines, i) => {
        const first = lines[0] || '';
        const isHeading = /^(#{1,3})\s+(.+)$/.exec(first);
        if (isHeading && lines.length === 1) {
          return (
            <h4
              key={`h-${i}`}
              className="mt-3 mb-1.5 first:mt-0 text-sm font-semibold text-slate-900 [&:first-child]:mt-0"
            >
              {parseInline(isHeading[2], `h-${i}`)}
            </h4>
          );
        }
        return renderBlock(lines, i);
      })}
    </div>
  );
}
