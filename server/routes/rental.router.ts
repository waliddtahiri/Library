import { Router, Request, Response, NextFunction } from 'express';
import Rental from '../models/rental';

export class RentalRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.router.get('/', this.getAll);
        this.router.post('/', this.create);
        this.router.get('/:id', this.getOne);

    }

    public async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const rentals = await Rental.find().sort({ orderDate: 'asc' });
            res.json(rentals);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            const rental = await Rental.find({ orderDate: req.params.id });
            res.json(rental);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async create(req: Request, res: Response, next: NextFunction) {
        // _id vient avec la valeur nulle d'angular (via reactive forms) => on doit l'enlever pour qu'il reçoive une valeur
        delete req.body._id;
        try {
            const { orderDate, member, items} = req.body;
            const rental = new Rental (req.body);
            const newRental = await rental.save();
            res.json(newRental);
        } catch (err) {
            res.status(500).send(err);
        }
    }
}
