import * as http from 'http';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Member from './models/member';
import Rental from './models/rental';
import Book from './models/book';
import Category from './models/category';
import { MembersRouter } from './routes/members.router';
import { AuthentificationRouter } from './routes/authentication.router';
import { MembersCommonRouter } from './routes/members-common.router';
import { BooksRouter } from './routes/books.router';
import { CategoriesRouter } from './routes/categories.router';
import { RentalRouter } from './routes/rental.router';

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
        this.express.use('/api/token', new AuthentificationRouter().router);
        this.express.use(AuthentificationRouter.checkAuthorization);    // à partir d'ici il faut être authentifié
        this.express.use('/api/members-common', new MembersCommonRouter().router);
        this.express.use('/api/books', new BooksRouter().router);
        this.express.use('/api/rentals', new RentalRouter().router);
        this.express.use(AuthentificationRouter.checkAdmin);
                   // à partir d'ici il faut être administrateur
        this.express.use('/api/members', new MembersRouter().router);
        this.express.use('/api/categories', new CategoriesRouter().router);
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
        Rental.aggregate([
            // permet d'obtenir un document par item
            { $unwind: '$items' },
            {
                // jointure sur les membres pour avoir les données du membre plutôt que son id
                $lookup: {
                    from: 'members',        // jointure sur la collection 'members'
                    localField: 'member',   // jointure se fait entre rentals.member ...
                    foreignField: '_id',    // ... et books._id
                    as: 'member'            // alias pour le résultat
                }
            },
            {
                // jointure sur les livres
                $lookup: {
                    from: 'books',
                    localField: 'items.book',
                    foreignField: '_id',
                    as: 'book'
                }
            },
            // par défaut les jointures retournent un array, même si une seul élément. Grâce au
            // $unwind on transforme cet array d'un seul élément en l'élément lui-même.
            { $unwind: '$member' },
            { $unwind: '$book' },
            {
                // La projection permet de formater les objets retournés par le query.
                // A gauche de chaque attribut on met le nom qu'on veut obtenir et à droite
                // on met soit true pour dire qu'on prend la donnée qui a le même nom, soit
                // on met une expression qui sera évaluée (ex: $items._id) pour avoir l'id
                // du rental item.
                $project: {
                    _id: '$items._id',
                    orderDate: true,
                    member: true,
                    returnDate: '$items.returnDate',
                    'book': '$book'
                }
            }
        ]);
    }

    // démarrage du serveur express
    public start(): void {
        this.port = process.env.PORT || 3000;
        this.express.set('port', this.port);
        this.server = http.createServer(this.express);
        this.server.listen(this.port, () => console.log(`Node/Express server running on localhost:${this.port}`));
    }
}
