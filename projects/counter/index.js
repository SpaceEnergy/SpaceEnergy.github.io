let number = 0;

document.getElementById("removeOne").addEventListener("click", function() {
    number -= 1;
    document.getElementById("display").value = number;
})
document.getElementById("reset").addEventListener("click", function() {
    number = 0;
    document.getElementById("display").value = number;
})
document.getElementById("addOne").addEventListener("click", function() {
    number += 1;
    document.getElementById("display").value = number;
})