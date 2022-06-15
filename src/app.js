/* eslint-disable no-console */
// @ts-check

const express = require('express')

const app = express()
app.use(express.json())
app.set('views', 'src/views')
app.set('view engine', 'pug')

const userRouter = require('./routers/user')

app.use('/users', userRouter)
app.use('/public', express.static('src/public'))

app.use((err, req, res, next) => {
  res.statusCode = err.statusCode || 500
  res.send(err.message)
})

app.get('/', (req, res) => {
  res.render('index', {
    message: 'hello pug!!',
  })
})

module.exports = app
