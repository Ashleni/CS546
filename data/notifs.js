import { ObjectId } from "mongodb";
import { users, reviews, restaurants } from "../config/mongoCollections.js"
import helpers from "../helpers.js"
import { getRestaurantById } from "./restaurants.js";


export const inboxAlertGradeDrop = async (restaurantId, grade, newGrade) => {
    const restaurant = await getRestaurantById(restaurantId);

    const userCollection = await users();
    const restaurantObjectId = new ObjectId(restaurantId);

    const publicUsers = await userCollection.find({
      publicFollowingRestaurants: restaurantObjectId
    }).toArray();
    
    const privateUsers = await userCollection.find({
      privateFollowingRestaurants: restaurantObjectId
    }).toArray();
    
    let followingUsers = [...publicUsers, ...privateUsers];

    const notification = helpers.createNotification(
        "Following Restaurant Grade Dropped",
        `${restaurant.name} had a grade drop from ${grade} to ${newGrade}`
    );

    for (const user of followingUsers) {
        await userCollection.updateOne(
            { _id: user._id },
            { $push: {notifications: notification}}
        );
    }
};

export const inboxAlertReviewFlags = async (restaurantId) => {
    const restaurant = await getRestaurantById(restaurantId);
    
    const userCollection = await users();

    const reviewsCollection = await reviews();
    const reviewsList = await reviewsCollection.find({
        restaurantID: new ObjectId(restaurantId)
    }).toArray();

    let count = 0;

    let flaggedReviews = reviewsList.filter(r => r.flagged);

    // skip the rest if none
    if (flaggedReviews.length === 0) return;

    let notif = flaggedReviews.length === 1  ? `${restaurant.name} has 1 outdated review` : `${restaurant.name} has ${flaggedReviews.length} outdated reviews`;

    const notification = {
        _id: new ObjectId(),
        title: "Flagged Reviews",
        message: notif,
        snippet: notif.substring(0, 40) + "...",
        date: helpers.currDate(),
        viewed: false,
        restaurantId: restaurantId,   // stored for live lookup in inbox route
        restaurantName: restaurant.name,
    };

    // exclude messages that are the same

    await userCollection.updateMany(
    {
        role: 'admin',
        'notifications.message': { $ne: notif }
    },
    { $push: { notifications: notification } }
    );
};