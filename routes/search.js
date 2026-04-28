import { Router } from "express";
import helpers from "../helpers.js";
import * as restaurants from "../data/restaurants.js";
import { loginGuard } from "../middleware.js";
import { CursorTimeoutMode } from "mongodb";

const router = Router();

router.route("/home").get(loginGuard, async (req, res) => {
  return res.render("home", { title: "Restaurant Search" });
});

// Changed the default page when not signed in, into a advertising landing page for Delicacy
router.route("/").get(async (req, res) => {
  if (req.session.user) {
    return res.redirect("/home"); // if logged in, go straight home
  }
  return res.render("landing", { title: "Delicacy Restaurant Review App" });
});

router.route("/searchResults").post(loginGuard, async (req, res) => {
  let info = req.body;
  let name;
  let boro;
  let cuisine;

  if (info.name) {
    name = info.name.trim();
  } else {
    name = "";
  }

  if (info.boro === "select") {
    boro = "";
  } else {
    try {
      boro = helpers.checkBoro(info.boro);
    } catch (e) {
      return res.status(400).render("error", {
        errorClass: "error",
        error: "Invalid Borough Location!",
      });
    }
  }

  if (info.cuisine) {
    cuisine = info.cuisine.trim();
  } else {
    cuisine = "";
  }

  if (name === "" && boro === "" && cuisine === "") {
    return res.status(400).render("error", {
      errorClass: "error",
      error: "You must supply a search term!",
    });
  }

  try {
    const data = await restaurants.search(name, boro, cuisine);
    console.log(data);
    return res.render("searchResults", {
      title: "Restaurants Found",
      name: name,
      boro: boro,
      cuisine: cuisine,
      restaurantsData: data,
    });
  } catch (e) {
    return res
      .status(404)
      .render("error", { errorClass: "restaurant-not-found", error: e });
  }
});

export default router;
