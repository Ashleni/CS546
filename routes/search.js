import { Router } from "express";
import helpers from "../helpers.js";
import * as restaurants from "../data/restaurants.js";
import { loginGuard } from "../middleware.js";

const router = Router();

function renderSearchError(res, view, title, status, error) {
  return res.status(status).render(view, { title, error });
}

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
      return renderSearchError(res, "home", "Restaurant Search", 400, "Invalid Borough Location!");
    }
  }

  if (info.cuisine) {
    cuisine = info.cuisine.trim();
  } else {
    cuisine = "";
  }

  if (name === "" && boro === "" && cuisine === "") {
    return renderSearchError(res, "home", "Restaurant Search", 400, "You must supply a search term!");
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
    return renderSearchError(res, "home", "Restaurant Search", 404, e);
  }
});

router.route("/searchCleanest").get(loginGuard, async (req, res) => {
  try {
    return res.render("searchCleanest", {
      title: "Search Cleanest Restaurants",
    });
  } catch (e) {
    return renderSearchError(res, "searchCleanest", "Search Cleanest Restaurants", 404, e);
  }
});

router.route("/restaurantsLeaderboard").post(loginGuard, async (req, res) => {
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
      return renderSearchError(res, "searchCleanest", "Search Cleanest Restaurants", 400, "Invalid Borough Location!");
    }
  }

  if (info.cuisine) {
    cuisine = info.cuisine.trim();
  } else {
    cuisine = "";
  }

  try {
    const data = await restaurants.getCleanestRestaurants(name, boro, cuisine);
    return res.render("cleanestRestaurants", {
      title: "Restaurants Leaderboard",
      name: name,
      boro: boro,
      cuisine: cuisine,
      restaurantsData: data,
    });
  } catch (e) {
    return renderSearchError(res, "searchCleanest", "Search Cleanest Restaurants", 404, e);
  }
});

export default router;
