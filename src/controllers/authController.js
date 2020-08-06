//crear enrutador
const { Router } = require('express');
const router = Router();

const User = require('../models/User');  //modelo de usuario
const Pagos = require('../models/Pagos');//modelo de pago

const verificarToken=require("./verificarToken");

//crear token
const jwt = require('jsonwebtoken');

//Importar mi llave de confij para el token
const config = require('../config');


//Estas 2 son para peticiones GET
const requestify = require('requestify'); 
const axios = require('axios');

//Para filtrar datos del json de los estacionamientos
var _ = require("underscore");

//Guardar Tokens
const Tokens = require('../models/Tokens');

//-------------------------Endpoint 1----------
router.post('/signup', async (req, res, next) =>{ //registrar usuario
    const { nombre, telefono, correo, password } = req.body; //capturar datos
    const user = new User({
        nombre: nombre,
        telefono: telefono,
        correo: correo,
        password: password
    });
    user.password = await user.encriptarPassword(user.password);//usar funcion para encriptar contraseña
    await user.save();

    //crear token del usuario
    const accessToken = jwt.sign({id: user._id}, config.secret, {
        expiresIn: 60 * 60 * 24 //Expiracion del token (24hrs)
    });

    //Guardar desde aqui el Token para despues solo actualizarlo en el endpoint 2 cada que el usuario se loguee
    const tokens = new Tokens({
        idUsuario: user._id,
        token: accessToken
    })
    await tokens.save();
    
    res.json(user);

})
//-------------------Fin del Endpoint 1---------------------


//-------------------Endpoint 2-----------------
//Logeo de usuario
router.post('/signin', async (req, res, next) =>{
    const { correo, password} = req.body;
    const user = await User.findOne({correo: correo});
    if(!user){//si no existe el correo en la bd entonces...
        return res.status(404).send('El correo ingresado no existe en la base de datos.')
    }

    const validarPassword = await user.validarPassword(password);
    if (!validarPassword){//si las contraseñas no coinciden entonces...
        return res.status(401).json({auth: false, accessToken: null, message:'Las contraseñas no coinciden'})
    }

    const accessToken = jwt.sign({id: user._id}, config.secret, {
        expiresIn: 60 * 60 * 24 //caducidad del token, expires es en segundos, así que lo multiplico por 60 para que sea un minuto, luego otra vez por 60 para la hora y al final por 24 hrs

    });


    console.log(validarPassword);
    res.json({accessToken});

    //Actualizar token en base de datos
    
    const token = await Tokens.findOneAndUpdate({"idUsuario":user._id, "token":accessToken});

    //const oldUser = await User.findByIdAndUpdate(user._id, {"saldo": actsaldo});//consulta para actualizar el saldo del usuario

})
//-------------------Fin Endpoint 2-----------------



//----------------Endopoint 3------------------
//actualizacion de datos de usuario -> ENVIAR ID DE USUARIO A MODIFICAR 

router.patch('/update', verificarToken, async (req, res, next) =>{

    const { _id, password} = req.body;
    const user = await User.findOne({_id: _id});

    //const { userId } = req._id;//sacar id de usuario
    const newUser = req.body; //sacar los datos de la actualizacion del cuerpo

    if (password){
        newUser.password = await user.encriptarPassword(user.password);//usar funcion para encriptar contraseña
    }
    
    
    const oldUser = await User.findByIdAndUpdate(user, newUser);//consulta para actualizar datos

    const actUser = await User.findOne({_id: _id});
    res.status(200).json(actUser);//informa que fue exitosa la consulta

    

});
//----------------------------Fin de Endpoint 3----------------

//----------------------------Endpoint 4-----------------------
//Endpoint para abonar saldo
router.post('/absaldo', verificarToken, async (req, res, next) =>{
    //Validar token de acceso de usuario
    

    const { _id } = req.body;
    const user = await User.findOne({_id: _id});

    const saldo = req.body; 

    const oldUser = await User.findByIdAndUpdate(user, saldo);//consulta para actualizar datos

    const actUser = await User.findOne({_id: _id});
    res.status(200).json(actUser);//informa que fue exitosa la consulta
   
});
//----------------------------FinEndpoint 4--------------------


//----------------------------Enpoint 5-----------------------
//Lista de estacionamientos desde URL




router.get('/estacionamientos', verificarToken, (req, res) =>{
    

    requestify.get('https://dev.parcoapp.com/api/Parkings?access_token=3Gc60QmoQO0IqWnCH7Jh2O3kFjREjHDDshfcn4i0076GBwhja2TV17MDjyMIyKMD') 
        .then(function(response) { 
            // Get the response body (JSON parsed or jQuery object for XMLs)
            res.json(response.getBody());

            //a partir de aqui el codigo solo es para filtrar datos en consola y mostrarlos a manera de prueba
            var estacionamientos = response.getBody();
            var filtered = _.where(estacionamientos, {id: '59231907799d4e3b3e3d6034'});
            console.log(filtered);
        } 
    );

  

})
//----------------------------Fin Enpoint 5-----------------------



