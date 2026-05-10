import e, { Router } from "express";
import * as restaurants from "../data/restaurants.js";
const router = Router();
import { loginGuard } from "../middleware.js";
import exportedMethods from "../helpers.js";
import { getCommentsByUser} from "../data/comments.js";
import * as reviews from "../data/reviews.js";
import userData from "../data/users.js";

// helpers

async function buildAdminViewData(req) {
  let adminUser = false;
  let restaurantsOwned = false;
  let userOwnedRestaurants = [];

  if (!req.session.user) throw 'No user in session';
  if (req.session.user.role.toLowerCase() === 'admin') adminUser = true;
  else throw 'User has no admin privileges';

  let restaurantsData = await restaurants.getAllRestaurants();
  if (restaurantsData.length == 0) restaurantsData = [];

  userOwnedRestaurants = restaurantsData.filter(restaurant =>
    restaurant.ownerId && restaurant.ownerId.toString() === req.session.user._id.toString()
  );

  for (const restaurant of userOwnedRestaurants) {
    const reviewsData = await reviews.getReviewsByRestaurant(restaurant._id.toString());
    if (reviewsData.length !== 0) {
      let sum = 0;
      for (const review of reviewsData) {
        sum += review.rating;
      }
      restaurant.avgRating = (sum / reviewsData.length).toFixed(1);
    }
  }

  if (userOwnedRestaurants.length > 0) restaurantsOwned = true;

  return {
    title: 'Admin Features',
    adminUser,
    restaurantsOwned,
    userOwnedRestaurants,
  };
}

async function renderAdminPage(res, req, status, error) {
  try {
    const data = await buildAdminViewData(req);
    return res.status(status).render('admin', { ...data, error });
  } catch (_) {
    return res.status(status).render('admin', {
      title: 'Admin Features',
      adminUser: false,
      restaurantsOwned: false,
      userOwnedRestaurants: [],
      error,
    });
  }
}


// routes



router.route('/admin').get(loginGuard, async (req, res) => {
  try {
    const data = await buildAdminViewData(req);
    return res.render('admin', data);
  } catch (e) {
    return res.status(404).render('error', { errorClass: 'error', error: e });
  }
});

router.route("/admin/restaurant/:id/update").post(loginGuard, async (req, res) => {
    try {
        if (!req.session.user) throw 'No user in session';
        if (req.session.user.role.toLowerCase() !== 'admin') throw 'User has no admin privileges';

        let restaurantId = exportedMethods.checkId(req.params.id, 'restaurant ID');
        let updateInfo = req.body;
        let updateObject = {};

        if (updateInfo.restaurantName) updateObject.name = exportedMethods.checkString(updateInfo.restaurantName);
        if (updateInfo.boro) updateObject.boro = exportedMethods.checkBoro(updateInfo.boro);
        if (updateInfo.cuisine) updateObject.cuisine = exportedMethods.checkCuisine(updateInfo.cuisine);
        if (updateInfo.phone) updateObject.phone = exportedMethods.checkPhoneNumber(updateInfo.phone);

        let addressObj = {};
        if (updateInfo.building) addressObj.building = exportedMethods.checkBuilding(updateInfo.building);
        if (updateInfo.street) addressObj.street = exportedMethods.checkString(updateInfo.street);
        if (updateInfo.zip) addressObj.zip = exportedMethods.checkZipCode(updateInfo.zip);

        if (Object.keys(addressObj).length > 0) {
            updateObject.address = addressObj;
}

        let patchedObject = await restaurants.patchRestaurant(restaurantId, updateObject);
        return res.redirect("/admin");
    } catch (e) {
    return renderAdminPage(res, req, 400, e);
    }
});

router.route("/admin/restaurant/:id/outdatedReviews").post(loginGuard, async (req, res) => {
    try {
        if (!req.session.user) throw 'No user in session';
        if (req.session.user.role.toLowerCase() !== 'admin') throw 'User has no admin privileges';
        
        const reviewsData = await reviews.getReviewsByRestaurant(req.params.id);
        const currDate = new Date();

        for (const review of reviewsData) {
            // Reviews that are of 2+ years are 'outdated'
            let reviewDate = new Date(review.date);
            let dateDifference = (currDate - reviewDate) / 86400000;

            if (dateDifference > 730) {
                await reviews.removeReviewById(review.userID.toString(), review._id.toString());
            }
        }

        return res.redirect('/admin');
    }
     catch (e) {
        return renderAdminPage(res, req, 400, e);
    }
});

router.route("/admin/restaurant/:id/delete").post(loginGuard, async (req, res) => {
    try {
        if (!req.session.user) throw 'No user in session';
        if (req.session.user.role.toLowerCase() !== 'admin') throw 'User has no admin privileges';  

        let idCheck = exportedMethods.checkId(req.body.restaurantDeletionId);

        if (idCheck !== req.params.id) throw 'Input does not match restaurant id';

        let result = await restaurants.removeRestaurant(idCheck);

        if (result.deleted) {
            return res.redirect('/admin');
        }
        else throw 'Restaurant could not be deleted';
        
    } catch (e) {
        return renderAdminPage(res, req, 400, e);    }
});

router.route("/admin/createRestaurant").post(loginGuard, async (req, res) => {
    try {
        if (!req.session.user) throw 'No user in session';
        if (req.session.user.role.toLowerCase() !== 'admin') throw 'User has no admin privileges';

        const restaurantInfo = req.body;

        // Throws if new restaurant can't be created
        const newRestaurant = await restaurants.createRestaurant(
            restaurantInfo.name,
            req.session.user._id,
            restaurantInfo.boro,
            restaurantInfo.building,
            restaurantInfo.street,
            restaurantInfo.zip,
            restaurantInfo.phone,
            restaurantInfo.cuisine
        )

        return res.redirect('/admin');
        
    } catch (e) {
        return renderAdminPage(res, req, 400, e);
    }
});

export default router;
