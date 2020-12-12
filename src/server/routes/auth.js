const express = require(`express`);
let router = new express.Router();

let { check, validationResult } = require(`express-validator`);
let bcrypt = require(`bcryptjs`);
let token = require(`jsonwebtoken`);

// Signup.
router.post(`/signup`,
    [
        check(`username`, `Username must be between 3 and 24 characters.`).isLength({ min: 3, max: 24 }),
        check(`password`, `Password must be between 8 and 64 characters.`).isLength({ min: 8, max: 64 })
    ],
    (req, res) => {
        
    }
);

module.exports = router;