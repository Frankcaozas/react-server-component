import escapeHtml from 'escape-html'
import { readFile } from 'fs/promises'
import { createServer } from 'http'

createServer(async (req, res) => {
  const author = 'Jae Doe'
  const postContent = await readFile('./posts/hello-world.txt', 'utf8')
  sendHTML(
    res,
    <html>
      <head>
        <title>My blog</title>
      </head>
      <body>
        <nav>
          <a href="/">Home</a>
          <hr />
        </nav>
        <article style={{backgroundColor: 'black'}}>{postContent}</article>
        <footer>
          <hr />
          <p>
            <i>
              (c) {author} {new Date().getFullYear()}
            </i>
          </p>
        </footer>
      </body>
    </html>
  )
}).listen(8080)

function sendHTML(res, jsx) {
  const html = renderJSXToHTML(jsx)
  res.setHeader('Content-Type', 'text/html')
  res.end(html)
}

function renderJSXToHTML(jsx) {
  console.log(jsx)
  if (typeof jsx === 'string' || typeof jsx === 'number') {
    return escapeHtml(jsx)
  } else if (jsx == null || typeof jsx === 'boolean') {
    return ''
  } else if (Array.isArray(jsx)) {
    return jsx.map((child) => renderJSXToHTML(child)).join('')
  } else if (typeof jsx === 'object') {
    if (jsx.$$typeof === Symbol.for('react.element')) {
      let html = '<' + jsx.type
      for (let key in jsx.props) {
        if (jsx.props.hasOwnProperty(key) && key !== 'children') {
          html += ' ' + key + '='
          html += escapeHtml(jsx.props[key])
        }
      }
      html += '>'
      html += renderJSXToHTML(jsx.props.children)
      html += '</' + jsx.type + '>'
      return html
    } else throw new Error('Cannot render an object.')
  } else throw new Error('Not implemented.')
}

function BlogLayout({ children }) {
  const author = "Jae Doe";
  return (
    <html>
      <head>
        <title>My blog</title>
      </head>
      <body>
        <nav>
          <a href="/">Home</a>
          <hr />
        </nav>
        <main>
          {children}
        </main>
        <Footer author={author} />
      </body>
    </html>
  );
}

function BlogPostPage({ postSlug, postContent }) {
  return (
    <section>
      <h2>
        <a href={"/" + postSlug}>{postSlug}</a>
      </h2>
      <article>{postContent}</article>
    </section>
  );
}