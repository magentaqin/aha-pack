const obj1 = {
  a: 1,
  c: {
    d: { e: ['hello', 'world']},
  }
}


const obj2 = {
  ...obj1,
  b:2,
  a: 5,
}