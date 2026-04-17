import { ObjectId } from "mongodb";
import { restaurants } from "../config/mongoCollections.js";
import helpers from "../helpers.js";
import Fuse from "fuse.js";

/**
 * Create a restaurant profile with the specified information.
 * @param {string} name - The name of the restaurant.
 * @param {string} boro - The boro the restaurant is located in.
 * @param {string} building - The building number of the restaurant.
 * @param {string} street - The street the restaurant is located on.
 * @param {string} zipame - The zip of the restaurant.
 * @param {string} phone - The 10 digit phone number of the restaurant.
 * @param {string} cuisine - The cuisine type of the restaurant.
 * @returns {Promise<object>} An object with the field restaurantCreated indicating success.
 */
export const createRestaurant = async (
  name,
  boro,
  building,
  street,
  zip,
  phone,
  cuisine,
) => {
  // name
  if (name) {
    if (typeof name !== "string") throw "Error: name must be type string!";

    name = name.trim();
    if (name.length < 2 || name.length > 35) {
      throw "Error: name has invalid length!";
    }
  } else {
    throw "Error: name is missing!";
  }

  // boro
  if (boro) {
    boro = helpers.checkBoro(boro);
  } else {
    throw "Error: boro is missing!";
  }

  // building
  if (building) {
    if (typeof building !== "string")
      throw "Error: building must be type string!";

    building = building.trim();
    if (building.length < 1 || building.length > 10)
      throw "Error: building has invalid length!";
  } else {
    throw "Error: building is missing!";
  }

  // street
  if (street) {
    if (typeof street !== "string") throw "Error: street must be type string!";

    street = street.trim();
    if (street.length < 3 || street.length > 45)
      throw "Error: street has invalid length!";
  } else {
    throw "Error: street is missing!";
  }

  // zip
  if (zip) {
    zip = helpers.checkZipCode(zip);
  } else {
    throw "Error: zip is missing!";
  }

  // phone
  if (phone) {
    phone = helpers.checkPhoneNumber(phone);
  } else {
    throw "Error: phone is missing!";
  }

  // cuisine
  if (cuisine) {
    if (typeof cuisine !== "string")
      throw "Error: cuisine must be type string!";

    cuisine = cuisine.trim().toLowerCase();
    if (cuisine.length < 3 || cuisine.length > 15)
      throw "Error: cuisine has invalid length!";
  } else {
    throw "Error: cuisine is missing!";
  }

  const restaurantInfo = {
    _id: new ObjectId(),
    name: name,
    boro: boro,
    address: {
      building: building,
      street: street,
      zip: zip,
    },
    phone: phone,
    cuisine: cuisine,
    inspections: [],
    userReviews: [],
    userComments: [],
  };

  const restaurantCollection = await restaurants();
  const insertInfo = await restaurantCollection.insertOne(restaurantInfo);

  if (!insertInfo.acknowledged || !insertInfo.insertedId)
    throw "Error: Restaurant could not be created!";

  return { restaurantCreated: true };
};

/**
 * Returns an array of restaurant object with certain fields.
 * @returns {Promise<array>} An array of restaurant objects, each containing the ID, name, boro, and cuisine of the restaurant.
 */
export const getAllRestaurants = async () => {
  const restaurantCollection = await restaurants();
  const restaurantList = await restaurantCollection
    .find({})
    .project({ _id: 1, name: 1, boro: 1, cuisine: 1 })
    .toArray();

  if (!restaurantList) throw "Error: Could not get all restaurants!";
  return restaurantList;
};

/**
 * Returns a restaurant given its id.
 * @param {string} id - The ID of the restaurant to retrieve.
 * @returns {Promise<object>} The entire object of the restaurant retrieved.
 */
