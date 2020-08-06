const express = require('express');
const app = express();

app.use(express.json());//Para que el servidor entienda archivos json
app.use(express.urlencoded({extended:false}));//por si se encesita enviar datos desde un frontend

app.use(require('./controllers/authController'));

module.exports = app;