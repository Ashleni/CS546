import { Router } from "express";
import * as restaurants from "../data/restaurants.js";
const router = Router();
import { loginGuard, adminGuard } from "../middleware.js";
import helpers from "../helpers.js";
import { getCommentsByRestaurant, createComment, patchCommentById, addReplyByCommentId, deleteCommentById, getCommentById, removeCommentById } from "../data/comments.js";
import {getReviewsByRestaurant, createReview, patchReviewById,
  getReviewById, SURVEY_QUESTIONS, validateSurvey,adminDeleteReviewById} from "../data/reviews.js";
import userData from "../data/users.js";
import multer from "multer";
import {followRestaurant, unfollowRestaurant, updateFollowVisibility} from "../data/users.js";

// set up multer, taken from https://blog.openreplay.com/multer-npm-file-upload-nodejs/
let storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"));
  }
};

let upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter,
});

// helper function for the review routes:

async function getRestaurantPageData(restaurantId, currentUserId) {
  let data =  await restaurants.getRestaurantById(restaurantId);

  data.inspections.sort(
    (a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate)
  );

  // Reviews 
  let  reviewData = await getReviewsByRestaurant(restaurantId); 
  let sumReviews = 0; 
  let avgRating = "";  
  let userReview = null;
 
  if (reviewData.length > 0) { 
    for (let r of reviewData) { 
      sumReviews += r.rating; 
      if (r.userID.toString() === currentUserId) { 
        userReview = {  
          _id: r._id.toString(),
          rating: r.rating,  
          reviewText: r.reviewText,
          survey: r.survey,  
          photos: r.photos, 
          date: r.date, 
          edited: r.edited, 
        };
      }
    } 
    avgRating =  (sumReviews / reviewData.length).toFixed(1);
  }
  let publicReviews  = reviewData.map((r) => ({
    _id: r._id.toString(),
    username: r.username,
    rating:  r.rating,
    reviewText: r.reviewText,
    photos: r.photos || [],
    date: r.date,
    edited: r.edited,
    surveyRows: SURVEY_QUESTIONS.map((q) => ({
      label:  q.label,
      answer: r.survey ? formatSurveyAnswer(q, r.survey[q.key]) : "—",
    })),
  }));
  // Comments
  let commentData = [];
  try {
    commentData = await getCommentsByRestaurant(restaurantId);
    commentData.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (_) {}
  return {
    restaurant: data,
    avgRating,
    userReview,
    publicReviews,
    commentCount:   commentData.length,
    commentData,
  };
}

// helper function for the review routes:

function formatSurveyAnswer(question, value) {
  if (value === undefined || value === null) {
    return "—";
  }
  if (question.type === "scale") {
    let formattedScale = value + " / 5";
    return formattedScale;
  }
  let selectedOption = null; 
  for (let i = 0; i < question.options.length; i++) {
    let currentOption = question.options[i];
    if (currentOption.value === value) {
      selectedOption = currentOption;
      break;
    }
  }
  if (selectedOption) {
    return selectedOption.label;
  }
  return value;
}


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
    const isAdmin = req.session.user.role.toLowerCase() === "admin";

  
    const {
      restaurant,
      avgRating,
      userReview,
      publicReviews,
      commentCount,
      commentData,
    } = await getRestaurantPageData(id, req.session.user._id);


    const data = restaurant;
    data.inspections.sort((a, b) => {
      return new Date(b.inspectionDate) - new Date(a.inspectionDate);
    });

    /* // A  helper function was made to do all of this
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
    */

    // is user following?
    const userInfo = await userData.getUserById(req.session.user._id);
    let userIsFollowing = false;
    let followVisibility = null; // null or "public" or "private" 
  
    const publicIds = userInfo.publicFollowingRestaurants.map((i)  =>  i.toString()); 
    const privateIds = userInfo.privateFollowingRestaurants.map((i)  =>  i.toString());

    if (publicIds.includes(id)) {
      userIsFollowing  = true;
      followVisibility = "public";
    } else if (privateIds.includes(id)) {
      userIsFollowing  = true;
      followVisibility = "private";
    }

    const BOROS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
    const adminBoroOptions = BOROS.map((b) => ({
      value: b,
      label: b,
      selected: b === data.boro,
    }));

    return res.render("restaurant", {
      title: data.name,
      restaurant: data,
      userIsFollowing: userIsFollowing,
      isAdmin: isAdmin,
      avgRating: avgRating,
      userReview,
      publicReviews,
      comments: commentData,
      commentCount: commentCount,
      adminBoroOptions,
    });
  } catch (e) {
    return res.status(404).render("error", { errorClass: "error", error: e });
  }
});

