async function fetchLatestRelease() {
    const urls = [
        { url: 'https://spaceenergy.github.io/version-discord.txt', elementId: 'discord' },
        { url: 'https://spaceenergy.github.io/version-steam.txt', elementId: 'steam' },
    ];

    try {
        const responses = await Promise.all(urls.map(({ url }) => fetch(url)));
        
        for (const [index, response] of responses.entries()) {
            if (!response.ok) throw new Error('error');
            const versionText = await response.text();
            document.getElementById(urls[index].elementId).textContent = versionText;
        }
    } catch (error) {
        console.error(error);
    }
}

fetchLatestRelease();
