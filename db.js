const sql = require('mssql');
var config = {
  user: 'sa',
  password: '?churcher/',
  server: 'SENSEI',
  database: 'MyRestaurant',
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log('Connected to MSSQL');
    alert('connected to mssql');
    return pool;
  })
  .catch((err) =>
    console.log('Database connection failed ! Bad Config: ', err)
  );

module.exports = { sql, poolPromise };
