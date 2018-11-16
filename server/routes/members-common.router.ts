import { Router, Request, Response, NextFunction } from 'express';
import * as mongoose from 'mongoose';
import Member from '../models/member';
import { AuthentificationRouter } from './authentication.router';
import { pipe } from 'rxjs';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs-extra';

const UPLOAD_DIR = './uploads/';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const pseudo = req.body.pseudo;
        cb(null, pseudo + '-' + Date.now());
    }
});
const upload = multer({ storage: storage });

export class MembersCommonRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.router.get('/count', this.getCount);
        this.router.get('/:id', this.getOne);
        this.router.post('/upload', upload.single('picture'), this.upload);
        this.router.post('/confirm', this.confirm);
        this.router.post('/cancel', this.cancel);
    }

    public async getCount(req: Request, res: Response, next: NextFunction) {
        try {
            const count = await Member.count({});
            res.json(count);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            const member = await Member.find({ pseudo: req.params.id });
            res.json(member);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public upload(req: Request, res: Response, next: NextFunction) {
        const file = req['file'];
        const currentUser = req['decoded'].pseudo;
        if (file) {
            const filePath = file.path.replace('\\', '/');
            res.json(filePath);
        } else {
            res.status(500).send('No file received');
        }
    }

    public confirm(req: Request, res: Response, next: NextFunction) {
        const picturePath = req.body.picturePath;
        const pseudo = req.body.pseudo;
        if (picturePath) {
            const filePath = 'uploads/' + pseudo;
            const src = path.resolve(__dirname + '/../../' + picturePath);
            const tgt = path.resolve(__dirname + '/../../' + filePath);
            fs.moveSync(src, tgt, { overwrite: true });
            res.json(filePath);
        } else {
            res.status(500).send('No picturePath received');
        }
    }

    public cancel(req: Request, res: Response, next: NextFunction) {
        const picturePath = req.body.picturePath;
        if (picturePath) {
            const src = path.resolve(__dirname + '/../../' + picturePath);
            fs.removeSync(src);
            res.json(picturePath);
        } else {
            res.status(500).send('No picturePath received');
        }
    }
}
