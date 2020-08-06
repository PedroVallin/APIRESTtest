//middleware
const jwt = require('jsonwebtoken');
const config = require('../config');

function verificarToken(req, res, next){
    const token = req.headers['x-access-token'];//recibir token por cabecera enviada por usuario.
    if (!token){
        return res.status(401).json({
            auth: false,
            message: 'Access Denied: No access token provided'
        });
    }
    const decoded = jwt.verify(token, config.secret);//Guardar valor decodificado    
    req.usuarioId = decoded.id;//en caso de que necesite la id en alguna ruta
    next();
}

module.exports = verificarToken;