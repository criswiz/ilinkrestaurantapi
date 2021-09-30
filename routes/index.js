const API_KEY = '1234';
var SECRET_KEY = 'Sensei_Link_Restaurant_6TrEF48X8720';

var express = require('express');
const { Float } = require('mssql');
var jwt = require('jsonwebtoken');
var exjwt = require('express-jwt');
var router = express.Router();
const { poolPromise, sql } = require('../db');

/*
 * DECLARE SECRET KEY
 *
 * */
const jwtMW = exjwt({
  secret: SECRET_KEY,
  algorithms: ['sha1', 'RS256', 'HS256'],
});

/*
  TEST API WITH JWT
  */
router.get('/testjwt', jwtMW, function (req, res) {
  var authorization = req.headers.authorization,
    decode;
  try {
    decode = jwt.verify(authorization.split(' ')[1], SECRET_KEY);
  } catch (e) {
    return res.status(401).send('Unauthorized');
  }
  var fbid = decode.fbid;
  res.send(JSON.stringify({ success: true, message: 'FBID: ' + fbid }));
});

//REQUEST JWT WITH FIREBASE ID
router.get('/getkey', async (req, res, next) => {
  var fbid = req.query.fbid;
  if (fbid != null) {
    let token = jwt.sign({ fbid: fbid }, SECRET_KEY, {});
    res.send(JSON.stringify({ success: true, token: token }));
  } else {
    res.send(
      JSON.stringify({ success: false, message: 'Missing fbid in request' })
    );
  }
});

/*
    TEST API IS RUNNNIG
 */
router.get('/', function (req, res) {
  res.end('API RUNNING');
});

//DISCOUNT AND USER_DISCOUNT TABLE
//POST/GET
router.get('/discount', jwtMW, async (req, res, next) => {
  console.log(req.query);

  var discount_code = req.query.code;
  if (discount_code != null) {
    try {
      const pool = await poolPromise;
      const queryResult = await pool
        .request()
        .input('code', sql.NChar, discount_code)
        .query(
          'SELECT code,value,description FROM [Discount] where code=@code'
        );
      if (queryResult.recordset.lenght > 0) {
        res.send(JSON.stringify({ success: false, message: 'Empty' }));
      } else {
        res.send(
          JSON.stringify({ success: true, result: queryResult.recordset })
        );
      }
    } catch (err) {
      res.status(500); // Internal server error
      res.send(JSON.stringify({ success: false, message: err.message }));
    }
  } else {
    res.send(
      JSON.stringify({
        success: false,
        message: 'Missing discount_code in JWT',
      })
    );
  }
});

router.get('/checkdiscount', jwtMW, async (req, res, next) => {
  console.log(req.query);
  var authorization = req.headers.authorization,
    decode;
  try {
    decode = jwt.verify(authorization.split(' ')[1], SECRET_KEY);
  } catch (e) {
    return res.status(401).send('Unauthorized');
  }
  var fbid = decode.fbid;
  var discount_code = req.query.code;
  if (fbid != null) {
    try {
      const pool = await poolPromise;
      const queryResult = await pool
        .request()
        .input('fbid', sql.NVarChar, fbid)
        .input('code', sql.NChar, discount_code)
        .query('SELECT * FROM [User_Discount] WHERE fbid=@fbid AND code=@code');
      if (queryResult.recordset.lenght > 0) {
        res.send(JSON.stringify({ success: true, message: 'NoUse' }));
      } else {
        res.send(JSON.stringify({ success: false, message: 'Exists' }));
      }
    } catch (err) {
      res.status(500); // Internal server error
      res.send(JSON.stringify({ success: false, message: err.message }));
    }
  } else {
    res.send(
      JSON.stringify({
        success: false,
        message: 'Missing fbid in JWT',
      })
    );
  }
});

router.post('/applydiscount', jwtMW, async (req, res, next) => {
  console.log(req.body);
  var authorization = req.headers.authorization,
    decode;
  try {
    decode = jwt.verify(authorization.split(' ')[1], SECRET_KEY);
  } catch (e) {
    return res.status(401).send('Unauthorized');
  }
  var fbid = decode.fbid;
  var code = req.body.code;

  if (fbid != null) {
    try {
      const pool = await poolPromise;
      const queryResult = await pool
        .request()
        .input('fbid', sql.NVarChar, fbid)
        .input('code', sql.NChar, code)
        .query(
          'INSERT INTO [User_Discount](FBID,Code) OUTPUT Inserted.FBID,Inserted.Code' +
            ' VALUES(@fbid,@code)'
        );

      console.log(queryResult); //Debug to see

      if (queryResult.rowsAffected != null) {
        res.send(JSON.stringify({ success: true, message: 'Success' }));
      }
    } catch (err) {
      res.status(500); // Internal server error
      res.send(JSON.stringify({ success: false, message: err.message }));
    }
  } else {
    res.send(
      JSON.stringify({
        success: false,
        messge: 'Missing Fbid in JWT',
      })
    );
  }
});

//TOKEN TABLE
//POST/GET
router.get('/token', jwtMW, async (req, res, next) => {
  console.log(req.query);
  var fbid = req.query.fbid;
  if (fbid != null) {
    try {
      const pool = await poolPromise;
      const queryResult = await pool
        .request()
        .input('FBID', sql.NVarChar, fbid)
        .query('SELECT fbid,token FROM [Token] where fbid=@FBID');
      if (queryResult.recordset.lenght > 0) {
        res.send(JSON.stringify({ success: false, message: 'Empty' }));
      } else {
        res.send(
          JSON.stringify({ success: true, result: queryResult.recordset })
        );
      }
    } catch (err) {
      res.status(500); // Internal server error
      res.send(JSON.stringify({ success: false, message: err.message }));
    }
  } else {
    res.send(
      JSON.stringify({ success: false, message: 'Missing fbid in JWT' })
    );
  }
});

