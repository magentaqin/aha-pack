const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default;
const t = require('@babel/types')
const generate = require('@babel/generator').default;
const { hasSpread, build } = require('./utils');

// STEP 1: read input.js and parse it to AST
const inputFileContent = fs.readFileSync(path.resolve(__dirname, './input.js'), 'utf-8');
const ast = parser.parse(inputFileContent);

// set up visitor
const visitor = {
  ArrayExpression(path) {
    const { node, scope } = path;
    const elements = node.elements;
    // console.log(node.elements)
    if (!hasSpread(elements)) return;

    // turn SpreadElement type to Identifier type.
    const nodes = build(elements, scope);
    console.log(nodes[0])
  }
}

// STEP2: traverse AST and let visitor transform AST.
traverse(ast, {
  VariableDeclaration: function(path) {
    path.traverse(visitor);
  }
})

// SETP3: turn the transformed AST to code and write it to output.js
// const result = generate(ast);
// const resultFile = fs.createWriteStream(path.resolve(__dirname, './output.js'));
// resultFile.write(result.code);
// resultFile.end();