import { marked } from 'marked';

export type Token = marked.Token;
export type Tokens = marked.TokensList;

export function parseMarkdown(markdown: string): Tokens {
  return marked.lexer(markdown);
}

export function getPlainText(token: Token): string {
  if ('text' in token && typeof token.text === 'string') {
    if ('tokens' in token && Array.isArray(token.tokens)) {
      return token.tokens.map(getPlainText).join('');
    }
    return token.text;
  }
  if (token.type === 'br') return '\n';
  return '';
}

export function getInlineTokens(token: Token): Token[] {
  if ('tokens' in token && Array.isArray(token.tokens)) {
    return token.tokens;
  }
  return [];
}