export const getRestaurantById = async (id) => {
  id = helpers.checkId(id, "id");

  const restaurantCollection = await restaurants();
  const restaurant = await restaurantCollection.findOne({
    _id: new ObjectId(id),
  });

  if (!restaurant) throw `No restaurant exists with id ${id}!`;
  restaurant._id = restaurant._id.toString();

  return restaurant;
};

/**
 * Adds an inspection to a restaurant with the specified id.
 * @param {string} restaurantID - The ID of the restaurant to add the inspection info to.
 * @param {string} date - The date of the inspection (required).
 * @param {string} action - The action taken (required).
 * @param {string} violationCode - The violation code (optional).
 * @param {string} violationDescription - The description of the violation (optional).
 * @param {string} criticalFlag - The flag indicating how critical the inspection was (required).
 * @param {string} grade - The letter grade of the inspection (required).
 * @returns {Promise<object>} The entire object of the inspection.
 */
export const addInspection = async (
  restaurantID,
  date,
  action,
  violationCode,
  violationDescription,
  criticalFlag,
  grade,
) => {
  // date
  if (date) {
    date = helpers.checkDate(date, "date");
  } else {
    throw "Error: date is missing!";
  }

  // action
  if (action) {
    if (typeof action !== "string") throw "Error: action must be type string";

    action = action.trim();
    const validActions = [
      "No violations were recorded at the time of this inspection.",
      "Violations were cited in the following area(s).",
    ];

    if (!validActions.includes(action))
      throw "Error: Invalid inspection action!";
  } else {
    throw "Error: action is missing!";
  }

  // violation code
  if (violationCode) {
    if (typeof violationCode !== "string")
      throw "Error: violationCode must be type string";

    violationCode = violationCode.trim();
    if (violationCode.length > 10)
      throw "Error: violationCode has invalid length!";
  } else {
    violationCode = "";
  }

  // violation description
  if (violationDescription) {
    if (typeof violationDescription !== "string")
      throw "Error: violationDescription must be type string!";

    violationDescription = violationDescription.trim();
    if (violationDescription.length > 100)
      throw "Error: violationDescription is too long!";
  } else {
    violationDescription = "";
  }

  // critical flag
  if (criticalFlag) {
    if (typeof criticalFlag !== "string")
      throw "Error: criticalFlag must be type string!";

    criticalFlag = criticalFlag.trim();
    const validFlags = ["Critical", "Not Critical"];

    if (!validFlags.includes(criticalFlag))
      throw `Error: criticalFlag must be either 'Critical' or 'Not Critical'!`;
  } else {
    throw "Error: criticalFlag is missing!";
  }

  // grade
  if (grade) {
    if (typeof grade !== "string") throw "Error: grade must be type string!";
    grade = grade.trim();

    const validGrades = ["A", "B", "C"];

    if (!validGrades.includes(grade))
      throw `Error: grade must be either 'A', 'B', or 'C'!`;
  } else {
    throw "Error: grade is missing!";
  }

  // check id
  restaurantID = helpers.checkId(restaurantID, "restaurantID");
  let restaurant = await getRestaurantById(restaurantID);

  const inspectionInfo = {
    _id: new ObjectId(),
    inspectionDate: date,
    action: action,
    violationCode: violationCode,
    violationDescription: violationDescription,
    criticalFlag: criticalFlag,
    grade: grade,
  };

  restaurant.inspections.push(inspectionInfo);

  const restaurantCollection = await restaurants();
  const updatedInfo = await restaurantCollection.findOneAndUpdate(
    { _id: new ObjectId(restaurantID) },
    { $set: { inspections: restaurant.inspections } },
    { returnDocument: "after" },
  );

  if (!updatedInfo)
    throw `Could not add inspection to restaurant with id '${restaurantID}'!`;
  return updatedInfo;
};

/**
 * Removes an inspection from a restaurant's inspection history with the specified id's.
 * @param {string} restaurantID - The ID of the restaurant to remove the inspection from.
 * @param {string} inspectionID - The ID of the inspection to remove.
 * @returns {Promise<object>} An object with field deleted indicating success.
 */
