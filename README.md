# GraphQL POC

This project was uses the Apollo GraphQL server to demonstrate how GraphQL can be used to streamline
development of web or mobile clients that access various IHG services.  For setting up the project, 
refer to the Apollo tutorial here:

https://www.apollographql.com/docs/apollo-server/deployment/lambda/

Once you've following the tutorial above, replace the contents of graphql.js with the contents of 
graphql.js in this project.  The graphql.js file in this project has a simple schema that defines a query 
for retrieving hotel offers and for retrieving hotel details.

Make sure you set up on the GraphQL playground described at the end of the tutorial.  Once you've deployed
the app as an AWS Lamba function, you should be able to use the GraphQL playground to issue requests.

This is a sample URL for a GraphQL playground:

https://wlutox3vje.execute-api.us-east-1.amazonaws.com/dev/graphql

Here is a sample request:

{  
  hotelOffers(dateRange: "123") {
    radius
    distanceUnit
    hotels {
      availabilityStatus
      hotelMnemonic
      lowestCashOnlyCost
      lowestCashOnlyCostAfterFeeTax
      highestCashOnlyCost
      highestCashOnlyCostAfterFeeTax
      hotel {
        chainCode
        brandCode
        brandName
      }
    }
  }
}

# Next Steps

1. Look at using the Apollo client in an Angular app.  The hotel search page would be a good candidate for this.  The search page issues an availability request and separate requests for each hotel returned in the availability response.  As a result, the page loads slowly.  This POC shows how using GraphQL the client can
obtain all this information in one request/response.

2. Look at using a caching tool to cache the hotel information.  This will result in a big performance increase.


