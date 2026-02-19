import figlet from 'figlet';

export function renderFiglet(text: string): string {
  try {
    return figlet.textSync(text, { font: 'Standard' });
  } catch {
    return text;
  }
}
