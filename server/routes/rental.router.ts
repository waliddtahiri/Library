import { Router, Request, Response, NextFunction } from 'express';
import Rental from '../models/rental';
import Member from '../models/member';

export class RentalRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.router.get('/', this.getAll);
        this.router.post('/', this.create);
        this.router.get('/:pseudo', this.getOne);
        this.router.get('/member/rental/item/:id', this.getRentalByItem);
        this.router.delete('/:id', this.deleteOne);
        this.router.put('/:id', this.update);
        this.router.get('/:pseudo', this.getCount);
    }

    public async getCount(req: Request, res: Response, next: NextFunction) {
        try {
            const rental = await Rental.findById({'member' : req.params.id});
            const count = rental.items.length - 1;
            res.json(count);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async update(req: Request, res: Response, next: NextFunction) {
        try {
            const updatedRental = await Rental.findOneAndUpdate({ _id: req.params.id },
                req.body,
                { new: true });  // pour renvoyer le document modifié
            res.json(updatedRental);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const rentals = await Rental.find().then(() => Rental.aggregate([
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
            ])
        );
            res.json(rentals);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async deleteOne(req: Request, res: Response, next: NextFunction) {
        try {
            const rental = await Rental.findOneAndRemove({ _id: req.params.id });
            res = await Member.updateMany(
                { _id: { $in: rental.member } },
                { $pull: { rentals: rental._id } }
            );
            if (rental != null) {
                res.json(true);
            } else {
                res.status(404).json(false);
            }
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            const member = await Member.findOne({pseudo: req.params.pseudo});
            const pseudo = member.pseudo;
            const rental = await Rental.find().then(() => Rental.aggregate([
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
                { $match: { 'member.pseudo': pseudo } },
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
            ])
        );
            res.json(rental);
            console.log(member);
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

    public async getRentalByItem(req: Request, res: Response, next: NextFunction) {
        try {
           const rental = await Rental.find({ 'items._id' : req.params.id });
           res.json(rental);
        } catch (err) {
            res.status(500).send(err);
        }
    }
}
