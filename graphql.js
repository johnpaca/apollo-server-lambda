// graphql.js

const { ApolloServer, gql } = require('apollo-server-lambda');
const { RESTDataSource } = require('apollo-datasource-rest');

const PROD_URL = 'https://apis.ihg.com/';
const INT_URL = 'https://int-api.ihg.com/';

const PROD_TOKEN = 'se9ym5iAzaW8pxfBjkmgbuGjJcr3Pj6Y';
const STAGE_TOKEN = 'LEov54xpgCPBEMHuFm5CdbV3cVd3NzUt'; 
const INT_TOKEN = 'Ym5gIH17Fe7WcF9J3gHbtAyoeusJpO2q';


class AvailabilityAPI extends RESTDataSource {

  constructor() {
    super();
    this.baseURL = PROD_URL;
  }

  async getOffers(dateRange) {
    let requestBody = 
    {"radius":30,"distanceUnit":"MI","distanceType":"STRAIGHT_LINE","startDate":"2021-02-02","endDate":"2021-03-03","geoLocation":[{"latitude":34.0028,"longitude":-84.144699}],"products":[{"productTypeCode":"SR","adults":1,"children":0,"quantity":1}],"options":{}};    
    let response =  await this.post(`/availability/v2/hotels/offers?fieldset=summary,summary.rateRanges`, requestBody);
    return response;
  }

  willSendRequest(request) {
    request.headers.set('x-ihg-api-key', this.context.token);
  }
}


class HotelAPI extends RESTDataSource {

  constructor() {
    super();
    this.baseURL = PROD_URL;
  }

  async getHotel(id) {
    try {
      let response =  await this.get(`/hotels/v1/profiles/${id}/details?fieldset=brandInfo,location,transportation,contact,reviews,profile,address,media,policies,badges,facilities,technology,renovations,renovationAlerts.active,tax,fee,marketing,services,parking`);
      return response;
    } catch(err) {
      console.log(`getHotel() error for id=${id} ` + err);
      return null
    }
  }

  willSendRequest(request) {
    request.headers.set('x-ihg-api-key', this.context.token);
  }

}

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = gql`
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  type HotelOffers {
    radius: String
    distanceUnit: String
    hotels: [HotelOffer]
  }

  type HotelOffer {
    availabilityStatus: String
    currency: String
    distance: Float
    distanceKm: Float
    freeNightAvailable: Boolean
    highestCashOnlyCost: Float
    highestCashOnlyCostAfterFeeTax: Float
    hotelMnemonic: String
    lowestCashOnlyCost: Float
    lowestCashOnlyCostAfterFeeTax: Float
    hotel: Hotel
  }

  type BrandInfo {
    chainCode: String
    brandCode: String
    brandName: String
  }

  type HotelInfo {
    brandInfo: BrandInfo
  }

  type Hotel2 {
    hotelInfo: HotelInfo
  }

  type Hotel {
    chainCode: String
    brandCode: String
    brandName: String
  }


  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    hotelOffers(dateRange: String!): HotelOffers
    hotel(mnemonic: String!): Hotel
    hotel2(mnemonic: String!): Hotel2
    getHotels(mnemonicList: [String]): [Hotel2]
  }
`;

  
// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const resolvers = {
  Query: {
    hotel: async (_source, { mnemonic }, { dataSources }) => {
      return dataSources.hotelAPI.getHotel(mnemonic);
    },
    hotel2: async (_source, { mnemonic }, { dataSources }) => {
      return dataSources.hotelAPI.getHotel(mnemonic);
    },
    getHotels(parent, args, context, info) {  
      let hotelList = [];    
      for (const element of args.mnemonicList) {    
        let response =  context.dataSources.hotelAPI.getHotel(element);
        if (response != null) {
          hotelList.push(response);
        }
      }
      return hotelList;
    },
    /*
    hotels(parent, args, context, info) {
      console.log("args ", args);
      for (const element of args.mnemonicList) {    
        return context.dataSources.hotelAPI.getHotel(element);
      }
    },
    */
    hotelOffers: async (_source, { dateRange }, { dataSources }) => {
      let response = dataSources.availabilityAPI.getOffers(dateRange);
      return response;
    }
  },
  HotelOffers: {
   hotels(parent, args, context, info) {
      return parent.hotels;
    }
  },
  HotelOffer: {
    hotel(parent, args, context, info) {
      return context.dataSources.hotelAPI.getHotel(parent.hotelMnemonic);
    }
  },
  Hotel: {
    chainCode(parent, args, context, info) {
      return parent.hotelInfo.brandInfo.chainCode;
    },
    brandCode(parent, args, context, info) {
      return parent.hotelInfo.brandInfo.brandCode;
    },
    brandName(parent, args, context, info) {
      return parent.hotelInfo.brandInfo.brandName;
    }
  }
}

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => {
    return {
      hotelAPI: new HotelAPI(),
      availabilityAPI: new AvailabilityAPI()
    };
  },
  context: () => {
    return {
      token: INT_TOKEN
    };
  },
  playground: {
    endpoint: "/dev/graphql"
  }
});

exports.graphqlHandler = server.createHandler();

