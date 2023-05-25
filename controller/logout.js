const session = require("express-session");

const destroy = (req,res)=>{

        req.session.destroy(function(err) {
          if (err) {
            console.log(err);
          } else {
            res.redirect('/');
          }
        });

}

module.exports = destroy