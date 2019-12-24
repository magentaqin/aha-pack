# How Babel works

> This blog is inspired by official [Babel Plugin Handbook](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md) and [@babel/plugin-transform-spread](https://babeljs.io/docs/en/babel-plugin-transform-spread). 
>
> Mainly, it talks about stages of babel and teaches you to build a simplified spread operator babel plugin. 



Before reading, you can run these two commands to have fun:

```makefile
# this will show you the stages of babel. You can re-engineer it as you like.
make babel-playground 

# transform code that has spread operator syntax to old standard syntax.
make my-first-babel-plugin
```



Babel is a JS compiler which transpiles new features(ES6, ES7, ES8) into old standard browser compatible syntax(ES5).

Before digging into the working process of babel, let me ask you these questions:

* Babel manages the two parts: transpiling and polyfilling. What's the difference between `babel-transpiler` and `babel-polyfill` ?

  > **transpiling **:  transform new syntax to old syntax. e.g.arrow functions, classes and destructuring
  >
  > **polyfilling** : add new properties to the browser's global namespace. e.g. Promise, Symbol, and Set

- What's the difference between `babel-plugins` and `babel-presets`?

  > plugins run before presets. 
  >
  > plugin ordering is first to last, while preset ordering is last to first.

- Except compiling, what can babel do for you?

  > Linting, and minification.



## Stages of babel

#### Stage One: parse

There are two phases of parsing in babel: lexical analysis and syntactic analysis.

**1) lexical analysis: turn code into a stream of tokens**
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
`TokenType` looks like:

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



#### Stage Two:  transform (MOST COMPLEX PART. Traverse AST and add/delete/udpate nodes.)

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

validate
```javascript
const testNode = {
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
const validateResult = t.isBinaryExpression(testNode)
console.log(validateResult) // true
```

e) @babel/template
it enables you parse template code into an AST.
```javascript
const buildRequire = template(`
  var %%importName%% = require(%%source%%)
`)
const templateAST = buildRequire({
  importName: t.identifier('myModule'),
  source: t.stringLiteral('my-module')
})
console.log(templateAST)

const templateOutput = generate(templateAST);
console.log(templateOutput.code) // var myModule = require('my-module');
```


* Stage 3 => generate(turn the transformed AST to a string of code.)
a) @babel/generator
it turns AST into code with sourcemaps. Take `square.js` and `scope.js` as example.
```javascript
const squareFileContent = fs.readFileSync(filename, 'utf-8');
const scopeFileContent = fs.readFileSync(scopeFile, 'utf-8');
const squareAST = parser.parse(squareFileContent, { sourceFilename: 'square.js'})
const scopeAST = parser.parse(scopeFileContent, { sourceFilename: 'scope.js'})
const ast = {
  type: 'Program',
  body: [].concat(squareAST.program.body, scopeAST.program.body)
}
const { code, map } = generate(ast, { sourceMaps: true }, {
  'square.js': squareFileContent,
  'scope.js': scopeFileContent,
})
```
The output is:
```javascript
// code
function square(n) {
  return n * n;
}

function scopeOne() {
  const ref1 = "hello";

  function scopeTwo() {
    let ref2 = `${ref1} world`;
    ref2 = 'HAHA';
  }
}

// map
{
  sources: [ 'square.js', 'scope.js' ],
  names: [ 'square', 'n', 'scopeOne', 'ref1', 'scopeTwo', 'ref2' ],
  sourcesContent: [
    'function square(n) {\n  return n*n;\n}',
    'function scopeOne() {\n' +
      '  const ref1 = "hello"\n' +
      '  function scopeTwo() {\n' +
      '    let ref2 = `${ref1} world`;\n' +
      "    ref2 = 'HAHA'\n" +
      '  }\n' +
      '}'
  ]
}
```



## Build your first plugin

