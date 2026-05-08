import { Router } from "express";
import * as restaurants from "../data/restaurants.js";
const router = Router();
import { loginGuard } from "../middleware.js";
import userData from "../data/users.js";

router.route("/inbox").get(loginGuard, async (req, res) => {
  try {
    let user = false;
    let isAdmin = false;

    if (req.session.user) user = true;
    if (req.session.user.role.toLowerCase() === "admin") isAdmin = true;

    const userInfo = await userData.getUserById(req.session.user._id);
    const notifications = userInfo.notifications;

    if (notifications) {
      for (let i = 0; i < notifications.length; i++) {
        const message = notifications[i].message;
        const cutoff = Math.floor(message.length * 0.65);
        const snippet = message.substring(0, cutoff) + "...";
        notifications[i].snippet = snippet;
      }
    }

    return res.render("inbox", {
      sortByUnread: false,
      notifications,
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
    const notifications = userInfo.notifications;

    let unread = [];
    if (notifications) {
      // only get unread
      for (let i = 0; i < notifications.length; i++) {
        if (notifications[i].viewed === false) {
          unread.push(notifications[i]);
        }
      }
    }

    return res.render("inbox", {
      sortByUnread: true,
      unread,
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

    return res.render("notification", {
      notification,
    });
  } catch (e) {
    return res.status(404).render("error", { errorClass: "error", error: e });
  }
});

export default router;
