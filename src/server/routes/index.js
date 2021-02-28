const express = require(`express`);
const router = express.Router();

// GET Homepage.
router.get(`/`, (req, res, next) => res.render(`index.ejs`));

// GET Staff UI
// TODO: use more obscure path
router.get(`/staff`, (req, res, next) => res.render(`staffUI.ejs`));

// GET Funny page.
router.get(`/ramen_noodle_stimulus_package`, (req, res, next) => res.redirect(`https://secret.badfirmware.com`));

module.exports = router;
