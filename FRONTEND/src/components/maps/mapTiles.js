const jawgAccessToken = import.meta.env.VITE_JAWG_ACCESS_TOKEN || "YOUR_JAWG_ACCESS_TOKEN";

export const JAWG_TILE_URL = `https://{s}.tile.jawg.io/jawg-dark/{z}/{x}/{y}{r}.png?access-token=${jawgAccessToken}`;

export const JAWG_ATTRIBUTION = '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
