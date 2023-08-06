# 从零写一个mini版React-Server-Component

记录一下学习dan的[RSC From Scatch](https://github.com/reactwg/server-components/discussions/5#top) 并自己实现一个React-Server-Component的过程

## Steps
- [x] 1: add JSX [stackblitz](https://stackblitz.com/edit/stackblitz-starters-cmcq63)
- [x] 2: add components [stackblitz](https://stackblitz.com/edit/stackblitz-starters-6jlpja?file=package.json)
- [x] 3: add routing [stackblitz](https://stackblitz.com/edit/stackblitz-starters-uxrehi)
- [x] 4: async components [stackblitz](https://stackblitz.com/edit/stackblitz-starters-ixiujx?file=package.json)
- [ ] 5: preserve state on navigation 
  - [x] 5.1: intercept navigations [stackblitz](https://stackblitz.com/edit/stackblitz-starters-ynvapw)
  - [x] 5.2: send JSX over the wire [stackblitz](https://stackblitz.com/edit/stackblitz-starters-gvmb7m?file=server.js,client.js)
  - [x] 5.3: apply JSX updates on the client [stackblitz](https://stackblitz.com/edit/stackblitz-starters-cgntq6?file=server.js,client.js)
    - [x] 5.3.1 fetch JSX from the server
    - [x] 5.3.2 inline the initial JSX into the HTML
- [ ] 6: clean things up 
