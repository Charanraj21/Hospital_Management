const express = require('express');
const path = require('path');

const bodyParser = require('body-parser');

const app = express()
app.set('view engine', 'ejs');
app.set('views','views')

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', {
        pageTitle: "Home",
        path: "/",
        type: "Homepage"
    })
})

app.listen(8080)