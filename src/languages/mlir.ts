export default function mlir(hljs: any) {
  const SSA_VALUE = {
    className: 'variable',
    begin: /%[a-zA-Z_$][\w$]*/,
  };

  const SSA_VALUE_NUM = {
    className: 'variable',
    begin: /%\d+/,
  };

  const BLOCK_LABEL = {
    className: 'symbol',
    begin: /\^[a-zA-Z_][\w]*/,
  };

  const ATTRIBUTE_REF = {
    className: 'meta',
    begin: /#[a-zA-Z_][\w.]*/,
  };

  const TYPE_ALIAS = {
    className: 'type',
    begin: /![a-zA-Z_][\w.]*/,
  };

  const BUILTIN_TYPES = {
    className: 'type',
    begin: /\b(i[1-9]\d*|f16|bf16|f32|f64|f80|f128|index|none)\b/,
  };

  const CONTAINER_TYPES = {
    className: 'type',
    begin: /\b(memref|tensor|vector|complex|tuple|opaque)\b/,
  };

  const DIALECT_OP = {
    className: 'title.function',
    begin: /[a-zA-Z_][\w]*\.[a-zA-Z_][\w.]*/,
  };

  const MAP_AFFINE = {
    className: 'string',
    begin: /affine_map\s*</,
    end: />/,
    contains: [
      { className: 'variable', begin: /d\d+|s\d+/ },
    ],
  };

  return {
    name: 'MLIR',
    case_insensitive: false,
    keywords: {
      keyword: [
        'func', 'return', 'br', 'cond_br', 'switch',
        'module', 'end',
        'cf', 'scf', 'arith', 'memref', 'tensor', 'linalg', 'affine', 'vector',
        'builtin', 'gpu', 'async', 'sparse_tensor', 'transform',
        'for', 'if', 'else', 'while', 'yield',
        'to', 'step', 'iter_args',
        'loc', 'attributes',
      ],
      literal: ['true', 'false', 'unit'],
      built_in: [
        'alloc', 'dealloc', 'load', 'store', 'dim', 'cast',
        'addi', 'subi', 'muli', 'divsi', 'divui', 'remsi', 'remui',
        'addf', 'subf', 'mulf', 'divf', 'negf',
        'andi', 'ori', 'xori',
        'cmpi', 'cmpf',
        'constant', 'index_cast', 'sitofp', 'fptosi',
        'select', 'call', 'unreachable',
        'extsi', 'extui', 'trunci', 'bitcast',
      ],
    },
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.QUOTE_STRING_MODE,
      hljs.C_NUMBER_MODE,
      SSA_VALUE,
      SSA_VALUE_NUM,
      BLOCK_LABEL,
      ATTRIBUTE_REF,
      TYPE_ALIAS,
      BUILTIN_TYPES,
      CONTAINER_TYPES,
      DIALECT_OP,
      MAP_AFFINE,
      {
        className: 'punctuation',
        begin: /[{}()\[\]<>:,=]/,
      },
    ],
  };
}
