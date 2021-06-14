const express = require('express');
var router = express.Router();

const controllerMySQL = require('../controllers/controllerSql.ts')

//Se connecter
router.post("/login", controllerMySQL.loginAccount)

//Se deconnecter
router.delete('/logout', controllerMySQL.logout)


module.exports = router;