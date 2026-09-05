document.addEventListener("DOMContentLoaded", () => {
    const viewer = document.createElement("div");
    viewer.className = "media-viewer";
    viewer.innerHTML = `
        <div class="viewer-backdrop"></div>
        <button class="viewer-close" aria-label="Close">×</button>
        <button class="viewer-nav prev" aria-label="Previous">‹</button>
        <div class="viewer-stage"></div>
        <button class="viewer-nav next" aria-label="Next">›</button>
    `;
    document.body.appendChild(viewer);

    let allItems = [];
    let activeItems = [];
    let activeIndex = 0;
    let activeLocation = '';
    let touchStartX = 0;

    const stage = viewer.querySelector(".viewer-stage");
    const backdrop = viewer.querySelector(".viewer-backdrop");
    const closeButton = viewer.querySelector(".viewer-close");
    const nextButton = viewer.querySelector(".viewer-nav.next");
    const prevButton = viewer.querySelector(".viewer-nav.prev");

    function parseTimestamp(filename) {
        const match = filename.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
        if (!match) return Number.MAX_SAFE_INTEGER;
        const [, year, month, day, hour, minute, second] = match;
        return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
    }

    function sortItems(items) {
        return [...items].sort((a, b) => {
            const aName = (typeof a === 'string' ? a : a.src || '').toString();
            const bName = (typeof b === 'string' ? b : b.src || '').toString();
            return parseTimestamp(aName) - parseTimestamp(bName);
        });
    }

    function renderViewer() {
        if (!activeItems.length) {
            stage.innerHTML = "";
            viewer.classList.remove("active");
            document.body.classList.remove("viewer-open");
            return;
        }

        const item = activeItems[activeIndex];
        const media = typeof item === 'string' ? { type: 'image', src: item } : item;
        const filename = media.src || '';
        const isVideo = media.type === 'video' || /\.(mp4|mov|m4v|mkv|webm|avi|mpeg|mpg)$/i.test(filename);
        const mediaPath = `/images/japan/${media.location}/${filename}`;

        stage.innerHTML = `
            <div class="viewer-media">
                ${isVideo
                    ? `<video src="${mediaPath}" poster="${mediaPath.replace(/\.webm$/i, '.poster.webp')}" controls autoplay playsinline></video>`
                    : `<img src="${mediaPath}" alt="">`
                }
            </div>
        `;

        viewer.classList.add("active");
        document.body.classList.add("viewer-open");
    }

    function openViewer(items, startIndex, location) {
        activeItems = sortItems(items);
        activeIndex = startIndex;
        activeLocation = location;
        renderViewer();
    }

    function openGlobalViewer(startIndex) {
        activeItems = [...allItems];
        activeIndex = startIndex;
        activeLocation = '';
        renderViewer();
    }

    function showNext() {
        if (!activeItems.length) return;
        activeIndex = (activeIndex + 1) % activeItems.length;
        renderViewer();
    }

    function showPrev() {
        if (!activeItems.length) return;
        activeIndex = (activeIndex - 1 + activeItems.length) % activeItems.length;
        renderViewer();
    }

    function closeViewer() {
        viewer.classList.remove("active");
        document.body.classList.remove("viewer-open");
        stage.innerHTML = "";
        activeItems = [];
        activeIndex = 0;
    }

    function handleViewerClick(event) {
        if (event.target.closest(".viewer-nav, .viewer-close, img, video")) return;
        closeViewer();
    }

    backdrop.addEventListener("click", handleViewerClick);
    viewer.addEventListener("click", handleViewerClick);
    closeButton.addEventListener("click", closeViewer);
    nextButton.addEventListener("click", showNext);
    prevButton.addEventListener("click", showPrev);

    viewer.addEventListener("touchstart", (event) => {
        touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });

    viewer.addEventListener("touchend", (event) => {
        const touchEndX = event.changedTouches[0].clientX;
        const delta = touchEndX - touchStartX;
        if (delta > 50) showPrev();
        if (delta < -50) showNext();
    }, { passive: true });

    window.addEventListener("keydown", (event) => {
        if (!viewer.classList.contains("active")) return;
        if (event.key === "Escape") closeViewer();
        if (event.key === "ArrowRight") showNext();
        if (event.key === "ArrowLeft") showPrev();
    });

    fetch('/images/japan/media.json')
        .then(response => response.json())
        .then(data => {
            const sections = [];
            const sectionOrder = Array.from(document.querySelectorAll('[id]'))
                .map(section => section.id)
                .filter(id => Object.prototype.hasOwnProperty.call(data, id));

            sectionOrder.forEach(location => {
                const grid = document.querySelector(`#${location} .grid`);
                if (!grid) return;

                const sortedItems = sortItems(data[location]);
                sortedItems.forEach((item) => {
                    const media = typeof item === 'string'
                        ? { type: 'image', src: item }
                        : item;

                    const filename = media.src || '';
                    const isVideo = media.type === 'video' || /\.(mp4|mov|m4v|mkv|webm|avi|mpeg|mpg)$/i.test(filename);
                    const mediaPath = `/images/japan/${location}/${filename}`;
                    const posterPath = `/images/japan/${location}/${filename.replace(/\.webm$/i, '.poster.webp')}`;
                    const entry = {
                        ...media,
                        location,
                        src: filename,
                        type: media.type || (isVideo ? 'video' : 'image')
                    };

                    sections.push(entry);

                    const card = document.createElement("div");
                    card.className = "card";
                    card.innerHTML = `
                        <a href="#" class="media-link">
                            <div class="img">
                                ${isVideo ? '<span class="left"><img src="/images/video.svg" alt=""></span>' : ''}
                                <span><img src="/images/expande.svg" alt=""></span>
                                ${isVideo
                                    ? `<video src="${mediaPath}" poster="${posterPath}" muted playsinline preload="metadata"></video>`
                                    : `<img src="${mediaPath}" loading="lazy" alt="" decoding="async">`}
                            </div>
                        </a>
                    `;

                    const link = card.querySelector("a");
                    link.addEventListener("click", (event) => {
                        event.preventDefault();
                        const globalIndex = allItems.findIndex(itemEntry => itemEntry.src === entry.src && itemEntry.location === entry.location);
                        openGlobalViewer(globalIndex >= 0 ? globalIndex : 0);
                    });

                    grid.appendChild(card);
                });
            });

            allItems = sections.map(item => ({ ...item, location: item.location }));
        });
});