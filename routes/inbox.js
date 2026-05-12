import { Router } from "express";
import * as restaurants from "../data/restaurants.js";
const router = Router();
import { loginGuard } from "../middleware.js";
import userData from "../data/users.js";
import { getReviewsByRestaurant } from "../data/reviews.js";

router.route("/inbox").get(loginGuard, async (req, res) => {
  try {
    let user = false;
    let isAdmin = false;

    if (req.session.user) user = true;
    if (req.session.user.role.toLowerCase() === "admin") isAdmin = true;

    const userInfo = await userData.getUserById(req.session.user._id);
    let notifications = userInfo.notifications;

    if (notifications) {
      for (let i = 0; i < notifications.length; i++) {
        const message = notifications[i].message;
        const cutoff = Math.floor(message.length * 0.65);
        const snippet = message.substring(0, cutoff) + "...";
        notifications[i].snippet = snippet;
      }
    }
    else notifications = [];

    return res.render("inbox", {
      title: "Your Inbox",
      sortByUnread: false,
      notifications,
      user: req.session.user,
      isAdmin
    });
  } catch (e) {
    return res.status(404).render("error", { errorClass: "error", error: e });
  }
});
router.route("/inbox/unread").get(loginGuard, async (req, res) => {
  try {
    let user = false;
    let isAdmin = false;

    if (req.session.user) user = true;
    if (req.session.user.role.toLowerCase() === "admin") isAdmin = true;

    const userInfo = await userData.getUserById(req.session.user._id);
    let notifications = userInfo.notifications;

    let unread = [];
    if (notifications) {
      // only get unread
      for (let i = 0; i < notifications.length; i++) {
        if (notifications[i].viewed === false) {
          let message = notifications[i].message;
          let cutoff = Math.floor(message.length * 0.65);
          notifications[i].snippet = message.substring(0, cutoff) + '...';
          unread.push(notifications[i]);
        }
      }
    }
    else notifications = [];

    return res.render("inbox", {
      title: "Your Inbox",
      sortByUnread: true,
      unread,
      user: req.session.user,
      isAdmin
    });
  } catch (e) {
    return res.status(404).render("error", { errorClass: "error", error: e });
  }
});
router.route("/inbox/:id").get(loginGuard, async (req, res) => {
  try {
    let user = false;
    let isAdmin = false;

    if (req.session.user) user = true;
    if (req.session.user.role.toLowerCase() === "admin") isAdmin = true;

    const userInfo = await userData.getUserById(req.session.user._id);
    let userNotifications = userInfo.notifications;
    const notification = userNotifications.find(
      (n) => n._id.toString() === req.params.id,
    );

    if (!notification) {
      return res.status(404).render("error", {
        errorClass: "error",
        error: "Notification with given ID does not exist!",
      });
    }

    // mark it as viewed
    for (let i = 0; i < userNotifications.length; i++) {
      if (userNotifications[i]._id.toString() === req.params.id) {
        userNotifications[i].viewed = true;
        break;
      }
    }

    await userData.updateUserPatch(req.session.user._id, {
      notifications: userNotifications,
    });


    let flaggedReviews = [];
    let restaurantLink = null;

    if (notification.restaurantId) {
      try {
        let rid = notification.restaurantId.toString();
        let reviewsData = await getReviewsByRestaurant(rid);
        flaggedReviews = reviewsData.filter(r => r.flagged).map(r => ({
            username: r.username,
            date: r.date,
            rating: r.rating,
            reviewText: r.reviewText,
          }));
        let restaurant = await restaurants.getRestaurantById(rid);
        restaurantLink = { id: rid, name: restaurant.name };
      } catch (_) {}
    }



    return res.render("notification", {
      title: notification.title,
      notification,
      flaggedReviews,
      restaurantLink,
    });
  } catch (e) {
    return res.status(404).render("error", { errorClass: "error", error: e });
  }
});

export default router;
