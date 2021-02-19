const express = require(`express`);
const router = express.Router();

// GET homepage.
router.get(`/`, (req, res, next) => res.render(`index.ejs`));

// GET Funny page.
router.get(`/ramen_noodle_stimulus_package`, (req, res, next) => res.redirect(`https://secret.badfirmware.com`));

module.exports = router;
