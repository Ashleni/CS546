import locationRoutes from "./location.js";
import authRoutes from "./auth.js";

const constructorMethod = (app) => {
  app.use("/", locationRoutes);
  app.use("/", authRoutes);
  app.use(/(.*)/, (req, res) => {
    res
      .status(404)
      .render("error", { errorClass: "error", error: "Route Not found" });
  });
};

export default constructorMethod;
