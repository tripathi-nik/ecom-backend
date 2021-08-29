const express = require('express');
const router = express.Router();
const agent_model = require('../../model/products');
const jwt = require('jsonwebtoken');

router.use((req,res,next)=>{
  const bearerHeader = req.headers["authorization"];
  if(typeof bearerHeader!=="undefined"){
    const bearer = bearerHeader.split(" ");
    const token = bearer[1];
    jwt.verify(token,'ecom_auth_token',function(err,data){
      if(err){
        res.send("mismatch_token");
      }else{
        req.user_id = data.user_id;
      }
    });
  }else{
    res.status(403).send("unauthorized request");
    res.end();
  }
  next();
});

router.post('/product-addgraph', (req, res) => {
  var d = new Date();
  var date = d. getDate();
  var month = d. getMonth() + 1; // Since getMonth() returns month from 0-11 not 1-12.
  var year = d. getFullYear();
  let dateArrs = [];
  let dateArr = {};
  async function setGraphAttr(){
    for(var i = 1;i<=parseInt(date);i++){
      const result = await agent_model.productDateCounter(req.user_id,i,month,year);
      dateArrs.push({x:i,y:result});
    }
    datatwo = JSON.stringify(dateArrs);
    res.status(200).send(datatwo);
  }
  setGraphAttr();
});


module.exports = router;
