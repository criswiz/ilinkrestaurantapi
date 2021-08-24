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

//TOKEN TABLE
//POST/GET
router.get('/token', jwtMW, async (req, res, next) => {
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
        .input('FBID', sql.NVarChar, fbid)
        .query('SELECT fbid,token FROM [Token] where fbid=@FBID');
      if (queryResult.recordset.lenght > 0) {
        res.send(
          JSON.stringify({ success: true, result: queryResult.recordset })
        );
      } else {
        res.send(JSON.stringify({ success: false, message: 'Empty' }));
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
router.get('/restaurantowner', async (req, res, next) => {
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
          'SELECT userPhone,name,status,restaurantId,fbid FROM [RestaurantOwner] where fbid=@fbid'
        );
      if (queryResult.recordset.lenght > 0) {
        res.send(
          JSON.stringify({ success: true, result: queryResult.recordset })
        );
      } else {
        res.send(JSON.stringify({ success: false, message: 'Empty' }));
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

router.post('/restaurantowner', async (req, res, next) => {
  console.log(req.body);
  var authorization = req.headers.authorization,
    decode;
  try {
    decode = jwt.verify(authorization.split(' ')[1], SECRET_KEY);
  } catch (e) {
    return res.status(401).send('Unauthorized');
  }
  var fbid = decode.fbid;
  var user_phone = req.body.userPhone;
  var user_name = req.body.userName;

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
            ' INSERT INTO [User](FBID,UserPhone,Name,Address,Status) OUTPUT Inserted.FBID,Inserted.UserPhone,Inserted.Name,Inserted.Address,Inserted.Status' +
            ' VALUES(@FBID,@UserName,@UserPhone,@UserAddress,0)'
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
        messge: 'Missing Fbid in Body of POST request',
      })
    );
  }
});

//USER TABLE
//POST/GET
router.get('/user', async (req, res, next) => {
  console.log(req.query);
  if (req.query.key != API_KEY) {
    res.send(JSON.stringify({ success: false, message: 'Wrong API key' }));
  } else {
    var fbid = req.query.fbid;
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
        JSON.stringify({ success: false, message: 'Missing fbid in query' })
      );
    }
  }
});

router.post('/user', async (req, res, next) => {
  console.log(req.body);
  if (req.body.key != API_KEY) {
    res.send(JSON.stringify({ success: false, message: 'Wrong API Key' }));
  } else {
    var user_phone = req.body.userPhone;
    var user_name = req.body.userName;
    var user_address = req.body.userAddress;
    var fbid = req.body.fbid;

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
          messge: 'Missing Fbid in Body of POST request',
        })
      );
    }
  }
});

//RESTAURANT TABLE
//GET

router.get('/restaurant', async (req, res, next) => {
  console.log(req.query);
  if (req.query.key != API_KEY) {
    res.send(JSON.stringify({ success: false, message: 'Wrong API Key' }));
  } else {
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
  }
});

router.get('/restaurantByID', async (req, res, next) => {
  {
    console.log(req.query);
    if (req.query.key != API_KEY) {
      res.send(JSON.stringify({ success: false, message: 'Wrong API key' }));
    } else {
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
        res.send(
          JSON.stringify({ success: false, message: 'Missing "id" in query' })
        );
      }
    }
  }
});

router.get('/nearbyrestaurant', async (req, res, next) => {
  {
    console.log(req.query);
    if (req.query.key != API_KEY) {
      res.send(JSON.stringify({ success: false, message: 'Wrong API key' }));
    } else {
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
              JSON.stringify({ success: true, result: queryResult.recordset })
            );
          }
        } catch (error) {
          res.status(500);
          res.send(JSON.send({ success: false, message: error.message }));
        }
      } else {
        res.send(
          JSON.stringify({ success: false, message: 'Missing "id" in query' })
        );
      }
    }
  }
});

//MENU TABLE
//GET

router.get('/menu', async (req, res, next) => {
  {
    console.log(req.query);
    if (req.query.key != API_KEY) {
      res.send(JSON.stringify({ success: false, message: 'Wrong API key' }));
    } else {
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
            message: 'Missing "Restaurant id" in query',
          })
        );
      }
    }
  }
});

//FOOD TABLE
//GET

router.get('/food', async (req, res, next) => {
  {
    console.log(req.query);
    if (req.query.key != API_KEY) {
      res.send(JSON.stringify({ success: false, message: 'Wrong API key' }));
    } else {
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
            message: 'Missing "Menu id" in query',
          })
        );
      }
    }
  }
});

router.get('/foodById', async (req, res, next) => {
  {
    console.log(req.query);
    if (req.query.key != API_KEY) {
      res.send(JSON.stringify({ success: false, message: 'Wrong API key' }));
    } else {
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
            message: 'Missing "Food id" in query',
          })
        );
      }
    }
  }
});

router.get('/searchFood', async (req, res, next) => {
  {
    console.log(req.query);
    if (req.query.key != API_KEY) {
      res.send(JSON.stringify({ success: false, message: 'Wrong API key' }));
    } else {
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
            message: 'Missing Food Name in query',
          })
        );
      }
    }
  }
});

