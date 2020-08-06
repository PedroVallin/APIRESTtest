const { Schema, model} = require('mongoose');

const bcrypt = require('bcryptjs');


const userSchema = new Schema({
    nombre: String,
    telefono: Number,
    correo: String,
    password: String,
    saldo: { type: Number, default:0 },
    signupDate: {type: Date, default: Date.now()}
});

//metodo para cifrar contraseña
userSchema.methods.encriptarPassword = async (password) =>{
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);

};


//metodo para comprobar contraseña
userSchema.methods.validarPassword = function (password){//no uso funcion flecha para poder usar this, para usar la contraseña del modelo de arriba
    return bcrypt.compare(password, this.password);//devuelve true o false

};



module.exports=model('User', userSchema);//exportar modelo de datos del usuario


