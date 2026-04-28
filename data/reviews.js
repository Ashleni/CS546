import {
    reviews,
    restaurants,
  } from "../config/mongoCollections.js";
import helpers from '../helpers.js';
import { getRestaurantById } from "./restaurants.js";
import userData from "./users.js";
import { ObjectId } from "mongodb";

export const createReview = async (
    userId,
    restaurantId,
    rating
    ) => {

    userId = helpers.checkId(userId);
    restaurantId = helpers.checkId(restaurantId);
    rating = helpers.checkRating(rating);
    
    // round rating
    rating = Math.round(rating * 10) / 10;

    // throws if object doesn't exist
    const userObject = await userData.getUserById(userId);
    const restaurantObject = await getRestaurantById(restaurantId);

    let date = helpers.currDate();
   
    let newReview = {
        userID: new ObjectId(userId),
        restaurantID: new ObjectId(restaurantId),
        rating,
        date,
    };

    const reviewCollection = await reviews();

    const insertInfo = await reviewCollection.insertOne(newReview);

    if (!(insertInfo.acknowledged) || !(insertInfo.insertedId)) {
    throw 'review could not be created';
    }

    const newId = insertInfo.insertedId.toString();

    // add review to restaurant reviews
    const addedReview = await addReviewToRestaurant(restaurantId, newId)

    const reviewResult = await getReviewById(newId);

    return reviewResult;
};

export const getReviewById = async (reviewId) => {

    reviewId = helpers.checkId(reviewId);
    
    const reviewCollection = await reviews();
    
    const reviewIdResult = await reviewCollection.findOne({_id: new ObjectId(reviewId)});
    
    if (reviewIdResult === null) {
        throw 'review with that review id does not exist';
    }
    
    reviewIdResult._id = reviewIdResult._id.toString();
    
    return reviewIdResult;
};

export const getReviewsByUser = async (userId) => {
   
    userId = helpers.checkId(userId);
    
    const reviewCollection = await reviews();
    
    const reviewIdResult = await reviewCollection.find({userID: new ObjectId(userId)}).toArray();
    
    if (reviewIdResult.length === 0) {
        return [];
    }
    
    return reviewIdResult;
};

export const getReviewsByRestaurant = async (restaurantId) => {

    restaurantId = helpers.checkId(restaurantId);

    const reviewCollection = await reviews();

    const reviewIdResult = await reviewCollection.find({restaurantID: new ObjectId(restaurantId)}).toArray();

    if (reviewIdResult.length === 0) {
        throw 'Reviews with that restaurant id do not exist';
    }

    return reviewIdResult;
};

export const addReviewToRestaurant = async (restaurantId, reviewId) => {

    restaurantId = helpers.checkId(restaurantId);
    reviewId = helpers.checkId(reviewId);

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

export const patchReviewById = async (currUserId, reviewId, newRating) => {
    
    reviewId = helpers.checkId(reviewId);
    currUserId = helpers.checkId(currUserId);

    // throws if user not found
    const userObject = await userData.getUserById(currUserId);
    
    const reviewCollection = await reviews();
    const reviewIdResult = await reviewCollection.findOne({
        _id: new ObjectId(reviewId), userID: new ObjectId(currUserId)});

    if (reviewIdResult === null) {
        throw 'Review with that restaurant id does not exist';
    }

    newRating = helpers.checkRating(newRating);

    const updatedInfo = await reviewCollection.findOneAndUpdate(
        {_id: new ObjectId(reviewId)},
        {$set: {rating: newRating, date: helpers.currDate()}},
        {returnDocument: 'after'}    
    );

    if (!updatedInfo) {
        throw 'Review could not be updated';
    }
      
    updatedInfo._id = updatedInfo._id.toString();

    return updatedInfo;
};

export const removeReviewById = async (currUserId, reviewId) => {  
    reviewId = helpers.checkId(reviewId);
    currUserId = helpers.checkId(currUserId);

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

