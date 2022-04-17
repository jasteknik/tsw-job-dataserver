const cors = require ('cors')
const express = require('express')
const app = express()
const Datastore = require('nedb')
const bodyParser = require('body-parser')
const { resolve } = require('path')
const file = require('./Modules/file')
const time = require('./Modules/time')
const { Console } = require('console')

let db
const dataPath = './data/'

const timetableQuery = {
  route: '',
  loco: '',
  type: '',
  origin: '',
  departureTime: ''
}

const corsOptions = {
  origin: '*'
 // methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT'],
  //credentials:true,
  //optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204 
}
//Cors, Server needs to have cors rights to be able to serv
//http and get request from two different sources. Web safety system
app.use(cors(corsOptions))
app.options('/loadQuery', cors(corsOptions)) // include before other routes

app.use(express.json({ limit: '1mb' }))
//Body parser to parse incoming POST() from client
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

//Simple server page
app.get('/', (req, res) => {
  res.send('<h1>TSW Timetable server!</h1>')
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
  const response = ServerResponse(req.body.route, req.body.loco, '.') //req.body.departureTime, add!
  response.then(timeTableReady => res.json(timeTableReady))
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

//***********************************************//
//SERVER RESPONSE ROUTINE//

async function ServerResponse(reqRoute, reqLoco, reqDeparture) {
  try {
    const reqType = '.'
    const reqOrigin = '.'
    const services = await FindServices(reqRoute, reqLoco, reqType, reqOrigin,  reqDeparture)
    const newService = GetNewRandomTimetable(services)
    console.log(newService)
    const timetable = await GetTimetableForService(newService.id)
    console.log(timetable)
    const response = {
      service: newService,
      timetable: timetable
    }
    return response
  } catch{ console.log("ServerResponse Throw error")}
}


//***********************************************//
//SERVER RESPONSE ROUTINE FOR JOB//

async function ServerResponseJobList(reqRoute, reqLoco, reqDeparture, reqJobLength) {
  const serviceList = []
  const timetableList = []

  let jobLength = reqJobLength
  console.log("Starting")
 // try {
    //Starting point for job!
    const servicesMatchingInitialQuery = await FindServices(reqRoute, reqLoco, '.', '.',  '.')
   
    const wait2 = await WaitUntil(1000, `Starting initial query !!`)
    console.log(wait2) 
    
    //Starting service for route
    const startingService = GetNewRandomTimetable(servicesMatchingInitialQuery)

    const wait1 = await WaitUntil(1000, `Starting Service is ${startingService.service}`)
    console.log(wait1) 
    
    let nextService, filteredServiceList, startTime, fourDigitTime
    let jobServices, jobNewService, jobTimetable
    //Define starting point for job routing
    let nextStation = startingService.destination
    let nextStationDepartureTime = startingService.departureTime
    let nextStationTraveltime = startingService.traveltime

    do  {
      let trimmedStartTime = []
      nextService = await TrimOriginString(nextStation)
      startTime = await StartinTimeForJob(nextStationDepartureTime, nextStationTraveltime, 15)
      fourDigitTime = await time.ConvertToFourDigits(startTime)
      trimmedStartTime.push(fourDigitTime[0]) //Hour
      //add next hour too in the array for search
      let startTimePlusOneHour = await time.AddTime(startTime, 1, 0)
      fourDigitTime = await time.ConvertToFourDigits(startTimePlusOneHour)
      trimmedStartTime.push(fourDigitTime[0]) //Hour

      jobServices = await FindServices(reqRoute, '.', '.', nextService,  trimmedStartTime)
      if (jobServices == null) break
      filteredServiceList = await FilteredServiceListByTime(jobServices, fourDigitTime)
      console.log("Filtered list " + filteredServiceList)
      jobNewService = GetNewRandomTimetable(jobServices)
      console.log("New service is " + jobNewService.id)
      jobTimetable = await GetTimetableForService(jobNewService.id)
      
      serviceList.push(jobNewService)
      timetableList.push(jobTimetable)
      jobLength = jobLength - 1

      //Prepare next search:
      console.log("jobLength is " + jobLength)
      nextStation = jobNewService.destination
      nextStationDepartureTime = jobNewService.departureTime
      nextStationTraveltime = jobNewService.traveltime

    } while (jobLength != 0)
    
    const response = {
      service: serviceList,
      timetable: timetableList
    }

    return response
 // } catch{ console.log(err)}
}

//***********************************************//

function StartinTimeForJob(departureTime, travelTime, setupTime) {
  return new Promise((resolve, reject) => {

    let hour = 0
    let minutes = 0
  
    const arrayTime = time.TimeStringToArray(travelTime)
    arrayTime.then(array => {
      hour = array[0]
      minutes = array[1]

      //console.log(".Addtime " + departureTime + " and trave " + hour + " and "+ minutes)
      const arrivalTime = time.AddTime(departureTime, hour, minutes)
        arrivalTime.then(aTime => {
        const  readyTime = time.AddTime(aTime, 0, setupTime)
        readyTime.then(rdyTime => {
          console.log(".readyTime is " + rdyTime)
          resolve(rdyTime)})
      })
    })
  })
}

function TrimOriginString(origin) {
  return new Promise((resolve, reject) => {

    let trimmedOrigin = undefined

    if (origin.indexOf('Platform') > -1) {trimmedOrigin = origin.split(' Platform')}
    if (origin.indexOf('siding') > -1) {trimmedOrigin = origin.split(' siding')}
    if (origin.indexOf('Siding') > -1) {trimmedOrigin = origin.split(' Siding')}
    
    if (trimmedOrigin != undefined) {resolve(trimmedOrigin[0])}

    console.log("TrimOriginString " + origin)
    resolve(origin)
  })
  
} 

function FindServices(aRoute, aLoco, aType, aOrigin, aDepartureTime) {
  
  timetableQuery.route = aRoute;
  timetableQuery.loco = aLoco;
  timetableQuery.type = aType
  timetableQuery.origin = aOrigin
  if (aDepartureTime.length > 1) {
    timetableQuery.departureTime = "^" + aDepartureTime[0] + "|^" + aDepartureTime[1] 
  } else {
    timetableQuery.departureTime = "^" + aDepartureTime[0]
  }

  console.log(timetableQuery)

  return new Promise((resolve, reject) => {
    db.find({ $and: [{ 
      route: timetableQuery.route, 
      loco: new RegExp(timetableQuery.loco), 
      type: new RegExp(timetableQuery.type),
      origin: new RegExp(timetableQuery.origin),
      departureTime: new RegExp(timetableQuery.departureTime) 
      }] }, function (err, docs) {
        //console.log(docs)
        if (err) reject(err)
        if (docs.length != 0) resolve(docs)
        //No sercvices found
        resolve(null)
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
  
  const response = await ServerResponseJobList("SFJ", "F40PH-2CAT", "07:00", 2)
  console.log("Exit loop " + response)
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

function FilteredServiceListByTime(serviceList, startingTime) {
  return new Promise((resolve, reject) => {
    let srvDepartureTime, filteredServiceList
    const sTime = startingTime[0] + startingTime[1]
    serviceList.map(item => {
      console.log(item)
      srvDepartureTime = time.ConvertToFourDigits(item.departureTime)
      srvDepartureTime = srvDepartureTime[0] + srvDepartureTime[1]
      if(parseInt(sTime) < parseInt(srvDepartureTime)) {
        filteredServiceList.push(item)
      }
    resolve(filteredServiceList)
    })
  /* startingTime == edellisen servicen loppuaika
  1. map kaikki listan itemit
  2. filteroi uusi lista startingTime perusteella.
  2.5 item.departureTime => fourDigitTime? Samoiten kuin startingTime?
  3. Käy läpi jokainen item, chekkaa onko startingTime < item.departureTime
        startingTime 1250, departureTime 1300, Läpi
        startingTime 1250, departureTime 1200 , Ei läpi
  4. Tallenna läpi menneet uuteen listaan. Palauta tämä lista!
   */
  })
}


function WaitUntil(time, routine) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(routine), time)
  })
}

//Start call
ServerStartRoutine()