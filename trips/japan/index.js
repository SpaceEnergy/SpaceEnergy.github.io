document.addEventListener("DOMContentLoaded", () => {
    fetch('/images/japan/images.json')
        .then(response => response.json())
        .then(data => {
            Object.keys(data).forEach(location => {
                const grid = document.querySelector(`#${location} .grid`);
                if (!grid) return;
                data[location].forEach(filename => {
                    const imgPath = `/images/japan/${location}/${filename}`;
                    const card = document.createElement("div");
                    card.className = "card";
                    card.innerHTML = `
                        <a href="${imgPath}">
                            <div class="img">
                                <span><img src="/images/expande.svg"></span>
                                <img src="${imgPath}">
                            </div>
                        </a>
                    `;
                    grid.appendChild(card);
                });
            });
        });
});