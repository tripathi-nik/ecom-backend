const express = require('express');
const router = express.Router();
const config = require('config');

const md5 = require('md5');
const Joi = require('joi');
const agent_model = require('../../model/agent');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
var nodemailer = require('nodemailer');

router.use((req,res,next)=>{
  let path = req.path.split('/');
  let endPoint  = path[path.length-1];
  if(endPoint!=='login'&&endPoint!=='add'&&endPoint!=='logout'&&endPoint!=='lostPassword'){
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
  }
  next();
});

router.post('/add', (req, res) => {
    const schema = {
        first_name: Joi.string().min(3).required(),
        last_name: Joi.string().min(3).required(),
        email_address: Joi.string().email().required(),
        input_password: Joi.string().min(8).required(),
        repeat_password: Joi.any().valid(Joi.ref('input_password')).required().options({
            language: {
                any: {
                    allowOnly: 'must match password'
                }
            }
        })

    };
    const result = Joi.validate(req.body, schema);
    if (result.error)
        res.status(config.get('UNAUTH_REQUEST')).send(result.error.details[0].message);
    const agentNew = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email_address: req.body.email_address,
        input_password: md5(req.body.input_password),
    };
    async function addRecord(){
      let agentRecord = await agent_model.agentAdd(agentNew);
      res.send(agentRecord);
    }
    addRecord();

    // setTimeout(() => {
    //     agentRecord.then((result) => {
    //
    //     }).catch((error) => {
    //         console.log("Error", error);
    //     })
    // }, 1500)
});

/*Agent Login Check*/
router.post('/login', (req, res) => {

    const schema = {
        email_address: Joi.string().email().required(),
        input_password: Joi.string().min(8).required(),
    };
    console.log(schema);
    const result = Joi.validate(req.body, schema);
    if (result.error)
        res.status(400).send(result.error.details[0].message);

    const agentNew = {
        email_address: req.body.email_address,
        input_password: md5(req.body.input_password),
    };
    async function checkLogin(){
      let agentLogin = await agent_model.checkLogin(agentNew);
      let resObj = agentLogin;
      if(agentLogin._id){
         let token = jwt.sign({user_id:agentLogin._id,email:req.body.email_address},'ecom_auth_token');
          resObj = {
            data:agentLogin,
            token:token
          };
          console.log(resObj);
      }
      res.status(200).send(resObj);
    }
    checkLogin();
});

router.post('/media-upload', (req, res) => {
    const storage = multer.diskStorage({
        destination: "./public/uploads/",
        filename: function(req, file, cb) {
            cb(null, "IMAGE-" + Date.now() + path.extname(file.originalname));
        }
    });
    const upload = multer({
        storage: storage,
        limits: {
            fileSize: 1000000
        },
    }).single("myImage");
    upload(req, res, (err) => {
        if (!err){
          const {file,user_id} = req;
          async function upload_image(){
             let imageUpdate = await agent_model.imageUpdate(file.path,user_id);
             if(imageUpdate.status===200){
                 res.status(200).send(req.file);
              }
             else{
               res.status(404).send('not_found');
             }
          }
          upload_image();
        }

    });
});

router.post('/user-profile', (req, res) => {
      const user_id = req.user_id;
      async function user_profile(){
        let agentRecord = await agent_model.agentGet(user_id);
        if(agentRecord.status){
          res.status(404).send('not_found');
        }
        else{
          res.status(200).send(agentRecord);
        }
      }
      user_profile();
});

router.post('/update-profile', (req, res) => {
   const user_id = req.user_id;
   async function update_profile(){
   let agentRecord = await agent_model.agentUpdate(user_id,req.body);
   if(agentRecord.status===parseInt(404)){
     res.status(404).send('not_found');
   }
   else{
     res.status(200).send({
       first_name:req.body.first_name,
       last_name:req.body.last_name,
       local_address:req.body.local_address,
       city:req.body.city,
       state:req.body.state,
       zip:req.body.zip
     });
   }
 }
 update_profile();
});
router.post('/lostPassword', (req, res) => {
    const agentNew = {
        email_address: req.body.email_address
    };

   async function generateLink(){
     var a = Math.floor(100000 + Math.random() * 900000);
     a = String(a);
     a = a.substring(0,4);
     let dateObj = new Date();
     let month = dateObj.getUTCMonth() + 1; //months from 1-12
     let day = dateObj.getUTCDate();
     let year = dateObj.getUTCFullYear();
     let finder_token = a+'_'+year + '' + month + '' + day;

     let token = await agent_model.generateLink(agentNew,finder_token);
     var responseOBJ = {};
     if(token.status===200){
       var transporter = nodemailer.createTransport({
         service: 'gmail',
         auth: {
           user: config.get('email_address'),
           pass: config.get('password')
         }
       });
       var mailOptions = {
            from: config.get('email_address'),
            to: agentNew.email_address,
            subject: 'Password Reset Link - Ecom Project.',
            html: 'Hello,<br>Click on the below link to reset your password.<br>'+'http://localhost:3000/admin/reset-password/'+finder_token+'<br/>Ignore this mail if you have not raised the request.<br>Thanks<br>Team Ecom Project'
          };

          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              responseOBJ = {message:'Problem in sending mail please try again later.',status:400};
              res.send(responseOBJ);
            } else {
              responseOBJ = {message:'Password reset link is send to your registered email address.',status:200};
              res.send(responseOBJ);
            }
          });

     }
     else{
       responseOBJ = {message:'Email address doesnot exists.',status:404};
       res.send(responseOBJ);
     }

    }
    generateLink();
});

module.exports = router;
