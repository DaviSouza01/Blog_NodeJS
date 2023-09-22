const express = require("express");
const router = express.Router();

const Categoria = require("../models/Categoria");
const Postagens = require("../models/Postagens");
const {eAdmin} = require("../helpers/eAdmin");

// GETS
router.get("/", eAdmin, (req, res) => {
    res.render("admin/index");
});

router.get("/posts", eAdmin, (req, res) => {
    res.send("Página de posts");
});

router.get("/categorias", eAdmin, (req, res) => {
    Categoria.find().sort({ date: "DESC" }).lean().then((categorias) => {
        res.render("admin/categorias", { categorias: categorias });
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao carregar as categorias, tente novamente!");
        res.redirect("/admin/categorias");
    });
});

router.get("/categorias/add", eAdmin, (req, res) => {
    res.render("admin/addcategoria");
});

router.get("/categorias/edit/:id", eAdmin, (req, res) => {
    Categoria.findOne({ _id: req.params.id }).lean().then((categoria) => {
        res.render("admin/editcategorias", { categoria: categoria });
    }).catch((err) => {
        req.flash("error_msg", "Esta categoria não existe!");
        res.redirect("/admin/categorias");
    });  
});

router.get("/postagens", eAdmin, (req, res) => {
    Postagens.find().lean().populate("categoria").sort({data: "desc"}).then((postagens) => {
        res.render("admin/postagens", {postagens: postagens});
    }).catch((err) => {
        console.log(err);
        req.flash("error_msg", "Houve um erro ao listar as postagens");
        res.redirect("/admin");
    });
});

router.get("/postagens/add", eAdmin, (req, res) => {
    Categoria.find().lean().then((categorias) => {
        res.render("admin/addpostagens", {categorias: categorias});
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao carregar o formulário!");
        res.redirect("/admin");
    });
    ;
});

router.get("/postagens/edit/:id", eAdmin, (req, res) => {
    Postagens.findOne({_id: req.params.id}).lean()
        .then((postagem) => {
            Categoria.find().lean()
                .then((categorias) => {
                    res.render("admin/editpostagens", {categorias: categorias, postagem: postagem});
                })
                .catch((err) =>{
                    req.flash("error_msg", "Houve um erro ao listar as categorias, tente novamente.");
                    res.redirect("/admin/postagens");
                });
        })
        .catch((err) => {
            req.flash("error_msg", "Houve um erro ao encontrar a postagem, tente novamente.");
            res.redirect("/admin/postagens");
        });
});

// POSTS
router.post("/categorias/edit", eAdmin, (req, res) => {
    let erros = [];

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Nome inválido!"});
    }
 
    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null){
        erros.push({texto: "Slug inválida!"});
    }

    if(req.body.nome.length < 5) {
        erros.push({texto: "Nome de categoria muito pequeno!"});
    }

    if(req.body.id.length != 24) {
        req.flash("error_msg", "Houve um erro ao editar a categoria, tente novamente!");
        res.redirect("/admin/categorias");
    }

    if(erros.length > 0){
        const categoria = {
            _id: req.body.id,
            nome: req.body.nome,
            slug: req.body.slug,
        }
        res.render("admin/editcategorias", {erros, categoria: categoria});
    }else{
        Categoria.findOne({ _id: req.body.id }).then((categoria) => {
            categoria.nome = req.body.nome;
            categoria.slug = req.body.slug;
            categoria.save().then(() => {
                req.flash("success_msg", "Categoria editada com sucesso!");
                res.redirect("/admin/categorias");
            }).catch((err) => {
                req.flash("error_msg", "Houve um erro ao editar a categoria, tente novamente!");
                res.redirect("/admin/categorias");
            });
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao editar a categoria, tente novamente!");
            res.redirect("/admin/categorias");
        });
    }
});

router.post("/categorias/delete", eAdmin, (req, res) => {
    Categoria.deleteOne({ _id: req.body.id }).then(() => {
        req.flash("success_msg", "Categoria deletada com sucesso!");
        res.redirect("/admin/categorias");
    }).catch(() => {
        req.flash("error_msg", "Houve um erro ao deletar a categoria, tente novamente!");
        res.redirect("/admin/categorias");
    });
});

router.post("/categorias/nova", eAdmin, (req, res) => {
    let erros = [];

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Nome inválido!"});
    }
 
    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null){
        erros.push({texto: "Slug inválida!"});
    }

    if(req.body.nome.length < 5) {
        erros.push({texto: "Nome de categoria muito pequeno!"});
    }

    if(erros.length > 0){
        res.render("admin/addcategoria", {erros});
    }else{
        const novaCategoria = {
            nome: req.body.nome,
            slug: req.body.slug,
        }
        Categoria.create(novaCategoria).then(() => {
            req.flash("success_msg", "Categoria criada com sucesso!");
            res.redirect("/admin/categorias");
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao salvar a categoria, tente novamente!");
            res.redirect("/admin/categorias");
        });
    }
});

router.post("/postagens/nova", eAdmin, (req, res) => {
    var erros = [];

    if(req.body.categoria == "0"){
        erros.push({texto: "Categoria inválida, registre uma categoria e tente novamente."});
    }

    if(!req.body.titulo || typeof req.body.titulo == undefined || req.body.titulo == null){
        erros.push({texto: "Título inválido!"});
    }

    if(!req.body.descricao || typeof req.body.descricao == undefined || req.body.descricao == null){
        erros.push({texto: "Descrição inválida!"});
    }

    if(!req.body.conteudo || typeof req.body.conteudo == undefined || req.body.conteudo == null){
        erros.push({texto: "Conteúdo inválido!"});
    }
    
    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null){
        erros.push({texto: "Slug inválido!"});
    }

    if(erros.length > 0){
        res.render("admin/addpostagens", {erros});
    }else{
        const novaPostagem = {
            titulo: req.body.titulo,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria,
            slug: req.body.slug,
        }
        Postagens.create(novaPostagem).then(()=>{
            req.flash("success_msg", "Postagem adicionada com sucesso!");
            res.redirect("/admin/postagens");
        }).catch((err) => {
            req.flash("error_msg", "Erro ao registrar a postagem, tente novamente.");
            res.redirect("/admin/postagens");
        });
    }
});

router.post("/postagens/edit", eAdmin, (req, res) => {
    Postagens.findOne({_id: req.body.id})
        .then((postagem) => {
            postagem.titulo = req.body.titulo,
            postagem.slug = req.body.slug,
            postagem.conteudo = req.body.conteudo,
            postagem.categoria = req.body.categoria

            postagem.save()
                .then(() => {
                    req.flash("success_msg", "Postagem editada com sucesso!");
                    res.redirect("/admin/postagens");
                }).catch((err) => {
                    req.flash("error_msg", "Houve um erro ao salvar a atualização da postagem. Tentet novamente.");
                    res.redirect("/admin/postagens");
                });
        })
        .catch((err) => {
            req.flash("error_msg", "Houve um erro ao salvar a edição");
            res.redirect("/admin/postagens");
        });
});

router.post("/postagens/delete/:id", eAdmin, async (req, res) => {
    try{
        await Postagens.deleteOne({_id: req.params.id});
        req.flash("success_msg", "Postagem deletada com sucesso!");
        res.redirect("/admin/postagens");
    }catch(err) {
        req.flash("error_msg", "Houve um erro ao deletar a postagem, tente novamente.");
        res.redirect("/admin/postagens");
    }
});

module.exports = router;