export const removeInspection = async (restaurantID, inspectionID) => {
  restaurantID = helpers.checkId(restaurantID, "restaurantID");
  inspectionID = helpers.checkId(inspectionID, "inspectionID");

  const restaurant = await getRestaurantById(restaurantID);
  let inspectionExists = false;
  for (let i = 0; i < restaurant.inspections.length; i++) {
    if (restaurant.inspections[i]._id.toString() === inspectionID)
      inspectionExists = true;
  }

  if (!inspectionExists)
    throw `Could not find an inspection with id '${inspectionID}'!`;

  const restaurantCollection = await restaurants();

  const removedInspection = await restaurantCollection.updateOne(
    {
      _id: new ObjectId(restaurantID),
      "inspections._id": new ObjectId(inspectionID),
    },
    { $pull: { inspections: { _id: new ObjectId(inspectionID) } } },
  );

  if (removedInspection.modifiedCount === 0) {
    throw `Could not find an inspection with id '${inspectionID}'!`;
  }

  return { deleted: true };
};

/**
 * Returns the inspection history for the restaurant with the specified id.
 * @param {string} id - The ID of the restaurant to retrieve the inspection history from.
 * @returns {Promise<array>} The inspections array of the restaurant.
 */
export const getInspectionHistory = async (id) => {
  id = helpers.checkId(id, "id");

  const restaurant = await getRestaurantById(id);

  return restaurant.inspections;
};

/**
 * Adds a user review reference ID to the specified restaurant's user reviews.
 * @param {string} restaurantID - The ID of the restaurant to add the review ID to.
 * @param {string} reviewID - The ID of the review to add.
 * @returns {Promise<object>} An object with the field added to indicte success.
 */
export const addReviewReference = async (restaurantID, reviewID) => {
  restaurantID = helpers.checkId(restaurantID, "restaurantID");
  reviewID = helpers.checkId(reviewID, "reviewID");

  const restaurant = await getRestaurantById(restaurantID);
  let reviewExists = false;
  for (let i = 0; i < restaurant.userReviews.length; i++) {
    if (restaurant.userReviews[i] === reviewID) reviewExists = true;
  }

  if (reviewExists)
    throw `Error: A review with that id has already been added!`;

  const restaurantCollection = await restaurants();

  const addedReview = await restaurantCollection.findOneAndUpdate(
    { _id: new ObjectId(restaurantID) },
    { $push: { userReviews: reviewID } },
    { returnDocument: "after" },
  );

  if (!addedReview)
    throw `Error: Could not add review '${reviewID}' to restaurant ${restaurantID}!`;

  return { added: true };
};

/**
 * Removes a user review reference ID from the specified restaurant's user reviews.
 * @param {string} restaurantID - The ID of the restaurant to remove the review ID from.
 * @param {string} reviewID - The ID of the review to remove.
 * @returns {Promise<object>} An object with the field deleted to indicte success.
 */
export const removeReviewReference = async (restaurantID, reviewID) => {
  restaurantID = helpers.checkId(restaurantID, "restaurantID");
  reviewID = helpers.checkId(reviewID, "reviewID");

  const restaurantCollection = await restaurants();

  const deletedReview = await restaurantCollection.findOneAndUpdate(
    { _id: new ObjectId(restaurantID) },
    { $pull: { userReviews: reviewID } },
    { returnDocument: "after" },
  );

  if (!deletedReview)
    throw `Error: Could not remove review '${reviewID}' to restaurant ${restaurantID}!`;

  return { deleted: true };
};

/**
 * Adds a user comment reference ID to the specified restaurant's user comments.
 * @param {string} restaurantID - The ID of the restaurant to add the comment ID to.
 * @param {string} commentID - The ID of the comment to add.
 * @returns {Promise<object>} An object with the field added to indicte success.
 */