// SHOW the create a review form
router.route("/restaurant/:id/review/new").get(loginGuard, async (req, res) => {
  let restaurantId;
  try {
    restaurantId = helpers.checkId(req.params.id, "restaurantId");
  } catch {
    return res
      .status(404)
      .render("error", { errorClass: "error", error: "Invalid Restaurant ID" });
  }

  // Guard against duplicates
  try{
    const existing = await getReviewsByRestaurant(restaurantId);
    if (existing.some((r) => r.userID.toString() === req.session.user._id)) {
      return res.redirect(`/restaurant/${restaurantId}`);
    }
  } catch (e) {
    return res.status(404).render("error", { errorClass: "error", error: e });
  }

  let restaurant;
  try {
    restaurant = await restaurants.getRestaurantById(restaurantId);
  } catch (e) {
    return res.status(404).render("error", { errorClass: "error", error: e });
  }

  return res.render("reviewForm", {
    title: `Review ${restaurant.name}`,
    restaurant,
    surveyQuestions: SURVEY_QUESTIONS,
    isEdit: false,
  });
});

// POST a new review from /review
router.route("/restaurant/:id/review").post(loginGuard, upload.array("photos", 3), async (req, res) => {
    let restaurantId;
    let userId;

    try {
      restaurantId = helpers.checkId(req.params.id, "restaurantId");
      userId = helpers.checkId(req.session.user._id, "userId");
    } catch (e) {
      return res
        .status(400)
        .render("error", { errorClass: "error", error: e });
    }

    // guard against duplicates
    const existing = await getReviewsByRestaurant(restaurantId);
    if (existing.some((r) => r.userID.toString() === userId)) {
      return res.status(400).render("error", {
        errorClass: "error",
        error: "You have already reviewed this restaurant. Edit your existing review from the restaurant page.",
      });
    }

    let rating, reviewText, survey;
    try {
      rating = helpers.checkRating(req.body.rating);
      if (!req.body.reviewText || req.body.reviewText.trim().length === 0) {
        throw "Review text is required.";
      }
      reviewText = req.body.reviewText.trim();
      survey = validateSurvey(req.body);
    } catch (e) {
      let restaurant;
      try { restaurant = await restaurants.getRestaurantById(restaurantId); } catch (_) {}
      return res.status(400).render("reviewForm", {
        title: restaurant ? `Review ${restaurant.name}` : "Write a Review",
        restaurant,
        surveyQuestions: SURVEY_QUESTIONS,
        isEdit: false,
        error: e,
        formData: req.body,
      });
    }

    const photos = (req.files || []).map((f) => ({data: f.buffer, mimetype: f.mimetype, }));

    try {
      await createReview(userId, restaurantId, rating, reviewText, survey, photos);
    } catch (e) {
      return res.status(404).render("error", { errorClass: "error", error: e });
    }

    return res.redirect(`/restaurant/${restaurantId}`);
  });

// EDIT an existing review in /edit
router.route("/review/:reviewId/edit").get(loginGuard, async (req, res) => {
  let reviewId;
  try { reviewId = helpers.checkId(req.params.reviewId, "reviewId");
  } catch {
    return res.status(404).render("error", { errorClass: "error", error: "Invalid Review ID" }); 
  }

  let review;
  try {review = await getReviewById(reviewId);
  } catch (e) {
    return res.status(404).render("error", { errorClass: "error", error: e });
  }

  if (review.userID.toString() !== req.session.user._id) {
    return res.status(403).render("error", { errorClass: "error", error: "Access forbidden." });
  }

  let restaurant;
  try {
    restaurant = await restaurants.getRestaurantById(review.restaurantID.toString());
  } catch (e) {
    return res.status(404).render("error", { errorClass: "error", error: e });
  }

  return res.render("editReviewForm", { 
    title: `Edit Your Review - ${restaurant.name}`, 
    restaurant, 
    review, 
    surveyQuestions: SURVEY_QUESTIONS,
    isEdit: true, 
  });
});

