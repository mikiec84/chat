var express = require('express')
    , router = express.Router();

router.use('/api/chats', require('./chats'));
router.use(require('./auth'));

module.exports = router;