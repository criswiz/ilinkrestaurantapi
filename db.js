const sql = require('mssql');

var config = {
  user: 'sensei',
  password: '?Churcher1234/',
  server: 'sensei.database.windows.net',
  database: 'MyRestaurant',
  options: {
    encrypt: true,
    database: 'MyRestaurant',
    port: 1433,
  },
  type: 'Microsoft.Sql/servers/databases',
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log('Connected to Azure MSSQL');
    return pool;
  })
  .catch((err) =>
    console.log('Database connection failed ! Bad Config: ', err)
  );

module.exports = { sql, poolPromise };
