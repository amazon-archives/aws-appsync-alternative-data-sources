const Redis = require("ioredis")

const GEO_KEY = process.env.ELASTICACHE_GEO_KEY
let redis = new Redis.Cluster([
  {
    host: process.env.ELASTICACHE_ENDPOINT,
    port: process.env.ELASTICACHE_PORT
  }
])

const addToRedis = async function(restaurantId, record) {
  let restaurant = {
    id: restaurantId,
    longitude: record.dynamodb.NewImage.longitude.N,
    latitude: record.dynamodb.NewImage.latitude.N
  }

  try {
    await redis.geoadd(
      GEO_KEY,
      restaurant.latitude,
      restaurant.longitude,
      restaurant.id
    )
  } catch(error) {
    throw error
  }
}

exports.handler = async(event, context, callback) => {
  for (let record of event.Records) {
    let id = record.dynamodb.Keys.id.S
    console.log(`Restaurant: ${id}`)

    switch(record.eventName) {
      case 'INSERT':
      case 'MODIFY':
        await addToRedis(id, record)
        break
      case 'REMOVE':
        // not implemented
        break
      default:
        callback("No such method")
    }
  }

  return { message: `Finished processing ${event.Records.length} records` }
}
