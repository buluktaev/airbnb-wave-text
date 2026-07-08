// ponytail: грубый однопроходный regex-подсветчик под наш конкретный экспортный
// сниппет (HTML + встроенный JS), не полноценный парсер — если понадобится общий,
// взять prism/shiki. Возвращает HTML-строку с <span class="tok-*"> для
// dangerouslySetInnerHTML (вход экранируется первым делом → XSS закрыт).

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Единый regex-альтернатива: comment | string | tag | number | keyword.
// Global-проход поглощает каждый токен целиком, поэтому числа внутри строк/
// комментариев не перекрашиваются (в отличие от плейсхолдерного подхода).
const TOKEN = /(\/\/[^\n]*)|((["'`])(?:\\.|(?!\3).)*\3)|(&lt;\/?[a-zA-Z][\w-]*)|(\b-?\d+\.?\d*\b)|(\b(?:var|function|return|if|else|new|for|forEach|Array|window|document|true|false|null|undefined)\b)/g;

export function highlight(code) {
  return escapeHtml(code).replace(TOKEN, (m, com, str, _q, tag, num, kw) => {
    if (com) return `<span class="tok-com">${com}</span>`;
    if (str) return `<span class="tok-str">${str}</span>`;
    if (tag) {
      const parts = tag.match(/^(&lt;\/?)(.*)$/); // красим только имя тега, скобку оставляем
      return `${parts[1]}<span class="tok-tag">${parts[2]}</span>`;
    }
    if (num) return `<span class="tok-num">${num}</span>`;
    if (kw) return `<span class="tok-kw">${kw}</span>`;
    return m;
  });
}
