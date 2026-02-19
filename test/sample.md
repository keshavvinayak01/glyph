# Glyph Demo

This is a **comprehensive** test of the Glyph CLI markdown viewer.

## Features

Glyph renders markdown with *visual hierarchy* in the terminal:

- FIGlet ASCII art for h1 headings
- Double-bordered boxes for h2
- Styled text for h3-h6

### Code Highlighting

Here is some JavaScript:

```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
```

And some Python:

```python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)
```

#### Inline Formatting

You can use `inline code`, **bold text**, *italic text*, and ~~strikethrough~~.

##### Links

Visit [GitHub](https://github.com) for more info.

###### Smallest Heading

This is the smallest heading level.

## Block Quotes

> "The best way to predict the future is to invent it."
> — Alan Kay

> Nested quotes can contain **bold** and *italic* text too.

## Lists

### Unordered

- First item
- Second item
  - Nested item A
  - Nested item B
    - Deep nested
- Third item

### Ordered

1. Step one
2. Step two
3. Step three
   1. Sub-step A
   2. Sub-step B

### Task List

- [x] Setup project
- [x] Implement parser
- [ ] Write tests
- [ ] Deploy

## Tables

| Feature | Status | Priority |
|---------|--------|----------|
| FIGlet headings | Done | High |
| Code highlighting | Done | High |
| Scrolling pager | Done | Medium |
| Search | Done | Medium |

| Left | Center | Right |
|:-----|:------:|------:|
| L1 | C1 | R1 |
| L2 | C2 | R2 |

---

## Horizontal Rules

The line above is a horizontal rule.

---

And so is the one above.

## Long Content for Scrolling

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.

Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula ut dictum pharetra, nisi nunc fringilla magna, in commodo elit erat nec turpis.

Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus.

## The End

Thanks for trying **Glyph**! Press `q` to quit.
