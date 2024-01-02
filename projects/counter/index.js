let number = 0;

document.getElementById("removeOne").addEventListener("click", function() {
    number --;
    document.getElementById("display").value = number;
})
document.getElementById("reset").addEventListener("click", function() {
    number = 0;
    document.getElementById("display").value = this.ariaPlaceholder;
})
document.getElementById("addOne").addEventListener("click", function() {
    number ++;
    document.getElementById("display").value = number;
})