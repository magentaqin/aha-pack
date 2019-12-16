const fs = require('fs')
const path = require('path')
const stream = require('stream')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default;
const t = require('@babel/types')

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
console.log(validateResult)
