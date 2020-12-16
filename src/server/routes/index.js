// routes/index.js

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test-server') {
        return res.render('index_dist.ejs');
    }
    res.render('index.ejs');
});

module.exports = router;