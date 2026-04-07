import meow from 'meow';
import fs from 'node:fs';
import path from 'node:path';
import { startPager } from './pager.js';
import { parseCsv } from './utils/csv.js';

const cli = meow(`
  Usage
    $ glyphmd <file.md|file.csv>

  Options
    --help     Show this help message

  Controls
    j/k or ↑/↓     Scroll one line
    Space/b         Scroll one page
    g/G             Jump to top/bottom
    /               Search
    n/N             Next/previous match
    E               Edit file in $EDITOR (default: vim)
    q               Quit

  CSV Controls
    Tab             Cycle focus to next column
    Shift+Tab       Cycle focus to previous column
    1-9             Jump focus to column 1-9
    +/=             Expand focused column
    -               Shrink focused column
    0               Reset column widths

  Examples
    $ glyphmd README.md
    $ glyphmd docs/guide.md
    $ glyphmd data.csv
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

  const ext = path.extname(resolved).toLowerCase();
  if (ext === '.csv') {
    const parsed = parseCsv(content);
    if (parsed.length < 2) {
      console.error('Error: CSV file has no data');
      process.exit(1);
    }
    const headers = parsed[0];
    const rows = parsed.slice(1);
    const naturalWidths: number[] = [];
    for (let c = 0; c < headers.length; c++) {
      let max = headers[c].length;
      for (const row of rows) {
        if (row[c] && row[c].length > max) max = row[c].length;
      }
      naturalWidths.push(max);
    }
    startPager(content, resolved, { headers, rows, naturalWidths });
  } else {
    startPager(content, resolved);
  }
}
