"use_scrict";
const { readFile, readFileSync } = require("fs").promises;
const express = require('express');
const app = express();
const portNumber = 3000;

app.get('/', async (request, response) => {
    response.send(await readFile("pages/index.html", "utf8"));
});

app.listen(process.env.PORT || portNumber, () => console.log("App is now available"));