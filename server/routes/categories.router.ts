import { Router, Request, Response, NextFunction } from 'express';
import Category from '../models/category';
import Book from '../models/book';

export class CategoriesRouter {
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
            const categories = await Category.find().sort({ name: 'asc' });
            res.json(categories);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            const category = await Category.find({ name: req.params.id });
            res.json(category);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async create(req: Request, res: Response, next: NextFunction) {
        // _id vient avec la valeur nulle d'angular (via reactive forms) => on doit l'enlever pour qu'il reçoive une valeur
        delete req.body._id;
        try {
            const category = new Category (req.body);
            const newCategory = await category.save();
            res.json(newCategory);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async update(req: Request, res: Response, next: NextFunction) {
        try {
            const updatedCategory = await Category.findOneAndUpdate({ _id: req.params.id },
                req.body,
                { new: true });  // pour renvoyer le document modifié
            res.json(updatedCategory);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async deleteOne(req: Request, res: Response, next: NextFunction) {
        try {
            const category = await Category.findOneAndRemove({ name: req.params.id });
            if (category != null) {
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
            const r = await Category.remove({});
            res.json(true);
        } catch (err) {
            res.status(500).send(err);
        }
    }
}
