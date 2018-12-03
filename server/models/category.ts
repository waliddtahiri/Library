import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export interface ICategory extends mongoose.Document {
    name: string;
}

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
});

const Category = mongoose.model<ICategory>('Category', categorySchema);

export default Category;
