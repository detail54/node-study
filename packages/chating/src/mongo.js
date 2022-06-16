const { MongoClient, ServerApiVersion } = require('mongodb')

const uri =
  'mongodb+srv://daehyun:jdh159468*@cluster0.kxoat.mongodb.net/?retryWrites=true&w=majority'
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
})

async function main() {
  await client.connect()

  const db = client.db('tuto')
  const users = db.collection('users')
  const cities = db.collection('cities')

  await users.deleteMany({})
  await cities.deleteMany({})

  await cities.insertMany([
    {
      name: '서울',
      population: 1000,
    },
    {
      name: '부산',
      population: 350,
    },
  ])

  await users.insertMany([
    {
      name: 'Foo',
      birthYear: 2000,
      contacts: [
        {
          type: 'phone',
          number: '+820100001111',
        },
        {
          type: 'home',
          number: '+82023334444',
        },
      ],
      city: '서울',
    },
    {
      name: 'Bar',
      birthYear: 1995,
      contacts: [
        {
          type: 'phone',
        },
      ],
      city: '부산',
    },
    {
      name: 'Baz',
      birthYear: 1990,
      city: '부산',
    },
    {
      name: 'Poo',
      birthYear: 1993,
      city: '서울',
    },
  ])

  // await users.deleteOne({
  //   name: 'Baz',
  // })

  // const cursor = users.find(
  //   {
  //     'contacts.type': 'phone',
  //   }
  //   // {
  //   //   birthYear: {
  //   //     $gte: 1990,
  //   //   },
  //   // },
  //   // {
  //   //   sort: {
  //   //     birthYear: 1,
  //   //   },
  //   // }
  // )

  const cursor = users.aggregate([
    {
      $lookup: {
        from: 'cities',
        localField: 'city',
        foreignField: 'name',
        as: 'city_info',
      },
    },
    {
      $match: {
        // $and: [
        $or: [
          {
            'city_info.population': {
              $gte: 500,
            },
          },
          {
            birthYear: {
              $gte: 1995,
            },
          },
        ],
      },
    },
    {
      $count: 'num_users',
    },
  ])

  await cursor.forEach(console.log)

  await client.close()
}

main()
