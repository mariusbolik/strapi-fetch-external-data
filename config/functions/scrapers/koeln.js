/**
 * This script will fetch all parking garages from thr city "Köln" (Germany)
 * Each object will have a property called "assignment". This is used to check if the 
 * parking garage already exists in the database. If not, it'll be create. If it exists,
 * it'll be updated.
 * The assignment consists of the city name and the it of the parking garage.
 */

const axios = require('axios');

module.exports = async () => {
  const prefix = 'koeln_';
  const { data } = await axios.get('https://www.koeln.de/apps/parken/json/current');

  // Generate assignments from original data
  const assignments = Object.values(data).map((origItem) => {
    return prefix + origItem.id;
  });

  // Get all available objects in one call
  const existingItems = await strapi.query('facilities').find({ assignment: assignments });

  await Promise.all(
    Object.values(data).map(async (origItem) => {
      // const existingItem = existingItems[i];
      const matchingExistingItem = existingItems.find((existingItem) => existingItem.assignment === prefix + origItem.id);

      if (matchingExistingItem) {
        // Check if count of free spots has changed
        // if (matchingExistingItem.spots.free !== Number(origItem.free)) {
          // Update
          try {
            await strapi.query('facilities').update(
              { id: matchingExistingItem.id },
              {
                spots: {
                  free: origItem.free,
                  freeText: Number(origItem.free) > 0 ? 'frei' : 'besetzt',
                },
                state: origItem.status === '1' ? 'Offen' : 'Geschlossen',
                updated_at: origItem.timestamp,
              }
            );
            console.log('Update:', matchingExistingItem.name, '(Köln)');
            console.log('Free Spots:', matchingExistingItem.spots.free + ' -> ' + Number(origItem.free));
            console.log('---');
          } catch (e) {
            console.log('ERROR! Could not update:', matchingExistingItem.name, '(Köln)');
            console.log(e);
            console.log('---');
          }
        // } else {
        //   console.log('Not Updating ' + matchingExistingItem.name, '(Köln)');
        //   console.log('---');
        // }
      } else {
        // Create
        await strapi.query('facilities').create({
          assignment: prefix + origItem.id,
          name: origItem.title,
          spots: {
            free: origItem.free,
            freeText: Number(origItem.free) > 0 ? 'frei' : 'besetzt',
            capacity: origItem.capacity,
          },
          pricing: {
            pricePerHour: origItem.price.split(' € / ').length === 2 ? parseFloat(origItem.price.split(' € / ')[0]) : null,
            stringRepresentation: origItem.price,
          },
          address: {
            street: (origItem.street + ' ' + origItem.housenumber).trim(),
            city: origItem.city,
            zip: origItem.zip,
          },
          location: {
            lat: origItem.lat,
            lng: origItem.lng,
          },
          city: {
            id: 1
          },
          state: origItem.status === '1' ? 'Offen' : 'Geschlossen',
          openingTimes: origItem.open,
          notice: origItem.extra_info,
          entranceHeight: origItem.entry_height,
          entranceWidth: origItem.entry_width,
          updated_at: origItem.timestamp,
        });
        console.log('Create:', origItem.longname, '(Köln)');
      }
    })
  );
};