// PUT request to update an existing review
router.route("/review/:reviewId").post(loginGuard, upload.array("photos", 3), async (req, res) => {
    let reviewId;
    let userId;

    try {
      reviewId = helpers.checkId(req.params.reviewId, "reviewId");
      userId = helpers.checkId(req.session.user._id, "userId");
    } catch (e) {
      return res.status(400).render("error", { errorClass: "error", error: e }); 
    }

    let review;
    try {review = await getReviewById(reviewId);
    } catch (e) {
      return res.status(404).render("error", { errorClass: "error", error: e }); 
    }

    if (review.userID.toString() !== userId) {  
      return res.status(403).render("error", { errorClass: "error", error: "Access forbidden." }); 
    } 
 
    let newRating, newReviewText, newSurvey, newPhotos; 
    try { 
      newRating = helpers.checkRating(req.body.rating); 
      if (!req.body.reviewText || req.body.reviewText.trim().length === 0) {
        throw "Review text cannot be empty."; 
      }  
      newReviewText = req.body.reviewText.trim();
      newSurvey = validateSurvey(req.body); 
    } catch (e) { 
      let restaurant;
      try {
        restaurant = await restaurants.getRestaurantById(review.restaurantID.toString());
      } catch (_) {}
      return res.status(400).render("editReviewForm", {
         title: restaurant ? `Edit Your Review - ${restaurant.name}` : "Edit Review",
        restaurant, 
        review,
        surveyQuestions: SURVEY_QUESTIONS, 
        isEdit: true,
        error: e,
      });
    }

    // If new photos are uploaded
    if (req.files && req.files.length > 0) {
      newPhotos = req.files.map((f) => ({ data: f.buffer, mimetype: f.mimetype }));
    }

    let updatedReview;
    try {
      updatedReview = await patchReviewById(
        userId,
        reviewId,
        newRating,
        newReviewText,
        newSurvey,
        newPhotos
      );
    } catch (e) {
      return res.status(400).render("error", { errorClass: "error", error: e });
    }

    return res.redirect(
      `/restaurant/${updatedReview.restaurantID.toString()}`
    );
  });

router.route("/restaurant/:id/comment").post(loginGuard,  async (req, res) => {
  const isAjax = req.headers["x-requested-with"] === "XMLHttpRequest";
  let restaurantId;
  let userId;
  let message;

  try {
    restaurantId = helpers.checkId(req.params.id, "restaurantId");
    userId = helpers.checkId(req.session.user._id, "userId");
    message = helpers.checkMessage(req.body.message);
  } catch (e) {
    if (isAjax) return res.status(400).json({ success: false, error: String(e) });
    return res.status(404).render("error", { errorClass: "error", error: e });
  }

  let comment;
  try {
    comment = await createComment(userId, restaurantId, message);
  } catch (e) {
    if (isAjax) return res.status(500).json({ success: false, error: String(e) });
    return res.status(404).render("error", { errorClass: "error", error: e });
  }

  if (isAjax) {
    return res.status(200).json({
      success: true,
      comment: {
        _id:      comment._id.toString(),
        username: comment.username,
        message:  comment.message,
        date:     comment.date,
      },
    });
  }

  return res.redirect(`/restaurant/${restaurantId}`);
});

router.route("/restaurant/:id/comment/:commentId/edit").get(loginGuard, async (req, res) => {
  try { 
    const restaurantId = helpers.checkId(req.params.id, "restaurantId");
    const commentId = helpers.checkId(req.params.commentId, "commentId");
    const userId = helpers.checkId(req.session.user._id, "userId");
    const comment = await getCommentById(commentId);

    if (comment.userID.toString() !== userId) {
      throw 'User did not create this comment'  
    }

    const restaurant = await restaurants.getRestaurantById(restaurantId);

    return res.render('editCommentForm', {
      title: `Edit Your Comment - ${restaurant.name}`,
      restaurant,
      comment
    });
  } catch (e) {
    return res.status(400).render("error", { errorClass: "error", error: e });
  }
});

