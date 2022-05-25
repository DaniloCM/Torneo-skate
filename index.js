const express = require('express');
const app = express();

require('dotenv').config();

const hbs = require('express-handlebars');
const fileupload = require('express-fileupload');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const { listarSkaters, nuevoSkater, actualizarSkater, eliminarSkater, estadoSkater, login } = require('./consultas.js');

const port = 3000;

app.listen(process.env.PORT || port, () => console.log(`Server ON, http://localhost:${port}`));


// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//// Fileupload
app.use(fileupload({
    limits: { fileSize: 5000000 },
    abortOnLimit: true,
    responseOnLimit: "El archivo supera el límite permitido"
}));

//// Handlebars
app.set("view engine", "handlebars");
app.engine(
  "handlebars",
  hbs.engine({
    layoutsDir: `${__dirname}/views`,
    partialsDir:`${__dirname}/views/partials`,
  })
);

//// Archivos
app.use("/assets", express.static(`${__dirname}/assets`));
app.use("/bootstrap", express.static(`${__dirname}/node_modules/bootstrap/dist/`));
app.use("/jquery", express.static(`${__dirname}/node_modules/jquery/dist/`));

//// Validaciones
app.use('/skater', (req, res, next) => {
    next();
});


//Rutas
app.get('/', async (req, res) => {
    const respuesta = await listarSkaters();

    const participantes = respuesta.rows;

    const config = {
        layout: 'participantes',
        titulo: "Participantes",
        participantes
    };

    if(req.query.del){
        config.eliminado = req.query.del;
    }

    res.render('participantes', config);
});


app.get('/registro', (req, res) => {
    res.render('registro', {
        layout: 'registro',
        titulo: "Regístrate"
    });
});


app.get('/login', (req, res) => {
    let config = {
        layout: 'login',
        titulo: "Iniciar Sesión"
    };

    if(req.query.usuario){
        config.usuario = req.query.usuario;
    }

    res.render('login', config);
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const respuesta = await login(email, password);
        
        console.log(respuesta.rows);
        
        if(respuesta.rowCount == 0){
            res.status(403).send({ message: 'Credenciales inválidas'});
        } else {
            const usuario = respuesta.rows[0];
            
            const token = jwt.sign({
                data:usuario,
                exp: Math.floor(Date.now() / 1000) + 5 * 60
            }, process.env.JWT_KEY);
            
            res.send({
                message: 'Autenticación exitosa',
                token: token
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({message : "error server"});
    }
});


app.get('/perfil', (req, res) => {
    const { token } = req.query;

    jwt.verify(token, process.env.JWT_KEY, (error, skater) => {
        if (error) {
            res.status(500).send({
                code: "500 Error interno del servidor ",
                message: "El servidor ha encontrado una situación que no sabe cómo manejarla, concretamente con el token.",
                error: error
            });
        } else {
            res.render('perfil', {
                layout: 'perfil',
                titulo: "Mi perfil",
                skater: skater.data
            });
        }
    });
});


app.get('/admin', async (req, res) => {

    const respuesta = await listarSkaters();

    const participantes = respuesta.rows;

    res.render('admin', {
        layout: 'admin',
        titulo: "Administración",
        participantes
    });
});


app.post('/skater', async (req, res) => {

    try {
        console.log("server");
        const { foto } = req.files;

        const nombreFoto = req.body.email + "-" + foto.name;
        const respuesta = await nuevoSkater(req.body, nombreFoto);

        if (respuesta.code === 500) {
            throw respuesta.error;
        }

        foto.mv(`${__dirname}/assets/imgs/${nombreFoto}`, async (error) => {

            if (error) {
                console.log(error);
                await eliminarSkater(respuesta.rows[0].id);
                throw error;
            }
        });

        res.send({message: 'Actualización del perfil exitosa'});
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});


app.put('/skater', async (req, res) => {

    try {
        const { id } = req.query;

        await actualizarSkater(id, req.body);

        const { email, password } = req.body;

        // Se vulve a generar el token para mostrar los nuevos datos en el perfil
        const respuesta = await login(email, password);

        if (respuesta.code === 500) {
            throw respuesta.error;
        }

        const usuario = respuesta.rows[0];
            
        const token = jwt.sign({
            data:usuario,
            exp: Math.floor(Date.now() / 1000) + 5 * 60
        }, process.env.JWT_KEY);

        res.send({
            message: 'Actualización del perfil exitosa',
            token: token
        });
        
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});


app.delete('/skater', async (req, res) => {

    try {
        
        const { id } = req.query;

        const respuesta = await eliminarSkater(id);

        const nombreFoto = respuesta.rows[0].foto;

        fs.rm(`${__dirname}/assets/imgs/${nombreFoto}`, (error) => {
            if (error) {
                throw error;
            }
        });

        res.send({
            message: 'El perfil fue eliminado de forma exitosa',
            respuesta
        });

    } catch (error) {
        console.log(error);
        res.send(error);
    }
});


app.put('/skater/estado', async (req, res) => {

    const { id, estado } = req.query;

    const respuesta =  await estadoSkater(id, estado);

    res.send({
        message: `El estado del skater con id ${id} fue cambiado de forma exitosa`,
        respuesta
    });

});


app.get('/skaters', async (req, res) => {
    const respuesta = await listarSkaters();

    const participantes = respuesta.rows;

    res.json(participantes);
});