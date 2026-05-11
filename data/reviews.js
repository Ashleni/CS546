import {
    reviews,
    restaurants,
    users,
  } from "../config/mongoCollections.js";
import helpers from '../helpers.js';
import { getRestaurantById } from "./restaurants.js";
import userData from "./users.js";
import { ObjectId } from "mongodb";

// we may want to change these or add more questions. 
export const SURVEY_QUESTIONS = [
  {
    key: "diningAreaCleanliness", 
    label: "How would you rate the cleanliness of the dining area?", 
    type: "scale",
    isScale: true, 
    isChoice: false,  
    options: [ 
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3", label: "3" }, 
      { value: "4", label: "4" },
      { value: "5", label: "5" }, 
    ],
  },

  { 
    key:  "restroomCleanliness",
    label:  "How would you rate the cleanliness of the restrooms?",
    type: "scale",
    isScale: true, 
    isChoice: false,  
    options: [ 
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3", label: "3" }, 
      { value: "4", label: "4" },
      { value: "5", label: "5" }, 
    ],
  },

  {
    key:  "staffHygiene",
    label: "How would you rate the overall hygiene of the staff?",
    type: "scale",
    isScale: true, 
    isChoice: false,  
    options: [ 
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3", label: "3" }, 
      { value: "4", label: "4" },
      { value: "5", label: "5" }, 
    ],
  },

  {
    key:  "overallExperience", 
    label:  "How would you rate your overall dining experience?", 
    type: "scale", 
    isScale: true, 
    isChoice: false,  
    options: [ 
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3", label: "3" }, 
      { value: "4", label: "4" },
      { value: "5", label: "5" }, 
    ],
  }, 

  {
    key: "foodHandlingPractices", 
    label: "Were proper food-handling practices observed (gloves, hair nets, etc.)?", 
    type: "choice", 
    isScale: false,
    isChoice: true,
    options: [
      { value: "yes",label: "Yes"}, 
      { value: "no",label: "No"}, 
      { value: "not_observed", label: "Didn't notice" },
    ],
  },

  {
    key: "foodTemperature",
    label: "Was food served at the appropriate temperature?",
    type: "choice", 
    isScale: false,
    isChoice: true,
    options: [
      { value: "yes",label: "Yes"},  
      { value: "no",label: "No"}, 
      { value: "unsure", label: "Unsure" }, 
    ],
  },

  {
    key: "pestSighting", 
    label: "Did you notice any signs of pests or infestation?", 
    type: "choice", 
    isScale: false,
    isChoice: true,
    options: [
      { value: "yes", label: "Yes"},
      { value: "no",  label: "No"},
    ],
  },
];



export const validateSurvey = (body) => {
  let survey = {};
  for (let question of SURVEY_QUESTIONS) {
    let answer = body[question.key];

    if (
      answer === undefined || answer === null ||String(answer).trim() === "" ) {
      throw `Survey question "${question.label}" is required.`; 
    } 

    // Handle scale questions
    if (question.type === "scale") { 
      let numberAnswer = Number(answer); 

      let isWholeNumber = Number.isInteger(numberAnswer); 
      let isInRange = numberAnswer >= 1 && numberAnswer <= 5;
 
      if (!isWholeNumber || !isInRange) {
        throw `Survey answer for "${question.label}" must be a whole number between 1 and 5.`; 
      } 
 
      survey[question.key] = numberAnswer; 
    }  
 
    // Handle multiple choice questions
    else {
      let isValidOption = false; 
  
      for (let option of question.options) {
        if (String(answer) === option.value) {
          isValidOption = true; 
          break;
        } 
      }

      if (!isValidOption) {
        throw `Invalid answer for "${question.label}".`;
      }

      survey[question.key] = String(answer);
    }
  }

  return survey;
};
 
