import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export interface IMember extends mongoose.Document {
    pseudo: string;
    password: string;
    profile: string;
    birthdate: Date;
    admin: boolean;
    picturePath: string;
    phones: [{type: string, number: string}];
}

const memberSchema = new mongoose.Schema({
    pseudo: { type: String, required: true, unique: true },
    password: { type: String, default: '' },
    profile: { type: String, default: '' },
    birthdate: { type: Date },
    admin: { type: Boolean, default: false },
    picturePath: { type: String, default: '' },
    phones: [{type: {type: String, default: ''}, number: {type: String, default: ''}}]
});

const Member = mongoose.model<IMember>('Member', memberSchema);

export default Member;
