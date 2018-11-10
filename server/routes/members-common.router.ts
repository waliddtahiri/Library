import { Router, Request, Response, NextFunction } from 'express';
import Member from '../models/member';

export class MembersCommonRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.router.get('/count', this.getCount);
    }

    public async getCount(req: Request, res: Response, next: NextFunction) {
        try {
            const count = await Member.count({});
            res.json(count);
        } catch (err) {
            res.status(500).send(err);
        }
    }
}
