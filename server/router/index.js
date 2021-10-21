'use strict';

var mysql = require('mysql');
var mysqlConfig = require('./mysqlConfig.js');
var sharp = require('sharp');
var fsystem = require('fs');

// MYSQL
var db = mysql.createPool({
  connectionLimit : 1000,
  host: mysqlConfig.host,
  port: mysqlConfig.port,
  user: mysqlConfig.user,
  password: mysqlConfig.password,
  database: mysqlConfig.database,
  multipleStatements: true
});
module.exports = function(app, fs) {
  var sess;
  
  app.get('/', function(req,res){
    db.getConnection(function(err, connection) {
      connection.query("SELECT * FROM picking", function(err1, result1, fields) {
        if (err1) {
          console.log(err1);
          connection.release();
        } else {
          db.getConnection(function(err, connection) {
            connection.query("SELECT * FROM user", function(err2, result2, fields) {
              if (err2) {
                console.log(err2);
                connection.release();
              } else {
                res.render('pages/board1', {
                  row1 : result1,
                  row2 : result2
                });
              }
            });
          });
        }
      });
    });
  });
  
 /*
  app.get('/', function(req,res){
    sess = req.session;    
    // console.log(sess);
 
    const id = req.query.id;    
    console.log("session id : ", sess.userId, ", id : ", id);
    if(!sess.userId) {
      res.render('pages/dnct_logIn');
    } else {
      db.getConnection(function(err, connection) {
        if(err)
        {
          console.log("db error / :", err);
          res.send("fail");
          return;
        }
        //console.log("connection: ", connection);
        connection.query("SELECT * FROM picking", function(err1, result1, fields) {
          if (err1) {
            console.log("db error1 ", err1);
            connection.release();
          } else {
            db.getConnection(function(err, connection) {
              if(err)
              {
                console.log("db error2 ", err);
                connection.release();
              }
              else
              {
                connection.query("SELECT * FROM user", function(err2, result2, fields) {
                  if (err2) {
                    console.log(err2);
                    connection.release();
                  } else {
                    res.render('pages/board1', {
                      row1 : result1,
                      row2 : result2
                    });
                  }
                });
              }
            });
          }
        });
      });
    }
  });
  

  app.get('/logIn', function(req,res){
    res.render('pages/dnct_logIn');
  });

  app.post('/dnct_logIn', function(req,res){
    sess = req.session;
    var id = req.body.id;
    var password = req.body.password;
    // console.log("id : ",id, "pwd : ", password);
    db.getConnection(function(err, connection) {
      connection.query("SELECT * FROM agent WHERE agentId = "+mysql.escape(id)+" LIMIT 1" , function (err, result, fields) {
        if (err) {
            connection.release();
            throw err;
        } else {
          if(result.length < 1) {
            res.send("0");
            //console.log("0");
            connection.release();
          } else {
            var userId = result[0].id;
            var dbpassword = result[0].pwd;
            if (password === dbpassword) {
              sess.userId = userId;              
              const jsonResult = {                
                "id":result[0].agentId
              }
              res.status(200).json(jsonResult);
              //console.log("true", "user id: ", userId);
              connection.release();
            } else {
              res.send("false");
              //console.log("false");
              connection.release();
            }
          }
        }
      });
    });
  });
*/
  app.post('/board1', function(req,res){
    var array = JSON.parse(req.body.work_data);
    var lsize = array.length;
    console.log("data size: ", lsize);
    
    if(req.files)
    {
      //console.log("files: ", req.files);
      for(var i = 0; i < lsize; i++)
      {
        let productImg = null;
        productImg = req.files['product_image'+ i] ;      
        //console.log("file: " + productImg);
        if(productImg)
        {
          let fileName = productImg.name;
          let fileExt =  ''
          let dotPos = fileName.indexOf(".");
          if (dotPos > 0){
            fileExt = fileName.substring(dotPos);
          }

          let filePath = `${__dirname}/../public/uploads/prodImg-${Math.floor(Date.now()/1000)}${i}${fileExt}`;
          let shortPath = `uploads/prodImg-${Math.floor(Date.now()/1000)}${i}${fileExt}`;  
          array[i].push(shortPath);

          //save file to disk
          productImg.mv(filePath, function(err){
            if(err)
            {
             console.log("file save error to ", filePath);
             res.send("fail");
             return;
            }
            
            sharp(filePath).resize({width: 300}).toBuffer(function(err1, buffer){
              if(err)    
              {
                console.log("image resize error: ", filePath);
              }
              else{                
                fsystem.writeFile(filePath, buffer);
              }
            });
          });
        }
        else
          array[i].push("");

        //console.log("individual data: ", array[i]);
      }
    }
    else
    {
      for(var i = 0; i < lsize; i++)
      {
        array[i].push("");
      }
    }
      
    db.getConnection(function(err, connection) {
      connection.query("INSERT INTO picking (userId, userName, taskType, fromLocation, toLocation, areaCode, area, shipper, startDate, finishDate, productCode, product, quantity, image) VALUES ?", [array], function (err, result, fields) {
        if (err) {
          console.log(err);
          res.send("fail");
          connection.release();
        } else {
          console.log("success");            
          
          res.send("success");
          connection.release();
        }
      });
    });      
  })


  app.post('/delete', function(req,res){
    var chkList = req.body.checklist;

   // console.log(typeof chkList);

   if (typeof chkList == "string") {
     db.getConnection(function(err, connection) {
       connection.query("DELETE FROM picking WHERE idx IN ("+chkList+")", function (err, result, fields) {
         if (err) {
           console.log(err);
           res.send("fail");
           connection.release();
         } else {
           console.log("success");
           res.send("success");
           connection.release();
         }
       });
     });
   } else {
     db.getConnection(function(err, connection) {
       for (var i in chkList) {chkList[i] = JSON.stringify(chkList[i]);}
       connection.query("DELETE FROM picking WHERE idx IN ("+chkList.join()+")", function (err, result, fields) {
         if (err) {
           console.log(err);
           res.send("fail");
           connection.release();
         } else {
           console.log("success");
           res.send("success");
           connection.release();
         }
       });
     });
   }

  });

  // app.post('/login', function(req,res){
  //   var userId = req.body.userId;
  //   // res.send("sdfsfs");
  //   db.getConnection(function(err, connection) {
  //     if(err){
  //       return res.send("connection err");
  //     }
  //     connection.query("SELECT * FROM user WHERE userId = ?", userId, function (err, result, fields) {
  //       if (err) {
  //         console.log(err);
  //         res.send("fail");
  //         connection.release();
  //       } else {
  //         console.log("success");
  //         res.status(200).json({"result":result[0]});
  //         connection.release();
  //       }
  //     });
  //   });
  // });

  app.post('/login', function(req,res){
    var userId = req.body.userId;
    // res.send("sdfsfs");
    db.getConnection(function(err, connection) {
      if(err){
        return res.send("connection err");
      }
      connection.query("SELECT * FROM user WHERE userId = ?", userId, function (err, result, fields) {
        
        if (err || result.length == 0) {
          console.log("error: " + err);
          res.status(200).json({"result":"fail"});
          connection.release();
        } else {
          console.log("success");
          res.status(200).json({"result":result[0]});
          connection.release();
        }
      });
    });
  });

  app.get('/toWorkList', function(req,res){
    var userId = req.query.userId;
    // res.send("sdfsfs");
    var dbId = req.query.idx;
    var limit = req.query.limit;

    var query = "SELECT * FROM picking WHERE userId = "+mysql.escape(userId)+ " AND status = 'wait' ";
      
    if(dbId){
      query += " order by case when idx=" + dbId + " then 0 else 1 end ";
    } 
    if(limit){
      query += "LIMIT "+limit;
    }    
    //console.log("query : "+query);
    db.getConnection(function(err, connection) {
      if(err){
        return res.send("connection err");
      }
      connection.query(query, function (err, result, fields) {
        if (err) {
          console.log(err);
          res.status(404).json({"result":"fail"});
          connection.release();
        } else {
          console.log("success");
          res.status(200).json({"result":result});
          connection.release();
        }
      });
    });
  });


  app.post('/updateWork', function(req,res){
    var dbId = req.body.idx;
    var worked = req.body.worked;
    db.getConnection(function(err, connection) {
      if(err){
        return res.send("connection err");
      }
      connection.query('UPDATE picking SET `worked` = '+worked+' WHERE idx = '+dbId, function (err, result, fields) {
        if (err) {
          console.log(err);
          res.status(404).json({"result":"fail"});
          connection.release();
        } else {
          connection.query("SELECT * FROM picking WHERE idx = ?", dbId, function (err, result, fields) {
            if (err) {
              console.log(err);
              res.send("fail");
              connection.release();
            } else {
              console.log("success");
              const worked = result[0].worked;
              const quantity = result[0].quantity;
              console.log("worked : ", worked)
              console.log("quantity : ", quantity)
              if (quantity > worked){
                res.status(200).json({"result":result[0]});
                connection.release();
              } else {
                //update wait to finish
                connection.query("UPDATE picking SET `status` = 'finish'  WHERE idx = "+dbId, function (err, result, fields) {
                  if (err) {
                    console.log(err);
                    res.status(404).json({"result":"fail"});
                    connection.release();
                  } else {
                    console.log("update status result : ", result)
                    res.status(200).json({"result":"finish"});
                    connection.release();
                  }
                });
              }
              
            }
          });
        }
      });

    });
  });
};
