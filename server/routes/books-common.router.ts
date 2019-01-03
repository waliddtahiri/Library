import { Router, Request, Response, NextFunction } from 'express';
import * as mongoose from 'mongoose';
import Book from '../models/book';
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
        const isbn = req.body.isbn;
        cb(null, isbn + '-' + Date.now());
    }
});
const upload = multer({ storage: storage });

export class BooksCommonRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.router.get('/count', this.getCount);
        this.router.get('/', this.getAll);
        this.router.get('/:id', this.getOne);
        this.router.put('/', this.update);
        this.router.post('/upload', upload.single('picture'), this.upload);
        this.router.post('/confirm', this.confirm);
        this.router.post('/cancel', this.cancel);
        this.router.put('/:id', this.updateBook);
    }

    public async getCount(req: Request, res: Response, next: NextFunction) {
        try {
            const count = await Book.count({});
            res.json(count);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const books = await Book.find()
                .sort({ isbn: 'asc' });
            res.json(books);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            const book = await Book.find({ isbn: req.params.id });
            res.json(book);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async updateBook(req: Request, res: Response, next: NextFunction) {
        try {
            const updatedBook = await Book.findOneAndUpdate({ isbn: req.params.id },
                req.body,
                { new: true });  // pour renvoyer le document modifié
            res.json(updatedBook);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async update(req: Request, res: Response, next: NextFunction) {
        if (!req.body.hasOwnProperty('picturePath')) {
            console.error('No picturePath received');
            return;
        }
        try {
            const currentBook = req['decoded'].isbn;
            const updatedBook = await Book.findOneAndUpdate({ isbn: currentBook },
                req.body,
                { new: true });  // pour renvoyer le document modifi�
            res.json(updatedBook);
        } catch (err) {
            res.status(500).send(err);
        }
    }



    public upload(req: Request, res: Response, next: NextFunction) {
        const file = req['file'];
        const currentBook = req['decoded'].isbn;
        if (file) {
            const filePath = file.path.replace('\\', '/');
            res.json(filePath);
        } else {
            res.status(500).send('No file received');
        }
    }

    public confirm(req: Request, res: Response, next: NextFunction) {
        const picturePath = req.body.picturePath;
        const isbn = req.body.isbn;
        if (picturePath) {
            const filePath = 'uploads/' + isbn;
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
