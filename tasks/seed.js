import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import {
  users,
  restaurants,
  reviews,
  comments,
} from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import helpers from "../helpers.js";

const main = async () => {
  const db = await dbConnection();
  await db.dropDatabase();

  // create some preliminary ids that can be referenced later
  // users
  const AlanTuringID = new ObjectId();
  const CharlieDavisID = new ObjectId();
  const AliceSmithID = new ObjectId();
  const AnnaReedID = new ObjectId();
  const JohnMillerID = new ObjectId();

  // restaurants
  const OldMillCafeID = new ObjectId();
  const JohnsPizzeriaID = new ObjectId();
  const LinDaughtersID = new ObjectId();
  const restaurant218ID = new ObjectId();
  const KingsWokID = new ObjectId();
  const SculptCafeID = new ObjectId();
  const TeaMilkID = new ObjectId();
  const TGFlavorsID = new ObjectId();
  const SNAFUID = new ObjectId();
  const SubwayID = new ObjectId();

  // reviews
  const AlanReview1 = new ObjectId(); // old mill cafe
  const CharlieReview1 = new ObjectId(); // old mill cafe
  const AnnaReview1 = new ObjectId(); // lin & daughters
  const JohnReview1 = new ObjectId(); // lin & daughters
  const AlanReview2 = new ObjectId(); // lin & daughters
  const AlanReview3 = new ObjectId(); // 218 restaurant

  // comments
  const AlanComment1 = new ObjectId(); // old mill cafe
  const AnnaComment1 = new ObjectId(); // jonhs pizzeria
  const AlanComment2 = new ObjectId(); // jonhs pizzeria; reply to Anna
  const JohnComment1 = new ObjectId(); // jonhs pizzeria; reply to Anna

  console.log("Seeding database...");

  // user data

  const userCollection = await users();

  const userData = [
    {
      _id: AlanTuringID,
      firstName: "Alan",
      lastName: "Turing",
      username: "alan.turing",
      email: "aturing@stevens.edu",
      role: "user",
      passwordHashed: await helpers.hashPassword("TuringMachine@1936"), // stores the hashed password
      publicFollowingRestaurants: [
        OldMillCafeID,
        LinDaughtersID,
        SculptCafeID,
        SNAFUID,
      ],
      privateFollowingRestaurants: [restaurant218ID],
      reviewsCompleted: [AlanReview1, AlanReview2, AlanReview3],
      commentsPosted: [AlanComment1, AlanComment2],
      notifications: [
        {
          _id: new ObjectId(),
          date: "01/16/2026",
          title: `Letter Grade Dropped - John's Pizzeria`,
          message: `The letter grade for restaurant John's Pizzeria has dropped from A to B.`,
          viewed: true,
        },
        {
          _id: new ObjectId(),
          date: "03/21/2026",
          title: `Letter Grade Improved - 218 Restaurant`,
          message: `The letter grade for restaurant 218 Restaurant has improved from C to B.`,
          viewed: false,
        },
      ],
    },
    {
      _id: CharlieDavisID,
      firstName: "Charlie",
      lastName: "Davis",
      username: "charlieinnyc",
      email: "charliesd@gmail.com",
      role: "user",
      passwordHashed: await helpers.hashPassword("foodie_NYC612"), // stores the hashed password
      publicFollowingRestaurants: [],
      privateFollowingRestaurants: [],
      reviewsCompleted: [CharlieReview1],
      commentsPosted: [],
      notifications: [],
    },
    {
      _id: AliceSmithID,
      firstName: "Alice",
      lastName: "Smith",
      username: "aliceisawesome",
      email: "alicesmith@nyc.gov",
      role: "admin",
      passwordHashed: await helpers.hashPassword("Testing@123"), // stores the hashed password
      publicFollowingRestaurants: [],
      privateFollowingRestaurants: [restaurant218ID],
      reviewsCompleted: [],
      commentsPosted: [],
      notifications: [
        {
          _id: new ObjectId(),
          date: "03/21/2026",
          title: `Letter Grade Improved - 218 Restaurant`,
          message: `The letter grade for restaurant 218 Restaurant has improved from C to B.`,
          viewed: false,
        },
      ],
    },
    {
      _id: AnnaReedID,
      firstName: "Anna",
      lastName: "Reed",
      username: "reedanna567",
      email: "annaemail@outlook.com",
      role: "user",
      passwordHashed: await helpers.hashPassword("Password123!"), // stores the hashed password
      publicFollowingRestaurants: [],
      privateFollowingRestaurants: [JohnsPizzeriaID, TGFlavorsID],
      reviewsCompleted: [AnnaReview1],
      commentsPosted: [AnnaComment1],
      notifications: [
        {
          _id: new ObjectId(),
          date: "01/16/2026",
          title: `Letter Grade Dropped - John's Pizzeria`,
          message: `The letter grade for restaurant John's Pizzeria has dropped from A to B.`,
          viewed: true,
        },
        {
          _id: new ObjectId(),
          date: "01/16/2026",
          title: `Review Flagged`,
          message: `The letter grade for restaurant 218 Restaurant has improved from C to B.
          The following user reviews have been flagged:`,
          viewed: false,
        },
      ],
    },
    {
      _id: JohnMillerID,
      firstName: "John",
      lastName: "Miller",
      username: "doglover78",
      email: "johnnyboy@aol.com",
      role: "user",
      passwordHashed: await helpers.hashPassword("ILoveDogs!89"), // stores the hashed password
      publicFollowingRestaurants: [JohnsPizzeriaID, SNAFUID],
      privateFollowingRestaurants: [],
      reviewsCompleted: [JohnReview1],
      commentsPosted: [JohnComment1],
      notifications: [
        {
          _id: new ObjectId(),
          date: "01/16/2026",
          title: `Letter Grade Dropped - John's Pizzeria`,
          message: `The letter grade for restaurant John's Pizzeria has dropped from A to B.`,
          viewed: false,
        },
      ],
    },
  ];

  await userCollection.insertMany(userData);

  // restaurant data

  const restaurantCollection = await restaurants();

  const restaurantData = [
    {
      _id: OldMillCafeID,
      name: "Old Mill Cafe LLC",
      boro: "Brooklyn",
      address: {
        _id: new ObjectId(),
        building: "49",
        street: "Wilson Avenue",
        zip: "11237",
      },
      phone: "9296229278",
      cuisine: "Coffee/Tea",
      inspections: [], // example with no inspections
      userReviews: [AlanReview1, CharlieReview1],
      userComments: [AlanComment1],
    },
    {
      _id: JohnsPizzeriaID,
      name: `John's Pizzeria`,
      boro: "Manhattan",
      address: {
        _id: new ObjectId(),
        building: "278",
        street: "Bleecker Street",
        zip: "10014",
      },
      phone: "2122431680",
      cuisine: "Pizza",
      inspections: [
        // example with dropped letter grade
        {
          _id: new ObjectId(),
          inspectionDate: "01/10/2025",
          action: "No violations were recorded at the time of this inspection.",
          violationCode: "",
          violationDescription: "",
          criticalFlag: "",
          grade: "A",
        },
        {
          _id: new ObjectId(),
          inspectionDate: "01/16/2026",
          action: "Violations were cited in the following area(s).",
          violationCode: "09E",
          violationDescription:
            "Wash hands sign not posted near or above hand washing sink.",
          criticalFlag: "Not Critical",
          grade: "B",
        },
      ],
      userReviews: [],
      userComments: [AnnaComment1],
    },
    {
      _id: LinDaughtersID,
      name: "Lin & Daughters",
      boro: "Manhattan",
      address: {
        _id: new ObjectId(),
        building: "181",
        street: "West 4 Street",
        zip: "10014",
      },
      phone: "5166735686",
      cuisine: "Chinese",
      inspections: [],
      userReviews: [AnnaReview1, JohnReview1, AlanReview2],
      userComments: [],
    },
    {
      _id: restaurant218ID,
      name: "218 Restaurant",
      boro: "Manhattan",
      address: {
        _id: new ObjectId(),
        building: "218220",
        street: "Grand Street",
        zip: "10014",
      },
      phone: "2122268039",
      cuisine: "Chinese",
      inspections: [
        // example with improved letter grade, will flag user reviews for admin
        {
          _id: new ObjectId(),
          inspectionDate: "10/10/2025",
          action: "Violations were cited in the following area(s).",
          violationCode: "06E",
          violationDescription:
            "Sanitized equipment or utensil, including in-use food dispensing utensil, improperly used or stored.",
          criticalFlag: "Critical",
          grade: "C",
        },
        {
          _id: new ObjectId(),
          inspectionDate: "03/21/2026",
          action: "Cycle Inspection / Re-inspection",
          violationCode: "",
          violationDescription: "",
          criticalFlag: "Not Critical",
          grade: "B",
        },
      ],
      userReviews: [],
      userComments: [],
    },

    // the following are intended to simply populate more restaurants to model the search and following features,
    // there will be no reviews, inspection history, etc.
    {
      _id: KingsWokID,
      name: "King's Wok",
      boro: "Brooklyn",
      address: {
        _id: new ObjectId(),
        building: "261",
        street: "Troy Avenue",
        zip: "11213",
      },
      phone: "7183631187",
      cuisine: "Chinese",
      inspections: [],
      userReviews: [],
      userComments: [],
    },
    {
      _id: SculptCafeID,
      name: "The Sculpt Cafe",
      boro: "Staten Island",
      address: {
        _id: new ObjectId(),
        building: "1584",
        street: "Richmond Rd",
        zip: "10304",
      },
      phone: "3474660072",
      cuisine: "Coffee/Tea",
      inspections: [],
      userReviews: [],
      userComments: [],
    },
    {
      _id: TeaMilkID,
      name: "Tea and Milk",
      boro: "Queens",
      address: {
        _id: new ObjectId(),
        building: "32-02",
        street: "34 Avenue",
        zip: "11106",
      },
      phone: "9174980618",
      cuisine: "Coffee/Tea",
      inspections: [],
      userReviews: [],
      userComments: [],
    },
    {
      _id: TGFlavorsID,
      name: "T & G Flavors",
      boro: "Queens",
      address: {
        _id: new ObjectId(),
        building: "228-01",
        street: "Linden Boulevard",
        zip: "11411",
      },
      phone: "7187122956",
      cuisine: "Caribbean",
      inspections: [],
      userReviews: [],
      userComments: [],
    },
    {
      _id: SNAFUID,
      name: "SNAFU",
      boro: "Manhattan",
      address: {
        _id: new ObjectId(),
        building: "127",
        street: "East 47 Street",
        zip: "10017",
      },
      phone: "2123179100",
      cuisine: "American",
      inspections: [],
      userReviews: [],
      userComments: [],
    },
    {
      _id: SubwayID,
      name: "Subway",
      boro: "Queens",
      address: {
        _id: new ObjectId(),
        building: "69-79",
        street: "Grand Avenue",
        zip: "11378",
      },
      phone: "9174597040",
      cuisine: "Sandwiches",
      inspections: [],
      userReviews: [],
      userComments: [],
    },
  ];

  await restaurantCollection.insertMany(restaurantData);

  // review data

  const reviewCollection = await reviews();

  const reviewData = [
    {
      _id: CharlieReview1,
      userID: CharlieDavisID,
      restaurantID: OldMillCafeID,
      rating: 4.5, // ratings are out of 5
      date: "11/25/2025",
    },
    {
      _id: AlanReview1,
      userID: AlanTuringID,
      restaurantID: OldMillCafeID,
      rating: 5.0, // ratings are out of 5
      date: "04/13/2026",
    },
    {
      _id: AnnaReview1,
      userID: AnnaReedID,
      restaurantID: LinDaughtersID,
      rating: 5.0, // ratings are out of 5
      date: "11/03/2024",
    },
    {
      _id: JohnReview1,
      userID: JohnMillerID,
      restaurantID: LinDaughtersID,
      rating: 4.5, // ratings are out of 5
      date: "01/31/2025",
    },
    {
      _id: AlanReview2,
      userID: AlanTuringID,
      restaurantID: LinDaughtersID,
      rating: 3.0, // ratings are out of 5
      date: "02/13/2025",
    },
    {
      _id: AlanReview3,
      userID: AlanTuringID,
      restaurantID: restaurant218ID,
      rating: 2.0, // ratings are out of 5
      date: "12/25/2025",
    },
  ];

  await reviewCollection.insertMany(reviewData);

  // comment data

  const commentCollection = await comments();

  const commentData = [
    {
      _id: AlanComment1,
      userID: AlanTuringID,
      message: "This place is awesome! Their scones are to die for!",
      date: "04/12/2026",
      replies: [],
    },
    {
      _id: AnnaComment1,
      userID: AnnaReedID,
      message: "I saw a rat last week in the kitchen...",
      date: "09/02/2025",
      replies: [AlanComment2, JohnComment1],
    },
    {
      _id: AlanComment2,
      userID: AlanTuringID,
      message: `Yikes! I also saw one today!! I hope this isn't a trend...`,
      date: "09/18/2025",
      replies: [],
    },
    {
      _id: JohnComment1,
      userID: JohnMillerID,
      message: `Broooo, 2 rats ran across my table last night when I was getting food. All I wanted was a quick slice after a night out!`,
      date: "09/18/2025",
      replies: [],
    },
  ];

  await commentCollection.insertMany(commentData);

  const userCount = await userCollection.countDocuments();
  const restaurantCount = await restaurantCollection.countDocuments();
  const reviewCount = await reviewCollection.countDocuments();
  const commentCount = await commentCollection.countDocuments();

  console.log("Seeding complete");
  console.log("Seeded:");
  console.log(`${userCount} of ${userData.length} users`);
  console.log(`${restaurantCount} of ${restaurantData.length} restaurants`);
  console.log(`${reviewCount} of ${reviewData.length} reviwes`);
  console.log(`${commentCount} of ${commentData.length} comments`);

  await closeConnection();
};

main();
