const cors = require ('cors')
const express = require('express')
const app = express()
const Datastore = require('nedb')
const bodyParser = require('body-parser')
const { resolve } = require('path')
const file = require('./Modules/file')

let db
const dataPath = './data/'

const timetableQuery = {
  route: '',
  loco: ''
}

const corsOptions = {
  origin: '*',
  methods: ['GET','POST'],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204 
}

//Cors, Server needs to have cors rights to be able to serv
//http and get request from two different sources. Web safety system
app.use(cors(corsOptions))
app.use(express.json({ limit: '1mb' }))
//Body parser to parse incoming POST() from client
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(function(req,res,next) {
  req.connection.setNoDelay(true)
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Credentials", true);
      res.header("Access-Control-Allow-Origin", "https://tsw-job-generator.herokuapp.com"); 

  res.header('Access-Control-Expose-Headers', 'agreementrequired');

  next()
})

//Simple server page
app.get('/', (req, res) => {
  res.send('<h1>TSW Timetable server</h1>')
})

//Client get requests, /api
app.get('/api', (req, res) => {
  FindServices().then(data => {
    res.json(data)
  }) 
})

//Client requests new query from database
app.post('/loadQuery', (req, res) => {
  console.log("Client requests route: " + req.body.route + " and a loco of " + req.body.loco)
  const response = ServerResponse(req.body.route, req.body.loco)
  response.then(timeTableReady => res.json(timeTableReady))
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

//***********************************************//
//SERVER RESPONSE ROUTINE//

async function ServerResponse(reqRoute, reqLoco) {
  const services = await FindServices(reqRoute, reqLoco)
  const newService = GetNewRandomTimetable(services)
  const timetable = await GetTimetableForService(newService.id)
  console.log(timetable)
  const response = {
    service: newService,
    timetable: timetable
  }
  return response
}

//***********************************************//

function FindServices(aRoute, aLoco) {
  timetableQuery.route = aRoute;
  timetableQuery.loco = aLoco;
  
  return new Promise((resolve, reject) => {
    db.find({ $and: [{ route: timetableQuery.route, loco:timetableQuery.loco }] }, function (err, docs) {
      if (err) {
        reject(err);
       }
       resolve(docs)
    })
    
  })
}

function GetTimetableForService(aService){
  const path = './rawdata/Peninsula/tb/json/'
  const filename = aService + '.json'
  return new Promise((resolve, reject) => {
    file.ReadJsonFile(path, filename)
      .then(data => {
        resolve(data)
      })
  })
}


//Server start routine. Handles loading database. 
//
async function ServerStartRoutine() {

  
  console.log(`Loading database services.db `)
  const loadResult = await LoadDatabase("services.db")
 
  const wait3 = await WaitUntil(1000, `DB ${loadResult} loaded. Ready for data requests`)
  console.log(wait3) 
  
}

//LoadDatabase function
//Returns promise. Posts database name when ready
function LoadDatabase(file) {
  return new Promise((resolve, reject) => {
    db = new Datastore({ filename: dataPath + file })
    db.loadDatabase((err) => {    // Callback is optional
      if (err) reject("error at loading database, errorcode: " + err)
      else resolve(file)
    })
  })
} 


function GetNewRandomTimetable(timetableArray) {
  const random = Math.floor(Math.random() * timetableArray.length);
  return timetableArray[random]
}



function WaitUntil(time, routine) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(routine), time)
  })
}

//Start call
ServerStartRoutine()