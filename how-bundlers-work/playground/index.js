const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default;
const { transformFromAstSync } = require('@babel/core')


let ID = 0;

const createAsset = (filename) => {
  const content = fs.readFileSync(filename, 'utf-8');

  const ast = parser.parse(content, { sourceType: 'module'})

  const dependencies = []
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value)
    }
  });


  const id = ID++;
  const { code } = transformFromAstSync(ast, null, {
    presets: ["@babel/preset-env",]
  })

  return {
    id,
    filename,
    dependencies,
    code,
  }
}

const createGraph = (entry) => {
  const mainAsset = createAsset(entry)
  const queue = [mainAsset]
  for (const asset of queue) {
    asset.mapping = {};
    const dirname = path.dirname(asset.filename);
    asset.dependencies.forEach(relativePath => {
      const absolutePath = path.join(dirname, relativePath)
      const child = createAsset(absolutePath)
      asset.mapping[relativePath] = child.id;
      queue.push(child);
    })
  }
  return queue;
}

const bundle = (graph) => {
  let modules = '';
  graph.forEach(mod => {
    modules += `${mod.id}: [
      function(require, module, exports) {
        ${mod.code}
      },
      ${JSON.stringify(mod.mapping)},
    ]`
  });
  const result = `
    (function(modules){
      function require(id) {
        const [fn, mapping] = modules[id];

        function localRequire(name) {
          return require(mapping[name]);
        }

        const module = { exports: {}};

        fn(localRequire, module, module.exports);
        return module.exports;
      }
      require(0);
    })({${modules}})
  `;
  return result;
}

const graph = createGraph(path.resolve(__dirname, './example/entry.js'));
// const result = bundle(graph);

// console.log(result);