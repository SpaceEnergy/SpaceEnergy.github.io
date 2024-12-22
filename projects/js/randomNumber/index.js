const display = document.getElementById("display");

document.getElementById("random").addEventListener("click", function() {
    const min = Math.ceil(document.getElementById("min").value);
    const max = Math.floor(document.getElementById("max").value);
    
    display.value = Math.floor(Math.random() * (max - min + 1)) + min;
});