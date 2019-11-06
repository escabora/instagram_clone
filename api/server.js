const express = require('express'),
    bodyParser = require('body-parser'),
    multiparty = require('connect-multiparty'),
    mongodb = require('mongodb'),
    objectId = require('mongodb').ObjectId,
    fs = require('fs');

const app = express();

// body-parser
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(multiparty());

app.use(function(req, res, next) {
  
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Credentials", true);

  next();
})

const port = 8080;

app.listen(port);

const db = new mongodb.Db(
  'instagram',
  new mongodb.Server('localhost', 27017, {}),
  {}
);

console.log('Servidor HTTP esta escutando na porta ' + port);

app.get('/',function(req, res) {
  res.send({msg: 'Olá'});
})

//POST (create)
app.post('/api',function(req, res) {
  // res.setHeader("Access-Control-Allow-Origin", "*"); // seta a API para responder para qualquer domínio
  

  const date = new Date();
  const time_stamp = date.getTime();
  const url_imagem = time_stamp + '_' + req.files.arquivo.originalFilename;

  const path_origin = req.files.arquivo.path;
  const path_destino = './uploads/' + url_imagem;

 
  fs.rename(path_origin, path_destino, function(err) {
    if(err) {
      res.status(500).json({error: err});
      return;
    } 

    const dados = {
      url_image : url_imagem,
      titulo : req.body.titulo, 
    }

    db.open(function(err, mongoclient) {
      mongoclient.collection('postagens', function(err, collection) {
        collection.insert(dados, function(err, records){
          if(err) {
            res.status(500).json({'status':'erro'});
          } else {
            res.json({'status':'inlcusão realizada com sucesso!'});
          }
          mongoclient.close();
        })
      })
    })
  })
})

//GET (create)
app.get('/api',function(req, res) {

 db.open(function(err, mongoclient) {
    mongoclient.collection('postagens', function(err, collection) {
      collection.find().toArray(function(err, result) {
        if(err) {
          res.status(500).json(err);
        } else {
          res.json(result);
        }
        mongoclient.close();
      });
    })
  })
  
})

//GET (create)
app.get('/api/:id',function(req, res) {
  db.open(function(err, mongoclient) {
     mongoclient.collection('postagens', function(err, collection) {
       const getId = objectId(req.params.id);
       collection.find(getId).toArray(function(err, result) {
         if(err) {
           res.status(500).json(err);
         } else {
           res.json(result);
         }
         mongoclient.close();
       });
     })
   })
 })


app.get('/imagens/:imagem',function(req, res) {
  const img = req.params.imagem;
  fs.readFile('./uploads/' + img, function(err, content) {
    if(err) {
      res.status(400).json(err);
      return;
    } 

    res.writeHead(200, {'Content-Type':'image/jpg'});
    res.end(content);

  })
 })


//PUT by Id (update)
app.put('/api/:id',function(req, res) {
  db.open(function(err, mongoclient) {
     mongoclient.collection('postagens', function(err, collection) {
       const getId = objectId(req.params.id);
       collection.update(
         { _id : getId },
         { $push : {
              comentarios : {
                id_comentario : new objectId(),
                comentario : req.body.comentario
              }
            } 
          },
         {  },
         function(err, records) {
          if(err) {
            res.status(500).json(err);
          } else {
            res.json(records);
          }
          mongoclient.close();
         } 
       );
     })
   })
 })


//DELETE by Id (update)
app.delete('/api/:id',function(req, res) {
  db.open(function(err, mongoclient) {
     mongoclient.collection('postagens', function(err, collection) {
       
       collection.update(
        { },
        { $pull : {
            comentarios : {
              id_comentario: objectId(req.params.id),
            }
          } 
        },
        { multi: true }, //terceiro paremetro remove todos os comentarios que encontrar o id 
        
        function(err, records) {
          if(err) {
            res.json(err);
          } else {
            res.json(records);
          }
        mongoclient.close();
       });
     })
   })
 })