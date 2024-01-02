let number = 0;

document.getElementById("addOne").onclick = function() {
    number++;
    document.getElementById("display").value = number;
}