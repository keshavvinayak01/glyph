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
    const fonts = ['Standard', 'Small', 'Mini'] as const;
    for (const font of fonts) {
      try {
        const ascii = figlet.textSync(text, { font });
        const lines = ascii.split('\n');
        const maxWidth = Math.max(...lines.map(l => l.length));
        if (maxWidth <= termWidth) {
          return ['', ...lines.map(l => chalk.bold.cyan(l)), ''];
        }
      } catch {
        continue;
      }
    }
    // All fonts too wide — fall back to plain styled text
    return ['', chalk.bold.cyan(text), ''];
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

  // Shrink columns to fit terminal width if needed
  // Total width = sum(colWidth + 2 padding) + (colCount + 1) border chars
  const borderChars = colCount + 1;
  const paddingChars = colCount * 2; // 1 space each side per column
  const availableForContent = termWidth - borderChars - paddingChars;
  const totalContentWidth = colWidths.reduce((a, b) => a + b, 0);

  if (totalContentWidth > availableForContent && availableForContent > 0) {
    const minColWidth = 3;
    // Step 1: Cap outlier columns. No column gets more than 25% of available
    // space (or the fair share if few columns), whichever is larger.
    const fairShare = Math.floor(availableForContent / colCount);
    const maxColWidth = Math.max(fairShare, Math.floor(availableForContent * 0.25));
    for (let c = 0; c < colCount; c++) {
      colWidths[c] = Math.min(colWidths[c], maxColWidth);
    }

    // Step 2: If still over budget, shrink proportionally from capped widths.
    const cappedTotal = colWidths.reduce((a, b) => a + b, 0);
    if (cappedTotal > availableForContent) {
      const scale = availableForContent / cappedTotal;
      let remaining = availableForContent;
      for (let c = 0; c < colCount; c++) {
        if (c === colCount - 1) {
          colWidths[c] = Math.max(minColWidth, remaining);
        } else {
          colWidths[c] = Math.max(minColWidth, Math.floor(colWidths[c] * scale));
          remaining -= colWidths[c];
        }
      }
    }
  }

  function truncate(text: string, width: number): string {
    if (text.length <= width) return text;
    return width > 1 ? text.slice(0, width - 1) + '…' : text.slice(0, width);
  }

  function pad(text: string, width: number, alignment: 'left' | 'center' | 'right' | null): string {
    const truncated = truncate(text, width);
    const diff = width - truncated.length;
    if (diff <= 0) return truncated;
    switch (alignment) {
      case 'right':
        return ' '.repeat(diff) + truncated;
      case 'center': {
        const left = Math.floor(diff / 2);
        return ' '.repeat(left) + truncated + ' '.repeat(diff - left);
      }
      default:
        return truncated + ' '.repeat(diff);
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

export interface CsvData {
  headers: string[];
  rows: string[][];
  /** Natural (unconstrained) width of each column based on content */
  naturalWidths: number[];
}

/**
 * Compute initial column widths that fit the terminal, applying caps and
 * proportional shrinking exactly like renderTable does for markdown tables.
 */
export function computeInitialColWidths(csv: CsvData): number[] {
  const tw = process.stdout.columns || 80;
  const colCount = csv.headers.length;
  const colWidths = csv.naturalWidths.slice();

  const borderChars = colCount + 1;
  const paddingChars = colCount * 2;
  const availableForContent = tw - borderChars - paddingChars;
  const totalContentWidth = colWidths.reduce((a, b) => a + b, 0);

  if (totalContentWidth > availableForContent && availableForContent > 0) {
    const minColWidth = 3;
    const fairShare = Math.floor(availableForContent / colCount);
    const maxColWidth = Math.max(fairShare, Math.floor(availableForContent * 0.25));
    for (let c = 0; c < colCount; c++) {
      colWidths[c] = Math.min(colWidths[c], maxColWidth);
    }
    const cappedTotal = colWidths.reduce((a, b) => a + b, 0);
    if (cappedTotal > availableForContent) {
      const scale = availableForContent / cappedTotal;
      let remaining = availableForContent;
      for (let c = 0; c < colCount; c++) {
        if (c === colCount - 1) {
          colWidths[c] = Math.max(minColWidth, remaining);
        } else {
          colWidths[c] = Math.max(minColWidth, Math.floor(colWidths[c] * scale));
          remaining -= colWidths[c];
        }
      }
    }
  }

  return colWidths;
}

/**
 * Render a CSV table with caller-supplied column widths and an optional
 * focused column (highlighted in light blue).
 */
export function renderCsvTable(
  csv: CsvData,
  colWidths: number[],
  focusedCol: number | null,
): string[] {
  const { headers, rows } = csv;
  const colCount = headers.length;

  function truncate(text: string, width: number): string {
    if (text.length <= width) return text;
    return width > 1 ? text.slice(0, width - 1) + '…' : text.slice(0, width);
  }

  function pad(text: string, width: number): string {
    const truncated = truncate(text, width);
    const diff = width - truncated.length;
    if (diff <= 0) return truncated;
    return truncated + ' '.repeat(diff);
  }

  const topBorder = '┌' + colWidths.map(w => '─'.repeat(w + 2)).join('┬') + '┐';
  const midBorder = '├' + colWidths.map(w => '─'.repeat(w + 2)).join('┼') + '┤';
  const botBorder = '└' + colWidths.map(w => '─'.repeat(w + 2)).join('┴') + '┘';

  function renderRow(cells: string[], isHeader: boolean): string {
    const parts = cells.map((cell, c) => {
      const content = ' ' + pad(cell, colWidths[c]) + ' ';
      const isFocused = focusedCol === c;
      if (isHeader && isFocused) return chalk.bgBlueBright.black.bold(content);
      if (isHeader) return chalk.bold(content);
      if (isFocused) return chalk.bgBlueBright.black(content);
      return content;
    });
    return '│' + parts.join('│') + '│';
  }

  const lines = [topBorder, renderRow(headers, true), midBorder];
  for (const row of rows) {
    const padded = headers.map((_, i) => row[i] ?? '');
    lines.push(renderRow(padded, false));
  }
  lines.push(botBorder);

  return lines;
}
