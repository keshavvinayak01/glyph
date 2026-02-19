# Code Block Tests

## JavaScript

```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## TypeScript

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

## Bash

```bash
#!/bin/bash
echo "Installing dependencies..."
npm install
npm run build
echo "Done!"
```

## No Language Specified

```
This is a plain code block
with no language tag
```

## Inline Code

Use the `glyph` command like this: `glyph README.md`
