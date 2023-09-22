const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const Usuarios = require("../models/Usuario");

module.exports = function(passport){
    passport.use(new localStrategy(
        {
            usernameField: "email",
            passwordField: "senha"
        },
        (email, senha, done) => {
            Usuarios.findOne({email: email})
                .then((usuario) => {
                    if(!usuario){
                        return done(null, false, {message: "Esta conta não existe."});
                    }else{
                        bcrypt.compare(senha, usuario.senha, (erro, isValid) => {
                            if(isValid){
                                return done(null, usuario);
                            }else{
                                return done(null, false, {message: "Senha incorreta"});
                            }
                        });
                    }
                })
                .catch((err) => {
                    return done(err, false, {message: "Houve um erro ao autenticar o usuário, tente novamente mais tarde."});
                });
        }
    ));

    passport.serializeUser((usuario, done) => {
        done(null, usuario.id);
    });

    passport.deserializeUser((id, done) => {
        Usuarios.findById(id)
            .then((usuario) => {
                done(null, usuario)
            })
            .catch((err) => {
                done(err, false, {message: "Houve um erro ao carregar o usuário. Tente novamente. "});
            });
    });
}