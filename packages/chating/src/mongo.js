const { MongoClient, ServerApiVersion } = require('mongodb')

const uri =
  'mongodb+srv://daehyun:jdh159468*@cluster0.kxoat.mongodb.net/?retryWrites=true&w=majority'
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
})

module.exports = client
