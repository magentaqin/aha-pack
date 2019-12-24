## 📦 Aha-pack

> Simple examples and detailed analysis of how `webpack` and `babel` work.

### Introduction

For a long time, tools like `webpack` and `babel` are like black boxes to me. I use them in almost every complicated front-end projects, but have no idea what's going on under the hood. Inspired by [minipack](https://github.com/ronami/minipack), I decided to dig deeper and re-engineer part of them.

I believe you can find your aha-moment after reading and re-enginnering the following sections.

### Sections
Each section has a directory called `playground`.

You can run these playgrounds to have a better unstanding how them work under the hood.

- [How bundlers work?](https://github.com/magentaqin/aha-pack/blob/master/how-bundlers-work/index.md)


- [How babel works?](https://github.com/magentaqin/aha-pack/blob/master/how-babel-works/index.md)

This blog is inspired by official [Babel Plugin Handbook](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md) and [@babel/plugin-transform-spread](https://babeljs.io/docs/en/babel-plugin-transform-spread).

Mainly, it talks about stages of babel and teaches you to build a simplified spread operator babel plugin.

The self-made babel plugin takes input:
```javascript
const arr1 = [1, 2]
const arr2 = [...arr1, 3];
```
and transforms it to:
```javascript
const arr1 = [1, 2];
const arr2 = [].concat(arr1, [3]);
```

