var express = require('express'),
    router = express.Router();

router.get('/', function(req, res) {
    res.json(req.user);
});

module.exports = router;