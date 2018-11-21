import * as http from 'http';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Member from './models/member';
import { Book } from './models/book';
import { MembersRouter } from './routes/members.router';
import { AuthentificationRouter } from './routes/authentication.router';
import { MembersCommonRouter } from './routes/members-common.router';

const MONGO_URL = 'mongodb://127.0.0.1/msn';

export class Server {
    private express: express.Application;
    private server: http.Server;
    private port: any;
    private books: Book[];

    constructor() {
        this.express = express();
        this.middleware();
        this.mongoose();
        this.routes();
        this.setupBooks();
        this.setupRouter();
    }

    private middleware(): void {
        const staticRoot = path.resolve(__dirname + '/..');
        this.express.use(express.static(staticRoot));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
    }

    setupBooks() {
        this.books = [
            new Book("123", "Ben", "Angular for dummies", "EPFC"),
            new Book("456", "Bru", "TS for dummies", "EPFC"),
            new Book("789", "Bo", "Java for dummies", "EPFC")
        ];
    }

    setupRouter() {
        let router1 = express.Router();

        router1.get('/', (req, res, next) => {
            res.json(this.books);
        });

        router1.get('/:isbn', (req, res, next) => {
            const isbn: string = req.params.isbn;
            const b = this.books.find(e => e.isbn === isbn);
            if (!b) {
                res.status(404).json(false);
            } else {
                res.json(b);
            }
        });

        router1.post('/', (req, res, next) => {
            const { isbn, author, title, editor } = req.body;
            const book = new Book(isbn, author, title, editor);
            this.books.push(book);
            res.json(book);
        });

        router1.delete('/:isbn', (req, res, next) => {
            const id: string = req.params.isbn;
            const index = this.books.findIndex(b => b.isbn === id);
            if (index == -1) {
                res.status(404).json(false);
            } else {
                this.books.splice(index, 1);
                res.json(true);
            }
        });

        router1.put('/:isbn', (req, res, next) => {
            const isbn = req.params.isbn;
            const { author, title, editor } = req.body;
            let book = this.books.find(b => b.isbn === isbn);
            if (!book)
                res.status(404).json(false);
            else {
                book.author = author;
                book.title = title;
                book.editor = editor;
                res.json(book);
            }
        });

        this.express.use(bodyParser.urlencoded({ extended: false }));
        this.express.use('/book', router1);
    }

    // initialise les routes
    private routes() {
        //this.express.use('/api/token', new AuthentificationRouter().router);
        //this.express.use(AuthentificationRouter.checkAuthorization);    // à partir d'ici il faut être authentifié
        this.express.use('/api/members-common', new MembersCommonRouter().router);
        //this.express.use(AuthentificationRouter.checkAdmin);            // à partir d'ici il faut être administrateur
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
