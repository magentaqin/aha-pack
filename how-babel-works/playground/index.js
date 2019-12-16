const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default;
const t = require('@babel/types')
const generate = require('@babel/generator').default;
const template = require('@babel/template').default

const inputFileContent = fs.readFileSync(path.resolve(__dirname, './input.js'), 'utf-8')
const ast = parser.parse(inputFileContent)


let spreadObjectName = '';
let spreadNode = {};

const spreadElementVisitor = {
  SpreadElement(path) {
    if (path.node.type === 'SpreadElement') {
      spreadObjectName = path.node.argument.name;
    }
  }

}
const objVisitor = {
  ObjectExpression(path) {
    path.traverse(spreadElementVisitor)
  }
}

const visitor = {
  VariableDeclarator(path) {
    path.traverse(objVisitor);
  },
}

const spreadVisitor = {
  VariableDeclarator(path) {
    if (path.node.id.name === spreadObjectName) {
      spreadNode = path.node.init.properties[0];
    }
  }
}

const updateObjVisitor = {
  VariableDeclarator(path) {
    const updatedProperties = []
    path.node.init.properties.forEach(item => {
      if (item.type === 'SpreadElement' && item.argument.name === spreadObjectName) {
        item = spreadNode;
      }
      updatedProperties.push(item);
    })
    path.node.init.properties = updatedProperties;
  }
}


traverse(ast, {
  VariableDeclaration: function(path) {
    path.traverse(visitor);
  }
})

if (spreadObjectName) {
  traverse(ast, {
    VariableDeclaration: function(path) {
      path.traverse(spreadVisitor);
    }
  })
}

if (Object.keys(spreadNode).length) {
  traverse(ast, {
    VariableDeclaration: function(path) {
      path.traverse(updateObjVisitor)
    }
  })
}

const result = generate(ast)
const resultFile = fs.createWriteStream(path.resolve(__dirname, './output.js'));
resultFile.write(result.code);
resultFile.end();
