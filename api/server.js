var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var objectId = require("mongodb").ObjectId;
var multiparty = require("connect-multiparty");
var fs = require("fs");


var app = express();

//bodyparser
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
//interpreta formularios com arquivos
app.use(multiparty());

//pre configuracao de permissoes da api
app.use(function(req,res,next){

    //permite requisicoes cross-domain
    res.setHeader("Access-Control-Allow-Origin", "*");
    //pre configura metodos que a origem requisita
    res.setHeader("Access-Control-Allow-Methods", "GET,POS,PUT,DELETE");

    //permite que a origem sobreescreva o header content-type
    res.setHeader("Access-Control-Allow-Headers", "content-type");

    res.setHeader("Access-Control-Allow-Credentials", true);

    next();
})

var port = 8080;

app.listen(port);

//criando objeto de conexao com o banco de dados
var db = new mongodb.Db(
    "instagram",
    new mongodb.Server("localhost", 27017, {}),
    {}
)

console.log("Servidor online");

//configurando rotas
app.get("/", (req, res)=>{

    res.send({msg:"olá mundo!"});

})

//URI + verbo HTTp = RESTFULL
app.post("/api", (req,res)=>{

   

    //console.log(req.files)
    //trazendo imagem upload da pasta temporaria para o projeto
    var date = new Date();
    var timeStamp = date.getTime();

    var url_imagem = timeStamp +"_" + req.files.arquivo.originalFilename;
    var pathOrigem = req.files.arquivo.path;
    var pathDestino = "./uploads/" + url_imagem;

    fs.rename(pathOrigem,pathDestino, function(err){
        if(err){
            res.status(500).json({error:err})
            return;
        }

        var dados = {
            url_imagem: url_imagem,
            titulo: req.body.titulo
        }


        db.open(function(err,mongoclient){
        mongoclient.collection("postagens", function(err,collection){
            collection.insert(dados, function(err, records){
                if(err){
                    res.json(err)
                }
                else{
                    res.json("{status: 'inclusao realizada com sucesso'}");
                }
                mongoclient.close();
            })
        })
    })
    });



  
})

app.get("/api", (req,res)=>{

    

    db.open(function(err,mongoclient){
        mongoclient.collection("postagens", function(err,collection){
            collection.find().toArray(function(err,results){
                if(err){
                    res.json(err);
                }else{
                    res.json(results);
                }
            });
                
                mongoclient.close();
           
        })
    })
})

app.get("/imagens/:imagem", function(req,res){
    var imagem = req.params.imagem;
    fs.readFile("./uploads/"+imagem,function(err, conteudo){
        if(err){
            res.status(400).json(err);
            return;
        }
            //escreve infromacaoes no header da requisicao
            res.writeHead(200,{"content-type" : "image/jpg"})
            //pega uma determindada informacao e escreve seu conteudo
            res.end(conteudo)
        
    })
})  

// get by id
app.get("/api/:id", (req,res)=>{
   

    db.open(function(err,mongoclient){
        mongoclient.collection("postagens", function(err,collection){
            collection.find(objectId(req.params.id)).toArray(function(err,results){
                if(err){
                    res.json(err);
                }else{
                    res.status(200).json(results);
                }
            });
                
                mongoclient.close();
           
        })
    })
})

//put update
app.put("/api/:id", (req,res)=>{


    db.open(function(err,mongoclient){
        mongoclient.collection("postagens", function(err,collection){
            collection.update(
                {_id : objectId(req.params.id)},
                { $push: {
                        comentarios : {
                            id_comentario: new objectId(),
                            comentario: req.body.comentario
                            }
                         }
                },
                {},
                function(err,records){
                    if(err){
                        res.json(err)
                    }else{
                        res.json(records)
                    }
                }
            )
                
                mongoclient.close();
           
        })
    })
})

//dalete update
app.delete("/api/:id", (req,res)=>{
    
    res.send(req.params.id)
    db.open(function(err,mongoclient){
        mongoclient.collection("postagens", function(err,collection){
            collection.update(
                
                {},
                {$pull: {
                         comentarios: {id_comentario: objectId(req.params.id)}
                        }
                },
                {multi: true},
                
                function(err,dados) {
                    if(err){
                        res.json(err)
                    }else{
                        res.json(dados)
                    }
                // mongoclient.close();
                }       
            )   
           
        })
    })
})