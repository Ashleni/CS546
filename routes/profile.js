import { Router } from "express";
import * as restaurants from "../data/restaurants.js";
const router = Router();
import { loginGuard } from "../middleware.js";
import helpers from "../helpers.js";
import { getCommentsByUser} from "../data/comments.js";
import { getReviewsByUser} from "../data/reviews.js";
import userData from "../data/users.js";

router.route("/profile").get(async (req, res) => {
    try {
        let user = false;
        let isAdmin = false;

        if (req.session.user) user = true;
        if (req.session.user.role.toLowerCase() === "admin") isAdmin = true;

        const userInfo = await userData.getUserById(req.session.user._id);
        
        const userName = userInfo.username;
        const firstName = userInfo.firstName;
        const lastName = userInfo.lastName;
        const role = userInfo.role;
        
        let userFollows = false;
        //array of the restaurants' id's
        let followIds = [
            ...userInfo.publicFollowingRestaurants,
            ...userInfo.privateFollowingRestaurants,
        ]

        let follows = [];

        if (followIds.length > 0) {
            userFollows = true;
            for (let id of followIds) {
                let restaurant = await restaurants.getRestaurantById(id.toString());
                follows.push(restaurant.name);
            }
        }

        let userReviews = false;
        //array of the reviews
        let reviewList = await getReviewsByUser(userInfo._id.toString());
        let reviews = [];
        if (reviewList.length > 0) {
            userReviews = true;
            reviewList.sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });
            for (let r of reviewList) {
                let restaurant = await restaurants.getRestaurantById(r.restaurantID.toString());
                let reviewInfo = {
                    restaurant: restaurant.name,
                    rating: r.rating,
                    date: r.date
                };
                reviews.push(reviewInfo);
            }
        }

        let userComments = false;
        //array of the comments
        let commentsList = await getCommentsByUser(userInfo._id.toString());
        let comments = [];
        if (commentsList.length > 0) {
            userComments = true;
            commentsList.sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });  
            for (let c of commentsList) {
                let restaurant = await restaurants.getRestaurantById(c.restaurantID.toString());
                let commentInfo = {
                    restaurant: restaurant.name,
                    message: c.message,
                    date: c.date
                };
                comments.push(commentInfo);
            }      
        }

        return res.render('userProfile', {
            user: {
                userName,
                firstName,
                lastName,
            },
            isAdmin,
            role,
            userFollows,
            follows,
            userReviews,
            reviews,
            userComments,
            comments
        });    
    } catch (e) {
        return res.status(404).render("error", { errorClass: "error", error: e });
    }
});

export default router;
