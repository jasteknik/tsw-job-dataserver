const fs = require('fs')

function WriteToJson(fileName ,toFile) {
  
  const file = "./responses/" + fileName +  ".json"
  const json = JSON.stringify(toFile, null, 2)
    fs.writeFile(file, json,
      (error) => {
        if (error) console.log("Error on writing file: ", error)
        //else console.log("Writing file " + file)
        })
}

function WriteToJsonSync(path, fileName ,toFile) {
  return new Promise((resolve, reject) => {
    console.log("Write file to sync starting")
    const file = path + fileName + '.json'
    const json = JSON.stringify(toFile, null, 2)
    fs.writeFile(file, json, (error) => {
      if (error) reject("File write error")
      else resolve("File write done!")
    })
   })
  }

function WriteToText(folder, fileName ,toFile, append) {
  
  const file = folder + fileName
  const text = toFile
  if (append) {
    fs.appendFile(file, text,
      (error) => {
        if (error) console.log("Error appending on file: ", error)
        else console.log("Updating file " + file)
        })
  }
  else {
    fs.writeFile(file, text,
      (error) => {
        if (error) console.log("Error on writing file: ", error)
        //else console.log("Writing file " + file)
        })
    }
}

//return as promise. When data is ready to be read
function ReadFromFile(path, fileName) { 
  return new Promise((resolve, reject) => {
    const file = path + fileName
    console.log("Starting read file " + file)
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) reject('error on reading file: ' + file)
      resolve(data.toString().split("\r\n"))
    })
  })
}

function ReadJsonFile(path, fileName) {
  return new Promise((resolve, reject) => {
    const pathToJsonFile = path + fileName
   // const jsonFile = fs.readFileSync(err, pathToJsonFile);
   // if (err) reject('error on reading file: ' + pathToJsonFile)
   // resolve(JSON.parse(jsonFile))

    try{
      const jsonFile = fs.readFileSync(pathToJsonFile)
      resolve(JSON.parse(jsonFile))
    } catch (err) {
      reject(err)
    }
  })
}

function ListFolder(path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, files) => resolve(files))
  })
}

function CopyFile(src, dest) {
  return new Promise((resolve, reject) => {
    // destination.txt will be created or overwritten by default.
    fs.copyFile(src, dest, (err) => {
      if (err) reject(err);
      else resolve(`${src} was copied to ${dest}`)
    })
  })
}

module.exports = {
  WriteToJson: WriteToJson,
  WriteToJsonSync: WriteToJsonSync,
  WriteToText: WriteToText,
  ReadFromFile: ReadFromFile,
  ReadJsonFile: ReadJsonFile,
  ListFolder: ListFolder,
  CopyFile: CopyFile
  
}