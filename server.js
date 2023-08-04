import escapeHtml from 'escape-html'
import { readFile, readdir } from 'fs/promises'
import { ServerResponse, createServer } from 'http'
import sanitizeFilename from 'sanitize-filename'
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    if (url.pathname === '/client.js') {
      await sendScript(res, './client.js')
    } else if (url.searchParams.has('jsx')) {
      await sendJSX(res, <Router url={url} />)
    } else {
      await sendHTML(res, <Router url={url} />)
    }
  } catch (err) {
    res.statusCode = err.statusCode ?? 500
    res.end()
  }
}).listen(8080)

/**
 *
 * @param {ServerResponse} res
 * @param {object} jsx
 */
async function sendJSX(res, jsx) {
  const clientJSX = await renderJSXToClitenJSX(jsx)
  console.log(clientJSX)
  const jsxStr = JSON.stringify(clientJSX, null, 2) //缩进2格
  res.setHeader('Conten-Type', 'application/json')
  res.end(jsxStr)
}

async function sendHTML(res, jsx) {
  let html = await renderJSXToHTML(jsx)
  html += "<script type='module' src='/client.js'></script>"
  res.setHeader('Content-Type', 'text/html')
  res.end(html)
}
/**
 *
 * @param {ServerResponse} res
 * @param {string} filename
 */
async function sendScript(res, filename) {
  const script = await readFile(filename, 'utf-8')
  res.setHeader('Content-Type', 'text/javascript')
  res.end(script)
}

function Router({ url }) {
  let page
  if (url.pathname === '/') {
    page = <BlogIndexPage />
  } else {
    const slug = sanitizeFilename(url.pathname.slice(1))
    page = <BlogPostPage slug={slug} />
  }
  return <BlogLayout>{page}</BlogLayout>
}

function Footer({ author }) {
  return (
    <footer>
      <hr />
      <p>
        <i>
          (c) {author} {new Date().getFullYear()}
        </i>
      </p>
    </footer>
  )
}

function BlogLayout({ children }) {
  const author = 'frankcao'
  return (
    <html>
      <head>
        <title>My blog</title>
      </head>
      <body>
        <nav>
          <a href="/">home</a>
          <input />
          <hr />
        </nav>
        <main>{children}</main>
        <Footer author={author} />
      </body>
    </html>
  )
}

async function BlogIndexPage({}) {
  const files = await readdir('./posts')
  const slugs = files.map((file) => file.slice(0, file.lastIndexOf('.')))
  return (
    <section>
      <h1>Welcome to my blog</h1>
      <div>
        {slugs.map((slug) => (
          <Post key={slug} slug={slug} />
        ))}
      </div>
    </section>
  )
}

async function Post({ slug }) {
  let content
  try {
    content = await readFile('./posts/' + slug + '.txt', 'utf8')
  } catch (err) {
    throwPageNotFound(err)
  }
  return (
    <section>
      <h2>
        <a href={'/' + slug}>{slug}</a>
      </h2>
      <article>{content}</article>
    </section>
  )
}

function BlogPostPage({ slug }) {
  return <Post slug={slug} />
}

function throwPageNotFound(cause) {
  const notFound = new Error('Page Not found.', { cause })
  notFound.statusCode = 404
  throw notFound
}

async function renderJSXToClitenJSX(jsx) {
  if (
    //基本数据类型
    typeof jsx === 'string' ||
    typeof jsx === 'boolean' ||
    typeof jsx === 'number' ||
    jsx === null
  )
    return jsx
  else if (Array.isArray(jsx)) {
    //数组
    return await Promise.all(jsx.map((child) => renderJSXToClitenJSX(child)))
  } else if (typeof jsx === 'object') {
    //对象
    // nodes
    if ((jsx.$$typeof === Symbol.for('react.element'))) {
      //普通标签
      if (typeof jsx.type === 'string') {
        return {
          ...jsx,
          props: await renderJSXToClitenJSX(jsx.props),
        }
        //react组件
      } else if (typeof jsx.type === 'function') {
        const Component = jsx.type
        const props = jsx.props
        const returnJSX = await Component(props)
        return renderJSXToClitenJSX(returnJSX)
      } else {
        throw new Error('Not Implemented')
      }
    } else {
      return Object.fromEntries(
        await Promise.all(
          Object.entries(jsx).map(async ([key, val]) => [
            key,
            await renderJSXToClitenJSX(val),
          ])
        )
      )
    }
  } else {
    throw new Error('Not Implemented')
  }
}

async function renderJSXToHTML(jsx) {
  if (typeof jsx === 'string' || typeof jsx === 'number') {
    return escapeHtml(jsx)
  } else if (jsx == null || typeof jsx === 'boolean') {
    return ''
  } else if (Array.isArray(jsx)) {
    const child = await Promise.all(jsx.map((child) => renderJSXToHTML(child)))
    return child.join('')
  } else if (typeof jsx === 'object') {
    if (jsx.$$typeof === Symbol.for('react.element')) {
      // 原生html标签
      if (typeof jsx.type === 'string') {
        let html = '<' + jsx.type
        for (let key in jsx.props) {
          if (jsx.props.hasOwnProperty(key) && key !== 'children') {
            html += ' ' + key + '='
            html += escapeHtml(jsx.props[key])
          }
        }
        html += '>'
        html += await renderJSXToHTML(jsx.props.children)
        html += '</' + jsx.type + '>'
        return html

        //react 组件
      } else if (typeof jsx.type === 'function') {
        const Component = jsx.type
        const retJsx = await Component(jsx.props)
        return renderJSXToHTML(retJsx)
      }
    } else throw new Error('Cannot render an object.')
  } else throw new Error('Not implemented.')
}
