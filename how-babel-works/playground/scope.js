function scopeOne() {
  const ref1 = "hello"
  function scopeTwo() {
    let ref2 = `${ref1} world`;
    ref2 = 'HAHA'
  }
}