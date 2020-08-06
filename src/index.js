const app = require('./app');
require('./database');

async function init(){
    await app.listen(3000);
    console.log('Servidor alojado en puerto 3000');

}

init();