// PUT request to update an existing review
router.route("/restaurant/:id/comment/:commentId/edit").post(loginGuard, async (req, res) => {
  try { 
    const restaurantId = helpers.checkId(req.params.id, "restaurantId");
    const commentId = helpers.checkId(req.params.commentId, "commentId");
    const userId = helpers.checkId(req.session.user._id, "userId");
    const comment = await getCommentById(commentId);

    if (comment.userID.toString() !== userId) {
      throw 'User did not create this comment'  
    }

    const newComment = helpers.checkMessage(req.body.message);
    await patchCommentById(userId, commentId, newComment);

    return res.redirect(`/restaurant/${restaurantId}`);
  } catch (e) {
    return res.status(400).render("error", { errorClass: "error", error: e });
  }
  });

router.route("/restaurant/:id/comment/:commentId/reply").post(loginGuard, async (req, res) => {
  let restaurantId;
  let userId;
  let parentCommentId;
  let replyMessage;

  try {
    restaurantId = helpers.checkId(req.params.id, "restaurantId");
    userId = helpers.checkId(req.session.user._id, "userId");
    parentCommentId = helpers.checkId(req.params.commentId, "parentCommentId");
    replyMessage = helpers.checkMessage(req.body.reply);
  } catch (e) {
    return res.status(404).render("error", { errorClass: "error", error: e });
  }

  try {
    const reply = await addReplyByCommentId(userId, restaurantId, parentCommentId, replyMessage);

  } catch (e) {
    return res.status(404).render("error", { errorClass: "error", error: e });
  }

  return res.redirect(`/restaurant/${restaurantId}`);
});

// FOLLOW FEATURE
router.route("/restaurant/:id/follow").post(loginGuard, async (req, res) => {
  let restaurantId;  
  try { 
    restaurantId = helpers.checkId(req.params.id, "restaurantId"); 
  } catch (e) { 
    return res.status(400).render("error", {errorClass: "error", error: e});
  }

  try { 
    await restaurants.getRestaurantById(restaurantId);
  } catch (e) { 
    return res.status(404).render("error", {errorClass: "error", error: e});
  }

  // right now, the follow will default to public
  const isPublic = req.body.visibility !== "private"; 

  try { 
    await followRestaurant(req.session.user._id, restaurantId, isPublic);
  } catch (e) {  
    return res.status(400).render("error", {errorClass: "error", error: e}); 
  }

  return res.redirect(`/restaurant/${restaurantId}`);   
});

router.route("/restaurant/:id/unfollow").post(loginGuard, async (req, res) => {
  let restaurantId;  
  try { 
    restaurantId = helpers.checkId(req.params.id, "restaurantId");
  } catch (e) { 
    return res.status(400).render("error", {errorClass: "error", error: e});
  } 

  try { 
    await unfollowRestaurant(req.session.user._id, restaurantId);
  } catch (e) { 
    return res.status(400).render("error", {errorClass: "error", error: e}); 
  } 

  return res.redirect(`/restaurant/${restaurantId}`);   
});

router.route("/restaurant/:id/follow/visibility").post(loginGuard, async (req, res) => {
  let restaurantId; 
  try {   
    restaurantId = helpers.checkId(req.params.id, "restaurantId" );
  } catch (e) {  
    return res.status(400).render("error", {errorClass: "error", error: e});
  } 
 
  const makePublic = req.body.visibility !== "private"; 
 
  try {  
     await updateFollowVisibility(req.session.user._id, restaurantId, makePublic);
  } catch (e) {  
    return res.status(400).render("error", {errorClass: "error", error: e});
  } 

  return res.redirect(`/restaurant/${restaurantId}`);   
});


// ADMIN ROUTES
router.route("/restaurant/:id/admin/edit").post(adminGuard, async (req, res) => {
  let id; 
  try { 
    id = helpers.checkId(req.params.id, "Restaurant ID"); 
  } catch (e) { 
    return res.status(400).render("error", { errorClass: "error", error: e }); 
  }

  const updateObject = {};
  if (req.body.name){
    updateObject.name= req.body.name;
  }
  if (req.body.cuisine) {
    updateObject.cuisine = req.body.cuisine;
  }
  if (req.body.boro){
    updateObject.boro= req.body.boro;
  }
  if (req.body.phone){
    updateObject.phone= req.body.phone;
  }

  const addressFields = {};
  if (req.body.building){ 
    addressFields.building = req.body.building;
  }
  if (req.body.street){
    addressFields.street= req.body.street;
  }
  if (req.body.zip){
    addressFields.zip= req.body.zip;
  }
  if (Object.keys(addressFields).length > 0){ 
    updateObject.address = addressFields;
  }

  if (Object.keys(updateObject).length === 0) {
    return res.redirect(`/restaurant/${id}`);
  }

  try {
    await restaurants.patchRestaurant(id, updateObject);
  } catch (e) {
    return res.status(400).render("error", { errorClass: "error", error: String(e) });
  }

  return res.redirect(`/restaurant/${id}`);
});


