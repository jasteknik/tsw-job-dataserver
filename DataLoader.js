const fs = require('fs')
const Datastore = require('nedb');
const File = require('./Modules/file')

let dataArray = []
const routeDBPath = './data/services.db'

//new neDB datastore
const routeBase = new Datastore(routeDBPath); 
const locoBase = new Datastore( './Data/locos.db'); 

function NewEntryObject(aId, aRoute, aService, aLoco, aOrigin, aDestination, aType, aDepartureTime, aTraveltime) {
  return {
    id: aId,
    route: aRoute,
    service: aService,
    loco: aLoco,
    origin: aOrigin,
    destination: aDestination,
    type: aType,
    departureTime: aDepartureTime,
    traveltime: aTraveltime
  }
}

function NewTimetableObject(aId, aStop, aArrival, aDeparture) {
  return {
    id: aId,
    stop: aStop,
    arrival: aArrival,
    departure: aDeparture
  }
}

function NewRouteListItem(aId, aName, aServices, aLocos, aFreight, aPassanger) {
  return {
    id: aId,
    name: aName,
    services: aServices,
    locos: aLocos,
    freight: aFreight,
    passanger: aPassanger
  }
}

//all route IDs
let routeList = ['SKA']

//MAIN PROG CALLS
async function Loop() {
  
  //Onko DB jo olemassa
  
  routeBase.loadDatabase(); 

  //Luetaan CSV tiedosto
  dataArray = await File.ReadFromFile('./rawdata/', 'ROUTEBASE.CSV')
  
  //Luetaan rivit taulukkoon
  const arrayForDB = await ReadLine(dataArray)

  //Vastaukset valmiina, asetetaan DB
  const insertDBCall = await InsertDatabase(arrayForDB)
  console.log(insertDBCall)

  //TIMETABLE CSV TO JSONS//
  const pathToCSV = './rawdata/Peninsula/tb/csv/'
  const pathToJson = './rawdata/Peninsula/tb/json/'

  const filesInCsvFolder = await FindAllFilesInFolder(pathToCSV)
  console.log(filesInCsvFolder)
  
  let fileArray
  let jsonForFile
  let toFile
  let routeListItemArray = []

  let jsonFileNames = filesInCsvFolder.map(filename => {
    const string = filename.toString().substr(0, filename.indexOf(' -'))
    return string})
  
  //console.log(pathToJson + jsonFileNames[0] + ".json")

  for (i in jsonFileNames){
    let jsonFileName = jsonFileNames[i]
    fileArray = await File.ReadFromFile(pathToCSV, filesInCsvFolder[i])
    //console.log("Array file ready " + filesInCsvFolder[i])

    jsonToFile = await ConvertArrayToJson(fileArray)
    //console.log("Json file ready " + pathToJson + currentFile + ".json")

    toFile = await File.WriteToJsonSync(pathToJson, jsonFileName, jsonToFile)
    console.log(toFile + jsonFileName + ".json")
  }

  const pathToRouteListJson = './rawdata/Route/'
  const fileName = 'routeList'

  for (i in routeList) {
    let currentRoute = routeList[i]
    let wait
    const serviceCount = await DatabaseCount(currentRoute)
    
    wait = await WaitUntil(1000, `Servicecount ${serviceCount} is calculated`)
    console.log(wait)

    const docs = await DatabaseFind(currentRoute)

    wait = await WaitUntil(1000, `docs is calculated`)
    console.log(wait)

    const locoArray = await CreateLocoArray(docs)

    wait = await WaitUntil(1000, `locoArray ${locoArray} is calculated`)
    console.log(wait)

    const serviceItem = CreateServiceFile(currentRoute, serviceCount, locoArray)
    console.log(serviceItem)
    routeListItemArray.push(serviceItem)
  }
  
  //Write routelist.json from the json array of routeListItemArray
  const writeRouteListToJson = await File.WriteToJsonSync(pathToRouteListJson, fileName, routeListItemArray)
  console.log(writeRouteListToJson + "for " + fileName + ".json")
  
  
}


