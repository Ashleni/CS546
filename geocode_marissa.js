import 'dotenv/config';
import { dbConnection, closeConnection } from '../config/mongoConnection.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const geocodeAddress = async (building, street, zip) => {
    const address = `${building} ${street}, ${zip}, New York City`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Delicacy-CS546-Project' }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon)
            };
        }
    } catch (e) {
        console.log(`Failed to geocode: ${address}`);
    }
    return null;
};

const main = async () => {
    const db = await dbConnection();
    const restaurantCollection = db.collection('restaurants');
    
    // Only get restaurants that don't have coordinates yet
    const allRestaurants = await restaurantCollection
        .find({ latitude: { $exists: false } })
        .project({ _id: 1, address: 1, name: 1 })
        .toArray();

    console.log(`Geocoding ${allRestaurants.length} restaurants...`);

    for (let i = 0; i < allRestaurants.length; i++) {
        const r = allRestaurants[i];
        const { building, street, zip } = r.address;
        
        const coords = await geocodeAddress(building, street, zip);
        
        if (coords) {
            await restaurantCollection.updateOne(
                { _id: r._id },
                { $set: { latitude: coords.latitude, longitude: coords.longitude } }
            );
            console.log(`${i + 1}/${allRestaurants.length} ✓ ${r.name}`);
        } else {
            console.log(`${i + 1}/${allRestaurants.length} ✗ ${r.name} (no coords found)`);
        }

        // Wait 1.1 seconds between requests to respect Nominatim rate limit
        await sleep(1100);
    }

    console.log('Done!');
    await closeConnection();
};

main();