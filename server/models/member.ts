import * as mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
    pseudo: { type: String, required: true, unique: true },
    password: { type: String, default: '' },
    profile: { type: String, default: '' }
});

const Member = mongoose.model('Member', memberSchema);

export default Member;
