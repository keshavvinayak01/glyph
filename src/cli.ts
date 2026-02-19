import meow from 'meow';
import fs from 'node:fs';
import path from 'node:path';
import { startPager } from './pager.js';

const cli = meow(`
  Usage
    $ glyphmd <file.md>

  Options
    --help     Show this help message

  Controls
    j/k or ↑/↓     Scroll one line
    Space/b         Scroll one page
    g/G             Jump to top/bottom
    /               Search
    n/N             Next/previous match
    q               Quit

  Examples
    $ glyphmd README.md
    $ glyphmd docs/guide.md
`, {
  importMeta: import.meta,
  flags: {},
});

const filePath = cli.input[0];

if (!filePath) {
  if (process.stdin.isTTY) {
    cli.showHelp();
    process.exit(1);
  }

  // Read from stdin
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk: string) => { data += chunk; });
  process.stdin.on('end', () => {
    if (!data.trim()) {
      console.error('Error: Empty input');
      process.exit(1);
    }
    startPager(data);
  });
} else {
  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    console.error(`Error: File not found: ${resolved}`);
    process.exit(1);
  }

  const stat = fs.statSync(resolved);
  if (stat.isDirectory()) {
    console.error(`Error: "${resolved}" is a directory, not a file`);
    process.exit(1);
  }

  const content = fs.readFileSync(resolved, 'utf8');

  if (!content.trim()) {
    console.error('Error: File is empty');
    process.exit(1);
  }

  if (content.includes('\0')) {
    console.error('Error: File appears to be binary');
    process.exit(1);
  }

  startPager(content);
}
