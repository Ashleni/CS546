import { Router } from 'express';
import * as restaurants from '../data/restaurants.js';
const router = Router();
import { loginGuard } from "../middleware.js";

/*
router.route('/').get(async (req, res) => {
  return res.render('home', {title: 'Location Search'});
});
*/

router.route('/restaurant/:id').get(loginGuard, async (req, res) => {
    try {
      const id = req.params.id.trim();
      const data = await restaurants.getRestaurantById(id);
      return res.render('restaurant', {title: data.name, restaurant: data});  
    
    } catch (e) {
      return res.status(404).render('error', {errorClass: "error", error: e});
    }
  });

  export default router;