const sql = require('mssql');
var config = {
  user: 'sensei',
  password: '?Churcher1234/',
  server: 'sensei.database.windows.net',
  options: {
    encrypt: true,
    database: 'MyRestaurant',
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log('Connected to MSSQL');
    return pool;
  })
  .catch((err) =>
    console.log('Database connection failed ! Bad Config: ', err)
  );

module.exports = { sql, poolPromise };