router.post('/token', jwtMW, async (req, res, next) => {
  console.log(req.body);
  var authorization = req.headers.authorization,
    decode;
  try {
    decode = jwt.verify(authorization.split(' ')[1], SECRET_KEY);
  } catch (e) {
    return res.status(401).send('Unauthorized');
  }
  var fbid = decode.fbid;
  var token = req.body.token;

  if (fbid != null) {
    try {
      const pool = await poolPromise;
      const queryResult = await pool
        .request()
        .input('FBID', sql.NVarChar, fbid)
        .input('Token', sql.NVarChar, token)
        .query(
          'IF EXISTS(SELECT * FROM [Token] WHERE FBID=@FBID)' +
            ' UPDATE [Token] SET Token=@Token WHERE FBID=@FBID' +
            ' ELSE' +
            ' INSERT INTO [Token](FBID,Token) OUTPUT Inserted.FBID,Inserted.Token' +
            ' VALUES(@FBID,@Token)'
        );

      console.log(queryResult); //Debug to see

      if (queryResult.rowsAffected != null) {
        res.send(JSON.stringify({ success: true, message: 'Success' }));
      }
    } catch (err) {
      res.status(500); // Internal server error
      res.send(JSON.stringify({ success: false, message: err.message }));
    }
  } else {
    res.send(
      JSON.stringify({
        success: false,
        messge: 'Missing Fbid in JWT',
      })
    );
  }
});

//RESTAURANTOWNER TABLE
//POST/GET
router.get('/restaurantowner', jwtMW, async (req, res, next) => {
  console.log(req.query);
  var authorization = req.headers.authorization,
    decode;
  try {
    decode = jwt.verify(authorization.split(' ')[1], SECRET_KEY);
  } catch (e) {
    return res.status(401).send('Unauthorized');
  }
  var fbid = decode.fbid;
  if (fbid != null) {
    try {
      const pool = await poolPromise;
      const queryResult = await pool
        .request()
        .input('fbid', sql.NVarChar, fbid)
        .query(
          'SELECT userPhone,name, status,restaurantId,fbid FROM [RestaurantOwner] where fbid=@fbid'
        );
      if (queryResult.recordset.lenght > 0) {
        res.send(JSON.stringify({ success: false, message: 'Empty' }));
      } else {
        res.send(
          JSON.stringify({ success: true, result: queryResult.recordset })
        );
      }
    } catch (err) {
      res.status(500); // Internal server error
      res.send(JSON.stringify({ success: false, message: err.message }));
    }
  } else {
    res.send(
      JSON.stringify({ success: false, message: 'Missing fbid in JWT' })
    );
  }
});

router.post('/restaurantowner', jwtMW, async (req, res, next) => {
  console.log(req.body);

  var user_phone = req.body.userPhone;
  var user_name = req.body.userName;
  var authorization = req.headers.authorization,
    decode;
  try {
    decode = jwt.verify(authorization.split(' ')[1], SECRET_KEY);
  } catch (e) {
    return res.status(401).send('Unauthorized');
  }
  var fbid = decode.fbid;

  if (fbid != null) {
    try {
      const pool = await poolPromise;
      const queryResult = await pool
        .request()
        .input('UserPhone', sql.NVarChar, user_phone)
        .input('UserName', sql.NVarChar, user_name)
        .input('FBID', sql.NVarChar, fbid)
        .query(
          'IF EXISTS(SELECT * FROM [RestaurantOwner] WHERE FBID=@FBID)' +
            ' UPDATE [User] SET Name=@UserName, UserPhone=@UserPhone WHERE FBID=@FBID' +
            ' ELSE' +
            ' INSERT INTO [RestaurantOwner](FBID,UserPhone,Name,Status) OUTPUT Inserted.FBID,Inserted.UserPhone,Inserted.Name,Inserted.Status' +
            ' VALUES(@FBID,@UserName,@UserPhone,0)'
        );

      console.log(queryResult); //Debug to see

      if (queryResult.rowsAffected != null) {
        res.send(JSON.stringify({ success: true, message: 'Success' }));
      }
    } catch (err) {
      res.status(500); // Internal server error
      res.send(JSON.stringify({ success: false, message: err.message }));
    }
  } else {
    res.send(
      JSON.stringify({
        success: false,
        messge: 'Missing Fbid in JWT',
      })
    );
  }
});

//USER TABLE
//POST/GET
router.get('/user', jwtMW, async (req, res, next) => {
  console.log(req.query);

  var authorization = req.headers.authorization,
    decode;
  try {
    decode = jwt.verify(authorization.split(' ')[1], SECRET_KEY);
  } catch (e) {
    return res.status(401).send('Unauthorized');
  }
  var fbid = decode.fbid;
  if (fbid != null) {
    try {
      const pool = await poolPromise;
      const queryResult = await pool
        .request()
        .input('fbid', sql.NVarChar, fbid)
        .query(
          'SELECT userPhone,name,address,fbid FROM [User] where fbid=@fbid'
        );
      if (queryResult.recordset.lenght > 0) {
        res.send(JSON.stringify({ success: false, message: 'Empty' }));
      } else {
        res.send(
          JSON.stringify({ success: true, result: queryResult.recordset })
        );
      }
    } catch (err) {
      res.status(500); // Internal server error
      res.send(JSON.stringify({ success: false, message: err.message }));
    }
  } else {
    res.send(
      JSON.stringify({ success: false, message: 'Missing fbid in JWT' })
    );
  }
});

