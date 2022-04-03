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

  let jsonFileNames = filesInCsvFolder.map(filename => {
    const string = filename.toString().substr(0, filename.indexOf(' -'))
    return string})
  
  //console.log(pathToJson + jsonFileNames[0] + ".json")

  for (i in jsonFileNames){
    let currentFile = jsonFileNames[i]
    fileArray = await File.ReadFromFile(pathToCSV, filesInCsvFolder[i])
    //console.log("Array file ready " + filesInCsvFolder[i])

    jsonForFile = await ConvertArrayToJson(fileArray)
    //console.log("Json file ready " + pathToJson + currentFile + ".json")

    toFile = await File.WriteToJsonSync(pathToJson, currentFile , jsonForFile)
    console.log(toFile + currentFile + ".json")
  }
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
      const locoArray = dataEntry[3].toString().split(" / ")
      console.log(locoArray)
      //console.log(dataEntry[0])
      entryObject = NewEntryObject(
        dataEntry[0],   //id
        dataEntry[1],   //route
        dataEntry[2],   //service
        locoArray,   //loco
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


//MAIN LOOP
Loop();

