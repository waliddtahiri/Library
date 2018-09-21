import * as http from 'http';
import * as express from 'express';
import * as mongo from 'mongodb';

export class Server {
    private express: express.Application;
    private server: http.Server;
    private port: any;
    private db: mongo.Db;

    constructor() {
        this.express = express();
        this.mongodb();
        this.routes();
    }

    // initialise les routes
    private routes() {
        let router = express.Router();
        router.get('/', (req, res, next) => {
            this.getMembers(res);
        });
        this.express.use('/', router);
    }

    // initialise la connection � la db
    private mongodb() {
        mongo.MongoClient.connect("mongodb://localhost:27017/msn", { useNewUrlParser: true }).then(client => {
            console.log("Connect� � la base de donn�es '" + client.db().databaseName + "'");
            this.db = client.db();
        });
    }

    // requ�te pour r�cup�rer tous les membres
    private getMembers(res) {
        this.db.collection("members").find().toArray().then(members => {
            res.json(members);
        });
    }

    // d�marrage du serveur express
    public start(): void {
        this.port = process.env.PORT || 3000;
        this.express.set('port', this.port);
        this.server = http.createServer(this.express);
        this.server.listen(this.port, () => console.log(`Node/Express server running on localhost:${this.port}`));
    }
}

new Server().start();