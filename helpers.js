/*
FUNCTIONS IN THIS FILE:

Validation Functions:
  checkString(strVal, varName) 
  checkId(id, varName)
  checkName(name, varName)
  checkUsername(username)
  checkEmail(email)
  checkRole(role)
  checkBoro(boro)

Utility Functions:
  hashPassword(password)

*/

import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

const exportedMethods = {
  async hashPassword(password) {
    password = password.trim();

    const saltRounds = 16;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  },

  checkString(strVal, varName) {
    if (!strVal) throw `Error: You must supply a ${varName}!`;
    if (typeof strVal !== "string") throw `Error: ${varName} must be a string!`;
    strVal = strVal.trim();
    if (strVal.length === 0)
      throw `Error: ${varName} cannot be an empty string or string with just spaces`;
    if (!isNaN(strVal))
      throw `Error: ${strVal} is not a valid value for ${varName} as it only contains digits`;
    return strVal;
  },

  // from Lecture 6.
  checkId(id, varName) {
    if (!id) {
      throw `Error: You must provide a ${varName}`;
    }
    if (typeof id !== "string") {
      throw `Error:${varName} must be a string`;
    }
    id = id.trim();
    if (id.length === 0) {
      throw `Error: ${varName} cannot be an empty string or just spaces`;
    }
    if (!ObjectId.isValid(id)) {
      throw `Error: ${varName} invalid object ID`;
    }
    return id;
  },

  checkName(name, varName) {
    name = this.checkString(name, varName);
    let nameRegex = /^[A-Za-z'-]{1,50}$/; // Taken from https://www.sitepoint.com/using-regular-expressions-to-check-string-length/
    if (!nameRegex.test(name)) {
      throw `Error: ${varName} must be 1-50 characters and contain only alphabetic characters, hyphens, or apostrophes`;
    }
    return name;
  },

  checkUsername(username) {
    username = this.checkString(username, "Username");
    let usernameRegex = /^[A-Za-z0-9_.]{3,30}$/; // Taken from https://www.sitepoint.com/using-regular-expressions-to-check-string-length/
    if (!usernameRegex.test(username)) {
      throw `Error: Username must be 3-30 characters and can only contain alphanumeric characters, underscores, or periods`;
    }
    return username.toLowerCase();
  },

  checkEmail(email) {
    email = this.checkString(email, "Email");
    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Taken from https://learn.microsoft.com/en-us/dotnet/standard/base-types/how-to-verify-that-strings-are-in-valid-email-format
    if (!emailRegex.test(email)) {
      throw `Error: Email must be a valid email address`;
    }
    return email.toLowerCase();
  },

  checkRole(role) {
    role = this.checkString(role, "Role").toLowerCase();
    if (role !== "admin" && role !== "user") {
      throw `Error: Role must be either "admin" or "user"`;
    }
    return role;
  },

  checkBoro(boro) {
    if (typeof boro !== "string") throw "Error: boro must be type string!";

    const validBoros = [
      "manhattan",
      "bronx",
      "brooklyn",
      "queens",
      "staten island",
    ];

    boro = boro.trim().toLowerCase();
    if (!validBoros.includes(boro)) throw "Error: Invalid boro!";

    return boro;
  },
};

export default exportedMethods;
