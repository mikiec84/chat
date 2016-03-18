var express = require('express'),
    jwt = require('jsonwebtoken'),
    config = require('../config'),
    users = require('../models/users'),
    router = express.Router();

router.post('/authenticate', function (req, res) {
    var user = users.find(x => req.body.username === x.username && req.body.password === x.password);
    if (!user) {
        res.send(401, 'Wrong user or password');
        return;
    }

    var token = jwt.sign(user, config.jwtSecret, { expiresIn: "5h" });

    res.json({ token: token });
});

module.exports = router;