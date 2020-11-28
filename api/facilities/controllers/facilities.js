'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
  async find(ctx) {

    // TODO: Improve function -> https://stackoverflow.com/a/46406904

    if (ctx.query.lat && ctx.query.lng) {
      const sql = `SELECT facilities.id, (
      3959 * acos (
              cos (radians(${ctx.query.lat}))
              * cos(radians(components_general_locations.lat))
              * cos(radians(components_general_locations.lng) - radians(${ctx.query.lng}))
              + sin (radians(${ctx.query.lat}))
              * sin(radians(components_general_locations.lat))
          )
      ) AS distance
      FROM facilities
      INNER JOIN facilities_components
      ON facilities_components.facility_id = facilities.id
      AND facilities_components.component_type = 'components_general_locations'
      INNER JOIN components_general_locations
      ON components_general_locations.id = facilities_components.component_id
      HAVING distance <= ${ctx.query.distance ? ctx.query.distance : '1000'} / 1000
      ORDER BY distance
      LIMIT 0, ${ctx.query.limit ? ctx.query.limit : '20'}`;

      const result = await strapi.connections.default.raw(sql);
      const parsedResult = JSON.parse(JSON.stringify(result[0]));

      const ids = parsedResult.map((item) => {
        return item.id;
      });

      // If ids.length = 0, strapi will output all available data. Because if we call find() without passing data,
      // that's the command for strapi to output everything. So we need to output an empty array if the sql query doesn't deliver results.
      if (ids.length) {
        const response = await strapi.query('facilities').find({ id: ids });
        return sanitizeEntity(response, {
          model: strapi.models['facilities'],
        });
      } else {
        return [];
      }


    } else {
      const result = await strapi.query('facilities').find(ctx.query);
      return sanitizeEntity(result, {
        model: strapi.models['facilities'],
      });
    }
  },
};
