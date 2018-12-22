import * as mongoose from 'mongoose';
import Member from './server/models/member';
import Book from './server/models/book';
import Category from './server/models/category';
import Rental from './server/models/rental';

const MONGO_URL = 'mongodb://127.0.0.1/msn';

/**
 * Cette fonction vide complètement la DB et l'initialise avec des données d'exemple
 * puis exécute quelques requêtes avancées.
 */
async function createData() {
    try {
        const db = await mongoose.connect(MONGO_URL);

        await db.connection.dropDatabase();

        const admin = new Member({
            pseudo: 'admin',
            password: 'admin',
            admin: true
        });
        const ben = new Member({
            pseudo: 'ben',
            password: 'ben',
            admin: false
        });
        const bruno = new Member({
            pseudo: 'bruno',
            password: 'bruno',
            admin: false
        });
        await Member.insertMany([admin, ben, bruno]);

        const catInformatique = new Category({ name: 'Informatique' });
        const catScienceFiction = new Category({ name: 'Science Fiction' });
        const catRoman = new Category({ name: 'Roman' });
        const catLitterature = new Category({ name: 'Littérature' });
        const catEssai = new Category({ name: 'Essai' });

        const book1 = new Book({
            isbn: '123',
            title: 'Java for Dummies',
            author: 'Duchmol', editor: 'EPFC'
        });
        const book2 = new Book({
            isbn: '456',
            title: 'Le Seigneur des Anneaux',
            author: 'Tolkien',
            editor: 'Bourgeois'
        });
        const book3 = new Book({
            isbn: '789',
            title: 'Les misérables',
            author: 'Victor Hugo',
            editor: 'XO'
        });

        book1.addCategories(catInformatique);
        book2.addCategories(catRoman, catScienceFiction);
        book3.addCategories(catRoman, catLitterature);

        await Book.insertMany([book1, book2, book3]);
        await Category.insertMany([
            catEssai,
            catInformatique,
            catLitterature,
            catRoman,
            catScienceFiction
        ]);

        const rental1 = ben.rent([book1, book3]);
        const rental2 = ben.rent([book2]);
        const rental3 = bruno.rent([book1, book2, book3]);
        await Rental.insertMany([rental1, rental2, rental3]);
        await ben.save();
        await bruno.save();

        rental1.return([book3]);
        rental3.return([book1, book2]);
        await rental1.save();
        await rental3.save();

        // Recherche les ids de tous les rentals items actifs (sans date de retour)
        let res = await Rental.aggregate([
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
        ]);
        console.log(res);

        // Recherche tous les rentals items actifs (sans date de retour)
        res = await Rental.aggregate([
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
        ]);

        // Recherche le rental qui correspond à un id donné
        const id = rental1.items[1]['_id'];
        res = await Rental.find({ 'items._id': id });
        console.log(res);

        // Idem, mais avec l'opérateur elemMatch
        res = await Rental.find({ items: { $elemMatch: { _id: id } } });
        console.log(res);

        // Met à jour la date de retour pour le rental item
        // qui correspond à un id donné
        res = await Rental.update(
            { 'items._id': id },
            { $set: { 'items.$.returnDate': '2018-11-22 22:22:22' } }
        );
        console.log(res);

        // Met à jour la date de retour pour tous les rental items
        // qui n'ont pas de date de retour
        res = await Rental.updateMany(
            { 'items.returnDate': null },
            { $set: { 'items.$[e].returnDate': '2018-11-22 22:22:22' } },
            { arrayFilters: [{ 'e.returnDate': null }] }
        );
        console.log(res);

        // Met la date de retour à null pour tous les rental items
        // qui ont une date de retour
        res = await Rental.updateMany(
            { 'items.returnDate': { $ne: null } },
            { $set: { 'items.$[e].returnDate': null } },
            { arrayFilters: [{ 'e.returnDate': { $ne: null } }] }
        );
        console.log(res);

        // Supprime la catégorie 'Roman', avec suppression des références
        // vers cette catégorie dans les livres
        const cat = await Category.findOneAndRemove({ name: /roman/i });
        res = await Book.updateMany(
            { _id: { $in: cat.books } },
            { $pull: { categories: cat._id } }
        );
        console.log(res);

        return 'done';
    } catch (err) {
        return `ERROR: ${err}`;
    }
    finally {
        await mongoose.disconnect();
    }
}

createData().then(res => console.log(res));
