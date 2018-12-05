import * as mongoose from 'mongoose';
import Member from './member';
import {IMember} from './member';
import Book from './book';
import {IBook} from './book';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

export interface IRental extends mongoose.Document {
    orderDate: string;
    member: IMember;
    items: { book: IBook, returnDate: string }[];
}

const rentalSchema = new Schema({
    orderDate: { type: String, required: true },
    member: { type: ObjectId, ref: 'Member' },
    items: [{ book: { type: ObjectId, ref: 'Book' }, returnDate: { type: String } }],
});

const RentalBase = mongoose.model<IRental>('Rental', rentalSchema);

export default class Rental extends RentalBase {
    return(books: Book[]): boolean {
        for (const book of books) {
            const item = this.items.find(i => i.book._id === book._id);
            if (!item) {
                return false;
            }
            item.returnDate = new Date().toLocaleString();
        }
        return true;
    }
}
