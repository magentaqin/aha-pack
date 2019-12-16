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
b) Traverse nodes
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
Notice the `path` param. It is a reactive object representation of the link between two nodes.
```javascript
  const NodeVisitor = {
    Identifier: {
      enter(path) {
        console.log('node entered', path.node.type, path.node.name)
      },
      exit(path){
        console.log('node exited', path.node.name)
      }
    },
  }
 traverse(ast, {
    FunctionDeclaration: function(path) {
      path.traverse(NodeVisitor)
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


c) binding
References all belong to a scope. The relationship between references and scope is called binding.
```javascript
const scopeFile = path.resolve(__dirname, './scope.js')
const getPathScope = (filename) => {
  const content = fs.readFileSync(filename, 'utf-8');

  const ast = parser.parse(content)
  traverse(ast, {
    FunctionDeclaration: function(path) {
      console.log(path.scope.bindings)
    }
  });
}
getPathScope(scopeFile)
```

Have a look at `ref1`'s and `ref2`'s binding. This binding information tells us if it is a constant(`constant` boolean value), its scope(`scope` property), whether it has been referenced and its referencing info.
```javascript
// ref1;
{
  identifier: node,
  scope: scope,
  path: path,
  kind: 'const',
  referenced: true,
  references: 1,
  referencePaths: [path],
  constant: true,
}

// ref2
{
  identifier: node,
  scope: scope,
  path: path,
  kind: 'let',
  referenced: false,
  references: 0,
  referencePaths: [],
  constant: false,
}
```

d) @babel/types => build/validate AST nodes
The definition of `BinaryExpress` type is:
```javascript
defineType("BinaryExpression", {
  builder: ["operator", "left", "right"],
  fields: {
    operator: {
      validate: assertValueType("string")
    },
    left: {
      validate: assertNodeType("Expression")
    },
    right: {
      validate: assertNodeType("Expression")
    }
  },
  visitor: ["left", "right"],
  aliases: ["Binary", "Expression"]
});
```
Each node type has a builder method. You can use this builder method to buld node.
```javascript
const binaryExpressionNode = t.binaryExpression('*', t.identifier('a'), t.identifier('b'))
console.log(binaryExpressionNode)
/**
 * {
  type: 'BinaryExpression',
  left: {
    type: 'Identifier',
    name: 'a',
  },
  operator: '*',
  right: {
    type: 'Identifier',
    name: 'b',
  }
}
```

* Stage 3 => generate(turn the transformed AST to a string of code.)
a) babel-generator

https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md