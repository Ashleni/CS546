import {
    comments,
    restaurants,
  } from "../config/mongoCollections.js";
import * as helpers from '../helpers.js';
import { getRestaurantById } from "./restaurants.js";
import userData from "./users.js";
import { ObjectId } from "mongodb";

export const createComment = async (
    userID,
    restaurantID,
    message
    ) => {

    //TODO: check message for script insertion exploit

    userID = helpers.checkId(userID);
    restaurantID = helpers.checkId(restaurantID);
    
    // throws if object doesn't exist
    const userObject = await userData.getUserById(userID);
    const restaurantObject = await getRestaurantById(restaurantID);

    message = helpers.checkMessage(message);

    let date = helpers.currDate();
   
    let replies = [];

    let edited = Boolean(false);

    let newComment = {
        userID,
        restaurantID,
        message,
        date,
        replies,
        edited
    };

    const commentCollection = await comments();

    const insertInfo = await commentCollection.insertOne(newComment);

    if (!(insertInfo.acknowledged) || !(insertInfo.insertedId)) {
    throw 'comment could not be created';
    }

    const newId = insertInfo.insertedId.toString();

    const commentResult = await getCommentById(newId);

    return commentResult;
};

export const getCommentById = async (commentId) => {

    commentId = helpers.checkId(commentId);
    
    const commentCollection = await comments();
    
    const commentIdResult = await commentCollection.findOne({_id: new ObjectId(commentId)});
    
    if (commentIdResult === null) {
        throw 'comment with that comment id does not exist';
    }
    
    commentIdResult._id = commentIdResult._id.toString();
    
    return commentIdResult;
};

export const getCommentsByUser = async (userId) => {
   
    userId = helpers.checkId(userId);
    
    const commentCollection = await comments();
    
    const commentIdResult = await commentCollection.find({userID: userId}).toArray();
    
    if (commentIdResult.length === 0) {
        throw 'Comments with that user id does not exist';
    }
    
    return commentIdResult;
};

export const getCommentsByRestaurant = async (restaurantId) => {

    restaurantId = helpers.checkId(restaurantId);

    const commentCollection = await comments();

    const commentIdResult = await commentCollection.find({restaurantID: restaurantId}).toArray();

    if (commentIdResult.length === 0) {
        throw 'Comments with that restaurant id do not exist';
    }

    return commentIdResult;
};

export const addCommentByRestaurant = async (restaurantId, commentId) => {

    restaurantId = helpers.checkId(restaurantId);
    commentId = helpers.checkId(commentId);

    const commentCollection = await comments();
    const restaurantCollection = await restaurants();

    // throws if not found
    const commentIdResult = await commentCollection.findOne({_id: new ObjectId(commentId)});

    const restaurantIdResult = await restaurantCollection.findOne({_id: new ObjectId(restaurantId)});

    if (commentIdResult === null) {
        throw 'Comment with that restaurant id does not exist';
    }

    if (restaurantIdResult === null) {
        throw 'Restaurant with that restaurant id does not exist';
    }

    const newCommentList = [...restaurantIdResult.userComments, commentId];

    const updatedInfo = await restaurantCollection.findOneAndUpdate(
        {_id: new ObjectId(restaurantId)},
        {$set: {userComments: newCommentList}},
        {returnDocument: 'after'}    
    );

    if (!updatedInfo) {
        throw 'New comment could not be added';
    }
    
    updatedInfo._id = updatedInfo._id.toString();

    return updatedInfo;
};

export const patchCommentById = async (currUserId, commentId, newMessage) => {
    
    commentId = helpers.checkId(commentId);
    currUserId = helpers.checkId(currUserId);

    // throws if user not found
    const userObject = await userData.getUserById(currUserId);
    
    const commentCollection = await comments();
    const commentIdResult = await commentCollection.findOne({
        _id: new ObjectId(commentId), userID: new ObjectId(currUserId)});

    if (commentIdResult === null) {
        throw 'Comment with that restaurant id does not exist';
    }

    newMessage = helpers.checkMessage(newMessage);

    const updatedInfo = await commentCollection.findOneAndUpdate(
        {_id: new ObjectId(commentId)},
        {$set: {message: newMessage, date: helpers.currDate(), edited: Boolean(true)}},
        {returnDocument: 'after'}    
    );

    if (!updatedInfo) {
        throw 'Comment could not be edited';
    }
      
    updatedInfo._id = updatedInfo._id.toString();

    return updatedInfo;
};

export const removeCommentById = async (currUserId, commentId) => {  
    commentId = helpers.checkId(commentId);
    currUserId = helpers.checkId(currUserId);

    // throws if user not found
    const userObject = await userData.getUserById(currUserId);
  
    // throws if comment doesn't exist
    const commentCollection = await comments();
  
    const deletionInfo = await commentCollection.findOneAndDelete({
        _id: new ObjectId(commentId), userID: new ObjectId(currUserId)}
    );
  
    if (!deletionInfo) {
      throw `Could not delete comment with comment id of ${commentId}`;
    }
    return {_id: deletionInfo._id, deleted: true};
};

