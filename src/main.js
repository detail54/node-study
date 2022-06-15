/* eslint-disable no-console */
// @ts-check

const express = require('express')
const bodyParser = require('body-parser')

const userRouter = express.Router()

const app = express()
app.use(bodyParser.json())

const PORT = 5000

const USERS = {
  15: {
    nickname: 'foo',
  },
}

userRouter.get('/', (req, res) => {
  res.send('Root - GET')
})

userRouter.param('id', (req, res, next, value) => {
  console.log(value)
  // @ts-ignore
  req.user = USERS[value]
  next()
})

userRouter.get('/:id', (req, res) => {
  // @ts-ignore
  res.send(req.user)
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

app.listen(PORT, () => {
  console.log(`The Express server is listening at port: ${PORT}`)
})
