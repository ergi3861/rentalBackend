  const db = require('../config/db');

const CarsModel = {
  create: async ({ type, brand, model, vin, category, year, engine_type, fuel, transmission, color, seats, price_per_day, sale_price, status }) => {
  const sql = `INSERT INTO cars (type, brand, model, vin, category, year,  fuel, transmission, color, seats, price_per_day, sale_price, status)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const [result] = await db.query(sql, [type, brand, model, vin, category, year,  fuel, transmission, color, seats, price_per_day, sale_price, status]);
  return result;
},

  // Get all cars
  getAllCars :  async (filters) => {
    const {
      type, brand, category, fuel, transmission,
      color, status, seats, year_min, year_max,
      price_min, price_max, search, sort,
      page = 1, limit = 24,
    } = filters;

    let query = "SELECT * FROM cars WHERE 1=1";
    const params = [];

    if (type) { query += " AND type = ?"; params.push(type); }
    if (brand) {
      const brands = brand.split(",");
      query += ` AND brand IN (${brands.map(() => "?").join(",")})`;
      params.push(...brands);
    }
    if (category) {
      const cats = category.split(",");
      query += ` AND category IN (${cats.map(() => "?").join(",")})`;
      params.push(...cats);
    }
    if (fuel) {
      const fuels = fuel.split(",");
      query += ` AND fuel IN (${fuels.map(() => "?").join(",")})`;
      params.push(...fuels);
    }
    if (transmission) {
      const trans = transmission.split(",");
      query += ` AND transmission IN (${trans.map(() => "?").join(",")})`;
      params.push(...trans);
    }
    if (color) {
      const colors = color.split(",");
      query += ` AND color IN (${colors.map(() => "?").join(",")})`;
      params.push(...colors);
    }
    if (status) { query += " AND status = ?"; params.push(status); }
    if (seats) { query += " AND seats = ?"; params.push(Number(seats)); }
    if (year_min) { query += " AND year >= ?"; params.push(Number(year_min)); }
    if (year_max) { query += " AND year <= ?"; params.push(Number(year_max)); }
    if (price_min) {
      query += " AND (price_per_day >= ? OR sale_price >= ?)";
      params.push(Number(price_min), Number(price_min));
    }
    if (price_max) {
      query += " AND (price_per_day <= ? OR sale_price <= ?)";
      params.push(Number(price_max), Number(price_max));
    }
    if (search) {
      query += " AND (brand LIKE ? OR model LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Sorting
    if (sort === "price_desc") {
      query += " ORDER BY COALESCE(NULLIF(price_per_day,0), sale_price) DESC";
    } else if (sort === "price_asc") {
      query += " ORDER BY COALESCE(NULLIF(price_per_day,0), sale_price) ASC";
    } else if (sort === "newest") {
      query += " ORDER BY created_at DESC";
    } else {
      query += " ORDER BY created_at DESC";
    }

    // Count total per pagination
    const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as total");
    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0].total;

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += " LIMIT ? OFFSET ?";
    params.push(Number(limit), offset);

    const [rows] = await db.query(query, params);
    return { rows, total };
  },

  getFilterOptions: async () => {
    const [[yearRange], [rentalPriceRange], [salePriceRange]] = await Promise.all([
      db.query("SELECT MIN(year) as min_year, MAX(year) as max_year FROM cars"),
      db.query("SELECT MIN(price_per_day) as min_rental, MAX(price_per_day) as max_rental FROM cars WHERE type='RENTAL'"),
      db.query("SELECT MIN(sale_price) as min_sale, MAX(sale_price) as max_sale FROM cars WHERE type='SALE'"),
    ]);

    return {
      brands: [
        'alfa romeo','aston martin','audi','bentley','bmw','bugatti','byd',
        'cadillac','chevrolet','chrysler','citroen','corvete','dacia','daimler',
        'dodge','ferrari','fiat','ford','genesis','gmc','honda','hummer','hyundai',
        'infiniti','iveco','jaguar','jeep','kia','koenigsegg','lada','lamborghini',
        'lancia','land rover','lexus','lincoln','maserati','maybach','mazda','mclaren',
        'mercedes benz','mg','mini cooper','mitsubishi','nissan','opel','pagani',
        'peugot','polestar','porsche','proton','renault','rolls royce','saab','seat',
        'skoda','smart','subaru','suzuki','tesla','toyota','volkswagen','volvo'
      ],
      categories: ['Ekonomike','Kompakt','SUV','Luksoze','Elektrike','Hibride'],
      fuels: ['nafte','benzin','elektrike','hybrid'],
      transmissions: ['manual','automatic','semi-automatic','tiptronic'],
      colors: [
        'black','white','grey','silver','red','blue','green','yellow','orange',
        'brown','beige','gold','purple','pink','violet','maroon','cyan','turquoise',
        'navy','lime','bronze','cream','pearl','cherry','mint','teal','magenta',
        'indigo','khaki','olive','tan'
      ],
      seats: [2, 4, 5, 6, 7, 8, 9, 10, 12, 15],
      yearRange: yearRange[0],
      rentalPriceRange: rentalPriceRange[0],
      salePriceRange: salePriceRange[0],
    };
  },

  //Get car by ID
  getById: async (id) => {
    const [rows] = await db.query("SELECT * FROM cars WHERE id = ?", [id]);
    return rows[0] || null;
  }

}


module.exports = CarsModel;