router.post('/user', jwtMW, async (req, res, next) => {
  console.log(req.body);

  var user_phone = req.body.userPhone;
  var user_name = req.body.userName;
  var user_address = req.body.userAddress;
  var authorization = req.headers.authorization,
    decode;
  try {
    decode = jwt.verify(authorization.split(' ')[1], SECRET_KEY);
  } catch (e) {
    return res.status(401).send('Unauthorized');
  }
  var fbid = decode.fbid;

  if (fbid != null) {
    try {
      const pool = await poolPromise;
      const queryResult = await pool
        .request()
        .input('UserPhone', sql.NVarChar, user_phone)
        .input('UserName', sql.NVarChar, user_name)
        .input('UserAddress', sql.NVarChar, user_address)
        .input('FBID', sql.NVarChar, fbid)
        .query(
          'IF EXISTS(SELECT * FROM [User] WHERE FBID=@FBID)' +
            ' UPDATE [User] SET Name=@UserName, UserPhone=@UserPhone, Address=@UserAddress WHERE FBID=@FBID' +
            ' ELSE' +
            ' INSERT INTO [User](FBID,UserPhone,Name,Address) OUTPUT Inserted.FBID,Inserted.UserPhone,Inserted.Name,Inserted.Address' +
            ' VALUES(@FBID,@UserName,@UserPhone,@UserAddress)'
        );

      console.log(queryResult); //Debug to see

      if (queryResult.rowsAffected != null) {
        res.send(JSON.stringify({ success: true, message: 'Success' }));
      }
    } catch (err) {
      res.status(500); // Internal server error
      res.send(JSON.stringify({ success: false, message: err.message }));
    }
  } else {
    res.send(
      JSON.stringify({
        success: false,
        messge: 'Missing Fbid in JWT',
      })
    );
  }
});

//RESTAURANT TABLE
//GET

router.get('/restaurant', jwtMW, async (req, res, next) => {
  console.log(req.query);

  try {
    const pool = await poolPromise;
    const queryResult = await pool
      .request()
      .query(
        'Select id,name,address,phone,lat,lng,userowner,image,paymentUrl from [Restaurant]'
      );
    if (queryResult.recordset.lenght > 0) {
      res.send(JSON.stringify({ success: false, message: 'Empty' }));
    } else {
      res.send(
        JSON.stringify({ success: true, message: queryResult.recordset })
      );
    }
  } catch (error) {
    res.status(500);
    res.send(JSON.stringify({ success: false, message: error.message }));
  }
});

router.get('/restaurantByID', jwtMW, async (req, res, next) => {
  {
    var restaurantId = req.query.id;
    if (restaurantId != null) {
      try {
        var pool = await poolPromise;
        var queryResult = await pool
          .request()
          .input('restaurantId', sql.Int, restaurantId)
          .query('Select * from [Restaurant] where id=@restaurantId');

        if (queryResult.recordset.lenght > 0) {
          res.send(JSON.stringify({ success: false, message: 'Empty' }));
        } else {
          res.send(
            JSON.stringify({ success: true, message: queryResult.recordset })
          );
        }
      } catch (error) {
        res.status(500);
        res.send(JSON.send({ success: false, message: error.message }));
      }
    } else {
      res.send(JSON.stringify({ success: false, message: 'Missing "id" JWT' }));
    }
  }
});

router.get('/nearbyrestaurant', jwtMW, async (req, res, next) => {
  {
    console.log(req.query);

    var user_lat = parseFloat(req.query.lat);
    var user_lng = parseFloat(req.query.lng);
    var distance = parseFloat(req.query.distance);
    if (user_lat != Number.NaN && user_lng != Number.NaN) {
      try {
        var pool = await poolPromise;
        var queryResult = await pool
          .request()
          .input('lat', sql.Float, user_lat)
          .input('lng', sql.Float, user_lng)
          .input('distance', sql.Int, distance)
          .query(
            'SELECT * FROM(SELECT id,name,address,phone,lat,lng,userOwner,image,paymentUrl,' +
              'ROUND (111.045 * DEGREES(ACOS(COS(RADIANS(@lat)) * COS(RADIANS(lat))' +
              '* COS(RADIANS(lng) - RADIANS(@lng)) + SIN(RADIANS(@lat))' +
              '* SIN(RADIANS(lat)))), 2) AS distance_in_km FROM  [Restaurant])tempTable' +
              ' WHERE distance_in_km < @distance'
          );
        if (queryResult.recordset.lenght > 0) {
          res.send(JSON.stringify({ success: false, message: 'Empty' }));
        } else {
          res.send(
            JSON.stringify({ success: true, message: queryResult.recordset })
          );
        }
      } catch (error) {
        res.status(500);
        res.send(JSON.send({ success: false, message: error.message }));
      }
    } else {
      res.send(
        JSON.stringify({ success: false, message: 'Missing "id" in JWT' })
      );
    }
  }
});

//MENU TABLE
//GET

router.get('/menu', jwtMW, async (req, res, next) => {
  {
    var restaurantId = req.query.restaurantId;
    if (restaurantId != null) {
      try {
        var pool = await poolPromise;
        var queryResult = await pool
          .request()
          .input('restaurantId', sql.Int, restaurantId)
          .query(
            'Select id,name,description,image FROM [Menu] Where id In' +
              '(Select menuId From [Restaurant_Menu] Where restaurantId=@restaurantId)'
          );

        if (queryResult.recordset.lenght > 0) {
          res.send(JSON.stringify({ success: false, message: 'Empty' }));
        } else {
          res.send(
            JSON.stringify({ success: true, message: queryResult.recordset })
          );
        }
      } catch (error) {
        res.status(500);
        res.send(JSON.stringify({ success: false, message: error.message }));
      }
    } else {
      res.send(
        JSON.stringify({
          success: false,
          message: 'Missing "Restaurant id" in JWT',
        })
      );
    }
  }
});

//FOOD TABLE
//GET

