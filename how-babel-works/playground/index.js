const fs = require('fs')
const path = require('path')
const stream = require('stream')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default;
const filename = path.resolve(__dirname, './square.js')

const lexicalAnalysis = (filename) => {
  const content = fs.readFileSync(filename, 'utf-8');
  const parseResult = parser.parse(content, { tokens: true })
  console.log('stream of tokens', parseResult.tokens)
}

// lexicalAnalysis(filename)

const transform = (filename) => {
  const content = fs.readFileSync(filename, 'utf-8');

  const ast = parser.parse(content)

  const traverseResult = traverse(ast, {
    FunctionDeclaration: function(path) {
      console.log(path.node)
      path.node.id.name = "x";
    }
})
  console.log(traverseResult)
}

transform(filename)


