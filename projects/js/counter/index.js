let count = 0;
const display = document.getElementById("display");

document.getElementById("addOne").addEventListener("click", function() {
    count ++;
    display.value = count;
    if (count === 0) {
        display.value = this.ariaPlaceholder;
    }
})
document.getElementById("removeOne").addEventListener("click", function() {
    count --;
    display.value = count;
    if (count === 0) {
        display.value = this.ariaPlaceholder;
    }
})
document.getElementById("reset").addEventListener("click", function() {
    count = 0;
    display.value = this.ariaPlaceholder;
})