//----------------------------Enpoint 6-----------------------
//Pago de estacionamiento
router.post('/pago', verificarToken, async(req, res) =>{

    const { idUsuario, idParking, monto } = req.body;
    const user = await User.findById(idUsuario);//buscar usuario por id

    requestify.get('https://dev.parcoapp.com/api/Parkings?access_token=3Gc60QmoQO0IqWnCH7Jh2O3kFjREjHDDshfcn4i0076GBwhja2TV17MDjyMIyKMD') 
        .then(async function(response) { 
            // Get the response body (JSON parsed or jQuery object for XMLs)
            

            //filtro de estacionamientos con status  1
            var estacionamientos = response.getBody();
            var filtered = _.where(estacionamientos, {status: 1});
            
            

            //Validacion de si el estacionamiento esta disponible
            var comparacion = _.where(filtered, {id: idParking})
            //console.log(comparacion);
            if(comparacion.length === 0 ){
                console.log("Error: El estacionamiento no está disponible");
                res.send("Error: El estacionamiento no esta disponible");
            }else{
                console.log("El estacionamiento si esta disponible");


                //Realizar pago, guarda en "pagos" en la base de datos

                
                //console.log(user.saldo);
                if(monto > user.saldo){
                    console.log("Saldo insuficiente");
                    
                }else{
                    console.log("Saldo suficiente");
                    const actsaldo = (user.saldo-monto);
                    const oldUser = await User.findByIdAndUpdate(user._id, {"saldo": actsaldo});//consulta para actualizar el saldo del usuario

                    //Registrar la tranferencia
                    const montoPago = new Pagos({
                        idUsuario: idUsuario,
                        idParking: idParking,
                        monto: monto
                
                    })
                    
                    await montoPago.save();
                    res.json(montoPago);
                    

                }

                /*
                
                */
            }
            
        } 
    );
    

/*
    
    
*/

})

//----------------------------Fin Enpoint 6-----------------------

//----------------------------Endpoint 7--------------------------

router.get('/transacciones', verificarToken, async (req, res)=>{
    //Validar token de acceso de usuario
    
    const pagos = await Pagos.findOne(req.body)
    if (!pagos){
        return res.status(404).send('Usuario no encontrado');
    }
    res.json(pagos);

    
})

//----------------------------Fin endpoint 7----------------------


//---------------------------Endpint 8---------------------------
/*
8) Endpoint para generar reporte de transacciones entre dos fechas o por estacionamiento y entre dos fechas en formato .csv
Método: GET
Parámetros: fecha inicial, fecha final, id de estacionamiento (opcional)
Respuesta: un archivo .csv con la información de las transacciones.
*/

//librerias para csv
const fs = require('fs');
//const csv = require('fast-csv');
//const ws = fs.createWriteStream('Reporte.csv');


router.get('/reportes', (req, res, next)=>{

    //Filtrado de fechas
    const fechaInicial = new Date(req.body.fechaInicial);
    const fechaFinal = new Date(req.body.fechaFinal);
    Pagos.find({$and: [{fecha: {$gte: new Date(fechaInicial)}},{fecha: {$lt: new Date(fechaFinal)}}]})
    .exec((err, act) => {
        if(err) {
            console.log('hubo un error');
            return res.status(500).json({error: err.message}); //debes enviar una respuesta o llamar al manejador de errores (return next(err))
        }
        console.log(act);
        if(!act){
            res.send("Ningun usuario encontrado en ese rango de fechas");

        }else{
            var dataToWrite=act; 
            

            fs.writeFile('Reportes.csv', dataToWrite, 'utf8', function (err) { 
                if (err) { 
                    console.log('Some error occured - file either not saved or corrupted file saved.'); 
                } else{ 
                    console.log('It\'s saved!'); 
                } 
            });

            /*
               
            csv.
                write([
                    {
                        id: act._id,
                        boleto:act.boleto,
                        fecha:act.fecha,
                        idUsuario:act.idUsuario,
                        idParking:act.idParking,
                        monto:act.monto

                    }
                    //[act._id, act.boleto, act.fecha, act.idUsuario, act.idParking, act.monto]
                ], {headers:true})
                .pipe(ws);
            */


            return res.status(200).json(act); // en este ejemplo se envía el resultado
        }
        
        
        
    });




})



//--------------------------Fin endpoint 8-----------------------


//-----------------Endpoint que no es parte del test, solo es para hacer pruebas---------
//Mostrar todos los usuarios registrados en la base de datos

router.get('/me', verificarToken, async (req, res, next) => {
    //Validar token de acceso de usuario

    const user = await User.findById(req.usuarioId)//buscar usuario por su id segun su token
    if (!user){
        return res.status(404).send('Usuario no encontrado');
    }
    res.json(user);
})

//-----------------Fin de endpoint--------------


module.exports = router;