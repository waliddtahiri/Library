import { Router, Request, Response, NextFunction } from 'express';
import * as mongoose from 'mongoose';
import Member from '../models/member';
import { AuthentificationRouter } from './authentication.router';
import { pipe } from 'rxjs';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as jwt from 'jsonwebtoken';

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
        this.router.get('/', this.getAll);
        this.router.get('/:id', this.getOne);
        this.router.put('/', this.update);
        this.router.post('/upload', upload.single('picture'), this.upload);
        this.router.post('/confirm', this.confirm);
        this.router.post('/cancel', this.cancel);
        this.router.post('/create', this.create);
        this.router.put('/:id', this.updateMember);
    }

    public async getCount(req: Request, res: Response, next: NextFunction) {
        try {
            const count = await Member.count({});
            res.json(count);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const members = await Member.find()
                .populate('followers followees')
                .sort({ pseudo: 'asc' });
            res.json(members);
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

    public async updateMember(req: Request, res: Response, next: NextFunction) {
        try {
            const updatedMember = await Member.findOneAndUpdate({ pseudo: req.params.id },
                req.body,
                { new: true });  // pour renvoyer le document modifié
            res.json(updatedMember);
        } catch (err) {
            res.status(500).send(err);
        }
    }

    public async create(req: Request, res: Response, next: NextFunction) {
        console.log('rentre dans create du routeur');
        const member = new Member(req.body);
        const token = jwt.sign({ pseudo: req.body.pseudo }, 'my-super-secret-key', { expiresIn: 60 });
        member.save()
            .then(member => res.json({ member: member, success: true, message: 'logged in', token: token }))
            .catch(err => res.status(500).send(err));

    }

    public async update(req: Request, res: Response, next: NextFunction) {
        if (!req.body.hasOwnProperty('picturePath')) {
            console.error('No picturePath received');
            return;
        }
        try {
            const currentUser = req['decoded'].pseudo;
            const updatedMember = await Member.findOneAndUpdate({ pseudo: currentUser },
                req.body,
                { new: true });  // pour renvoyer le document modifi�
            res.json(updatedMember);
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