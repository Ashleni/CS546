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
  checkZipCode(zip)
  checkPhoneNumber(phone)

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

  currDate() {
    let today = new Date();

    let mm = today.getMonth() + 1;
    let dd = today.getDate();
    let yyyy = today.getFullYear();

    mm = mm < 10 ? "0" + mm : mm;
    dd = dd < 10 ? "0" + dd : dd;

    return `${mm}/${dd}/${yyyy}`;
  },

  checkMessage(message) {
    if (!message) {
      throw "message parameter needs to have valid value";
    }

    if (typeof message != "string") {
      throw "message parameter must be string";
    }

    message = message.trim();

    if (message.length == 0) {
      throw "message must not be empty";
    }

    let repeatingChar = null;
    let occurance = 1;

    for (let i = 0; i < message.length - 1; i++) {
      let currChar = message[i];
      let nextChar = message[i + 1];
      if (currChar == repeatingChar) {
        occurance += 1;
        if (occurance == 5) {
          throw "message parameter repeats the same character >= 5 times";
        }
      } else if (currChar == nextChar && currChar != repeatingChar) {
        repeatingChar = currChar;
        occurance = 2;
      } else occurance = 1;
    }

    return message;
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

  checkZipCode(zip) {
    if (typeof zip !== "string") throw "Error: zip must be type string!";

    zip = zip.trim();
    if (zip.length !== 5) throw "Error: zip has invalid length!";

    // check for valid zip format
    const validNums = "0123456789";
    for (let i = 0; i < zip.length; i++) {
      if (!validNums.includes(zip[i]))
        throw "Error: zip must only contain numbers!";
    }

    return zip;
  },

  checkPhoneNumber(phone) {
    if (typeof phone !== "string") throw "Error: phone must be type string!";

    phone = phone.trim();
    if (phone.length !== 10) throw "Error: phone must be 10 digits!";

    // check for numbers only
    const validNums = "0123456789";
    for (let i = 0; i < phone.length; i++) {
      if (!validNums.includes(phone[i]))
        throw "Error: phone must only contain numbers!";
    }
  },

  checkDate(date, variableName) {
    if (typeof date !== "string")
      throw `Error: ${variableName} must be type string!`;
    date = date.trim();

    if (date.length !== 10 || date[2] !== "/" || date[5] !== "/") {
      throw `'${variableName}' has invalid format!`;
    }

    const validMonths = [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
      "10",
      "11",
      "12",
    ];

    const month = date.substring(0, 2);
    if (validMonths.indexOf(month) === -1) {
      throw `'${variableName}' is an invalid date!`;
    }

    const days31 = ["01", "03", "05", "07", "08", "10", "12"];

    const year = Number(date.substring(6));
    const day = Number(date.substring(3, 5));
    if (isNaN(year) || isNaN(day))
      throw `'${variableName}' is an invalid date!`;

    if (month === "02") {
      if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
        // leap year
        if (day < 1 || day > 29) throw `'${variableName}' is an invalid date!`;
      } else {
        if (day < 1 || day > 28) throw `'${variableName}' is an invalid date!`;
      }
    }

    if (days31.indexOf(month) !== -1) {
      if (day < 1 || day > 31) throw `'${variableName}' is an invalid date!`;
    } else {
      if (day < 1 || day > 30) throw `'${variableName}' is an invalid date!`;
    }

    return date;
  },

  checkPassword(s, varName) {
    s = this.checkString(s, varName);
    if (s.length < 8)
      throw `Error: '${varName}' must be at least 8 characters!`;
    const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "1234567890";
    let containsUpper = false;
    let conatinsNumber = false;
    let containsSpecial = false;

    for (let i = 0; i < s.length; i++) {
      if (s[i] === " ") throw `Error: '${varName}' cannot contain a space!`;
      if (!containsUpper && uppercaseLetters.includes(s[i])) {
        containsUpper = true;
        continue;
      }
      if (uppercaseLetters.toLowerCase().includes(s[i])) continue;
      if (!conatinsNumber && numbers.includes(s[i])) {
        conatinsNumber = true;
        continue;
      }
      if (!containsSpecial) {
        containsSpecial = true;
        continue;
      }
    }

    if (!(containsSpecial && conatinsNumber && containsUpper))
      throw `Error: '${varName}' must have at least one number, one uppercase letter, and one special character!`;

    return s;
  },
};

export default exportedMethods;