router.get('/food', jwtMW, async (req, res, next) => {
  {
    var menuId = req.query.menuId;
    if (menuId != null) {
      try {
        var pool = await poolPromise;
        var queryResult = await pool
          .request()
          .input('menuId', sql.Int, menuId)
          .query(
            'Select id,name,description,image, price,isSize,isAddon,discount FROM [Food] Where id In' +
              '(Select foodId From [Menu_Food] Where menuId=@menuId)'
          );

        if (queryResult.recordset.lenght > 0) {
          res.send(JSON.stringify({ success: false, message: 'Empty' }));
        } else {
          res.send(
            JSON.stringify({ success: true, message: queryResult.recordset })
          );
        }
      } catch (error) {
        res.status(500);
        res.send(JSON.stringify({ success: false, message: error.message }));
      }
    } else {
      res.send(
        JSON.stringify({
          success: false,
          message: 'Missing "Menu id" in JWT',
        })
      );
    }
  }
});

router.get('/foodById', jwtMW, async (req, res, next) => {
  {
    var foodId = req.query.foodId;
    if (foodId != null) {
      try {
        var pool = await poolPromise;
        var queryResult = await pool
          .request()
          .input('foodId', sql.Int, foodId)
          .query(
            'Select id,name,description,image, price,isSize,isAddon,discount FROM [Food] Where id=@foodId'
          );

        if (queryResult.recordset.lenght > 0) {
          res.send(JSON.stringify({ success: false, message: 'Empty' }));
        } else {
          res.send(
            JSON.stringify({ success: true, message: queryResult.recordset })
          );
        }
      } catch (error) {
        res.status(500);
        res.send(JSON.stringify({ success: false, message: error.message }));
      }
    } else {
      res.send(
        JSON.stringify({
          success: false,
          message: 'Missing "Food id" in JWT',
        })
      );
    }
  }
});

router.get('/searchFood', jwtMW, async (req, res, next) => {
  {
    var searchQuery = req.query.foodName;
    if (searchQuery != null) {
      try {
        var pool = await poolPromise;
        var queryResult = await pool
          .request()
          .input('searchQuery', sql.NVarChar, '%' + searchQuery + '%')
          .query(
            'Select id,name,description,image, price,isSize,isAddon,discount FROM [Food] Where name LIKE @searchQuery'
          );

        if (queryResult.recordset.lenght > 0) {
          res.send(JSON.stringify({ success: false, message: 'Empty' }));
        } else {
          res.send(
            JSON.stringify({ success: true, message: queryResult.recordset })
          );
        }
      } catch (error) {
        res.status(500);
        res.send(JSON.stringify({ success: false, message: error.message }));
      }
    } else {
      res.send(
        JSON.stringify({
          success: false,
          message: 'Missing Food Name in JWT',
        })
      );
    }
  }
});

//SIZE TABLE
//GET

router.get('/size', jwtMW, async (req, res, next) => {
  {
    var foodId = req.query.foodId;
    if (foodId != null) {
      try {
        var pool = await poolPromise;
        var queryResult = await pool
          .request()
          .input('foodId', sql.Int, foodId)
          .query(
            'Select id,description,extraPrice From [Size] Where id in' +
              ' (Select sizeId from [Food_Size] Where foodId=@foodId)'
          );

        if (queryResult.recordset.lenght > 0) {
          res.send(JSON.stringify({ success: false, message: 'Empty' }));
        } else {
          res.send(
            JSON.stringify({ success: true, message: queryResult.recordset })
          );
        }
      } catch (error) {
        res.status(500);
        res.send(JSON.stringify({ success: false, message: error.message }));
      }
    } else {
      res.send(
        JSON.stringify({
          success: false,
          message: 'Missing "Food id" in JWT',
        })
      );
    }
  }
});

//ADDON TABLE
//GET

router.get('/addon', jwtMW, async (req, res, next) => {
  {
    var foodId = req.query.foodId;
    if (foodId != null) {
      try {
        var pool = await poolPromise;
        var queryResult = await pool
          .request()
          .input('foodId', sql.Int, foodId)
          .query(
            'Select id,name,description,extraPrice From [Addon] Where id in' +
              ' (Select addonId from [Food_Addon] Where foodId=@foodId)'
          );

        if (queryResult.recordset.lenght > 0) {
          res.send(JSON.stringify({ success: false, message: 'Empty' }));
        } else {
          res.send(
            JSON.stringify({ success: true, message: queryResult.recordset })
          );
        }
      } catch (error) {
        res.status(500);
        res.send(JSON.stringify({ success: false, message: error.message }));
      }
    } else {
      res.send(
        JSON.stringify({
          success: false,
          message: 'Missing "Food id" in JWT',
        })
      );
    }
  }
});

//ORDER AND ORDER DETAIL TABLE
//GET / POST
router.get('/hotfood', jwtMW, async (req, res, next) => {
  {
    try {
      var pool = await poolPromise;
      var queryResult = await pool
        .request()
        .query(
          'Select TOP 10 tempTable.itemId, tempTable.name, ROUND((COUNT(tempTable.itemId)*100.0/(Select COUNT(*) FROM OrderDetail)),2) as [percent] FROM (Select itemId, name From Food INNER JOIN OrderDetail ON Food.ID = OrderDetail.ItemId) tempTable GROUP BY tempTable.itemId, tempTable.name ORDER BY [percent] DESC '
        );

      if (queryResult.recordset.lenght > 0) {
        res.send(JSON.stringify({ success: false, message: 'Empty' }));
      } else {
        res.send(
          JSON.stringify({ success: true, message: queryResult.recordset })
        );
      }
    } catch (error) {
      res.status(500);
      res.send(JSON.stringify({ success: false, message: error.message }));
    }
  }
});

