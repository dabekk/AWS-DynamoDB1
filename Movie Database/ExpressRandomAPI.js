"use strict";

const express = require('express')
const app = express()
const port = 3000

app.get('/random/:min/:max', sendrandom)

app.use(express.static, 'static')

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

function sendrandom(req, res) {
    let min = parseInt(req.params.min);
    let max = parseInt(req.params.max);
    if (isNaN(min) || isNaN(max)) {
        res.status(400);
        res.json( {error : "Bad Request."});
        return;
    }
    let result = Math.round( (Math.random() * (max - min)) + min);

    res.json( { result : result });
}