export const createReview = async (
    userId,
    restaurantId,
    rating,
    reviewText,
    survey,     
    photos     
    ) => {

    userId = helpers.checkId(userId, "userId");
    restaurantId = helpers.checkId(restaurantId, "restaurantId");
    rating = helpers.checkRating(rating);
    
    // round rating
    rating = Math.round(rating * 10) / 10;

    if (!reviewText || typeof reviewText !== "string" || reviewText.trim().length === 0) {
        throw "Review text is required.";
    }
    reviewText = reviewText.trim();

    
    const serialisedPhotos = (photos || []).map((p) => ({
        data: Buffer.isBuffer(p.data) ? p.data.toString("base64") : p.data,
        mimetype: p.mimetype,
    }));

    // throws if object doesn't exist
    const userObject = await userData.getUserById(userId);
    const restaurantObject = await getRestaurantById(restaurantId);

    let date = helpers.currDate();
   
    let currGrade = null;
    let inspections = restaurantObject.inspections;
    if (inspections.length > 0) {
      currGrade = inspections[inspections.length - 1].grade;
    }

    let newReview = {
        userID:new ObjectId(userId),
        username:userObject.username,
        restaurantID: new ObjectId(restaurantId),
        rating,
        reviewText,
        survey,
        photos: serialisedPhotos,
        date,
        edited: false,
        flagged: false,
        currRestaurantGrade: currGrade,
        upvotes: [],
        downvotes: [],
    };

    const reviewCollection = await reviews();

    const insertInfo = await reviewCollection.insertOne(newReview);

    if (!(insertInfo.acknowledged) || !(insertInfo.insertedId)) {
    throw 'review could not be created';
    }

    const newId = insertInfo.insertedId.toString();
    const addedReview = await addReviewToRestaurant(restaurantId, newId);
    const userCollection = await users();
    await userCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $push: { reviewsCompleted: new ObjectId(newId) } }
    );
    const reviewResult = await getReviewById(newId);
    return reviewResult;
};

export const getReviewById = async (reviewId) => {

    reviewId = helpers.checkId(reviewId, "reviewId");
    
    const reviewCollection = await reviews();
    
    const reviewIdResult = await reviewCollection.findOne({_id: new ObjectId(reviewId)});
    
    if (reviewIdResult === null) {
        throw 'review with that review id does not exist';
    }
    
    reviewIdResult._id = reviewIdResult._id.toString();
    
    return reviewIdResult;
};

export const getReviewsByUser = async (userId) => {
   
    userId = helpers.checkId(userId, "userId");
    
    const reviewCollection = await reviews();
    
    const reviewIdResult = await reviewCollection.find({userID: new ObjectId(userId)}).toArray();
    
    if (reviewIdResult.length === 0) {
        return [];
    }
    
    return reviewIdResult;
};

export const getReviewsByRestaurant = async (restaurantId) => {

    restaurantId = helpers.checkId(restaurantId, "restaurantId");

    const reviewCollection = await reviews();

    const reviewIdResult = await reviewCollection.find({restaurantID: new ObjectId(restaurantId)}).toArray();

    if (reviewIdResult.length === 0) {
        return [];
    }

    return reviewIdResult;
};

export const addReviewToRestaurant = async (restaurantId, reviewId) => {

    restaurantId = helpers.checkId(restaurantId, "restaurantId");
    reviewId = helpers.checkId(reviewId,"reviewId");

    const reviewCollection = await reviews();
    const restaurantCollection = await restaurants();

    // throws if not found
    const reviewIdResult = await reviewCollection.findOne({_id: new ObjectId(reviewId)});

    const restaurantIdResult = await restaurantCollection.findOne({_id: new ObjectId(restaurantId)});

    if (reviewIdResult === null) {
        throw 'Review with that review id does not exist';
    }

    if (restaurantIdResult === null) {
        throw 'Restaurant with that restaurant id does not exist';
    }

    const updatedInfo = await restaurantCollection.findOneAndUpdate(
        {_id: new ObjectId(restaurantId)},
        { $push: { userReviews: reviewId } },
        { returnDocument: 'after' }    
    );

    if (!updatedInfo) {
        throw 'New review could not be added';
    }
    
    updatedInfo._id = updatedInfo._id.toString();

    return updatedInfo;
};