//SIZE TABLE
//GET

router.get('/size', async (req, res, next) => {
  {
    console.log(req.query);
    if (req.query.key != API_KEY) {
      res.send(JSON.stringify({ success: false, message: 'Wrong API key' }));
    } else {
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
            message: 'Missing "Food id" in query',
          })
        );
      }
    }
  }
});

//ADDON TABLE
//GET

router.get('/addon', async (req, res, next) => {
  {
    console.log(req.query);
    if (req.query.key != API_KEY) {
      res.send(JSON.stringify({ success: false, message: 'Wrong API key' }));
    } else {
      var foodId = req.query.foodId;
      if (foodId != null) {
        try {
          var pool = await poolPromise;
          var queryResult = await pool
            .request()
            .input('foodId', sql.Int, foodId)
            .query(
              'Select id,description,extraPrice From [Addon] Where id in' +
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
            message: 'Missing "Food id" in query',
          })
        );
      }
    }
  }
});

//ORDER AND ORDER DETAIL TABLE
//GET / POST

router.get('/order', async (req, res, next) => {
  {
    console.log(req.query);
    if (req.query.key != API_KEY) {
      res.send(JSON.stringify({ success: false, message: 'Wrong API key' }));
    } else {
      var orderfbid = req.query.orderfbid;
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
            message: 'Missing Order Fbid in query',
          })
        );
      }
    }
  }
});

router.get('/maxorder', async (req, res, next) => {
  {
    console.log(req.query);
    if (req.query.key != API_KEY) {
      res.send(JSON.stringify({ success: false, message: 'Wrong API key' }));
    } else {
      var orderfbid = req.query.orderfbid;
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
            message: 'Missing Order Fbid in query',
          })
        );
      }
    }
  }
});

router.get('/orderDetail', async (req, res, next) => {
  {
    console.log(req.query);
    if (req.query.key != API_KEY) {
      res.send(JSON.stringify({ success: false, message: 'Wrong API key' }));
    } else {
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
            message: 'Missing Order Id in query',
          })
        );
      }
    }
  }
});

router.post('/createOrder', async (req, res, next) => {
  console.log(req.body);
  if (req.body.key != API_KEY) {
    res.send(JSON.stringify({ success: false, message: 'Wrong API Key' }));
  } else {
    var order_phone = req.body.orderPhone;
    var order_name = req.body.orderName;
    var order_address = req.body.orderAddress;
    var order_date = req.body.orderDate;
    var restaurantId = req.body.restaurantId;
    var transactionId = req.body.transactionId;
    var cod = req.body.cod;
    var total_price = req.body.totalPrice;
    var num_of_item = req.body.numOfItem;
    var order_fbid = req.body.orderFbid;

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
          messge: 'Missing order Fbid in Body of POST request',
        })
      );
    }
  }
});

router.post('/updateOrder', async (req, res, next) => {
  console.log(req.body);
  if (req.body.key != API_KEY) {
    res.send(JSON.stringify({ success: false, message: 'Wrong API Key' }));
  } else {
    var orderId = req.body.orderId;
    var orderDetail;

    try {
      orderDetail = JSON.parse(req.body.orderDetail);
    } catch (error) {
      console.log(error);
      res.status(500);
      res.send(JSON.stringify({ success: false, message: error.message }));
    }

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
          messge: 'Missing orderId or orderDetail in Body of POST request',
        })
      );
    }
  }
});

//FAVORITE TABLE
//GET / POST / DELETE

router.get('/favorite', async (req, res, next) => {
  {
    console.log(req.query);
    if (req.query.key != API_KEY) {
      res.send(JSON.stringify({ success: false, message: 'Wrong API key' }));
    } else {
      var fbid = req.query.fbid;
      if (fbid != null) {
        try {
          var pool = await poolPromise;
          var queryResult = await pool
            .request()
            .input('fbid', sql.NVarChar, fbid)
            .query(
              'Select fbid,foodId,restaurantId, foodName, foodImage, price From [Favorite] Where fbid=@fbid '
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
            message: 'Missing Fbid in query',
          })
        );
      }
    }
  }
});

router.get('/favoriteByRestaurant', async (req, res, next) => {
  {
    console.log(req.query);
    if (req.query.key != API_KEY) {
      res.send(JSON.stringify({ success: false, message: 'Wrong API key' }));
    } else {
      var fbid = req.query.fbid;
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
            message: 'Missing Fbid in query',
          })
        );
      }
    }
  }
});

router.post('/favorite', async (req, res, next) => {
  console.log(req.body);
  if (req.body.key != API_KEY) {
    res.send(JSON.stringify({ success: false, message: 'Wrong API Key' }));
  } else {
    let fbid = req.body.fbid;
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
          messge: 'Missing fbid in Body of POST request',
        })
      );
    }
  }
});

router.delete('/favorite', async (req, res, next) => {
  console.log(req.query);
  if (req.query.key != API_KEY) {
    res.send(JSON.stringify({ success: false, message: 'Wrong API Key' }));
  } else {
    let fbid = req.query.fbid;
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
          messge: 'Missing fbid in query',
        })
      );
    }
  }
});

module.exports = router;
