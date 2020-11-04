const express = require(`express`);
let router = new express.Router();

// GET home page.
router.get(`/`, (req, res, next) => res.render(`index.ejs`));

module.exports = router;