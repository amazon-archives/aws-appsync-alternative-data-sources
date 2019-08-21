const gremlin = require('gremlin')
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection

const Graph = gremlin.structure.Graph
const P = gremlin.process.P
const Order = gremlin.process.order
const Scope = gremlin.process.scope
const Column = gremlin.process.column

const dc = new DriverRemoteConnection(
  `wss://${process.env.NEPTUNE_ENDPOINT}:${process.env.NEPTUNE_PORT}/gremlin`
)
const graph = new Graph()
const g = graph.traversal().withRemote(dc)

// based on Gremlin recommendation recipe:
// http://tinkerpop.apache.org/docs/current/recipes/#recommendation
async function getRecommendationsFor(userName) {
  try {
    let result = await g.V()
      .has('User', 'name', userName).as('user')
      .out('likes').aggregate('self')
      .in_('likes').where(P.neq('user'))
      .out('likes').where(P.without('self'))
      .values('id')
      .groupCount()
      .order(Scope.local)
        .by(Column.values, Order.decr)
      .select(Column.keys)
      .next()

    return result.value.map( (r) => {
      return { id: r }
    })
  } catch (error) {
    console.error(JSON.stringify(error))
    return { error: error.message }
  }
}

async function addLike(user, restaurantId) {
  try {
    await g.V()
      .has("Restaurant", "id", restaurantId).as("restaurant")
      .V()
      .has("User", "name", user)
      .addE("likes")
      .to("restaurant")
      .next()

    return { success: true }
  } catch (error) {
    console.error(JSON.stringify(error))
    return { error: error.message }
  }
}

exports.handler = async(event) => {
  switch(event.action) {
    case "getRecommendations":
      return await getRecommendationsFor(event.arguments.user)
    case "addLike":
      return await addLike(event.arguments.user, event.arguments.restaurantId)
    default:
      return { error: "No such method" }
  }
}
