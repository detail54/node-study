/* eslint-disable no-console */
// @ts-check

const express = require('express')
const bodyParser = require('body-parser')

const userRouter = express.Router()

const app = express()
app.use(bodyParser.json())
app.set('views', 'src/views')
app.set('view engine', 'pug')

const PORT = 5000

const USERS = {
  15: {
    nickname: 'foo',
  },
  16: {
    nickname: 'bar',
  },
}

userRouter.get('/', (req, res) => {
  res.send('Root - GET')
})

userRouter.param('id', (req, res, next, value) => {
  // @ts-ignore
  req.user = USERS[value]
  next()
})

userRouter.get('/:id', (req, res) => {
  const resMimeType = req.accepts(['json', 'html'])

  if (resMimeType === 'json') {
    // @ts-ignore
    res.send(req.user)
  } else if (resMimeType === 'html') {
    res.render('user-profile', {
      // @ts-ignore
      nickname: req.user.nickname,
    })
  }
})

userRouter.post('/', (req, res) => {
  res.send('Root - POST')
})

userRouter.post('/:id/nickname', (req, res) => {
  // @ts-ignore
  const { user } = req
  const { nickname } = req.body

  user.nickname = nickname
  res.send(USERS)
})

app.use('/users', userRouter)
app.use('/public', express.static('src/public'))

app.get('/', (req, res) => {
  res.render('index', {
    message: 'hello pug!!',
  })
})

app.listen(PORT, () => {
  console.log(`The Express server is listening at port: ${PORT}`)
})
