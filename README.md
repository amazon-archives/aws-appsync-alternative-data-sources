# Enabling alternative data sources with AWS AppSync

> Exploring how AWS AppSync can utilize [AWS Lambda](https://aws.amazon.com/lambda/) to integrate with alternative data sources, including Amazon ElastiCache and Amazon Neptune.

As CTO and VP of [Amazon.com](http://amazon.com/), Werner Vogels, has [pointed out](https://www.allthingsdistributed.com/2018/06/purpose-built-databases-in-aws.html) “Seldom can one database fit the needs of multiple distinct use cases. The days of the one-size-fits-all monolithic database are behind us, and developers are now building highly distributed applications using a multitude of purpose-built databases.” AWS now offers a number purpose-built databases, including those mentioned including document, graph, and in-memory.

In this project, we explore how AWS AppSync can utilize [AWS Lambda](https://aws.amazon.com/lambda/) to integrate with alternative data sources, those not supported out-of-the-box by AppSync. In specific, we will focus on Amazon ElastiCache (in-memory database) and Amazon Neptune (graph database) to build functionality of a Chicago-style hot dog finder.

Further detail on this project can be found in the accompanying [blog post](#).

## Getting Started

To get started, clone this repository. The repository contains an [AWS SAM Template](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html) template and sample code.

### Prerequisites

To run the sample, you will need to:

1. Select an AWS region that offers AWS AppSync (currently N. Virginia, Ohio, Oregon, Ireland, Frankfurt, London, Singapore, Tokyo, Sydney, Seoul, and Mumbai).
2. [Install the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html).

## Deployment

We will use AWS SAM to deploy cloud resources (note: deployment can take 20 minutes or more):

``` bash
# install node modules
$ cd elasticache && npm install & cd ..
$ cd neptune && npm install & cd ..
$ cd setup && npm install & cd ..
$ cd stream && npm install & cd ..

# select a unique bucket name
$ aws s3 mb s3://<UNIQUE_BUCKET_NAME>

# package for deployment
$ sam package --output-template-file packaged.yaml \
              --s3-bucket <UNIQUE_BUCKET_NAME>

# deploy cloud resources
$ sam deploy --template-file packaged.yaml \
             --stack-name aws-appsync-alt-data-sources \
             --capabilities CAPABILITY_NAMED_IAM
```

### Sample Data

Before we take our API for a test run, we'll need to load data. To simplify data loading, we have provided an AWS Step Functions state machine. The first step will load data in DynamoDB, which in turn pushes data to ElastiCache via DynamoDB Streams. Next, we will load restaurant, user, and like data to Neptune.

To start execution of the state machine, run the following commands:

``` bash
# 1. get the ARN of the State Machine
$ export SFN_ARN=$(aws cloudformation describe-stacks --stack-name aws-appsync-alt-data-sources \
    --query 'Stacks[*].Outputs[?OutputKey==`SetupStateMachine`].OutputValue' \
    --output text)

# 2. start execution
$ aws stepfunctions start-execution --state-machine-arn $SFN_ARN
```

## Test Run

Once you have deployed the project resources and sample data, we can take the GraphQL API for a test run. You can use the GraphQL IDE of your choice, including GraphiQL, Insomnia, Postman, or the AppSync Console.

To retrieve the DNS name and API Key for your AppSync API:

``` bash
# DNS Name
$ aws cloudformation describe-stacks --stack-name aws-appsync-alt-data-sources \
    --query 'Stacks[*].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
    --output text

# API Key
$ aws cloudformation describe-stacks --stack-name aws-appsync-alt-data-sources \
    --query 'Stacks[*].Outputs[?OutputKey==`ApiKey`].OutputValue' \
    --output text
```

First, let's query for restaurants close to a particular location. The sample location is in downtown Chicago, but in a real-life scenario, you could use the native functionality of the user's device to retrieve his coordinates (with permission):

``` graphql
query SearchByLocation {
  searchByLocation(location: {
    latitude: 41.8781,
    longitude: -87.6298
  }) {
    restaurant {
      name
    }
    distance
    units
  }
}
```

In this scenario, we are leveraging Amazon ElastiCache to perform a geospatial query for locations within a default radius of 10 miles (note: you can also specify the search radius as a query parameter). The response is as follows:

``` json
{
  "data": {
    "searchByLocation": [
      {
        "restaurant": {
          "name": "Portillo’s"
        },
        "distance": "1.0694",
        "units": "mi"
      },
      {
        "restaurant": {
          "name": "Fatso’s Last Stand"
        },
        "distance": "3.0622",
        "units": "mi"
      },
      ...
    ]
  }
}
```

Next, we can query for recommended restaurants via integration with Amazon Neptune as follows:

``` graphql
query Recommendations {
  getRecommendationsFor(user: "Dorothy") {
    id
    name
  }
}
```

The result for Dorothy is as follows. You can query for different recommendations for our users by changing the parameter value to Sam, Joe, or Jane.

``` json
{
  "data": {
    "getRecommendationsFor": [
      {
        "id": "EE1CAA5B-B271-4E08-9ED8-5C05D9B1EE94",
        "name": "Gene & Jude’s Red Hot Stand"
      },
      {
        "id": "2C33902E-C049-4667-A8E8-5C66C5E2875E",
        "name": "Original Jimmy’s Red Hots"
      },
      ...
    ]
  }
}
```

Finally, let's mutate data in the Neptune Graph Database by calling the `AddLike` mutation. In this case, we add a like for user Joe to Chicago's Dog House.

``` graphql
mutation AddLike {
	addLike(
      user: "Joe",
      restaurantId: "EB8941AC-C3AD-4263-B97D-B7A29B36FB5F"
    ) {
      user
    }
}
```

And the result:

``` json
{
  "data": {
    "addLike": {
      "user": "Joe"
    }
  }
}
```

Try adding likes for other user + restaurant combinations, intermittently querying for new recommendations.

## Cleaning Up

Once finished, feel free to clean-up the sample code:

``` bash
$ aws cloudformation delete-stack \
             --stack-name aws-appsync-alt-data-sources

$ aws s3 rm s3://<UNIQUE_BUCKET_NAME>
```

Thanks!

## License Summary

This sample code is made available under a modified MIT license. See the LICENSE file.
