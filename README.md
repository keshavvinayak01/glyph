# Glyph

CLI Markdown viewer with FIGlet ASCII art headings and a full-screen pager.

Unlike other terminal markdown viewers that only use bold+color for headings, Glyph renders h1 headings as large FIGlet ASCII art, h2 in double-bordered boxes, and h3-h6 with descending styled emphasis -- giving a browser-like visual hierarchy entirely within the terminal.

## Install

```bash
git clone <repo-url> glyph
cd glyph
npm install
npm link
```

Then use it anywhere:

```bash
glyph README.md
```

If `npm link` fails with a permissions error, either:

- Run `sudo npm link`, or
- Set a user-writable prefix first:
  ```bash
  npm config set prefix ~/.npm-global
  export PATH="$HOME/.npm-global/bin:$PATH"  # add to your .bashrc/.zshrc
  npm link
  ```

## Usage

```
glyph <file.md>
```

### Controls

| Key | Action |
|-----|--------|
| `j` / `k` or `Up` / `Down` | Scroll one line |
| `Space` / `b` | Scroll one page down / up |
| `g` / `G` | Jump to top / bottom |
| `/` | Enter search mode |
| `n` / `N` | Next / previous search match |
| `q` | Quit |

## Features

- **h1**: FIGlet ASCII art (Standard font)
- **h2**: Double-bordered box
- **h3-h6**: Bold + color + underline with descending emphasis
- **Code blocks**: Syntax-highlighted with bordered boxes
- **Tables**: Box-drawing characters with alignment
- **Lists**: Ordered, unordered, nested, task lists
- **Blockquotes**: Left-bordered italic text
- **Inline formatting**: Bold, italic, strikethrough, inline code, links
- **Pager**: Full-screen scrolling with search

## Development

```bash
npm run build    # compile TypeScript
npm run dev      # watch mode
npm start        # run directly
```
