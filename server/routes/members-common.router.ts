import { Router, Request, Response, NextFunction } from 'express';
import Member from '../models/member';

export class MembersCommonRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.router.get('/count', this.getCount);
        this.router.get('/:id', this.getOne);
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
}
