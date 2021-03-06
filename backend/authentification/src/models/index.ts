export {}
const dbConfig = require("../config/db.config.ts");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

const db = {Sequelize : null, sequelize :null, model : null};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.model = require("./model.ts")(sequelize, Sequelize);

module.exports = db;