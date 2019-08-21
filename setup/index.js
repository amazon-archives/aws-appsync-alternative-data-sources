const DynamoDB = require("aws-sdk/clients/dynamodb")
const restaurants = require("./restaurants")

const RESTAURANT_TABLE = process.env.RESTAURANT_TABLE

let ddb = new DynamoDB.DocumentClient()

exports.handler = async(event, context) => {
  for (let restaurant of restaurants) {
    let record = {
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      city: restaurant.city,
      state: restaurant.state,
      zip: restaurant.zip,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      // description: restaurant.description
    }

    try {
      await ddb.put({
        TableName: RESTAURANT_TABLE,
        Item: record
      }).promise()
    } catch(error) {
      console.error(error)
      throw error
    }
  }
}
