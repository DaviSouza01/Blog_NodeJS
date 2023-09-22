require("dotenv").config();

const express = require("express");
const handlebars = require("express-handlebars");
const mongoose = require("mongoose");
const admin = require("./routes/admin");
const usuarios = require("./routes/usuarios");
const Postagens = require("./models/Postagens");
const Categorias = require("./models/Categoria");
const passport = require("passport");
const port = 8089;

require("./config/auth")(passport);
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.engine("handlebars", handlebars.engine({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.set("views", "./views");

// Banco de Dados
mongoose
  .connect(
    `mongodb+srv://dev:${process.env.MONGODB_PASSWORD}@cluster0.wkqr4f1.mongodb.net/?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log("Conectado ao MongoDB com sucesso!");
    app.listen(port, () => {
      console.log("Servidor iniciado com sucesso na porta " + port);
    });
  })
  .catch((err) => {
    console.log("Erro ao se conectar com o MongoDB: " + err);
  });

// Session
const session = require("express-session");
const flash = require("connect-flash");

const MongoDBStore = require("connect-mongodb-session")(session);

const store = new MongoDBStore({
  uri: `mongodb+srv://dev:${process.env.MONGODB_PASSWORD}@cluster0.wkqr4f1.mongodb.net/?retryWrites=true&w=majority`,
  collection: "sessions",
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: null,
      httpOnly: true,
      secure: true,
    },
    name: process.env.COOKIE_NAME,
    store: store,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// Middlewares
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.user || null;
  next();
});

// Rotas
app.use("/admin", admin);
app.use("/usuarios", usuarios);

app.get("/", (req, res) => {
  Postagens.find()
    .populate("categoria")
    .sort({ data: "desc" })
    .lean()
    .then((postagens) => {
      res.render("index", { postagens: postagens });
    })
    .catch((err) => {
      req.flash("error_msg", "Houve um erro ao carregar as postagens.");
      res.redirect("/404");
    });
});

app.get("/post/:slug", (req, res) => {
  Postagens.findOne({ slug: req.params.slug })
    .lean()
    .then((post) => {
      if (post) {
        res.render("post/index", { post: post });
      } else {
        req.flash("error_msg", "Esta postagem não existe.");
        res.redirect("/");
      }
    })
    .catch((err) => {
      req.flash(
        "error_msg",
        "Houve um erro ao carregar a página. Tente novamente."
      );
      res.redirect("/");
    });
});

app.get("/404", (req, res) => {
  res.send("Erro 404!");
});

app.get("/categorias", (req, res) => {
  Categorias.find()
    .lean()
    .then((categorias) => {
      res.render("categorias/index", { categorias: categorias });
    })
    .catch((err) => {
      req.flash("error_msg", "Houve um erro ao listar as categorias");
      res.redirect("/");
    });
});

app.get("/categorias/:slug", (req, res) => {
  Categorias.findOne({ slug: req.params.slug })
    .lean()
    .then((categoria) => {
      if (categoria) {
        Postagens.find({ categoria: categoria._id })
          .lean()
          .then((postagens) => {
            res.render("categorias/postagens", {
              postagens: postagens,
              categoria: categoria,
            });
          })
          .catch((err) => {
            req.flash(
              "error_msg",
              "Houve um erro ao listar as postagens desta categoria."
            );
            res.redirect("/categorias");
          });
      } else {
        req.flash("error_msg", "Esta categoria não existe.");
        res.redirect("/");
      }
    })
    .catch((err) => {
      req.flash("error_msg", "Houve um erro ao listar a página desta categoria.");
      res.redirect("/");
    });
});