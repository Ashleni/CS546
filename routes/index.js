import searchRoutes from "./search.js";
import profileRoutes from "./profile.js";
import authRoutes from "./auth.js";
import restaurantRoutes from "./restaurant.js";
import inboxRoutes from "./inbox.js";

const constructorMethod = (app) => {
  app.use("/", searchRoutes);
  app.use("/", profileRoutes);
  app.use("/", authRoutes);
  app.use("/", restaurantRoutes);
  app.use("/", inboxRoutes);
  app.use(/(.*)/, (req, res) => {
    res
      .status(404)
      .render("error", { errorClass: "error", error: "Route Not found" });
  });
};

export default constructorMethod;