router.route("/restaurant/:id/admin/inspection").post(adminGuard, async (req, res) => {
  let id;
  try {
    id = helpers.checkId(req.params.id, "Restaurant ID");
  } catch (e) {
    return res.status(400).render("error", { errorClass: "error", error: e });
  }

  const { inspectionDate: rawDate, action, violationCode, violationDescription, criticalFlag, grade } = req.body;

  let inspectionDate;
  if (rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    const [y, m, d] = rawDate.split("-");
    inspectionDate = `${m}/${d}/${y}`;
  } else {
    inspectionDate = rawDate;
  }

  try {
    await restaurants.addInspection(id, inspectionDate, action, violationCode, violationDescription, criticalFlag, grade);
  } catch (e) {
    return res.status(400).render("error", { errorClass: "error", error: String(e) });
  }

  return res.redirect(`/restaurant/${id}`);
});

router.route("/restaurant/:id/admin/inspection/:inspectionId/delete").post(adminGuard, async (req, res) => {
  let id, inspectionId;
  try {
    id = helpers.checkId(req.params.id, "Restaurant ID");
    inspectionId = helpers.checkId(req.params.inspectionId, "Inspection ID");
  } catch (e) {
    return res.status(400).render("error", { errorClass: "error", error: e });
  }

  try {
    await restaurants.removeInspection(id, inspectionId);
  } catch (e) {
    return res.status(400).render("error", { errorClass: "error", error: String(e) });
  }

  return res.redirect(`/restaurant/${id}`);
});


router.route("/review/:reviewId/admin/delete").post(adminGuard, async (req, res) => {
  let reviewId;
  try {
    reviewId = helpers.checkId(req.params.reviewId, "reviewId");
  } catch (e) {
    return res.status(400).render("error", { errorClass: "error", error: e });
  }

  let restaurantId;
  try {
    const review = await getReviewById(reviewId);
    restaurantId = review.restaurantID.toString();
  } catch (e) {
    return res.status(404).render("error", { errorClass: "error", error: String(e) });
  }

  try {
    await adminDeleteReviewById(reviewId);
  } catch (e) {
    return res.status(400).render("error", { errorClass: "error", error: String(e) });
  }

  return res.redirect(`/restaurant/${restaurantId}`);
});

router.route("/restaurant/:id/comment/:commentId/delete").post(loginGuard, async (req, res) => {
  let restaurantId, commentId, userId;
  const isAdmin = req.session.user.role.toLowerCase() === "admin";

  try {
    restaurantId = helpers.checkId(req.params.id, "restaurantId");
    userId = helpers.checkId(req.session.user._id, "userId");
    commentId    = helpers.checkId(req.params.commentId, "commentId");
  } catch (e) {
    return res.status(400).render("error", { errorClass: "error", error: e });
  }

  let comment;
  try {
    comment = await getCommentById(commentId);
  } catch (e) {
    return res.status(404).render("error", { errorClass: "error", error: e });
  }

  try {
    let isCommentOwner = false;

    if (comment.userID.toString() == userId) {
      isCommentOwner = true;
    }

    if (!isAdmin && !isCommentOwner) throw 'User is not admin or comment owner';

  } catch (e) {
    return res.status(403).render("error", { errorClass: "error", error: String(e) });
  }

  try {
    if (isAdmin) {
      await deleteCommentById(commentId);
    }
    else {
      await removeCommentById(userId, commentId)
    }
  } catch (e) {
    return res.status(400).render("error", { errorClass: "error", error: String(e) });
  }

  return res.redirect(`/restaurant/${restaurantId}`);
});

export default router;