router.get('/orderdetailbyrestaurant', jwtMW, async (req, res, next) => {
  {
    var orderId = req.query.orderId;
    if (orderId != null) {
      try {
        var pool = await poolPromise;
        var queryResult = await pool
          .request()
          .input('OrderId', sql.Int, orderId)
          .query(
            'Select OrderDetail.orderId,itemId,quantity,size,addOn,orderFBID,name,description,image' +
              ' From [OrderDetail] INNER JOIN [Order] ON OrderDetail.orderId = [Order].orderId' +
              ' INNER JOIN Food ON OrderDetail.itemId = Food.ID' +
              ' WHERE OrderDetail.orderId=@OrderId'
          );

        if (queryResult.recordset.lenght > 0) {
          res.send(JSON.stringify({ success: false, message: 'Empty' }));
        } else {
          res.send(
            JSON.stringify({ success: true, message: queryResult.recordset })
          );
        }
      } catch (error) {
        res.status(500);
        res.send(JSON.stringify({ success: false, message: error.message }));
      }
    } else {
      res.send(
        JSON.stringify({
          success: false,
          message: 'Missing Order Id in JWT',
        })
      );
    }
  }
});

router.get('/orderbyrestaurant', jwtMW, async (req, res, next) => {
  {
    var restaurantId = req.query.restaurantId;
    var startIndex = req.query.from;
    var endIndex = req.query.to;
    if (restaurantId != null) {
      try {
        if (startIndex == null) startIndex = 0; //if user does not submit anything the default is 0
        if (endIndex == null) endIndex = 10; //

        var pool = await poolPromise;
        var queryResult = await pool
          .request()
          .input('RestaurantId', sql.NVarChar, restaurantId)
          .input('StartIndex', sql.Int, startIndex)
          .input('EndIndex', sql.Int, endIndex)
          .query(
            'Select * from (Select ROW_NUMBER() OVER(ORDER BY orderId DESC) AS RowNum, orderId,orderFbid,orderPhone,orderName,orderAddress,orderStatus,orderDate,restaurantId,transactionId,cod,totalPrice,numOfItem From [Order] Where restaurantId=@RestaurantId AND numOfItem > 0) AS RowConstrainedResult'
          );

        if (queryResult.recordset.lenght > 0) {
          res.send(JSON.stringify({ success: false, message: 'Empty' }));
        } else {
          res.send(
            JSON.stringify({ success: true, message: queryResult.recordset })
          );
        }
      } catch (error) {
        res.status(500);
        res.send(JSON.stringify({ success: false, message: error.message }));
      }
    } else {
      res.send(
        JSON.stringify({
          success: false,
          message: 'Missing Order Fbid in JWT',
        })
      );
    }
  }
});

router.get('/maxorderbyrestaurant', jwtMW, async (req, res, next) => {
  {
    var restaurantId = req.query.restaurantId;
    if (restaurantId != null) {
      try {
        var pool = await poolPromise;
        var queryResult = await pool
          .request()
          .input('RestaurantId', sql.NVarChar, restaurantId)
          .query(
            'Select MAX(RowNum) as maxRowNum from (Select ROW_NUMBER() OVER(ORDER BY orderId DESC) AS RowNum, orderId,orderFbid,orderPhone,orderName,orderAddress,orderStatus,orderDate,restaurantId,transactionId,cod,totalPrice,numOfItem From [Order] Where restaurantId=@RestaurantId AND numOfItem > 0) AS RowConstrainedResult'
          );

        if (queryResult.recordset.lenght > 0) {
          res.send(JSON.stringify({ success: false, message: 'Empty' }));
        } else {
          res.send(
            JSON.stringify({ success: true, message: queryResult.recordset })
          );
        }
      } catch (error) {
        res.status(500);
        res.send(JSON.stringify({ success: false, message: error.message }));
      }
    } else {
      res.send(
        JSON.stringify({
          success: false,
          message: 'Missing Order Fbid in JWT',
        })
      );
    }
  }
});

router.get('/order', jwtMW, async (req, res, next) => {
  {
    var authorization = req.headers.authorization,
      decode;
    try {
      decode = jwt.verify(authorization.split(' ')[1], SECRET_KEY);
    } catch (e) {
      return res.status(401).send('Unauthorized');
    }
    var orderfbid = decode.fbid;
    var startIndex = req.query.from;
    var endIndex = req.query.to;
    if (orderfbid != null) {
      try {
        if (startIndex == null) startIndex = 0; //if user does not submit anything the default is 0
        if (endIndex == null) endIndex = 10; //

        var pool = await poolPromise;
        var queryResult = await pool
          .request()
          .input('OrderFBID', sql.NVarChar, orderfbid)
          .input('StartIndex', sql.Int, startIndex)
          .input('EndIndex', sql.Int, endIndex)
          .query(
            'Select * from (Select ROW_NUMBER() OVER(ORDER BY orderId DESC) AS RowNum, orderId,orderFbid,orderPhone,orderName,orderAddress,orderStatus,orderDate,restaurantId,transactionId,cod,totalPrice,numOfItem From [Order] Where orderFBID=@orderFBID AND numOfItem > 0) AS RowConstrainedResult'
          );

        if (queryResult.recordset.lenght > 0) {
          res.send(JSON.stringify({ success: false, message: 'Empty' }));
        } else {
          res.send(
            JSON.stringify({ success: true, message: queryResult.recordset })
          );
        }
      } catch (error) {
        res.status(500);
        res.send(JSON.stringify({ success: false, message: error.message }));
      }
    } else {
      res.send(
        JSON.stringify({
          success: false,
          message: 'Missing Order Fbid in JWT',
        })
      );
    }
  }
});

