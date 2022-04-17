const arr = [ 12]
console.log(arr.length)
const initialValue = "^" 
if (arr.length > 1) {
  const reduced = arr.reduce(
    (prev, curr) => prev + curr + "|", initialValue)
  
  console.log(reduced)
}
