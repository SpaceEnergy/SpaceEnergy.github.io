let number = 0;

document.getElementById("addOne").addEventListener("click", function() {
    number += 1;
    document.getElementById("display").value = number;
})
document.getElementById("addTen").addEventListener("click", function() {
    number += 10;
    document.getElementById("display").value = number;
})
document.getElementById("addHundred").addEventListener("click", function() {
    number += 100;
    document.getElementById("display").value = number;
})