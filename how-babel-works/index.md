# How Babel works
Babel is a JS compiler. It is used for compiling, linting, minification and so on. (forms of static analysis).

#### Stages of babel
* Stage 1 => parse:
1) lexical analysis: turn code into a stream of tokens
Take `square.js` for example:
```javascript
const lexicalAnalysis = (filename) => {
  const content = fs.readFileSync(filename, 'utf-8');
  const parseResult = parser.parse(content, { tokens: true })
}
```
The parsedResult has a property named `tokens`:
```javascript
[
  Token {
      type: [TokenType],
      value: 'function',
      start: 0,
      end: 8,
      loc: [SourceLocation]
    },
    Token {
      type: [TokenType],
      value: 'square',
      start: 9,
      end: 15,
      loc: [SourceLocation]
    },
  ...
]
```
Print ths `TokenType`:
```javascript
TokenType {
  label: 'function',
  keyword: 'function',
  beforeExpr: false,
  startsExpr: true,
  rightAssociative: false,
  isLoop: false,
  isAssign: false,
  prefix: false,
  postfix: false,
  binop: null,
  updateContext: [Function]
}
```

2) syntactic analysis
Syntactic Analysis will take a stream of tokens and turn it into an AST representation.
```javascript
Node {
  type: 'File',
  start: 0,
  end: 36,
  loc: SourceLocation {
    start: Position { line: 1, column: 0 },
    end: Position { line: 3, column: 1 }
  },
  errors: [],
  program: Node {
    type: 'Program',
    start: 0,
    end: 36,
    loc: SourceLocation { start: [Position], end: [Position] },
    sourceType: 'script',
    interpreter: null,
    body: [ [Node] ],
    directives: []
  },
  comments: []
}
```

* Stage 2 => transform(MOST COMPLEX PART. Traverse AST and add/delete/udpate nodes.)

* Stage 3 => generate(turn the transformed AST to a string of code.)


https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md