function FindAllFilesInFolder(path) {
  return new Promise((resolve, reject) => {
    File.ListFolder(path).then(response => {
      //console.log("Files in folder " + response)
      resolve(response)})
  })
}

function CheckIfFileExists(){
  return new Promise((resolve, reject) => {
    try {
      if (fs.existsSync(routeDBPath)) {
        //file exists
        console.log("YAY")
        resolve(1)
      }
    } catch(err) {
      console.log("NEI")
      console.error(err)
    }
  })
}

//Alifunktiot
function ReadFromFile() {
  return new Promise((resolve, reject) => {
    fs.readFile('./rawdata/Peninsula/trains', 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
      resolve(data.toString().split("\n"))
    });
  })
}

function ReadLine(entry) {
  return new Promise((resolve,reject) => {
    let readyToBeInsertedArray = []
    let entryObject
    for (i in entry) {
      const dataEntry = entry[i].toString().split(",")
      IsRouteOnList(dataEntry[1]) //Update routeList -array

      const locoArray = dataEntry[3].toString().split(" / ")
      entryObject = NewEntryObject(
        dataEntry[0],   //id
        dataEntry[1],   //route
        dataEntry[2],   //service
        locoArray,      //loco
        dataEntry[4],   //origin
        dataEntry[5],   //dest
        dataEntry[6],   //type
        dataEntry[7],   //departure
        dataEntry[8]    //traveltime
      )
      //console.log(routeEntry)
      readyToBeInsertedArray.push(entryObject)
      
    }
    resolve(readyToBeInsertedArray) 
  })
  
}

function ConvertArrayToJson(entry) {
  return new Promise((resolve,reject) => {
    let timetableArray = []
    let timetableObject
    for (i in entry) {
      const dataEntry = entry[i].toString().split(",")
      //console.log(dataEntry[0])
      const route = dataEntry[1].toString().split(" - ")
      timetableObject = NewTimetableObject(
        dataEntry[0], //id
        dataEntry[2], //stop
        dataEntry[3], //arrival
        dataEntry[4]  //departure
      )
      //console.log(routeEntry)
      timetableArray.push(timetableObject)
      
    }
    resolve(timetableArray) 
  })
  
}

function InsertDatabase(arrayToDB) {
  return new Promise((resolve, reject) => {
    for (i in arrayToDB) {
      //console.log(aEntry[i])
      routeBase.insert(arrayToDB[i], function(err, doc) {
        //console.log('Inserted', doc.train, 'with ID', doc._id);
      });
    }
    resolve("Insert done!")
  }) 
}

function CreateServiceFile(aRoute, aServiceCount, aLocoArray) {

  const routeListItem = NewRouteListItem(
    aRoute,                 //ID
    'routename',            //Name
    aServiceCount,          //Services
    aLocoArray,             //Locos
    'Yes',                  //Freight
    'Yes'                   //Passanger
  )

  return routeListItem
}

function CreateLocoArray(docs) {
  return new Promise((resolve, reject) => {
    let locoArray = []
  
    docs.map(element => {
      
      element.loco.map(item => {
        locoArray.push(item)
      })
    })

    const unique = (value, index, self) => {
      return self.indexOf(value) === index
    }

    const uniqueLocos = locoArray.filter(unique)
    console.log(uniqueLocos)
    resolve(uniqueLocos)
  })
}

function DatabaseCount(aRoute) {
  return new Promise((resolve, reject) => {
    routeBase.count({ route: aRoute}, (err, count) => {
      resolve(count)})
  })
}

function DatabaseFind(aRoute) {
  return new Promise((resolve, reject) => {
    routeBase.find({ route: aRoute}, (err, docs) => {
      resolve(docs)
    })
  })
}

function IsRouteOnList(routeId) {

  let foundItem = 0
  console.log("lets check " + routeId) 
  routeList.forEach(element => {
    if(element == routeId) { foundItem = foundItem + 1 }     
  });

  if (foundItem == 0) { routeList.push(routeId)}
  console.log(routeList)
}

function WaitUntil(time, routine) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(routine), time)
  })
}

//MAIN LOOP
Loop();

