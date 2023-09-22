const mongoose = require("mongoose");

const Categoria = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

const categoryModel = mongoose.model("categorias", Categoria);

module.exports = categoryModel;