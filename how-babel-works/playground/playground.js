const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default;
const t = require('@babel/types')
const generate = require('@babel/generator').default;
const template = require('@babel/template').default;

const filename = path.resolve(__dirname, './square.js')

/**
 * lexical analysis
 */
const lexicalAnalysis = (filename) => {
  const content = fs.readFileSync(filename, 'utf-8');
  const parseResult = parser.parse(content, { tokens: true })
  console.log('stream of tokens', parseResult.tokens)
}

// lexicalAnalysis(filename)


/**
 *  traverse nodes
 *
 */
const traverseNodes = (filename) => {
  const content = fs.readFileSync(filename, 'utf-8');

  const ast = parser.parse(content)

  // nodes traversed.
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
      console.log(path.node)
      path.traverse(NodeVisitor)
    }
  });
}

// traverseNodes(filename)



/**
 * get scope
 */
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
// getPathScope(scopeFile)



/**
 * buid node
 */
const binaryExpressionNode = t.binaryExpression('*', t.identifier('a'), t.identifier('b'))
// console.log(binaryExpressionNode)



/**
 * validate node
 */
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
// console.log(validateResult)

/**
 * transform AST to code with sourcemaps
 */
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
// console.log('code', code)
// console.log('map', map)

/**
 * @babel/template
 */
const buildRequire = template(`
  var %%importName%% = require(%%source%%)
`)
const templateAST = buildRequire({
  importName: t.identifier('myModule'),
  source: t.stringLiteral('my-module')
})
console.log(templateAST)

const templateOutput = generate(templateAST);
console.log(templateOutput.code)