router.get('/maxorder', jwtMW, async (req, res, next) => {
  {
    var authorization = req.headers.authorization,
      decode;
    try {
      decode = jwt.verify(authorization.split(' ')[1], SECRET_KEY);
    } catch (e) {
      return res.status(401).send('Unauthorized');
    }
    var orderfbid = decode.fbid;
    if (orderfbid != null) {
      try {
        var pool = await poolPromise;
        var queryResult = await pool
          .request()
          .input('OrderFBID', sql.NVarChar, orderfbid)
          .query(
            'Select MAX(RowNum) as maxRowNum from (Select ROW_NUMBER() OVER(ORDER BY orderId DESC) AS RowNum, orderId,orderFbid,orderPhone,orderName,orderAddress,orderStatus,orderDate,restaurantId,transactionId,cod,totalPrice,numOfItem From [Order] Where orderFBID=@orderFBID AND numOfItem > 0) AS RowConstrainedResult'
          );

        if (queryResult.recordset.lenght > 0) {
          res.send(JSON.stringify({ success: false, message: 'Empty' }));
        } else {
          res.send(
            JSON.stringify({ success: true, message: queryResult.recordset })
          );
        }
      } catch (error) {
        res.status(500);
        res.send(JSON.stringify({ success: false, message: error.message }));
      }
    } else {
      res.send(
        JSON.stringify({
          success: false,
          message: 'Missing Order Fbid in JWT',
        })
      );
    }
  }
});

router.get('/orderDetail', jwtMW, async (req, res, next) => {
  {
    var orderId = req.query.orderId;
    if (orderId != null) {
      try {
        var pool = await poolPromise;
        var queryResult = await pool
          .request()
          .input('orderId', sql.Int, orderId)
          .query(
            'Select orderId,itemId,quantity,price,discount,size,addon,extraPrice From [OrderDetail] Where orderId=@orderId '
          );

        if (queryResult.recordset.lenght > 0) {
          res.send(JSON.stringify({ success: false, message: 'Empty' }));
        } else {
          res.send(
            JSON.stringify({ success: true, message: queryResult.recordset })
          );
        }
      } catch (error) {
        res.status(500);
        res.send(JSON.stringify({ success: false, message: error.message }));
      }
    } else {
      res.send(
        JSON.stringify({
          success: false,
          message: 'Missing Order Id in JWT',
        })
      );
    }
  }
});

router.post('/createOrder', jwtMW, async (req, res, next) => {
  var order_phone = req.body.orderPhone;
  var order_name = req.body.orderName;
  var order_address = req.body.orderAddress;
  var order_date = req.body.orderDate;
  var restaurantId = req.body.restaurantId;
  var transactionId = req.body.transactionId;
  var cod = req.body.cod;
  var total_price = req.body.totalPrice;
  var num_of_item = req.body.numOfItem;
  var authorization = req.headers.authorization,
    decode;
  try {
    decode = jwt.verify(authorization.split(' ')[1], SECRET_KEY);
  } catch (e) {
    return res.status(401).send('Unauthorized');
  }
  var order_fbid = decode.fbid;

  if (order_fbid != null) {
    try {
      const pool = await poolPromise;
      const queryResult = await pool
        .request()
        .input('OrderPhone', sql.NVarChar, order_phone)
        .input('OrderName', sql.NVarChar, order_name)
        .input('OrderAddress', sql.NVarChar, order_address)
        .input('OrderDate', sql.Date, order_date)
        .input('RestaurantId', sql.Int, restaurantId)
        .input('TransactionId', sql.NVarChar, transactionId)
        .input('Cod', sql.Bit, cod == true ? 1 : 0)
        .input('TotalPrice', sql.Float, total_price)
        .input('NumOfItem', sql.Int, num_of_item)
        .input('OrderFbid', sql.NVarChar, order_fbid)
        .query(
          ' INSERT INTO [Order] (orderFBID,orderPhone,orderName,orderAddress,orderDate,restaurantId,transactionId,cod,totalPrice,numOfItem)' +
            ' VALUES(@OrderFBID,@OrderName,@OrderPhone,@OrderAddress,@OrderDate, @RestaurantId, @TransactionId, @Cod, @TotalPrice, @NumOfItem)' +
            'Select Top 1 OrderId as orderNumber From [Order] Where orderFbid=@orderFBID Order By ordernumber DESC'
        );

      if (queryResult.recordset.lenght > 0) {
        res.send(JSON.stringify({ success: false, message: Empty }));
      } else {
        res.send(
          JSON.stringify({ success: true, message: queryResult.recordset })
        );
      }
    } catch (err) {
      res.status(500); // Internal server error
      res.send(JSON.stringify({ success: false, message: err.message }));
    }
  } else {
    res.send(
      JSON.stringify({
        success: false,
        messge: 'Missing order Fbid in JWT',
      })
    );
  }
});

router.post('/updateOrder', jwtMW, async (req, res, next) => {
  var orderId = req.body.orderId;
  var orderDetail;

  if (orderId != null && orderDetail != null) {
    try {
      const pool = await poolPromise;
      const table = new sql.Table('OrderDetail'); // Create virtual table to bulk insert
      table.create = true;

      table.columns.add('OrderId', sql.Int, {
        nullable: false,
        primary: true,
      });
      table.columns.add('ItemId', sql.Int, {
        nullable: false,
        primary: true,
      });
      table.columns.add('Quatity', sql.Int, { nullable: true });
      table.columns.add('Price', sql.Float, { nullable: true });
      table.columns.add('Discount', sql.Int, { nullable: true });
      table.columns, add('Size', sql.NVarChar(50), { nullable: true }); // Need exactly size in SQLServer Table (real table)
      table.columns.add('Addon', sql.NVarChar(4000), { nullable: true });
      table.columns.add('ExtraPrice', sql.Float, { nullable: true });

      for (i = 0; i < orderDetail.lenght; i++) {
        table.rows.add(
          orderId,
          orderDetail[i]['foodId'],
          orderDetail[i]['foodQuantity'],
          orderDetail[i]['foodPrice'],
          orderDetail[i]['foodDiscount'],
          orderDetail[i]['foodSize'],
          orderDetail[i]['foodAddon'],
          parseFloat(orderDetail[i]['foodExtraPrice'])
        );
      }

      const request = pool.request();
      request.bulk(table, (err, resultBulk) => {
        if (err) {
          console.log(err);
          res.send(JSON.stringify({ success: false, message: err }));
        } else {
          res.send(
            JSON.stringify({ success: true, message: 'Update Success' })
          );
        }
      });

      if (queryResult.recordset.lenght > 0) {
        res.send(JSON.stringify({ success: false, message: 'Empty' }));
      } else {
        res.send(
          JSON.stringify({ success: true, message: queryResult.recordset })
        );
      }
    } catch (err) {
      res.status(500); // Internal server error
      res.send(JSON.stringify({ success: false, message: err.message }));
    }
  } else {
    res.send(
      JSON.stringify({
        success: false,
        messge: 'Missing orderId or orderDetail in JWT',
      })
    );
  }
});

