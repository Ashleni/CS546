import { Router } from "express";
import helpers from "../helpers.js";
const router = Router();
import { users } from "../config/mongoCollections.js";
import userData from "../data/users.js";
import { signinGuard} from "../middleware.js";


router
  .route("/register")
  .get(signinGuard, async (req, res) => {
      return res.render("register", { title: "Registration Page" });
      
  })
  .post(async (req, res) => {
    let registerInfo = req.body;

    // first name
    if (registerInfo.firstName) {
      try {
        registerInfo.firstName = helpers.checkName(
          registerInfo.firstName,
          "firstName",
        );
      } catch (e) {
        return res.status(400).render("register", {
          error: "First Name is invalid!",
          title: "Registration Page",
        });
      }
    } else {
      return res.status(400).render("register", {
        error: "First Name is missing!",
        title: "Registration Page",
      });
    }

    // last name
    if (registerInfo.lastName) {
      try {
        registerInfo.lastName = helpers.checkName(
          registerInfo.lastName,
          "lastName",
        );
      } catch (e) {
        return res.status(400).render("register", {
          error: "Last Name is invalid!",
          title: "Registration Page",
        });
      }
    } else {
      return res.status(400).render("register", {
        error: "Last Name is missing!",
        title: "Registration Page",
      });
    }

    const usersCollection = await users();

    // username
    if (registerInfo.username) {
      try {
        registerInfo.username = helpers.checkUsername(registerInfo.username);
      } catch (e) {
        return res.status(400).render("register", {
          error: "Username is invalid!",
          title: "Registration Page",
        });
      }

      // check if username is a duplicate
      const user = await usersCollection.findOne({
        username: registerInfo.username,
      });
      if (user)
        return res.status(400).render("register", {
          error: "Username is already in use!",
          title: "Registration Page",
        });
    } else {
      return res.status(400).render("register", {
        error: "Username is missing!",
        title: "Registration Page",
      });
    }

    // password
    if (registerInfo.password) {
      try {
        registerInfo.password = helpers.checkPassword(
          registerInfo.password,
          "password",
        );
      } catch (e) {
        return res.status(400).render("register", {
          error: e,
          title: "Registration Page",
        });
      }
    } else {
      return res.status(400).render("register", {
        error: "Password is missing!",
        title: "Registration Page",
      });
    }

    // confirm password
    if (registerInfo.confirmPassword) {
      if (registerInfo.confirmPassword !== registerInfo.password)
        return res.status(400).render("register", {
          error: "Passwords do not match!",
          title: "Registration Page",
        });
    } else {
      return res.status(400).render("register", {
        error: "Confirm Password is missing!",
        title: "Registration Page",
      });
    }

    // account type
    if (registerInfo.role) {
      try {
        registerInfo.role = helpers.checkRole(registerInfo.role);
      } catch (e) {
        return res.status(400).render("register", {
          error: "Account Type is invalid!",
          title: "Registration Page",
        });
      }
    } else {
      return res.status(400).render("register", {
        error: "Account Type is missing!",
        title: "Registration Page",
      });
    }

    let confirmation;
    try {
      confirmation = await userData.addUser(
        registerInfo.firstName,
        registerInfo.lastName,
        registerInfo.username,
        registerInfo.password,
        registerInfo.role,
      );
    } catch (e) {
      return res
        .status(400)
        .render("register", { error: e, title: "Registration Page" });
    }

    if (confirmation.userCreated === true) {
      return res.status(200).redirect("/signin");
    } else {
      return res.status(500).render("register", {
        error: "Internal Server Error",
        title: "Registration Page",
      });
    }
  });

router
  .route("/signin")
  .get(signinGuard, async (req, res) => {
    return res.render("signin", { title: "Sign-in Page" });

  })
  .post(async (req, res) => {
    let signinInfo = req.body;

    if (signinInfo.username) {
      try {
        signinInfo.username = helpers.checkUsername(signinInfo.username);
      } catch (e) {
        return res.status(400).render("signin", {
          error: "Username is invalid!",
          title: "Sign-in Page",
        });
      }
    } else {
      return res.status(400).render("signin", {
        error: "Username is missing!",
        title: "Sign-in Page",
      });
    }


    if (!signinInfo.password) {
      return res.status(400).render("signin", {
        error: "Password is missing!",
        title: "Sign-in Page",
      });
    }

    // auth here not needed anymore
    /*
    if (signinInfo.password) {
      try {
        signinInfo.password = helpers.checkPassword(
          signinInfo.password,
          "password",
        );
      } catch (e) {
        return res.status(400).render("signin", {
          error: "Password is invalid!",
          title: "Sign-in Page",
        });
      }
    } else {
      return res.status(400).render("signin", {
        error: "Password is missing!",
        title: "Sign-in Page",
      });
    }
    */

    let confirmation;

    try {
      confirmation = await userData.authenticateUser(
        signinInfo.username,
        signinInfo.password,
      );
    } catch (e) {
      return res.status(400).render("signin", {
        error: "Either the username or password is invalid!",
        title: "Sign-in Page",
      });
    }

    if (confirmation) {
      req.session.user = {
        firstName: confirmation.firstName,
        lastName: confirmation.lastName,
        username: confirmation.username,
        role: confirmation.role,
      };

      return res.status(200).redirect("/home");
    }/* else {
      return res.status(400).render("signin", {
        error: "Either the handle or password is invalid!",
        title: "Sign-in Page",
      });
    }*/
  });

router.route("/signout").get(async (req, res) => {
  req.session.destroy();
  return res.status(200).render("signout", { title: "Signout Page" });
});

export default router;
