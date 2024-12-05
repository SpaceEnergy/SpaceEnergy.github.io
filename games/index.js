const STEAM_API_KEY = 'api_key';
const STEAM_ID = '76561199251838449';

const gameNamesCache = new Map();

function formatHours(minutes) {
    if (!minutes) return '0 hrs';
    const hours = Math.floor(minutes / 60);
    return hours.toLocaleString() + ' hrs';
}

function formatLastPlayed(timestamp) {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

async function loadGameNames() {
    try {
        const response = await fetch('https://corsproxy.io/?https://api.steampowered.com/ISteamApps/GetAppList/v0002/?format=json');
        const data = await response.json();
        
        if (data && data.applist && data.applist.apps) {
            data.applist.apps.forEach(app => {
                if (app.name) {
                    gameNamesCache.set(app.appid.toString(), app.name);
                }
            });
        }
    } catch (error) {
        console.error('Error loading game names:', error);
    }
}

function getGameName(appId) {
    return gameNamesCache.get(appId.toString()) || 'Unknown Game';
}

async function getAchievements(appId) {
    try {
        const response = await fetch(`https://corsproxy.io/?https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appId}&key=${STEAM_API_KEY}&steamid=${STEAM_ID}`);
        const schemaResponse = await fetch(`https://corsproxy.io/?https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?appid=${appId}&key=${STEAM_API_KEY}`);
        
        const data = await response.json();
        const schemaData = await schemaResponse.json();
        
        if (data.playerstats && data.playerstats.success && schemaData.game) {
            const achievements = data.playerstats.achievements;
            const achievementSchema = schemaData.game.availableGameStats?.achievements || [];
            
            return {
                total: achievements.length,
                completed: achievements.filter(a => a.achieved).length,
                details: achievementSchema.map((schema, index) => ({
                    name: schema.displayName || schema.name,
                    description: schema.description || '',
                    icon: schema.icon,
                    achieved: achievements[index]?.achieved || false
                }))
            };
        }
        return null;
    } catch (error) {
        console.error(`Error fetching achievements for game ${appId}:`, error);
        return null;
    }
}

async function createGameCard(game) {
    const gameName = await getGameName(game.appid);
    const achievements = await getAchievements(game.appid);

    const MAX_VISIBLE_ACHIEVEMENTS = 8;
    
const achievementsIconsHtml = achievements?.details ? `
    <div class="achievements">
        <p class="disc">ACHIEVEMENTS (${achievements.completed}/${achievements.total})</p>
        <div class="achievements-icons">
            ${achievements.details
                .sort((a, b) => b.achieved - a.achieved)
                .slice(0, MAX_VISIBLE_ACHIEVEMENTS)
                .map(achievement => `
                    <div class="achievement-icon-wrapper">
                        <img 
                            src="${achievement.icon}" 
                            alt="${achievement.name}"
                            class="achievement-icon ${achievement.achieved ? '' : 'locked'}"
                            loading="lazy"
                            onerror="src='https://placehold.co/32x32?text=Unknown'"
                        >
                        <div class="achievement-tooltip">
                            <img 
                                src="${achievement.icon}" 
                                alt="${achievement.name}"
                                class="tooltip-icon"
                                loading="lazy"
                                onerror="src='https://placehold.co/64x64?text=Unknown'"
                            >
                            <div class="tooltip-content">
                                <p>${achievement.name}</p>
                                <p class="disc">${achievement.description}</p>
                                ${achievement.achieved ? '' : '<p class="disc" style="color: #ff6b6b;">Locked</p>'}
                            </div>
                        </div>
                    </div>
                `).join('')}
            ${achievements.details.length > MAX_VISIBLE_ACHIEVEMENTS ? 
                `<div class="remaining-achievements">+${achievements.details.length - MAX_VISIBLE_ACHIEVEMENTS}</div>` : 
                ''}
        </div>
        <div class="progress-bar">
            <div class="progress-bar-fill" style="width: ${(achievements.completed / achievements.total * 100)}%"></div>
        </div>
    </div>
` : '';

    return `
        <div class="card">
            <a href="https://store.steampowered.com/app/${game.appid}">
                <div class="img img-radius" style="padding:0;">
                    <span><img src="/images/external-link.svg"></span>
                    <img src="https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg">
                </div>
                <p>${gameName}</p>
                <div class="game-info">
                    <div class="stats">
                        <div class="stat-box">
                            <p class="disc">Total Played</p>
                            <p class="disc">${formatHours(game.playtime_forever)}</p>
                        </div>
                        <div class="stat-box">
                            <p class="disc">Last Played</p>
                            <p class="disc">${formatLastPlayed(game.rtime_last_played)}</p>
                        </div>
                    </div>
                    ${achievementsIconsHtml}
                </div>
            </a>
        </div>
    `;
}

async function loadGames() {
    try {
        await loadGameNames();
            
        const gamesResponse = await fetch(`https://corsproxy.io/?https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&format=json`);
        const gamesData = await gamesResponse.json();
        
        if (!gamesData.response || !gamesData.response.games) {
            throw new Error('No games data found');
        }

        const games = gamesData.response.games;
        
        const sortedGames = games.sort((a, b) => b.playtime_forever - a.playtime_forever);
        
        document.getElementById('gamesContainer').innerHTML = '';
        
        for (const game of sortedGames) {
            const gameCard = await createGameCard(game);
            document.getElementById('gamesContainer').insertAdjacentHTML('beforeend', gameCard);
        }

    } catch (error) {
        document.getElementById('gamesContainer').innerHTML = `
            <div class="error">
                Please try again later
            </div>
        `;
        console.error('Error loading games:', error);
    }
}

window.addEventListener('load', loadGames);