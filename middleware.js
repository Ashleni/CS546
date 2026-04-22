export const handlebarsLocalVars = (req, res, next) => {
    res.locals.user = req.session.user || null; // https://forum.freecodecamp.org/t/res-locals-user-how-does-it-work/76212
    next(); // we can add more variables to use in handlebars templates as needed.
};


// GET /member auth middleware and /signout auth middleware
export const loginGuard = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/signin");
    }
    next();
};

// GET /admin auth middleware
export const adminGuard = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== "admin"){
        return res.status(403).render("error", { error: "Access Forbidden", errorClass: "error" });
    }
    next();
};

// GET /signin guard middleware and /register guard middleware
export const signinGuard = (req, res, next) => {
    if (req.session.user) {
        return res.redirect("/home");
    }
    next();
};
