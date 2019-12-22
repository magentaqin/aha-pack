const t = require('@babel/types');
const loose = false;

const hasSpread = (nodes) => {
  return nodes.some(node => t.isSpreadElement(node))
}

function getSpreadLiteral(spread, scope) {
  if (loose && !t.isIdentifier(spread.argument, { name: "arguments" })) {
    return spread.argument;
  } else {
    return scope.toArray(spread.argument, true);
  }
}

function push(_props, nodes) {
  if (!_props.length) return _props;
  nodes.push(t.arrayExpression(_props));
  return [];
}

const build = (props, scope) => {
  const nodes = [];
  let _props = [];

  for (const prop of props) {
    if (t.isSpreadElement(prop)) {
      _props = push(_props, nodes);
      nodes.push(getSpreadLiteral(prop, scope));
    } else {
      _props.push(prop);
    }
  }

  push(_props, nodes);

  return nodes;
}

module.exports = {
  hasSpread,
  getSpreadLiteral,
  build,
}