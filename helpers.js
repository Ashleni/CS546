import bcrypt from "bcrypt";

const exportedMethods = {
  async hashPassword(password) {
    password = password.trim();

    const saltRounds = 16;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  },
};

export default exportedMethods;