export const patchReviewById = async (
    currUserId,
    reviewId,
    newRating,
    newReviewText,
    newSurvey,
    newPhotos
    ) => {

    reviewId = helpers.checkId(reviewId,"reviewId");
    currUserId = helpers.checkId(currUserId,"currUserId"); 

    // throws if user not found
    const userObject = await userData.getUserById(currUserId);
    
    const reviewCollection = await reviews();
    const reviewIdResult = await reviewCollection.findOne({
        _id: new ObjectId(reviewId), userID: new ObjectId(currUserId)});

    if (reviewIdResult === null) {
        throw 'Review with that restaurant id does not exist';
    }


    let updateFields = { date: helpers.currDate(), edited: true };

    if (newRating !== undefined) {
        newRating = helpers.checkRating(newRating);
        updateFields.rating = Math.round(newRating * 10) / 10;
    }

    if (newReviewText !== undefined) {
        if (typeof newReviewText !== "string" || newReviewText.trim().length === 0) {
            throw "Review text cannot be empty.";
        }
        updateFields.reviewText = newReviewText.trim();
    }

    if (newSurvey !== undefined) {
        updateFields.survey = newSurvey;
    }

    if (newPhotos !== undefined) {
        updateFields.photos = (newPhotos).map((p) => ({
            data: Buffer.isBuffer(p.data) ? p.data.toString("base64") : p.data,
            mimetype: p.mimetype,
        }));
    }

    let updatedInfo = await reviewCollection.findOneAndUpdate(
        { _id: new ObjectId(reviewId) },
        { $set: updateFields },
        { returnDocument: "after" }
    );

    if (!updatedInfo) {
        throw "Review could not be updated.";
    }
    updatedInfo._id = updatedInfo._id.toString();
    return updatedInfo;
};

export const removeReviewById = async (currUserId, reviewId) => {  
    reviewId = helpers.checkId(reviewId,"reviewId");
    currUserId = helpers.checkId(currUserId,"currUserId");

    // throws if user not found
    const userObject = await userData.getUserById(currUserId);
  
    // throws if review doesn't exist
    const reviewCollection = await reviews();
    const restaurantCollection = await restaurants();
  
    const deletionInfo = await reviewCollection.findOneAndDelete({
        _id: new ObjectId(reviewId), userID: new ObjectId(currUserId)}
    );

    if (!deletionInfo) {
      throw `Could not delete review with review id of ${reviewId}`;
    }

    const deleteReviewInRestaurant = await restaurantCollection.updateOne({
        _id: deletionInfo.restaurantID }, { $pull: { userReviews: reviewId} });    
  
    return {_id: deletionInfo._id.toString(), deleted: true};
};

