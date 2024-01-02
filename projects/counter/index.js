let count = 0;
const display = document.getElementById("display");

document.getElementById("removeOne").addEventListener("click", function() {
    count --;
    display.value = count;
})
document.getElementById("reset").addEventListener("click", function() {
    count = 0;
    display.value = this.ariaPlaceholder;
})
document.getElementById("addOne").addEventListener("click", function() {
    count ++;
    display.value = count;
})