router.put('/updateOrder', jwtMW, async (req, res, next) => {
  var orderId = req.body.orderId;
  var orderStatus = req.body.orderStatus;

  if (orderId != null && orderStatus != null) {
    try {
      const pool = await poolPromise;
      const queryResult = await pool
        .request()
        .input('OrderId', sql.Int, orderId)
        .input('OrderStatus', sql.Int, orderStatus)
        .query(
          'UPDATE [Order] SET OrderStatus=@OrderStatus WHERE OrderId=@OrderId'
        );
      if (queryResult.rowsAffected != null)
        res.end(JSON.stringify({ success: true, message: 'Success' }));
    } catch (error) {
      console.log(error);
      res.status(500);
      res.send(JSON.stringify({ success: false, message: error.message }));
    }
  } else {
    res.send(
      JSON.stringify({
        success: false,
        messge: 'Missing orderId in Put request of JWT',
      })
    );
  }
});

//FAVORITE TABLE
//GET / POST / DELETE

router.get('/favorite', jwtMW, async (req, res, next) => {
  {
    var authorization = req.headers.authorization,
      decode;
    try {
      decode = jwt.verify(authorization.split(' ')[1], SECRET_KEY);
    } catch (e) {
      return res.status(401).send('Unauthorized');
    }
    var fbid = decode.fbid;
    if (fbid != null) {
      try {
        var pool = await poolPromise;
        var queryResult = await pool
          .request()
          .input('fbid', sql.NVarChar, fbid)
          .query(
            'Select fbid,foodId,restaurantId,restaurantName, foodName, foodImage, price From [Favorite] Where fbid=@fbid '
          );

        if (queryResult.recordset.lenght > 0) {
          res.send(JSON.stringify({ success: false, message: 'Empty' }));
        } else {
          res.send(
            JSON.stringify({ success: true, message: queryResult.recordset })
          );
        }
      } catch (error) {
        res.status(500);
        res.send(JSON.stringify({ success: false, message: error.message }));
      }
    } else {
      res.send(
        JSON.stringify({
          success: false,
          message: 'Missing Fbid in JWT',
        })
      );
    }
  }
});

router.get('/favoriteByRestaurant', jwtMW, async (req, res, next) => {
  {
    var authorization = req.headers.authorization,
      decode;
    try {
      decode = jwt.verify(authorization.split(' ')[1], SECRET_KEY);
    } catch (e) {
      return res.status(401).send('Unauthorized');
    }
    var fbid = decode.fbid;
    var restaurantId = req.query.restaurantId;
    if (fbid != null) {
      try {
        var pool = await poolPromise;
        var queryResult = await pool
          .request()
          .input('fbid', sql.NVarChar, fbid)
          .input('restaurantId', sql.Int, restaurantId)
          .query(
            'Select fbid,foodId,restaurantId, foodName, foodImage, price From [Favorite] Where fbid=@fbid and restaurantId=@restaurantId'
          );

        if (queryResult.recordset.lenght > 0) {
          res.send(JSON.stringify({ success: false, message: 'Empty' }));
        } else {
          res.send(
            JSON.stringify({ success: true, message: queryResult.recordset })
          );
        }
      } catch (error) {
        res.status(500);
        res.send(JSON.stringify({ success: false, message: error.message }));
      }
    } else {
      res.send(
        JSON.stringify({
          success: false,
          message: 'Missing Fbid in JWT',
        })
      );
    }
  }
});

router.post('/favorite', jwtMW, async (req, res, next) => {
  var authorization = req.headers.authorization,
    decode;
  try {
    decode = jwt.verify(authorization.split(' ')[1], SECRET_KEY);
  } catch (e) {
    return res.status(401).send('Unauthorized');
  }
  var fbid = decode.fbid;
  let foodId = req.body.foodId;
  let restaurantId = req.body.restaurantId;
  let restaurantName = req.body.restaurantName;
  let foodName = req.body.foodName;
  let foodImage = req.body.foodImage;
  let foodPrice = req.body.price;

  if (fbid != null) {
    try {
      const pool = await poolPromise;
      const queryResult = await pool
        .request()
        .input('Fbid', sql.NVarChar, fbid)
        .input('foodId', sql.NVarChar, foodId)
        .input('restaurantId', sql.Int, restaurantId)
        .input('restaurantName', sql.NVarChar, restaurantName)
        .input('foodName', sql.NVarChar, foodName)
        .input('foodImage', sql.NVarChar, foodImage)
        .input('price', sql.Float, foodPrice)
        .query(
          'INSERT INTO [Favorite]' +
            '(fbid, FoodId, RestaurantId, RestaurantName, FoodName, FoodImage, Price)' +
            'VALUES' +
            '(@Fbid,@FoodId,@RestaurantId,@RestaurantName,@FoodName,@FoodImage,@price)'
        );
      res.send(JSON.stringify({ success: true, message: 'Success' }));
    } catch (err) {
      res.status(500); // Internal server error
      res.send(JSON.stringify({ success: false, message: err.message }));
    }
  } else {
    res.send(
      JSON.stringify({
        success: false,
        messge: 'Missing fbid in JWT',
      })
    );
  }
});

