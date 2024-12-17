import cat1 from '../assets/cat1.png';
import cat2 from '../assets/cat2.png';
import cat3 from '../assets/cat3.png';
import cat4 from '../assets/cat4.png';
import check from '../assets/checkmark-circle-02.png';
import ObjectID from 'bson-objectid';

export const categoriesData = [
    {
        id: ObjectID().toHexString(),
        name: 'Cloths',
        image: cat1,
        checkedImage: check
    },
    {
        id: ObjectID().toHexString(),
        name: 'Accessories',
        image: cat2,
        checkedImage: check
    },
    {
        id: ObjectID().toHexString(),
        name: 'Foot Wears',
        image: cat3,
        checkedImage: check
    },
    {
        id: ObjectID().toHexString(),
        name: 'Baby Wears',
        image: cat4,
        checkedImage: check
    }
]
