import * as http from 'http';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Member from './models/member';
import Book from './models/book';
import { MembersRouter } from './routes/members.router';
import { AuthentificationRouter } from './routes/authentication.router';
import { MembersCommonRouter } from './routes/members-common.router';
import { BooksRouter } from './routes/books.router';

const MONGO_URL = 'mongodb://127.0.0.1/msn';

export class Server {
    private express: express.Application;
    private server: http.Server;
    private port: any;

    constructor() {
        this.express = express();
        this.middleware();
        this.mongoose();
        this.routes();
    }

    private middleware(): void {
        const staticRoot = path.resolve(__dirname + '/..');
        this.express.use(express.static(staticRoot));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
    }


    // initialise les routes
    private routes() {
        // this.express.use('/api/token', new AuthentificationRouter().router);
        // this.express.use(AuthentificationRouter.checkAuthorization);    // à partir d'ici il faut être authentifié
        this.express.use('/api/members-common', new MembersCommonRouter().router);
        this.express.use('/api/books', new BooksRouter().router);
        // this.express.use(AuthentificationRouter.checkAdmin);            // à partir d'ici il faut être administrateur
        this.express.use('/api/members', new MembersRouter().router);
    }

    // initialise mongoose
    private mongoose() {
        (mongoose as any).Promise = global.Promise;     // see: https://stackoverflow.com/a/38833920
        let trials = 0;
        const connectWithRetry = () => {
            trials++;
            mongoose.connect(MONGO_URL)
                .then(res => {
                    console.log('Connected to MONGODB');
                    this.initData();
                })
                .catch(err => {
                    if (trials < 3) {
                        console.error('Failed to connect to mongo on startup - retrying in 2 sec');
                        setTimeout(connectWithRetry, 2000);
                    } else {
                        console.error('Failed to connect to mongo after 3 trials ... abort!');
                        process.exit(-1);
                    }
                });
        };
        connectWithRetry();
    }

    private initData() {
        Member.count({}).then(count => {
            if (count === 0) {
                console.log('Initializing data...');
                Member.insertMany([
                    { pseudo: 'test', password: 'test', profile: 'Hi, I\'m test!' },
                    { pseudo: 'ben', password: 'ben', profile: 'Hi, I\'m ben!' },
                    { pseudo: 'bruno', password: 'bruno', profile: 'Hi, I\'m bruno!' },
                    { pseudo: 'boris', password: 'boris', profile: 'Hi, I\'m boris!' },
                    { pseudo: 'alain', password: 'alain', profile: 'Hi, I\'m alain!' }
                ]);
            }
        });
        Book.count({}).then(count => {
            if (count === 0) {
                console.log('Initializing data...');
                Book.insertMany([
                    { isbn: '123', author: 'ben', title: 'Angular for dummies', editor: 'EPFC' },
                    { isbn: '456', author: 'bru', title: 'TS for dummies', editor: 'EPFC' },
                    { isbn: '789', author: 'bo', title: 'Java for dummies', editor: 'EPFC' }
                ]);
            }
        });
        Member.count({ pseudo: 'admin' }).then(count => {
            if (count === 0) {
                console.log('Creating admin account...');
                Member.create({
                    pseudo: 'admin', password: 'admin',
                    profile: 'I\'m the administrator of the site!', admin: true
                });
            }
        });
    }

    // démarrage du serveur express
    public start(): void {
        this.port = process.env.PORT || 3000;
        this.express.set('port', this.port);
        this.server = http.createServer(this.express);
        this.server.listen(this.port, () => console.log(`Node/Express server running on localhost:${this.port}`));
    }
}
