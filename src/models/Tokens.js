const { Schema, model} = require('mongoose');

const saveTokens = new Schema({
    idUsuario: String,
    token: String
})

module.exports=model('Tokens', saveTokens);