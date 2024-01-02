let number = 0;
const display = document.getElementById("display");

document.getElementById("removeOne").addEventListener("click", function() {
    number --;
    display.value = number;
})
document.getElementById("reset").addEventListener("click", function() {
    number = 0;
    display.value = this.ariaPlaceholder;
})
document.getElementById("addOne").addEventListener("click", function() {
    number ++;
    display.value = number;
})