export const addCommentReference = async (restaurantID, commentID) => {
  restaurantID = helpers.checkId(restaurantID, "restaurantID");
  commentID = helpers.checkId(commentID, "commentID");

  const restaurant = await getRestaurantById(restaurantID);
  let commentExists = false;
  for (let i = 0; i < restaurant.userComments.length; i++) {
    if (restaurant.userComments[i] === commentID) commentExists = true;
  }

  if (commentExists)
    throw `Error: A comment with that id has already been added!`;

  const restaurantCollection = await restaurants();

  const addedComment = await restaurantCollection.findOneAndUpdate(
    { _id: new ObjectId(restaurantID) },
    { $push: { userComments: commentID } },
    { returnDocument: "after" },
  );

  if (!addedComment)
    throw `Error: Could not add comment '${commentID}' to restaurant ${restaurantID}!`;

  return { added: true };
};

/**
 * Removes a user comment reference ID from the specified restaurant's user comments.
 * @param {string} restaurantID - The ID of the restaurant to remove the comment ID from.
 * @param {string} commentID - The ID of the comment to remove.
 * @returns {Promise<object>} An object with the field deleted to indicte success.
 */
export const removeCommentReference = async (restaurantID, commentID) => {
  restaurantID = helpers.checkId(restaurantID, "restaurantID");
  commentID = helpers.checkId(commentID, "commentID");

  const restaurantCollection = await restaurants();

  const deletedComment = await restaurantCollection.findOneAndUpdate(
    { _id: new ObjectId(restaurantID) },
    { $pull: { userComments: commentID } },
    { returnDocument: "after" },
  );

  if (!deletedComment)
    throw `Error: Could not remove comment '${commentID}' to restaurant ${restaurantID}!`;

  return { deleted: true };
};

/**
 * Updates given fields for the given restaurant id.
 * @param {string} restaurantID - The ID of the restaurant to update.
 * @param {object} updateObject - An object containing fields to update (valid fields are name, boro, address, phone, and cuisine).
 * @returns {Promise<object>} The entire object of the restaurant updated.
 */
export const patchRestaurant = async (restaurantID, updateObject) => {
  restaurantID = helpers.checkId(restaurantID, "restaurantID");

  if (!updateObject) throw "Error: updateObject is missing!";
  if (typeof updateObject !== "object")
    throw `Error: updateObject must an object!`;
  const objectKeys = Object.keys(updateObject);

  if (objectKeys.length === 0) throw `Error: updateObject cannot be empty!`;

  const validFields = ["name", "boro", "address", "phone", "cuisine"];
  const validAddressFields = ["building", "street", "zip"];

  for (let i = 0; i < objectKeys.length; i++) {
    if (validFields.indexOf(objectKeys[i]) === -1)
      throw `updateObject contains invalid field ${objectKeys[i]}!`;
  }

  let addressObjectKeys = [];
  if (updateObject.address) {
    addressObjectKeys = Object.keys(updateObject.address);
  }

  for (let i = 0; i < addressObjectKeys.length; i++) {
    if (validAddressFields.indexOf(addressObjectKeys[i]) === -1)
      throw `updateObject contains invalid field ${addressObjectKeys[i]}!`;
  }

  // update given properties
  let updatedInfo = {};

  // name
  if (updateObject.name) {
    let name = updateObject.name;
    if (typeof name !== "string") throw "Error: name must be type string!";

    name = name.trim();
    if (name.length < 2 || name.length > 35) {
      throw "Error: name has invalid length!";
    }

    updatedInfo.name = name;
  }

  // boro
  if (updateObject.boro) {
    let boro = helpers.checkBoro(updateObject.boro);
    updatedInfo.boro = boro;
  }

  // phone
  if (updateObject.phone) {
    let phone = helpers.checkPhoneNumber(updateObject.phone);
    updatedInfo.phone = phone;
  }

  // cuisine
  if (updateObject.cuisine) {
    let cuisine = updateObject.cuisine;
    if (typeof cuisine !== "string")
      throw "Error: cuisine must be type string!";

    cuisine = cuisine.trim().toLowerCase();
    if (cuisine.length < 3 || cuisine.length > 15)
      throw "Error: cuisine has invalid length!";
    updatedInfo.cuisine = cuisine;
  }

  if (updateObject.address) {
    updatedInfo.address = {};
    // building
    if (updateObject.address.building) {
      let building = updateObject.address.building;
      if (typeof building !== "string")
        throw "Error: building must be type string!";

      building = building.trim();
      if (building.length < 1 || building.length > 10)
        throw "Error: building has invalid length!";

      updatedInfo.address.building = building;
    }

    // street
    if (updateObject.address.street) {
      let street = updateObject.address.street;
      if (typeof street !== "string")
        throw "Error: street must be type string!";

      street = street.trim();
      if (street.length < 3 || street.length > 45)
        throw "Error: street has invalid length!";
      updatedInfo.address.street = street;
    }

    // zip
    if (updateObject.address.zip) {
      let zip = helpers.checkZipCode(updateObject.address.zip);
      updatedInfo.address.zip = zip;
    }
  }

  const restaurantCollection = await restaurants();
  const updatedRestaurant = await restaurantCollection.findOneAndUpdate(
    { _id: new ObjectId(restaurantID) },
    { $set: updatedInfo },
    { returnDocument: "after" },
  );

  if (!updatedRestaurant)
    throw `Error: Update failed! Could not find restaurant with id '${restaurantID}'!`;
  return updatedRestaurant;
};

