import chalk from 'chalk';
import figlet from 'figlet';
import { marked } from 'marked';
import { highlight } from 'cli-highlight';
import hljs from 'highlight.js';
import mlirLang from './languages/mlir.js';

// Register custom languages
hljs.registerLanguage('mlir', mlirLang);

const termWidth = process.stdout.columns || 80;

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

function wordWrap(text: string, width: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');
  for (const para of paragraphs) {
    if (para.length <= width) {
      lines.push(para);
      continue;
    }
    const words = para.split(/\s+/);
    let current = '';
    for (const word of words) {
      if (current.length + word.length + 1 > width) {
        lines.push(current);
        current = word;
      } else {
        current = current ? current + ' ' + word : word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function renderInlineTokens(tokens: any[]): string {
  if (!tokens) return '';
  return tokens.map(token => {
    switch (token.type) {
      case 'strong':
        return chalk.bold(token.tokens ? renderInlineTokens(token.tokens) : token.text);
      case 'em':
        return chalk.italic(token.tokens ? renderInlineTokens(token.tokens) : token.text);
      case 'del':
        return chalk.strikethrough(token.tokens ? renderInlineTokens(token.tokens) : token.text);
      case 'codespan':
        return chalk.bgHex('#3c3c3c').hex('#e0e0e0')(` ${token.text} `);
      case 'link':
        return chalk.blue.underline(token.text) + chalk.dim(` (${token.href})`);
      case 'image':
        return chalk.dim(`[Image: ${token.text || token.href}]`);
      case 'br':
        return '\n';
      case 'text':
        if (token.tokens) return renderInlineTokens(token.tokens);
        return token.text;
      case 'escape':
        return token.text;
      default:
        return token.text || '';
    }
  }).join('');
}

function getPlainText(token: any): string {
  if (token.tokens) {
    return token.tokens.map(getPlainText).join('');
  }
  return token.text || '';
}

function renderHeading(token: any): string[] {
  const text = getPlainText(token);
  const depth = token.depth;

  if (depth === 1) {
    try {
      const ascii = figlet.textSync(text, { font: 'Standard' });
      const lines = ascii.split('\n');
      return ['', ...lines.map(l => chalk.bold.cyan(l)), ''];
    } catch {
      return ['', chalk.bold.cyan(text), ''];
    }
  }

  if (depth === 2) {
    const inner = ` ${text} `;
    const width = inner.length + 4;
    const top = '╔' + '═'.repeat(width - 2) + '╗';
    const mid = '║ ' + chalk.bold.green(inner) + ' ║';
    const bot = '╚' + '═'.repeat(width - 2) + '╝';
    return ['', chalk.green(top), chalk.green('║ ') + chalk.bold.green(inner) + chalk.green(' ║'), chalk.green(bot), ''];
  }

  const styles: Record<number, (s: string) => string> = {
    3: (s) => chalk.bold.cyan.underline(s),
    4: (s) => chalk.bold.yellow(s),
    5: (s) => chalk.bold.dim(s),
    6: (s) => chalk.dim.underline(s),
  };

  const styleFn = styles[depth] || ((s: string) => s);
  return ['', styleFn(text), ''];
}

function renderCodeBlock(token: any): string[] {
  const lang = token.lang || '';
  const code = token.text.replace(/\n$/, '');
  let highlighted: string;
  // Suppress cli-highlight's stderr warning for unknown languages
  const origStderrWrite = process.stderr.write;
  process.stderr.write = (() => true) as typeof process.stderr.write;
  try {
    highlighted = highlight(code, { language: lang || 'plaintext', ignoreIllegals: true });
  } catch {
    try {
      highlighted = highlight(code, { ignoreIllegals: true });
    } catch {
      highlighted = code;
    }
  } finally {
    process.stderr.write = origStderrWrite;
  }

  const codeLines = highlighted.split('\n');
  const maxLen = Math.max(...codeLines.map(l => stripAnsi(l).length), lang.length);
  const boxWidth = Math.min(maxLen + 4, termWidth);

  const lines: string[] = [];
  const top = chalk.gray('╭' + '─'.repeat(boxWidth - 2) + '╮');
  const bot = chalk.gray('╰' + '─'.repeat(boxWidth - 2) + '╯');

  lines.push(top);
  if (lang) {
    lines.push(chalk.gray('│ ') + chalk.dim.italic(lang) + ' '.repeat(Math.max(0, boxWidth - 4 - lang.length)) + chalk.gray(' │'));
    lines.push(chalk.gray('│' + '─'.repeat(boxWidth - 2) + '│'));
  }
  for (const cl of codeLines) {
    const plainLen = stripAnsi(cl).length;
    const padding = Math.max(0, boxWidth - 4 - plainLen);
    lines.push(chalk.gray('│ ') + cl + ' '.repeat(padding) + chalk.gray(' │'));
  }
  lines.push(bot);

  return lines;
}

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

function renderBlockQuote(token: any): string[] {
  const lines: string[] = [];
  const innerTokens = token.tokens || [];
  for (const t of innerTokens) {
    if (t.type === 'paragraph') {
      const text = renderInlineTokens(t.tokens || []);
      const wrapped = wordWrap(stripAnsi(text), termWidth - 4);
      for (const wl of wrapped) {
        lines.push(chalk.gray('│ ') + chalk.italic(wl));
      }
    } else if (t.text) {
      lines.push(chalk.gray('│ ') + chalk.italic(t.text));
    }
  }
  return lines;
}

function renderList(token: any, depth: number = 0): string[] {
  const lines: string[] = [];
  const indent = '  '.repeat(depth);
  const items = token.items || [];

  items.forEach((item: any, i: number) => {
    const bullet = token.ordered
      ? `${(token.start || 1) + i}. `
      : '• ';

    const checkbox = item.task
      ? (item.checked ? '[x] ' : '[ ] ')
      : '';

    // First line of item
    let firstLine = true;
    for (const t of item.tokens || []) {
      if (t.type === 'text' || t.type === 'paragraph') {
        const text = renderInlineTokens(t.tokens || []);
        const wrapped = wordWrap(text, termWidth - indent.length - bullet.length - 4);
        for (const wl of wrapped) {
          if (firstLine) {
            lines.push(indent + bullet + checkbox + wl);
            firstLine = false;
          } else {
            lines.push(indent + ' '.repeat(bullet.length) + wl);
          }
        }
      } else if (t.type === 'list') {
        lines.push(...renderList(t, depth + 1));
      }
    }
    if (firstLine) {
      lines.push(indent + bullet + checkbox);
    }
  });

  return lines;
}

function renderTable(token: any): string[] {
  const headers: string[] = token.header.map((cell: any) => getPlainText(cell));
  const rows: string[][] = token.rows.map((row: any[]) =>
    row.map((cell: any) => getPlainText(cell))
  );
  const aligns: Array<'left' | 'center' | 'right' | null> = token.align || [];

  const colCount = headers.length;
  const colWidths: number[] = [];
  for (let c = 0; c < colCount; c++) {
    let max = headers[c].length;
    for (const row of rows) {
      if (row[c] && row[c].length > max) max = row[c].length;
    }
    colWidths.push(max);
  }

  function pad(text: string, width: number, alignment: 'left' | 'center' | 'right' | null): string {
    const diff = width - text.length;
    if (diff <= 0) return text;
    switch (alignment) {
      case 'right':
        return ' '.repeat(diff) + text;
      case 'center': {
        const left = Math.floor(diff / 2);
        return ' '.repeat(left) + text + ' '.repeat(diff - left);
      }
      default:
        return text + ' '.repeat(diff);
    }
  }

  const topBorder = '┌' + colWidths.map(w => '─'.repeat(w + 2)).join('┬') + '┐';
  const midBorder = '├' + colWidths.map(w => '─'.repeat(w + 2)).join('┼') + '┤';
  const botBorder = '└' + colWidths.map(w => '─'.repeat(w + 2)).join('┴') + '┘';

  function renderRow(cells: string[], bold: boolean): string {
    const content = cells.map((cell, c) =>
      ' ' + pad(cell, colWidths[c], aligns[c]) + ' '
    ).join('│');
    return bold
      ? '│' + chalk.bold(content) + '│'
      : '│' + content + '│';
  }

  const lines = [topBorder, renderRow(headers, true), midBorder];
  for (const row of rows) {
    lines.push(renderRow(row, false));
  }
  lines.push(botBorder);

  return lines;
}

function renderHr(): string[] {
  return ['', chalk.dim('─'.repeat(termWidth)), ''];
}

function renderToken(token: any): string[] {
  switch (token.type) {
    case 'heading':
      return renderHeading(token);

    case 'paragraph': {
      const text = renderInlineTokens(token.tokens || []);
      const lines = wordWrap(text, termWidth);
      return [...lines, ''];
    }

    case 'code':
      return [...renderCodeBlock(token), ''];

    case 'blockquote':
      return [...renderBlockQuote(token), ''];

    case 'list':
      return [...renderList(token), ''];

    case 'table':
      return [...renderTable(token), ''];

    case 'hr':
      return renderHr();

    case 'space':
      return [''];

    case 'html':
      return [chalk.dim(token.text)];

    default:
      if (token.text) return [token.text];
      return [];
  }
}

export function renderFullDocument(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  const allLines: string[] = [];

  for (const token of tokens) {
    allLines.push(...renderToken(token));
  }

  return allLines;
}
