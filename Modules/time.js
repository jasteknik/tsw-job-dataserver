//const time = "14:43:30"
//const updatedTime = AddTime(time, 1, 29)
//updatedTime.then(update => console.log("Updated time is: "  + update) )


function AddTime(currentTime, aHour, aMinutes) {
  return new Promise((resolve, reject) => {
    const time = currentTime.toString().split(":")

    const hour = parseInt(time[0]) + parseInt(aHour)
    const minutes = parseInt(time[1]) + parseInt(aMinutes)

    //console.log(`Current time is: ${currentTime} lets add ${aHour} hours and ${aMinutes} minutes`)

    const convertedTime = CheckTime(hour, minutes)

    convertedTime.then(time => {
      //console.log("new time is " + time)
      resolve(time)})
  })
  
}

function SubtractTime(currentTime, aHour, aMinutes) {
  return new Promise((resolve, reject) => {
    //time[0] hour, time[1] minutes
    const time = currentTime.toString().split(":")

    const hour = parseInt(time[0]) - aHour
    const minutes = parseInt(time[1]) - aMinutes

    //console.log(`Current time is: ${currentTime} lets subtract ${aHour} hours and ${aMinutes} minutes`)

    const convertedTime = CheckTime(hour, minutes)

    convertedTime.then(time => {resolve(time)})
    
  })
}

function CheckTime(aHour, aMinutes) {
  return new Promise((resolve, reject) => {
    let hour = undefined
    let minutes = undefined

    //Check hours are within limits and adjust
    if (aHour > 23 ) { hour = aHour - 24}
    if (aHour < 0 ) { hour = aHour + 24}

    //Check minutes are within limits and adjust
    if (aMinutes > 60 ) { 
      minutes = aMinutes - 60
      if(hour == undefined){
        hour = aHour + 1 }
        else { hour = hour + 1}
    }

    if (aMinutes < 0) {
      minutes = aMinutes + 60
      if(hour == undefined){
        hour = aHour - 1 }
        else { hour = hour - 1} 
    }

    //Check hours again after minute adjust...
    if (hour > 23 || hour < 0 ) { hour = 0}

    //console.log(hour +  " sss " + minutes)
    //Check if hours and minutes are defined. And then push to array
    if (hour == undefined) { hour = aHour}
    if (minutes == undefined) { minutes = aMinutes}

    const timeArray = []
    timeArray.push(hour)
    timeArray.push(minutes)

    const convertedString =  ConvertTimeBackToString(timeArray)
    convertedString.then(cString => {resolve(cString)})
  })
  
}

function ConvertTimeBackToString(timeArray) {
  return new Promise((resolve, reject) => {
    let hours = timeArray[0]
    let minutes = timeArray[1]
    
    //No need to add leading zeros
    if (hours > 9 && minutes > 9) { resolve(hours + ":" + minutes)}

    //Add leading zeros
    if (minutes < 10 ) { 
      minutes = ('00' + minutes).slice(-2)
    }
    
    //Add leading zeros
    if (hours < 10 ) { 
      hours = ('00' + hours).slice(-2)
    }
    resolve(hours + ":" + minutes)
  })

}

function TimeStringToArray(timeString) {
  return new Promise((resolve, reject) => {
    array = timeString.toString().split(":")
    resolve(array)
  })
  
}
 
function ConvertToFourDigits(timeToConvert) {
  return new Promise((resolve, reject) => {
    const time = timeToConvert.toString().split(":")
    fourDigitTime = time[0] + time[1]
    resolve(time)
  })
}

module.exports = {
  AddTime: AddTime,
  SubtractTime: SubtractTime,
  TimeStringToArray: TimeStringToArray,
  ConvertToFourDigits: ConvertToFourDigits

}