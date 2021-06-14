import mongoose from 'mongoose';
import Sensor from './models/sensor_models';
import jwt_decode from "jwt-decode";

require("dotenv").config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser')
const logger = require('morgan');
const log = require('./modules/logger')
const cors = require("cors");
const { checkJWT,createJWT , checkRefreshToken } = require('./modules/jwt');
var jwt = require('jsonwebtoken');
const db_sql = require("./models");
const User = db_sql.model;

//Import routes 
var usersRouter = require('./routes/user')
var loginRouter = require('./routes/login')

var corsOptions = {
  origin: "http://localhost:3001",
};

// Connection MongoDB
mongoose.connect('mongodb://fradetaxel.fr:2717/test', {useNewUrlParser: true, useUnifiedTopology: true,  useCreateIndex: true,
});
const db_mongo = mongoose.connection;
db_mongo.on('error', console.error.bind(console, 'connection error:'));
db_mongo.once('open', function() {
   console.log('MongoDB connected...')
});

// Connection MySQL
const db = require('./models');
db.sequelize.authenticate()
  .then(()=>console.log('MySQL connected...'))
  .catch(err => console.log('Error : ' + err))
// db.sequelize.sync().then(() => {
//   console.log("Drop and re-sync db.");
// });


//Create App with options
const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors(corsOptions));

app.use('/login' ,loginRouter);

//Middleware
var secure = async function (req,res,next) {
  //Get Token dans le header
  var token = req.headers.authorization
  if(token) {
      token = token.replace(/^Bearer\s+/, "");    
      //Check Access Token 
      try {
        const verif = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        next(); //Si pas d'erreur, next
      } catch (err) {
        //Si erreur, on  récupère les valeurs dans le token

        //Si le token a expiré
        if(err.name == 'TokenExpiredError' ) {
          let decoded : any = jwt_decode(token)
          console.log(decoded);
  
          //Recup RefreshToken pour voir s'il est toujours valide
          const {email, role} = decoded.user;
          const data = await User.findOne({ where : {email : email, role:role }})   
          const refreshToken = data.refreshToken;
          //Return si Refresh Token Inexistant
          if(refreshToken == null) return res.sendStatus(401)
          if(!refreshToken.includes(refreshToken)) return res.sendStatus(403)
          //Check Refresh Token
          const verifRefresh = checkRefreshToken(refreshToken)
          console.log('verifRefresh')

          console.log(verifRefresh)
          //Si Refresh Token périmé ou autre erreur
          if(verifRefresh == 'TokenExpiredError' || !verifRefresh){
            res.status(401).json({
              message : "Veuillez vous reconnecter, votre session a expiré"
            })
          }
          //Si Refresh Token valide
          else {
            const accessToken = createJWT({ email : email, role : role })
            res.set({ accessToken: accessToken })
            next();
          }
          
        }
        //Si token incorrect
        else{
          res.status(401).json({
            message : "Acces refusé, token incorrect"
          })
        }
      }
    }
  }

app.use(secure)

app.use('/users' ,usersRouter);

const port = 3000;

app.listen(port, () => {
  return console.log(`server is listening on ${port}`);
});

module.exports = app;


// app.get('/', (req, res) => {
//   res.send('Le Serveur est connecté mon bro');
// })
// .get('/api/fonction/getAll', (req, res) => {
//   Sensor.countDocuments()
//   .then(Sensor => {
//     res.status(200).send("Nous avons " + Sensor + " capteur(s) dans notre BDD")
//   })
//   .catch(error => res.status(400).json({ error }));
// })
// .get('/api/fonction/get/:id', (req, res) => {
//   var findSensor =  Sensor.find({id: parseInt(req.params.id)});

//   findSensor.exec(function(err,result){
//     if(err)
//       res.status(400).json({ err });
      
//     if(Object.keys(result).length === 0)
//       res.status(400).json({ message: "This sensor doesn't exist in the database" });
    
//     res.status(201).json({ message: result})
//   });
// });

// app.post('/api/fonction/add', (req, res) => {
//   const createSensor = new Sensor({
//     id : req.body.id,
//     type : req.body.type,
//     data : req.body.data
//   })
//   createSensor.save()
//   .then(() => res.status(201).json({ message: 'Objet add succesfully !'}))		
//   .catch(error => res.status(400).json({ error }));
// });

// app.delete('/api/fonction/delete/', (req, res) => {
//   const deleteSensor = { id: req.body.id};
// 	Sensor.deleteMany(deleteSensor)
//   .then(() => res.status(200).json({ message: 'Objet delete !'}))		
//   .catch(error => res.status(400).json({ error }));
// });

// app.put('/api/fonction/edit/:id', (req, res) => {
//   const filter = {id : parseInt(req.params.id)}
//   const update = { type : req.body.type, data : req.body.data }
//   Sensor.findOneAndUpdate(filter, update)
//   .then(Sensor => res.status(202).json({message : "Edit Succesfully"}))
//   .catch(error => res.status(400).json({ error }));
// });