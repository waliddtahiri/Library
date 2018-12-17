import { Router, Request, Response, NextFunction } from 'express';
import Book from '../models/book';

export class BooksRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.router.get('/', this.getAll);
        this.router.post('/', this.create);
        this.router.delete('/', this.deleteAll);
        this.router.get('/:id', this.getOne);
        this.router.put('/:id', this.update);
        this.router.delete('/:id', this.deleteOne);
    }

    public async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const books = await Book.find().sort({ isbn: 'asc' });
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

    public async create(req: Request, res: Response, next: NextFunction) {
        // _id vient avec la valeur nulle d'angular (via reactive forms) => on doit l'enlever pour qu'il reçoive une valeur
        delete req.body._id;
        try {
            const { isbn, author, title, editor } = req.body;
            const book = new Book (req.body);
            const newBook = await book.save();
            res.json(newBook);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async update(req: Request, res: Response, next: NextFunction) {
        try {
            const updatedBook = await Book.findOneAndUpdate({ isbn: req.params.id },
                req.body,
                { new: true });  // pour renvoyer le document modifié
            res.json(updatedBook);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async deleteOne(req: Request, res: Response, next: NextFunction) {
        try {
            const book = await Book.findOneAndRemove({ isbn: req.params.id });
            if (book != null) {
                res.json(true);
            } else {
                res.status(404).json(false);
            }
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async deleteAll(req: Request, res: Response, next: NextFunction) {
        try {
            const r = await Book.remove({});
            res.json(true);
        } catch (err) {
            res.status(500).send(err);
        }
    }
}
