export let SEK_USD_RATE: number | null = null;

export async function fetchSEKUSDRate() {
    const resp = await fetch("https://open.er-api.com/v6/latest/SEK");
    if (!resp.ok) {
        throw new Error("Failed to fetch SEK/USD rate");
    }
    const data = await resp.json();
    SEK_USD_RATE = data.rates.USD; 
}