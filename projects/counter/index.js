let number = 0;

document.getElementById("addOne").onclick = function() {
    number += 1;
    document.getElementById("display").value = number;
}
document.getElementById("addTen").onclick = function() {
    number += 10;
    document.getElementById("display").value = number;
}
document.getElementById("addHundred").onclick = function() {
    number += 100;
    document.getElementById("display").value = number;
}