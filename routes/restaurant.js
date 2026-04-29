import { Router } from "express";
import * as restaurants from "../data/restaurants.js";
const router = Router();
import { loginGuard } from "../middleware.js";
import helpers from "../helpers.js";
import { getCommentsByRestaurant, createComment } from "../data/comments.js";
import { getReviewsByRestaurant } from "../data/reviews.js";
import userData from "../data/users.js";

router.route("/restaurant/:id").get(loginGuard, async (req, res) => {
  let id;
  try {
    id = helpers.checkId(req.params.id, "Restaurant ID");
  } catch (e) {
    return res
      .status(404)
      .render("error", { errorClass: "error", error: "Invalid Restaurant ID" });
  }

  try {
    const data = await restaurants.getRestaurantById(id);
    data.inspections.sort((a, b) => {
      return new Date(b.inspectionDate) - new Date(a.inspectionDate);
    });

    let isAdmin = false;
    if (req.session.user.role.toLowerCase() === "admin") isAdmin = true;
    console.log(data);

    // aggregate review information
    let sumReviews = 0;
    let avgRating = "";

    try {
      const reviewData = await getReviewsByRestaurant(id);

      if (reviewData.length > 0) {
        let numReviews = 0;
        for (let i = 0; i < reviewData.length; i++) {
          sumReviews += reviewData[i].rating;
          numReviews++;
        }
        avgRating = (sumReviews / numReviews).toFixed(1);
      }
    } catch (e) {
      avgRating = "";
    }

    // fetch comments
    let commentData;
    let commentCount = 0;
    try {
      commentData = await getCommentsByRestaurant(id);
      commentData.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });

      commentCount = commentData.length;
    } catch (e) {
      commentData = [];
    }

    // is user following?
    const userInfo = await userData.getUserById(req.session.user._id);
    let userIsFollowing = false;
    let following = [
      ...userInfo.publicFollowingRestaurants,
      ...userInfo.privateFollowingRestaurants,
    ].map((id) => id.toString());
    if (following.includes(id)) userIsFollowing = true;

    return res.render("restaurant", {
      title: data.name,
      restaurant: data,
      userIsFollowing: userIsFollowing,
      isAdmin: isAdmin,
      avgRating: avgRating,
      comments: commentData,
      commentCount: commentCount,
    });
  } catch (e) {
    return res.status(404).render("error", { errorClass: "error", error: e });
  }
});

router.route("/restaurant/:id/comment").post(async (req, res) => {
  let restaurantId;
  let userId;
  let message;

  try {
    restaurantId = helpers.checkId(req.params.id, "restaurantId");
    userId = helpers.checkId(req.session.user._id, "userId");
    message = helpers.checkMessage(req.body.message);
  } catch (e) {
    return res.status(404).render("error", { errorClass: "error", error: e });
  }

  try {
    const comment = await createComment(userId, restaurantId, message);
  } catch (e) {
    return res.status(404).render("error", { errorClass: "error", error: e });
  }

  return res.redirect(`/restaurant/${restaurantId}`);
});

export default router;
