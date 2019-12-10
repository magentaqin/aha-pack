# How module bundlers work?

Module bundlers compile small modules of code into larger bundles that can be loaded by the browser through building and analzing `dependency graph`.

We start with the entry file. The tool we use to figure out which files the entry file depends on is the `Javascript parser`.

Javascript parser will generate a model called `AST(Abstract Syntax Tree)`.

https://github.com/webpack/webpack/tree/master/examples
https://github.com/ronami/minipack
https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md
https://github.com/babel/babel/tree/master/packages/babel-parser