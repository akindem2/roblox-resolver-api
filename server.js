const express = require('express');
const cors = require('cors');

const app = express();
// Enable CORS so your GitHub Pages frontend is allowed to talk to this backend
app.use(cors());

app.get('/resolve', async (req, res) => {
    const code = req.query.code;
    
    if (!code || code.length !== 32) {
        return res.status(400).json({ error: 'Invalid share code format.' });
    }

    const shareUrl = `https://www.roblox.com/share?code=${code}&type=Server`;

    try {
        // We ping Roblox, but tell fetch NOT to follow the redirect (redirect: 'manual')
        // We also use a standard User-Agent so Cloudflare doesn't think we are a bot.
        const response = await fetch(shareUrl, {
            redirect: 'manual', 
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        // The target URL (containing the private server code) is in the 'location' header
        const location = response.headers.get('location');

        if (!location) {
            return res.status(500).json({ error: 'Could not intercept the redirect. Link may be invalid.' });
        }

        // Extract the place ID and privateServerLinkCode from the location URL
        const psCodeMatch = location.match(/privateServerLinkCode=([0-9a-zA-Z]+)/);
        const placeIdMatch = location.match(/games\/(\d+)\//);

        if (psCodeMatch && placeIdMatch) {
            return res.json({
                success: true,
                privateServerLinkCode: psCodeMatch[1],
                placeId: placeIdMatch[1]
            });
        } else {
            return res.status(404).json({ error: 'Redirected, but no private server code was found in the URL.' });
        }

    } catch (error) {
        return res.status(500).json({ error: 'Server error', details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Resolver API running on port ${PORT}`);
});
