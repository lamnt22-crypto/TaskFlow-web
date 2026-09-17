require('dotenv').config();
const apiKey = "12345";
if (!apiKey) {
    console.log("No API key");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
const data = {
    contents: [{
        parts: [{ text: "Hello" }]
    }]
};

fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
})
.then(res => res.json().then(json => ({status: res.status, json})))
.then(({status, json}) => {
    console.log(`Status: ${status}`);
    console.log(`Response:`, JSON.stringify(json, null, 2));
})
.catch(err => {
    console.error(err);
});