router.delete('/favorite', jwtMW, async (req, res, next) => {
  var authorization = req.headers.authorization,
    decode;
  try {
    decode = jwt.verify(authorization.split(' ')[1], SECRET_KEY);
  } catch (e) {
    return res.status(401).send('Unauthorized');
  }
  var fbid = decode.fbid;
  let foodId = req.query.foodId;
  let restaurantId = req.query.restaurantId;

  if (fbid != null) {
    try {
      const pool = await poolPromise;
      const queryResult = await pool
        .request()
        .input('Fbid', sql.NVarChar, fbid)
        .input('foodId', sql.NVarChar, foodId)
        .input('restaurantId', sql.Int, restaurantId)
        .query(
          'Delete From [favorite] Where Fbid=@Fbid And FoodId=@FoodId And RestaurantId=@RestaurantId'
        );
      res.send(JSON.stringify({ success: true, message: 'Success' }));
    } catch (err) {
      res.status(500); // Internal server error
      res.send(JSON.stringify({ success: false, message: err.message }));
    }
  } else {
    res.send(
      JSON.stringify({
        success: false,
        messge: 'Missing fbid in JWT',
      })
    );
  }
});

//SHIPPING TABLE
//GET / POST / DELETE

router.post('/shippingOrder', jwtMW, async (req, res, next) => {
  var authorization = req.headers.authorization,
    decode;
  try {
    decode = jwt.verify(authorization.split(' ')[1], SECRET_KEY);
  } catch (e) {
    return res.status(401).send('Unauthorized');
  }
  var orderId = req.body.orderId;
  let restaurantId = req.body.restaurantId;

  if (orderId != null && restaurantId != null) {
    try {
      const pool = await poolPromise;
      const queryResult = await pool
        .request()
        .input('OrderId', sql.Int, orderId)
        .input('RestaurantId', sql.Int, restaurantId)
        .query(
          'INSERT INTO [ShippingOrder]' +
            '(OrderId,ShippingStatus,ShipperId,RestaurantId )' +
            'VALUES' +
            '(@OrderId,1,0,@RestaurantId)'
        );
      res.send(JSON.stringify({ success: true, message: 'Success' }));
    } catch (err) {
      res.status(500); // Internal server error
      res.send(JSON.stringify({ success: false, message: err.message }));
    }
  } else {
    res.send(
      JSON.stringify({
        success: false,
        messge: 'Missing orederId, restaurantId in JWT',
      })
    );
  }
});

router.get('/shippingOrder', jwtMW, async (req, res, next) => {
  {
    var restaurantId = req.body.restaurantId;
    var startIndex = req.body.from;
    var endIndex = req.body.to;

    if (startIndex == null || isNaN(startIndex)) startIndex = 0;
    if (endIndex == null || isNaN(endIndex)) endIndex = 10;

    if (restaurantId != null) {
      try {
        var pool = await poolPromise;
        var queryResult = await pool
          .request()
          .input('RestaurantId', sql.NVarChar, restaurantId)
          .input('StartIndex', sql.NVarChar, startIndex)
          .input('EndIndex', sql.NVarChar, endIndex)
          .query(
            "Select * From (SELECT ROW_NUMBER() OVER (ORDER BY [ShippingOrder].OrderId DESC) AS RowNum, [ShippingOrder].orderId,shippingStatus,orderName,orderAddress,orderPhone,orderDate,orderStatus,transactionId,cod,totalPrice,numOfItem From [ShippingOrder] INNER JOIN [Order] ON [ShippingOrder].orderId = [Order].orderId WHERE [ShippingOrder].RestaurantId = @RestaurantId AND shipperId = '0')" +
              ' AS RowConstrainedResult WHERE RowNum >= @StartIndex AND RowNum <= @EndIndex ORDER BY orderId DESC'
          );

        if (queryResult.recordset.lenght > 0) {
          res.send(JSON.stringify({ success: false, message: 'Empty' }));
        } else {
          res.send(
            JSON.stringify({ success: true, result: queryResult.recordset })
          );
        }
      } catch (error) {
        res.status(500);
        res.send(JSON.stringify({ success: false, message: error.message }));
      }
    } else {
      res.send(
        JSON.stringify({
          success: false,
          message: 'Missing restaurantId in JWT',
        })
      );
    }
  }
});

router.get('/maxorderneedshipbyrestaurant', jwtMW, async (req, res, next) => {
  {
    var restaurantId = req.query.restaurantId;
    if (restaurantId != null) {
      try {
        var pool = await poolPromise;
        var queryResult = await pool
          .request()
          .input('RestaurantId', sql.NVarChar, restaurantId)
          .query(
            'Select MAX(RowNum) as maxRowNum from (Select ROW_NUMBER() OVER(ORDER BY orderId DESC) AS RowNum From [ShippingOrder] Where restaurantId=@RestaurantId) AS RowConstrainedResult'
          );

        if (queryResult.recordset.lenght > 0) {
          res.send(JSON.stringify({ success: false, message: 'Empty' }));
        } else {
          res.send(
            JSON.stringify({ success: true, message: queryResult.recordset })
          );
        }
      } catch (error) {
        res.status(500);
        res.send(JSON.stringify({ success: false, message: error.message }));
      }
    } else {
      res.send(
        JSON.stringify({
          success: false,
          message: 'Missing restaurantId  in JWT',
        })
      );
    }
  }
});

module.exports = router;
