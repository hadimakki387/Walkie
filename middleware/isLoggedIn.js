function isLoggedIn(req, res, next) {
    if (req.user || req.session.user) {
      next();
    } else {
      res.redirect("/signIn");
    }
  }
  
  module.exports = isLoggedIn;
  