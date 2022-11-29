
//Import MSSQL package to handle database
const sql = require('mssql');

//Database Config
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

//Database connection with config details
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
