const t = require('@babel/types');
const loose = false;

const hasSpread = (nodes) => {
  return nodes.some(node => t.isSpreadElement(node))
}

const getSpreadLiteral = (spread, scope) => {
  if (loose && !t.isIdentifier(spread.argument, { name: "arguments" })) {
    return spread.argument;
  } else {
    // return transformed element
    return scope.toArray(spread.argument, true)
  }
}

const build = (elements, scope) => {
  const nodes = [];
  const rest = [];

  elements.forEach(element => {
    if (t.isSpreadElement(element)) {
      /**
       * TRANSFORM
       * {
       *   type: 'SpreadElement',
       *   argument: { type: 'Identifier', name: 'arr1'}
       * }
       *
       * TO
       * { type: 'Identifier', name: 'arr1'}
       */
      nodes.push(getSpreadLiteral(element,scope));
    } else {
      rest.push(element)
    }
  })

  /**
   * t.arrayExpression turns node of xx type into node of ArrayExpression type.
   * e.g.
   * TRANSFORM { type: 'NumericLiteral', value: 3}
   * TO
   * {
   *   type: 'ArrayExpression',
   *   elements: [
   *     {
   *       type: 'NumericLiteral',
   *       value: 3
   *     }
   *   ]
   * }
   *
   */
  if (rest.length) {
    nodes.push(t.arrayExpression(rest))
  }

  return nodes;
}

module.exports = {
  hasSpread,
  build,
}