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
**1) Traverse AST**
a) what does the AST node look like?
```javascript
const traverseResult = traverse(ast, {
    FunctionDeclaration: function(path) {
      console.log(path.node)
    }
});
```
The node has propeties: `id`, `params` and `body`. Take a look at the `body` property. (Only important info is included here.)
```javascript
// original code:  function square { return n * n } ;
{
  type: 'FunctionDeclaration',
  id: {
    type: 'Identifier',
    name: 'square',
  },
  params: [{
    type: 'Identifier',
    name: 'n',
  }],
  body: {
    type: 'BlockStatement',
    body: [
      {
        type: 'ReturnStatement',
        argument: {
          type: 'BinaryExpression',
          left: {
            type: 'Identifier',
            name: 'n',
          },
          operator: '*',
          right: {
            type: 'Identifier',
            name: 'n',
          }
        }
      }
    ]
  }
}
```
b) Tranverse process
The node above has this tree structure:
```javascript
- FunctionDeclaration
  - Identifier (id)
  - Identifier (params[0])
  - BlockStatement (body)
    - ReturnStatement (body)
      -BinaryExpression (argument)
        - Identifier (left)
        - Identifier (right)
```
There are mainly 4 nodes (whose type is tagged as `Identifier`). To enter next node, we have to exit current node. Use a `visitor` to track the `enter` and `exit` process.
```javascript
const MyVisitor = {
    Identifier: {
      enter(node) {
        console.log('node entered', node.node.type, node.node.name)
      },
      exit(node){
        console.log('node exited', node.node.name)
      }
    },
  }
 const traverseResult = traverse(ast, {
    FunctionDeclaration: function(path) {
      path.traverse(MyVisitor)
    }
});
```
The process is:
```
node entered Identifier square
node exited square
node entered Identifier n
node exited n
node entered Identifier n
node exited n
node entered Identifier n
node exited n
```

* Stage 3 => generate(turn the transformed AST to a string of code.)


https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md