import escapeHtml from 'escape-html'
import { readFile, readdir } from 'fs/promises'
import { ServerResponse, createServer } from 'http'
import sanitizeFilename from 'sanitize-filename'
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    if (url.pathname === '/client.js') {
      await sendScript(res, './client.js')
    } else {
      await sendHTML(res, <Route url={url} />)
    }
  } catch (err) {
    res.statusCode = err.statusCode ?? 500
    res.end()
  }
}).listen(8080)

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
  const script = await readFile('./client.js', 'utf-8')
  res.setHeader('Content-Type', 'text/javascript')
  res.end(script)
}

function Route({ url }) {
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

async function renderJSXToHTML(jsx) {
  if (typeof jsx === 'string' || typeof jsx === 'number') {
    return escapeHtml(jsx)
  } else if (jsx == null || typeof jsx === 'boolean') {
    return ''
  } else if (Array.isArray(jsx)) {
    //map 里不能await
    // return jsx.map((child) => (await renderJSXToHTML(child))).join('')
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
