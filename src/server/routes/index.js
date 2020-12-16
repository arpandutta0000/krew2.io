let express = require(`express`);
let router = express.Router();

/* GET home page. */
router.get(`/`, function (req, res, next) {
    if(process.env.NODE_ENV === `prod` || process.env.NODE_ENV === `test-server`) return res.render(`index_dist.ejs`);
    else res.render(`index.ejs`);
});

module.exports = router;
