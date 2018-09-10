import * as http from 'http';
import * as express from 'express';

export class Server {
    private express: express.Application;
    private server: http.Server;
    private port: any;

    constructor() {
        this.express = express();
        let router = express.Router();
        router.get('/', (req, res, next) => {
            res.json({ success: true, message: 'Hello World!' });
        });
        this.express.use('/', router);
    }

    public start(): void {
        this.port = process.env.PORT || 3000;
        this.express.set('port', this.port);
        this.server = http.createServer(this.express);
        this.server.listen(this.port, () => console.log(`Node/Express server running on localhost:${this.port}`));
    }
}

new Server().start();