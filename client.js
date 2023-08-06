import { hydrateRoot } from 'react-dom/client'

const root = hydrateRoot(document, getInitialClientJSX())
let currentPathname = window.location.pathname

// 拦截后的逻辑
async function navigate(pathname) {
  currentPathname = pathname
  //fetch到新的内容
  const clientJSX = await fetchClientJSX(pathname)
  // 上面fetch是异步的，有可能新的navigate被触发
  if (pathname === currentPathname) {
    root.render(clientJSX)
  }
}

async function fetchClientJSX(pathname) {
  const response = await fetch(pathname + '?jsx')
  const jsxString = await response.text()
  return JSON.parse(jsxString, parseJSX)
}

function parseJSX(key, value) {
  if (value === '$REACT') {
    return Symbol.for('react.element')
  } else if (typeof value === 'string' && value.startsWith('$$')) {
    return value.slice(1)
  } else {
    return value
  }
}

function getInitialClientJSX() {
  return JSON.parse(window.__INITIAL_CLIENT_JSX_STRING__, parseJSX)
}

window.addEventListener(
  'click',
  (e) => {
    //只监听点击链接
    if (e.target.tagName !== 'A') return
    //忽略在新窗口打开
    if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return

    const href = e.target.getAttribute('href')
    if (!href.startsWith('/')) {
      return
    }
    //禁止浏览器自己刷新
    e.preventDefault()
    window.history.pushState(null, null, href)
    navigate(href)
  },
  true
)

window.addEventListener('popstate', () => {
  //点浏览器前进或者后退，同样走navigate的逻辑
  navigate(window.location.pathname)
})
