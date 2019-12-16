const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default;
const t = require('@babel/types')
const generate = require('@babel/generator').default;

const inputFileContent = fs.readFileSync(path.resolve(__dirname, './input.js'), 'utf-8')
const ast = parser.parse(inputFileContent)


let spreadObjectName = '';
let spreadNodes = [];

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
      spreadNodes = path.node.init.properties;
    }
  }
}

const updateObjVisitor = {
  VariableDeclarator(path) {
    const updatedProperties = {}
    if (path.node && path.node.init && path.node.init.properties) {
      path.node.init.properties.forEach(item => {
        console.log(item.type)
        if (item.type === 'SpreadElement' && item.argument.name === spreadObjectName) {
          spreadNodes.forEach(spreadNode => updatedProperties[spreadNode.key.name] = spreadNode)
          return;
        }
        console.log(item.key.name)
        updatedProperties[item.key.name] = item;
      })
      // console.log(Object.keys(updatedProperties))
      path.node.init.properties = Object.values(updatedProperties);
    }
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

if (spreadNodes.length) {
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
