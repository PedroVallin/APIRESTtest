const { Schema, model} = require('mongoose');

const pagosSchema = new Schema({
    idUsuario: String,
    idParking: String,
    monto: Number,
    boleto: {type: Number, default: Math.random(1, 10000000000)},
    fecha: {type: Date, default: Date.now()},
})

module.exports=model('Pagos', pagosSchema);