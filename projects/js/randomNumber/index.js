const min = 0;
const max = 200;

document.getElementById("random").addEventListener("click", function() {
    display.value = Math.floor(Math.random() * (max - min));
});