/**
 * Removes the restaurant of given id.
 * @param {string} id - The ID of the restaurant to remove.
 * @returns {Promise<object>} An object with the removed restaurant's name and field confirming the delection was successful.
 */
export const removeRestaurant = async (id) => {
  id = helpers.checkId(id, "id");

  const restaurantCollection = await restaurants();
  const deletedRestaurant = await restaurantCollection.findOneAndDelete({
    _id: new ObjectId(id),
  });

  if (!deletedRestaurant)
    throw `Error: Could not delete restaurant with id '${id}'!`;
  return { name: deletedRestaurant.name, deleted: true };
};

/**
 * Searches the database for restaurant's matching the given arguments. Minor spelling mistakes are allowed. If only
 * blank arguments are given, all restaurant in the database are returned.
 * @param {string} name - The name of the restaurant(s) to search for (optional).
 * @param {string} boro - The boro location of the restaurant(s) to search for (optional).
 * @param {string} cuisine - The cuisine type of the restaurant(s) to search for (optional).
 * @returns {Promise<array>} An array with the restaurant's found using the specified arguments. The array contains the
 * restaurant ID, name, boro, and cuisine type.
 */
export const search = async (name = "", boro = "", cuisine = "") => {
  if (typeof name !== "string") throw "Errow: name must be type string!";
  if (typeof boro !== "string") throw "Errow: boro must be type string!";
  if (typeof cuisine !== "string") throw "Errow: cuisine must be type string!";

  name = name.trim();
  boro = boro.trim();
  cuisine = cuisine.trim().toLowerCase();

  let restaurants = await getAllRestaurants();

  if (boro !== "") {
    boro = helpers.checkBoro(boro);
    restaurants = restaurants.filter((restaurant) => restaurant.boro === boro);
  }

  if (name !== "") {
    const fuse = new Fuse(restaurants, {
      keys: ["name"],
      threshold: 0.4,
    });

    const searchResults = fuse.search(name);

    restaurants = searchResults.map((restaurant) => restaurant.item);
  }

  if (cuisine !== "") {
    const fuse = new Fuse(restaurants, {
      keys: ["cuisine"],
      threshold: 0.4,
    });

    const searchResults = fuse.search(cuisine);

    restaurants = searchResults.map((restaurant) => restaurant.item);
  }

  return restaurants;
};