export const voteOnReview = async (reviewId, votingUserId, voteType) => {
  reviewId = helpers.checkId(reviewId, "reviewId");
  votingUserId = helpers.checkId(votingUserId, "votingUserId");

  if (voteType !== "upvote" && voteType !== "downvote") {
      throw "voteType must be 'upvote' or 'downvote'.";
  }

  const reviewCollection = await reviews();
  const review = await reviewCollection.findOne({ _id: new ObjectId(reviewId) });

  if (!review) throw "Review not found.";

  // Prevent the review's own author from voting
  if (review.userID.toString() === votingUserId) {
      throw "You cannot vote on your own review.";
  }

  const alreadyUpvoted  = (review.upvotes  || []).map(id => id.toString()).includes(votingUserId);
  const alreadyDownvoted = (review.downvotes || []).map(id => id.toString()).includes(votingUserId);

  let updateOp;

  if (voteType === "upvote") {
      if (alreadyUpvoted) {
          // Undo upvote
          updateOp = { $pull: { upvotes: new ObjectId(votingUserId) } };
      } else {
          // Add upvote, remove any existing downvote
          updateOp = {
              $addToSet: { upvotes: new ObjectId(votingUserId) },
              $pull:     { downvotes: new ObjectId(votingUserId) },
          };
      }
  } else {
      if (alreadyDownvoted) {
          // Undo downvote
          updateOp = { $pull: { downvotes: new ObjectId(votingUserId) } };
      } else {
          // Add downvote, remove any existing upvote
          updateOp = {
              $addToSet: { downvotes: new ObjectId(votingUserId) },
              $pull:     { upvotes:   new ObjectId(votingUserId) },
          };
      }
  }

  const updatedReview = await reviewCollection.findOneAndUpdate(
      { _id: new ObjectId(reviewId) },
      updateOp,
      { returnDocument: "after" }
  );

  if (!updatedReview) throw "Vote could not be recorded.";

  // Auto-remove if 10+ downvotes
  if ((updatedReview.downvotes || []).length >= 10) {
      const restaurantCollection = await restaurants();
      await reviewCollection.deleteOne({ _id: new ObjectId(reviewId) });
      await restaurantCollection.updateOne(
          { _id: updatedReview.restaurantID },
          { $pull: { userReviews: reviewId } }
      );
      return { deleted: true, reason: "Too many downvotes." };
  }

  return { deleted: false, upvotes: (updatedReview.upvotes || []).length, downvotes: (updatedReview.downvotes || []).length };
};

export const adminDeleteReviewById = async (reviewId) => {
  reviewId = helpers.checkId(reviewId, "reviewId");

  const reviewCollection = await reviews();
  const restaurantCollection = await restaurants();

  const deletionInfo = await reviewCollection.findOneAndDelete({
    _id: new ObjectId(reviewId),
  });

  if (!deletionInfo) {
    throw `Could not delete review with review id of ${reviewId}`;
  }

  await restaurantCollection.updateOne(
    { _id: deletionInfo.restaurantID },
    { $pull: { userReviews: reviewId } }
  );

  return {
    _id: deletionInfo._id.toString(),
    deleted: true,
    restaurantID: deletionInfo.restaurantID.toString(),
  };
};

export const flagOutdatedReviews = async (restaurantId) => {
  restaurantId = helpers.checkId(restaurantId);

  const restaurant = await getRestaurantById(restaurantId);
  
  // date of improved grade
  let gradeChangeDate = null;
  let grades = {A: 1, B: 2, C: 3};

  if (restaurant.inspections.length > 1) {
    const inspections = restaurant.inspections.sort ((a, b) => {
      a = new Date(a.inspectionDate);
      b = new Date(b.inspectionDate);

      if (b > a) return 1;
      if (b < a) return -1;
      return 0;
    });
    
    let currGrade = inspections[0].grade;
    let prevGrade = inspections[1].grade;
  
    // the value is equivalent to rank, A for 1st rank
    // save the date grade improved
    if (grades[currGrade] < grades[prevGrade]) {
      gradeChangeDate = new Date(inspections[0].inspectionDate);
    }    
  }

  // flag reviews with date before gradeChangeDate
  const currDate = new Date();
  
  const reviewCollection = await reviews();
  
  const reviewData = await reviewCollection.find({ restaurantID: new ObjectId(restaurantId) }).toArray();

  // check reviews to flag according to conditions
  for (const review of reviewData) {
    const reviewDate = new Date(review.date);
    let dateDifference = (currDate - reviewDate) / 86400000;
    let reviewFlag = false;

    // condition 1: Flag when review is old (2+ years)
    if (dateDifference > 730) reviewFlag = true;

    // condition 2: Flag when review was posted before a grade change
    if (gradeChangeDate && reviewDate < gradeChangeDate) reviewFlag = true;

    if (reviewFlag && !review.flagged) {
      await reviewCollection.updateOne({
        _id: review._id},
        { $set: {flagged: true}
      });
    }
  }
};