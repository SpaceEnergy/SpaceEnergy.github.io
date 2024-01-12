let count = 0;
const display = document.getElementById("display");

document.getElementById("addOne").addEventListener("click", function() {
    count ++;
    display.value = count;
})
document.getElementById("removeOne").addEventListener("click", function() {
    count --;
    display.value = count;
})
document.getElementById("reset").addEventListener("click", function() {
    count = 0;
    display.value = this.ariaPlaceholder;
})



let x = 3;
let y = 2;
let z = 1;

let max = Math.max(x, y, z);

console.log(max)