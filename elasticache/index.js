const Redis = require("ioredis")

const GEO_KEY = process.env.ELASTICACHE_GEO_KEY

let redis = new Redis.Cluster([
  {
    host: process.env.ELASTICACHE_ENDPOINT,
    port: process.env.ELASTICACHE_PORT
  }
])

async function searchByGeo(lat, lon, radius=10, units="mi") {
  try {
    let result = await redis.georadius(
          GEO_KEY,   // key
          lon,       // longitude
          lat,       // longitude
          radius,    // search radius
          units,     // search radius units
          "WITHCOORD",
          "WITHDIST"
        )

    if (!result) { return [] }

    // map from Redis response
    return result.map( (r) => {
      return { id: r[0], dist: r[1], units: units }
    }).sort((a, b) => { return a.dist - b.dist })

  } catch (error) {
    console.error(JSON.stringify(error))
    return { error: error.message }
  }
}

exports.handler = async(event) => {
  switch(event.action) {
    case "searchByLocation":
      let location = event.arguments.location
      let radius = event.arguments.radius
      return await searchByGeo(location.latitude, location.longitude, radius)
    default:
      throw("No such method")
  }
}
