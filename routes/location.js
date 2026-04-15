import { Router } from 'express';
import helpers from '../helpers.js';
import * as restaurants from '../data/restaurants.js';
const router = Router();

router.route('/').get(async (req, res) => {
  return res.render('home', {title: 'Location Search'});
});

router.route('/searchResults').post(async (req, res) => {
  //code here for POST this is where your form will be submitting keyword 
  //and then call your data function passing in the keyword and then 
  // rendering the search results of matching meals.
  let info = req.body.location;

  try {
    info = helpers.checkString(info, 'location');
  } catch (e) {
    let message = "You must enter a search term!";
    return res.status(400).render('error', {errorClass: "error", error: message});
  }

  try {
    const data = await restaurants.searchNearbyRestaurants(info);
    return res.render('searchResults', {title: 'Restaurants Found', keywords: info, restaurantsData: data.restaurants});
    
  } catch (e) {
    return res.status(404).render('error', {errorClass: "restaurant-not-found", error: e});
  }
});

export default router;