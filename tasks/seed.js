import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import {
  users,
  restaurants,
  reviews,
  comments,
} from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import helpers from "../helpers.js";

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";

const clean = (value) => {
  let text = String(value ?? "");
  return text.trim().replace(/\s+/g, " ");
};

const loadRestaurantsFromCSV = async (csvPath) => {
  let file = await fs.readFile(csvPath, "utf8");
  let rows = parse(file, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  let restaurantMap = new Map();

  for (let row of rows) {
    let name = clean(row.Restaurant);
    let boro = clean(row.Borough).toLowerCase();
    let building = clean(row.BUILDING);
    let street = clean(row.STREET);
    let zip = clean(row.ZIPCODE);
    let phone = clean(row.PHONE);
    let cuisine = clean(row["CUISINE DESCRIPTION"]).toLowerCase();

    let key = [name, boro, building, street, zip, phone, cuisine].join("||");

    if (!restaurantMap.has(key)) {
      restaurantMap.set(key, {
        _id: new ObjectId(),
        name,
        boro,
        address: {
          _id: new ObjectId(),
          building,
          street,
          zip,
        },
        phone,
        cuisine,
        inspections: [],
        userReviews: [],
        userComments: [],
        isClosed: false,
        closedVotes: [],
        reopenVotes: [],
      });
    }

    restaurantMap.get(key).inspections.push({
      _id: new ObjectId(),
      inspectionDate: clean(row["INSPECTION DATE"]),
      action: clean(row.ACTION),
      violationCode: clean(row["VIOLATION CODE"]),
      violationDescription: clean(row["VIOLATION DESCRIPTION"]),
      criticalFlag: clean(row["CRITICAL FLAG"]),
      grade: clean(row.GRADE),
    });
  }

  return [...restaurantMap.values()];
};

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
  const TGFlavorsID = new ObjectId();
  const SNAFUID = new ObjectId();
  const OldMillCafeID = new ObjectId();
  const JohnsPizzeriaID = new ObjectId();
  const LinDaughtersID = new ObjectId();
  const restaurant218ID = new ObjectId();

  // reviews
  const AlanReview1ID = new ObjectId();   // old mill cafe
  const CharlieReview1ID = new ObjectId(); // old mill cafe
  const AnnaReview1ID = new ObjectId();   // lin & daughters  
  const JohnReview1ID = new ObjectId();   // lin & daughters
  const AlanReview2ID = new ObjectId();   // lin & daughters
  const AlanReview3ID = new ObjectId();   // 218 restaurant  

  // comments
  const AlanComment1ID = new ObjectId();  // old mill cafe
  const AnnaComment1ID = new ObjectId();  // john's pizzeria
  const AlanComment2ID = new ObjectId();  // reply to Anna
  const JohnComment1ID = new ObjectId();  // reply to Anna


  let survey5 = {
    diningAreaCleanliness: 5,
    restroomCleanliness: 5,
    staffHygiene: 5,
    overallExperience: 5,
    foodHandlingPractices: "yes",
    foodTemperature: "yes",
    pestSighting: "no",
  };
  let survey4 = {
    diningAreaCleanliness: 4,
    restroomCleanliness: 4,
    staffHygiene: 4,
    overallExperience: 4,
    foodHandlingPractices: "yes",
    foodTemperature: "yes",
    pestSighting: "no",
  };
  let survey3 = {
    diningAreaCleanliness: 3,
    restroomCleanliness: 3,
    staffHygiene: 3,
    overallExperience: 3,
    foodHandlingPractices: "not_observed",
    foodTemperature: "yes",
    pestSighting: "no",
  };
  let survey2 = {
    diningAreaCleanliness: 2,
    restroomCleanliness: 2,
    staffHygiene: 2,
    overallExperience: 2,
    foodHandlingPractices: "no",
    foodTemperature: "no",
    pestSighting: "yes",
  };

  let AlanReplyEmbedded = {
    _id: AlanComment2ID.toString(),
    userID: AlanTuringID,
    username: "alan.turing",
    restaurantID: JohnsPizzeriaID,
    message: "Yikes! I also saw one today!! I hope this isn't a trend...",
    date: "09/18/2025",
    replies: [],
    parentId: AnnaComment1ID,
    edited: true,
  };
  let JohnReplyEmbedded = {
    _id: JohnComment1ID.toString(),
    userID: JohnMillerID,
    username: "doglover78",
    restaurantID: JohnsPizzeriaID,
    message: "Broooo, 2 rats ran across my table last night when I was getting food. All I wanted was a quick slice after a night out!",
    date: "09/18/2025",
    replies: [],
    parentId: AnnaComment1ID,
    edited: false,
  };

  console.log("Seeding database...");

  // user data

  const userCollection = await users();

  const userData = [
    {
      _id: AlanTuringID,
      firstName: "Alan",
      lastName: "Turing",
      username: "alan.turing",
      role: "user",
      passwordHashed: await helpers.hashPassword("TuringMachine@1936"), // stores the hashed password
      publicFollowingRestaurants: [],
      privateFollowingRestaurants: [restaurant218ID],
      reviewsCompleted: [AlanReview1ID, AlanReview2ID, AlanReview3ID],
      commentsPosted: [AlanComment1ID, AlanComment2ID],
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
      role: "user",
      passwordHashed: await helpers.hashPassword("foodie_NYC612"), // stores the hashed password
      publicFollowingRestaurants: [],
      privateFollowingRestaurants: [],
      reviewsCompleted: [CharlieReview1ID],
      commentsPosted: [],
      notifications: [],
    },
    {
      _id: AliceSmithID,
      firstName: "Alice",
      lastName: "Smith",
      username: "aliceisawesome",
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
      role: "user",
      passwordHashed: await helpers.hashPassword("Password123!"), // stores the hashed password
      publicFollowingRestaurants: [],
      privateFollowingRestaurants: [JohnsPizzeriaID, TGFlavorsID],
      reviewsCompleted: [AnnaReview1ID],
      commentsPosted: [AnnaComment1ID],
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
      role: "user",
      passwordHashed: await helpers.hashPassword("ILoveDogs!89"), // stores the hashed password
      publicFollowingRestaurants: [JohnsPizzeriaID, SNAFUID],
      privateFollowingRestaurants: [],
      reviewsCompleted: [JohnReview1ID],
      commentsPosted: [JohnComment1ID],
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
      boro: "brooklyn",
      address: {
        building: "49",
        street: "Wilson Avenue",
        zip: "11237",
      },
      phone: "9296229278",
      cuisine: "coffee/tea",
      inspections: [], // example with no inspections
      userReviews: [AlanReview1ID, CharlieReview1ID],
      userComments: [AlanComment1ID],
      isClosed: true,
      closedVotes: [],
      reopenVotes: [],
    },
    {
      _id: JohnsPizzeriaID,
      name: `John's Pizzeria`,
      boro: "manhattan",
      address: {
        building: "278",
        street: "Bleecker Street",
        zip: "10014",
      },
      phone: "2122431680",
      cuisine: "pizza",
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
      userComments: [AnnaComment1ID, AlanComment2ID, JohnComment1ID],
      isClosed: false,
      closedVotes: [],
      reopenVotes: [],
    },
    {
      _id: LinDaughtersID,
      name: "Lin & Daughters",
      boro: "manhattan",
      address: { building: "181", street: "West 4 Street", zip: "10014" },
      phone: "5166735686",
      cuisine: "chinese",
      inspections: [],
      userReviews: [AnnaReview1ID, JohnReview1ID, AlanReview2ID],
      userComments: [],
      isClosed: false,
      closedVotes: [],
      reopenVotes: [],
    },
    {
      _id: restaurant218ID,
      name: "218 Restaurant",
      boro: "manhattan",
      address: {
        building: "218220",
        street: "Grand Street",
        zip: "10014",
      },
      phone: "2122268039",
      cuisine: "chinese",
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
      userReviews: [AlanReview3ID],
      userComments: [],
      isClosed: false,
      closedVotes: [],
      reopenVotes: [],
    },
    {
      _id: TGFlavorsID,
      name: "TG Flavors",
      boro: "bronx",
      address: { building: "1032", street: "Southern Boulevard", zip: "10459" },
      phone: "7186231234",
      cuisine: "caribbean",
      inspections: [
        {
          _id: new ObjectId(),
          inspectionDate: "06/15/2025",
          action: "No violations were recorded at the time of this inspection.",
          violationCode: "",
          violationDescription: "",
          criticalFlag: "",
          grade: "A",
        },
      ],
      userReviews: [],
      userComments: [],
      isClosed: false,
      closedVotes: [],
      reopenVotes: [],
    },
    {
      _id: SNAFUID,
      name: "SNAFU Bar & Grill",
      boro: "brooklyn",
      address: { building: "212", street: "DeKalb Avenue", zip: "11205" },
      phone: "7184561234",
      cuisine: "american",
      inspections: [
        {
          _id: new ObjectId(),
          inspectionDate: "09/05/2025",
          action: "No violations were recorded at the time of this inspection.",
          violationCode: "",
          violationDescription: "",
          criticalFlag: "",
          grade: "A",
        },
      ],
      userReviews: [],
      userComments: [],
      isClosed: false,
      closedVotes: [],
      reopenVotes: [],
    },
  ];

  const csvRestaurants = await loadRestaurantsFromCSV(
    path.resolve(
      "tasks/DOHMH_New_York_City_Restaurant_Inspection_Results_20260423_FILTERED_TRUNCATED.csv",
    ),
  );

  await restaurantCollection.insertMany([...restaurantData, ...csvRestaurants]);

  // review data

  const reviewCollection = await reviews();

  const reviewData = [
    {
      _id: CharlieReview1ID,
      userID: CharlieDavisID,
      username: "charlieinnyc",
      restaurantID: OldMillCafeID,
      rating: 4.5,
      reviewText: "Great little cafe!",
      survey: survey4,
      photos: [],
      date: "11/25/2025",
      edited: false,
      flagged: false,
      currRestaurantGrade: null,
      upvotes: [],
      downvotes: [],
    },
    {
      _id: AlanReview1ID,
      userID: AlanTuringID,
      username: "alan.turing",
      restaurantID: OldMillCafeID,
      rating: 5.0,
      reviewText:  "Highly recommend!",
      survey: survey5,
      photos: [],
      date: "04/13/2026",
      edited: false,
      flagged: false,
      currRestaurantGrade: null,
      upvotes: [CharlieDavisID],
      downvotes: [],
    },
    {
      _id: AnnaReview1ID,
      userID: AnnaReedID,
      username: "reedanna567",
      restaurantID: LinDaughtersID,
      rating: 5.0,
      reviewText: "My favorite spot to go to.",
      survey: survey5,
      photos: [],
      date: "04/01/2023",
      edited: false,
      flagged: false,
      currRestaurantGrade: null,
      upvotes: [JohnMillerID, AlanTuringID],
      downvotes: [],
    },
    {
      _id: JohnReview1ID,
      userID: JohnMillerID,
      username: "doglover78",
      restaurantID: LinDaughtersID,
      rating: 4.5,
      reviewText: "Would be a 5 if they gave fortune cookies.",
      survey: survey4,
      photos: [],
      date: "01/31/2025",
      edited: false,
      flagged: false,
      currRestaurantGrade: null,
      upvotes: [],
      downvotes: [],
    },
    {
      _id: AlanReview2ID,
      userID: AlanTuringID,
      username: "alan.turing",
      restaurantID: LinDaughtersID,
      rating: 3.0,
      reviewText: "Not my cup of tea.",
      survey: survey3,
      photos: [],
      date: "02/13/2025",
      edited: false,
      flagged: false,
      currRestaurantGrade: null,
      upvotes: [],
      downvotes: [],
    },
    {
      _id: AlanReview3ID,
      userID: AlanTuringID,
      username: "alan.turing",
      restaurantID: restaurant218ID,
      rating: 2.0,
      reviewText: "The kitchen area looked a bit unclean.",
      survey: survey2,
      photos: [],
      date: "12/25/2025",
      edited: false,
      flagged: false,
      currRestaurantGrade: "C",
      upvotes: [],
      downvotes: [],
    },
  ];

  await reviewCollection.insertMany(reviewData);

  // comment data

  const commentCollection = await comments();

  const commentData = [
    {
      _id: AlanComment1ID,
      userID: AlanTuringID,
      username: "alan.turing",
      restaurantID: OldMillCafeID,
      message: "This place is awesome! Their scones are to die for!",
      date: "04/12/2026",
      replies: [],
      parentId: null,
      edited: false,
    },
    {
      _id: AnnaComment1ID,
      userID: AnnaReedID,
      username: "reedanna567",
      restaurantID: JohnsPizzeriaID,
      message: "I saw a rat last week in the kitchen...",
      date: "09/02/2025",
      replies: [AlanReplyEmbedded, JohnReplyEmbedded],
      parentId: null,
      edited: false,
    },
    {
      _id: AlanComment2ID,
      userID: AlanTuringID,
      username: "alan.turing",
      restaurantID: JohnsPizzeriaID,
      message: `Yikes! I also saw one today!! I hope this isn't a trend...`,
      date: "09/18/2025",
      replies: [],
      parentId: AnnaComment1ID,
      edited: true,
    },
    {
      _id: JohnComment1ID,
      userID: JohnMillerID,
      username: "doglover78",
      restaurantID: JohnsPizzeriaID,
      message: `Broooo, 2 rats ran across my table last night when I was getting food. All I wanted was a quick slice after a night out!`,
      date: "09/18/2025",
      replies: [],
      parentId: AnnaComment1ID,
      edited: false,
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
  console.log(`${restaurantCount} of 2186 restaurants`);
  console.log(`${reviewCount} of ${reviewData.length} reviwes`);
  console.log(`${commentCount} of ${commentData.length} comments`);

  await closeConnection();
};

main();