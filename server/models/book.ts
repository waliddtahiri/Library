import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export interface IBook extends mongoose.Document {
    isbn: number;
    title: string;
    author: string;
    editor: string;
}

const bookSchema = new mongoose.Schema({
    isbn: { type: Number, required: true, unique: true },
    author: { type: String, required: true },
    title: { type: String, required: true },
    editor: { type: String, required: true },
});

const Book = mongoose.model<IBook>('Book', bookSchema);

export default Book;
