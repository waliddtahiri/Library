import { Router, Request, Response, NextFunction } from 'express';
import Member from '../models/member';

export class MembersRouter {
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

    public getAll(req: Request, res: Response, next: NextFunction) {
        Member.find().sort({ pseudo: 'asc' })
            .then(members => res.json(members))
            .catch(err => res.status(500).send(err));
    }

    public getOne(req: Request, res: Response, next: NextFunction) {
        Member.find({ pseudo: req.params.id })
            .then(member => res.json(member))
            .catch(err => res.status(500).send(err));
    }

    public create(req: Request, res: Response, next: NextFunction) {
        let member = new Member(req.body);
        member.save()
            .then(member => res.json(member))
            .catch(err => res.status(500).send(err));
    }

    public update(req: Request, res: Response, next: NextFunction) {
        let member = new Member(req.body);
        Member.findOneAndUpdate({ pseudo: req.params.id },
            req.body,
            { new: true })  // pour renvoyer le document modifié
            .then(member => res.json(member))
            .catch(err => res.status(500).send(err));
    }

    public deleteOne(req: Request, res: Response, next: NextFunction) {
        Member.findOneAndRemove({ pseudo: req.params.id })
            .then(_ => res.json(true))
            .catch(err => res.status(500).send(err));
    }

    public deleteAll(req: Request, res: Response, next: NextFunction) {
        Member.remove({})
            .then(_ => res.json(true))
            .catch(err => res.status(500).send(err));
    }
}
