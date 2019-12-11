# How module bundlers work?
This blog is inspired by [minipack](https://github.com/ronami/minipack). You can see this blog as a detailed explanation for minipack.

Module bundlers compile small modules of code into larger bundles that can be loaded by the browser through building and analzing `dependency graph`.

We start with the entry file. The tool we use to figure out which files the entry file depends on is the `Javascript parser`.

Javascript parser will generate a model called `AST(Abstract Syntax Tree)`.

* STEP ONE: Extract dependencies of a given file. => `createAsset` function in playground.
1) Get AST model by using `@babel/parser`.
The babel parser is a Javascript parser that generates AST.

`sourceType` indicates the parsed mode. It can be "script", "module" and "ambigious".
```javascript
const ast = parser.parse(content, { sourceType: 'module' })
```
We specifies sourceType to "module". Have a look at what AST model we get.
```javascript
Node {
  type: 'File',
  start: 0,
  end: 57,
  loc: SourceLocation {
    start: Position { line: 1, column: 0 },
    end: Position { line: 3, column: 20 }
  },
  errors: [],
  program: Node {
    type: 'Program',
    start: 0,
    end: 57,
    loc: SourceLocation { start: [Position], end: [Position] },
    sourceType: 'module',
    interpreter: null,
    body: [ [Node], [Node] ],
    directives: []
  },
  comments: []
}
```
If we changes sourceType to "script", it will throw an error:`'import' and 'export' may appear only with 'sourceType: "module"'`.

2) Traverse AST model and get dependency files of the entry file by using `@babel/traverse`.
It will count the times of import statements appear.
```javascript
 traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value)
    }
  });
```
Print dependencies by now: `['./message.js']`. It shows the dependency files of `entry.js` is `message.js`.

3) Get bundle code from AST(using `@babel-core`) and transpile latest syntax code to bundle code that can run across browsers(using `@babel/preset-env`).
```javascript
 const { code } = transformFromAstSync(ast, null, {
    presets: ["@babel/preset-env",]
 })
```
Print code:
```javascript
"use strict";

var _message = _interopRequireDefault(require("./message.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

console.log(_message["default"]);

/**
 * Code before transpile:
 * import message from './message.js';
 * console.log(message)
```

* STEP TWO: Create Dependency Graph. (Briefly, recursively call STEP ONE) => `createGraph` function in playground
Variable `queue` holds the total dependencies of the application.
1) Initially, it has entry asset.
```javascript
const queue = [mainAsset]
```

2) Recursively extract dependencies.
> First loop: entry.js has dependencies `[message.js]`. So extract dependencies of message.js.
> Second loop: message.js has dependencies `[name.js]`. So extract depencies of name.js
> Third loop: name.js has dependencies `[]`. Nothing to extract.

In the end, the queue is :
```javascript
[
  {
    id: 0,
    filename: 'entry.js',
    dependencies: ['./message.js'].
    code: 'balabala',
    mapping: {'./message.js': 1}
  },
  {
    id: 1,
    filename: 'message.js',
    dependencies: ['./name.js'].
    code: 'balabala',
    mapping: {'./name.js': 2}
  },
  {
    id: 2,
    filename: 'name.js',
    dependencies: [].
    code: 'balabala',
    mapping: {}
  }
]
```

* STEP THREE: Use dependency graph to bundle modules into a bundle file. => `bundle` function in playground
1) Construct modules object.
The key is id of queue item, and the value is consisted of array.
```javascript
{
  [mod.id]: modArray
}
```
The modArray has two elements. The first element is a function, and the second element is queue item's mapping property which points to its dependencies and id of each dependency(e.g. `{'./name.js': 2}`). To be noticed, we wrap the `code` with a function that expects three parameters `require`,`module` and `exports` just like what CommonJS Module System did for you.
```javascript
`[
  function(require, module, exports) {
    ${mod.code}
  },
  ${JSON.stringify(mod.mapping)},
]
`
```

2) pass `moduleObj` to self-invoking function.
Have a look at the recursion process.
> a) require(0)
When call `fn(localRequire, module, module.exports)`, it will pass `localRequire` function to the `code`. Let's see the first queue item's code:
```javascript
'"use strict";\n' +
'\n' +
'var _message = _interopRequireDefault(require("./message.js"));\n' +
'\n' +
'function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }\n' +
'\n' +
'console.log(_message["default"]);'
```
When executing this code,` _interopRequireDefault(require("./message.js"));` is actually ` _interopRequireDefault(localRequire("./message.js"));`, which equals to ` _interopRequireDefault(require(1));`. It will eventually require id 1.

> b) require(1)
`'var _name = require("./name.js");\n'` will require id 2.

> c) require(2)
The code of last queue item has nothing to require. End.

I write the result to `output.js`. Execute this file. You will get:
`Hello Wolrd`

That's the result we want.


https://github.com/webpack/webpack/tree/master/examples
https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md
https://github.com/babel/babel/tree/master/packages/babel-parser