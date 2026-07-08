// ponytail: a rough single-pass regex highlighter for our specific export snippet
// (HTML + inline JS), not a real parser — reach for prism/shiki if a general one
// is ever needed. Returns an HTML string with <span class="tok-*"> for
// dangerouslySetInnerHTML (input is escaped first → XSS is closed off).

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Single alternation regex: comment | string | tag | number | keyword.
// The global pass consumes each token whole, so numbers inside strings/comments
// don't get recolored (unlike the earlier placeholder-based approach).
const TOKEN = /(\/\/[^\n]*)|((["'`])(?:\\.|(?!\3).)*\3)|(&lt;\/?[a-zA-Z][\w-]*)|(\b-?\d+\.?\d*\b)|(\b(?:var|function|return|if|else|new|for|forEach|Array|window|document|true|false|null|undefined)\b)/g;

export function highlight(code) {
  return escapeHtml(code).replace(TOKEN, (m, com, str, _q, tag, num, kw) => {
    if (com) return `<span class="tok-com">${com}</span>`;
    if (str) return `<span class="tok-str">${str}</span>`;
    if (tag) {
      const parts = tag.match(/^(&lt;\/?)(.*)$/); // only color the tag name, leave the bracket alone
      return `${parts[1]}<span class="tok-tag">${parts[2]}</span>`;
    }
    if (num) return `<span class="tok-num">${num}</span>`;
    if (kw) return `<span class="tok-kw">${kw}</span>`;
    return m;
  });
}
