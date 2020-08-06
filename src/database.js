const mongoose = require("mongoose");


mongoose.connect('mongodb://localhost/apitest', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(db => console.log('BD conectada...'))