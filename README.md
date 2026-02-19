# glyphmd

A CLI markdown viewer with FIGlet ASCII art headings and a full-screen terminal pager.

Unlike other terminal markdown viewers that only use bold+color for headings, glyphmd renders h1 headings as large FIGlet ASCII art, h2 in double-bordered boxes, and h3-h6 with descending styled emphasis -- giving a browser-like visual hierarchy entirely within the terminal.

## Requirements

- Node.js 18+
- npm

No other system dependencies. Works over SSH, no graphics protocols needed.

## Install

```bash
npm install -g glyphmd
```

Or from source:

```bash
git clone https://github.com/keshavvinayak01/glyph
cd glyphmd
npm install
sudo npm link
```

## Usage

```bash
glyphmd README.md
glyphmd ~/docs/notes.md
```

### Controls

| Key | Action |
|-----|--------|
| `j` / `k` or `↑` / `↓` | Scroll one line |
| `Space` / `b` | Page down / up |
| `g` / `G` | Jump to top / bottom |
| `/` | Search |
| `n` / `N` | Next / previous search match |
| `E` | Edit file in `$EDITOR` (default: vim) |
| `q` | Quit |

## Features

- **h1**: FIGlet ASCII art (Standard font, bold cyan)
- **h2**: Double-bordered box (green)
- **h3**: Bold + cyan + underline
- **h4**: Bold + yellow
- **h5**: Bold + dim
- **h6**: Dim + underline
- **Code blocks**: Syntax-highlighted with bordered boxes and language labels
- **Tables**: Box-drawing characters with column alignment
- **Lists**: Ordered, unordered, nested, and task lists
- **Blockquotes**: Left-bordered italic text
- **Inline formatting**: Bold, italic, strikethrough, inline code, links
- **Horizontal rules**: Full-width terminal separators
- **Pager**: Full-screen scrolling with search and match navigation

## Development

```bash
npm run build    # compile TypeScript
npm run dev      # watch mode
npm start        # run directly without global install
```
