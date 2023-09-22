const mongoose = require("mongoose");

const Usuarios = new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    eAdmin: {
        type: Number,
        default: "0"
    },
    senha: {
        type: String,
        required: true
    }
});

const userModel = mongoose.model("usuarios", Usuarios);

module.exports = userModel;