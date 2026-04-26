/*
This file implements basically the same exact functions from Lecture 6's data/users.js (excluding updateUserPut).
Ref: https://github.com/stevens-cs546-cs554/CS-546/blob/master/lecture_06/intermediate_api/data/users.js 

to import: import userData from '<path>/users.js';

FUNCTIONS IN THIS FILE:

getAllUsers()

getUserById(id)

addUser(userData)

removeUser(id)

updateUserPatch(id, userInfo)

authenticateUser(username, password)

--------------------------------------

Notes:

- rigorous checking has only been implemented for firstName, lastName, username, email, role.
  Subdocuments do not have any rigorous checking yet. 


- 

*/

import { users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import exportedMethods from "../helpers.js";
import bcrypt from "bcrypt";

let userData = {
  async getAllUsers() {
    let userCollection = await users();
    let userList = await userCollection.find({}).toArray();
    return userList;
  },

  async getUserById(id) {
    id = exportedMethods.checkId(id);
    let userCollection = await users();
    let user = await userCollection.findOne({ _id: new ObjectId(id) });
    if (!user) throw "Error: User not found";
    return user;
  },

  async addUser(firstName, lastName, username, password, role) {
    let passwordHashed = await exportedMethods.hashPassword(password);

    let newUser = {
      firstName: exportedMethods.checkName(firstName, "First name"),
      lastName: exportedMethods.checkName(lastName, "Last name"),
      username: exportedMethods.checkUsername(username),
      role: exportedMethods.checkRole(role),
      passwordHashed,
      // No validation done yet for the following...
      publicFollowingRestaurants: [],
      privateFollowingRestaurants: [],
      reviewsCompleted: [],
      commentsPosted: [],
      notifications: [],
    };

    let userCollection = await users();

    // Check for duplicate usernames and emails.
    let existingUser = await userCollection.findOne({
      username: newUser.username,
    });

    if (existingUser) {
      throw "Username already exists";
    }
    //let existingEmail = await userCollection.findOne({
    //        email: newUser.email
    //});

    //if (existingEmail) {
    //        throw 'Email already exists';
    //}

    let insertInfo = await userCollection.insertOne(newUser);
    if (!insertInfo.insertedId) {
      throw "Insert failed!";
    }
    return { userCreated: true };
  },

  // I dont see a use for this right now for our app
  async removeUser(id) {
    id = exportedMethods.checkId(id);
    let userCollection = await users();
    let deletionInfo = await userCollection.findOneAndDelete({
      _id: new ObjectId(id),
    });
    if (!deletionInfo) throw `Error: Could not delete user with id of ${id}`;
    return { ...deletionInfo, deleted: true };
  },

  async authenticateUser(username, password) {
    username = exportedMethods.checkUsername(username);

    let userCollection = await users();
    let user = await userCollection.findOne({ username });
    if (!user) {
      throw "Invalid username or password";
    }

    const match = await bcrypt.compare(password, user.passwordHashed);
    if (!match) {
      throw "Invalid username or password";
    }

    return {
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role,
    };
  },

  async updateUserPatch(id, userInfo) {
    id = exportedMethods.checkId(id);
    let updateFields = {};
    let userCollection = await users();

    if (userInfo.firstName) {
      updateFields.firstName = exportedMethods.checkName(
        userInfo.firstName,
        "First name",
      );
    }
    if (userInfo.lastName) {
      updateFields.lastName = exportedMethods.checkName(
        userInfo.lastName,
        "Last name",
      );
    }
    if (userInfo.username) {
      updateFields.username = exportedMethods.checkUsername(userInfo.username);
      let existingUser = await userCollection.findOne({
        username: userInfo.username,
      });

      if (existingUser) {
        throw "Username already exists";
      }
    }
    //if (userInfo.email) {
    //    updateFields.email = exportedMethods.checkEmail(userInfo.email);
    //    let existingEmail = await userCollection.findOne({
    //            email: userInfo.email
    //    });

    //    if (existingEmail) {
    //            throw 'Email already exists';
    //    }
    //}
    if (userInfo.role) {
      updateFields.role = exportedMethods.checkRole(userInfo.role);
    }
    if (userInfo.passwordHashed) {
      updateFields.passwordHashed = exportedMethods.checkString(
        userInfo.passwordHashed,
        "Password",
      );
    }
    // No validation done yet for the following...
    if (userInfo.publicFollowingRestaurants) {
      updateFields.publicFollowingRestaurants =
        userInfo.publicFollowingRestaurants;
    }
    if (userInfo.privateFollowingRestaurants) {
      updateFields.privateFollowingRestaurants =
        userInfo.privateFollowingRestaurants;
    }
    if (userInfo.reviewsCompleted) {
      updateFields.reviewsCompleted = userInfo.reviewsCompleted;
    }
    if (userInfo.commentsPosted) {
      updateFields.commentsPosted = userInfo.commentsPosted;
    }
    if (userInfo.notifications) {
      updateFields.notifications = userInfo.notifications;
    }

    let updateInfo = await userCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: "after" },
    );

    if (!updateInfo)
      throw `Error: Update fail, Could not find a user with id of ${id}`;
    return updateInfo;
  },
};

export default userData;
