let currentPathname = window.location.pathname

// 拦截后的逻辑
async function navigate(pathname) {
  currentPathname = pathname
  //fetch到新的内容
  const response = await fetch(pathname)
  const html = await response.text()
  // 上面fetch是异步的，有可能新的navigate被触发
  if (pathname === currentPathname) {
    const bodyStartIndex = html.indexOf('<body>') + '<body>'.length
    const bodyEndIndex = html.lastIndexOf('</body>')
    const bodyHTML = html.slice(bodyStartIndex, bodyEndIndex)

    // 替换成新的内容
    document.body.innerHTML = bodyHTML
  }
}

//
window.addEventListener(
  'click',
  (e) => {
    console.log('CLICK A')
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
  console.log('POPSTATE')
  //点浏览器前进或者后退，同样走navigate的逻辑
  navigate(window.location.pathname)
})
