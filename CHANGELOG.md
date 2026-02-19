# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-02-19

### Added

- **Edit mode**: Press `E` to open the current file in `$EDITOR` (default: vim). On exit, the pager reloads the file and refreshes the rendered view, preserving scroll position.

## [1.0.0] - 2026-02-19

### Added

- FIGlet ASCII art rendering for h1 headings
- Double-bordered boxes for h2 headings
- Styled text (bold, color, underline) for h3-h6 with descending emphasis
- Syntax-highlighted code blocks with bordered boxes and language labels
- Tables with box-drawing characters and column alignment
- Ordered, unordered, nested, and task lists
- Left-bordered italic blockquotes
- Inline formatting: bold, italic, strikethrough, inline code, links
- Full-width horizontal rule separators
- Full-screen terminal pager using alternate screen buffer
- Keyboard navigation: j/k, arrows, Space/b, g/G
- Search mode with `/`, navigate matches with n/N
- Stdin pipe support
- Error handling for missing files, directories, empty files, binary files
