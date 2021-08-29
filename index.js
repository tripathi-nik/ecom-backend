const express = require('express');
const app = express();
const agent = require('./routes/admin/agent');
const product = require('./routes/admin/product');
const home = require('./routes/home');
const graph = require('./routes/admin/graph');
const cors = require('cors');
var bodyParser = require("body-parser");
require('./startup/prod')(app);

app.use(cors());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use(function(req,res,next){
  var _send = res.send;
  var sent = false;
  res.send = function(data){
    if(sent) return;
    _send.bind(res)(data);
    sent = true;
};
  next();
});

app.use(express.json());
app.use('/api/agent',agent);
app.use('/api/product',product);
app.use('/api/graph',graph);
app.use('/',home);
app.use('/static', express.static('public'))



console.log('Welcome to new project');
const port = process.env.PORT || 3000;

app.listen(port,()=>console.log(`listing to port ${port}`));
