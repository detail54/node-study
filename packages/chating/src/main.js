const Koa = require('koa')
const Pug = require('koa-pug')
const path = require('path')

const app = new Koa()

// eslint-disable-next-line no-new
new Pug({
  viewPath: path.resolve(__dirname, './views'),
  app,
})

app.use(async (ctx) => {
  await ctx.render('index')
})

app.listen(5000)
