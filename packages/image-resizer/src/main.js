const fs = require('fs')
const path = require('path')
const http = require('http')
const { createApi } = require('unsplash-js')
const fetch = require('node-fetch')
const { pipeline } = require('stream')
const { promisify } = require('util')
const sharp = require('sharp')

const unsplash = createApi({
  accessKey: '2EJMeBaLj9zyNN3G6w84zyItXWpMysQMd1qx0xU0M5M',
  fetch,
})

/**
 * @param {string} query
 */
async function searchImage(query) {
  const result = await unsplash.search.getPhotos({ query })

  if (!result.response) {
    throw new Error('Failed to searchc image.')
  }

  const image = result.response.results[0]

  if (!image) {
    throw new Error('No image found.')
  }

  return {
    description: image.description || image.alt_description,
    url: image.urls.regular,
  }
}

/**
 * @param {string} query
 */
async function getCachedImageOrSearchedImage(query) {
  const imageFilePath = path.resolve(__dirname, `../images/${query}`)

  if (fs.existsSync(imageFilePath)) {
    return {
      message: `Returning cached Image: ${query}`,
      stream: fs.createReadStream(imageFilePath),
    }
  }

  const result = await searchImage(query)
  const resp = await fetch(result.url)

  resp.body.pipe(fs.createWriteStream(imageFilePath))

  await promisify(pipeline)(resp.body, fs.createWriteStream(imageFilePath))

  return {
    message: `Returning new image: ${query}`,
    stream: fs.createReadStream(imageFilePath),
  }
}

/**
 * @param {string | undefined} url
 */
function convertURLToImageInfo(url) {
  const urlObj = new URL(url, 'http://localhost:5000')

  /**
   *
   * @param {string} name
   * @param {number} defaultValue
   * @returns
   */
  function getSearchParam(name, defaultValue) {
    const str = urlObj.searchParams.get(name)
    return str ? parseInt(str, 10) : defaultValue
  }

  const width = getSearchParam('width', 400)
  const height = getSearchParam('height', 400)

  return {
    query: urlObj.pathname.slice(1),
    width,
    height,
  }
}

const server = http.createServer((req, res) => {
  async function main() {
    if (!req.url) {
      res.statusCode = 400
      res.end('Needs URL.')
      return
    }

    const { query, width, height } = convertURLToImageInfo(req.url)
    try {
      const { message, stream } = await getCachedImageOrSearchedImage(query)

      console.log(message, width)

      await promisify(pipeline)(
        stream,
        sharp()
          .resize(width, height, {
            fit: 'contain',
            background: '#fff',
          })
          .png(),
        res
      )
    } catch (err) {
      res.statusCode = 400
      res.end()
    }
  }

  main()
})

const PORT = 5000
server.listen(PORT, () => {
  console.log('The server is listening at port', PORT)
})
