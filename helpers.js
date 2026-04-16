import bcrypt from "bcrypt";

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
    
    mm = mm < 10 ? '0' + mm : mm;
    dd = dd < 10 ? '0' + dd : dd;
    
    return `${mm}/${dd}/${yyyy}`;
  },

  checkMessage(message) {
    if (!message) {
    throw 'message parameter needs to have valid value';
    }

    if (typeof message != 'string') {
    throw 'message parameter must be string';
    }

    message = message.trim();

    if (message.length == 0){
        throw 'message must not be empty';
    }

    let repeatingChar = null;
    let occurance = 1;

    for (let i = 0; i < message.length-1; i++) {
        let currChar = message[i];
        let nextChar = message[i+1];
        if (currChar == repeatingChar) {       
            occurance += 1;
            if (occurance == 5) {
                throw 'message parameter repeats the same character >= 5 times';
            }
        }
        else if (currChar == nextChar && currChar != repeatingChar) {
            repeatingChar = currChar;
            occurance = 2;
        }
        else occurance = 1;
    }

    return message;
  },

  checkString(strVal, varName) {
    if (!strVal) throw `Error: You must supply a ${varName}!`;
    if (typeof strVal !== 'string') throw `Error: ${varName} must be a string!`;
    strVal = strVal.trim();
    if (strVal.length === 0)
      throw `Error: ${varName} cannot be an empty string or string with just spaces`;
    if (!isNaN(strVal))
      throw `Error: ${strVal} is not a valid value for ${varName} as it only contains digits`;
    return strVal;
  },
};

export default exportedMethods;
