const restaurants = require("./restaurants")
const gremlin = require('gremlin')
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection
const { addV, unfold } = gremlin.process.statics

const Graph = gremlin.structure.Graph

const dc = new DriverRemoteConnection(
  `wss://${process.env.NEPTUNE_ENDPOINT}:${process.env.NEPTUNE_PORT}/gremlin`
)
const graph = new Graph()
const g = graph.traversal().withRemote(dc)


async function createRestaurant(id, name) {
  try {
    await g.V().has("Restaurant", "id", id)
            .fold()
            .coalesce(
              unfold(),
              addV("Restaurant").property("id", id).property("name", name)
            )
            .next()
  } catch (error) {
    console.error(error)
  }
}

async function createUser(name) {
  try {
    await g.V().has("User", "name", name)
            .fold()
            .coalesce(
              unfold(),
              addV("User").property("name", name)
            )
            .next()
  } catch (error) {
    console.error(error)
  }
}

async function addLike(userName, restaurantId) {
  try {
    await g.V().has("Restaurant", "id", restaurantId).as("restaurant")
           .V().has("User", "name", userName)
           .addE("likes").to("restaurant")
           .next()
  } catch (error) {
    console.error(error)
  }
}



exports.handler = async(event, context) => {
  for (let restaurant of restaurants) {
    console.log(`Adding ${restaurant.name}`)
    await createRestaurant(restaurant.id, restaurant.name)
  }
  
  let users = [ "Sam", "Joe", "Jane", "Dorothy" ]
  for (let user of users) {
    await createUser(user)
  }
  
  addLike("Sam", "27BE498A-5841-40DF-877A-CE6686073B0D")
  addLike("Sam", "E891C174-23ED-4495-A9D1-39A26F58C394")
  addLike("Sam", "F24B37E4-C89B-48AA-871B-46E5DE47118F")
  addLike("Sam", "D1E9ABF7-6A37-4138-80E3-E6983B93706A")
  addLike("Joe", "EE1CAA5B-B271-4E08-9ED8-5C05D9B1EE94")
  addLike("Joe", "27BE498A-5841-40DF-877A-CE6686073B0D")
  addLike("Joe", "2A3EE6F0-3970-4B7E-9553-A4095E5525DA")
  addLike("Joe", "2C33902E-C049-4667-A8E8-5C66C5E2875E")
  addLike("Jane", "2A3EE6F0-3970-4B7E-9553-A4095E5525DA")
  addLike("Jane", "F24B37E4-C89B-48AA-871B-46E5DE47118F")
  addLike("Jane", "2C33902E-C049-4667-A8E8-5C66C5E2875E")
  addLike("Jane", "96B7CB80-6DC4-445F-8925-69316B222DCC")
  addLike("Jane", "27BE498A-5841-40DF-877A-CE6686073B0D")
  addLike("Jane", "EE1CAA5B-B271-4E08-9ED8-5C05D9B1EE94")
  addLike("Dorothy", "27BE498A-5841-40DF-877A-CE6686073B0D")
  addLike("Dorothy", "2A3EE6F0-3970-4B7E-9553-A4095E5525DA")
  
};
