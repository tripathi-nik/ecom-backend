const express = require('express');
const router = express.Router();
const Joi = require('joi');
const product_model = require('../../model/products');
const category_model = require('../../model/category');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');

router.use(fileUpload());
router.use((req,res,next)=>{
  let path = req.path.split('/');
  let endPoint  = path[path.length-1];
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

router.post('/add', (req, res) => {
    const schema = {
        user_id: Joi.string(),
        title: Joi.string().min(3).required(),
        slug: Joi.string().required(),
        cost_price: Joi.number().min(Joi.ref('sale_price')).required(),
        sale_price: Joi.number().min(1),
        inventory: Joi.number().min(1).required(),
        short_des: Joi.string(),
        product_specification: Joi.string(),
        picture: Joi.string()
    };
    const result = Joi.validate(req.body, schema);
    if (result.error){
      console.log(result.error);
      res.status(400).send(result.error.details[0].message);
    }

    const productDetail = {
        user_id:req.user_id,
        title: req.body.title,
        slug:req.body.slug,
        cost_price: req.body.cost_price,
        sale_price: req.body.sale_price,
        inventory: req.body.inventory,
        short_des: req.body.short_des,
        product_specification: req.body.product_specification,
        picture: req.body.picture
    };
    async function product_add(){
      let productRecord = await product_model.productAdd(productDetail);
      if(productRecord){
        res.status(200).send(productRecord);
      }
    }
    product_add();
});

router.put('/update/:slug', (req, res) => {
    const schema = {
        title: Joi.string().min(3).required(),
        slug: Joi.string().required(),
        cost_price: Joi.number().min(Joi.ref('sale_price')).required(),
        sale_price: Joi.number().min(1),
        inventory: Joi.number().min(1).required(),
        short_des: Joi.string(),
        product_specification: Joi.string(),
        picture: Joi.string()
    };
    const result = Joi.validate(req.body, schema);
    if (result.error)
        res.status(400).send(result.error.details[0].message);
    const user_id = req.user_id;
    const slug =  req.params.slug;
    const productDetail = {
        title: req.body.title,
        cost_price: req.body.cost_price,
        sale_price: req.body.sale_price,
        inventory: req.body.inventory,
        short_des: req.body.short_des,
        product_specification: req.body.product_specification,
        picture: req.body.picture
    };
    async function product_update(){
      let productRecord = await product_model.productUpdate(productDetail,user_id,slug);
      if(productRecord.title){
         res.status(200).send(productRecord);
      }
    }
    product_update();
});

router.post('/list', (req,res)=>{
  const user_id=req.user_id;
  async function product_list(){
     const details = await product_model.productList(user_id);
     res.send({status:200,result:details});
  }
  product_list();
});

router.post('/product-gallery', (req, res) => {
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
          res.status(200).send(req.file);
        }

    });
});

router.post('/detail', (req, res) => {
      const user_id = req.user_id;
      async function product_detail(){
        let agentRecord = await product_model.fetchProduct(user_id,req.body.slug);
        if(agentRecord.status){
          res.status(404).send('not_found');
        }
        else{
          res.status(200).send(agentRecord);
        }
      }
      product_detail();
});

router.post('/removeimage', (req, res) => {
  let images = req.body.slug;
  let key = req.body.to_remove;
  let ind = images.findIndex(e=>{
    return e.id===key
  });
  images.splice(ind,1);

  const curObj = {
    ...images[ind]
  };
  const pathe = curObj.path;
  // const img = pathe.split('/');
  // const imgpath = img[img.length-1];
  // const uploadPath = "public";
  res.send(images);
});

router.post('/CategoryAdd', (req, res) => {
  const categoryDetail = {
      category:req.body.title,
      slug:req.body.slug,
      short_des: req.body.short_des,
      picture: req.body.image
  };
  async function category_add(details){
    let categoryRecord = await category_model.categoryAdd(details);
    if(categoryRecord){
      res.status(200).send(categoryRecord);
    }
  }
  category_add(categoryDetail);
});
router.post('/changeSlug', (req, res)=>{
  let slug = req.body.text;
  async function slug_update(params){
     const details = await category_model.getSlug(params);
     res.send(details);
  }
  slug_update(slug);

});
router.post('/media-gallery', (req,res)=>{
  let data = req.body;
  const url_endpoint = data.slug;
  async function fetch_image(params){
     const details = await product_model.get_media(params);
     res.send(details);
  }
  fetch_image(url_endpoint);
});

router.post('/replace-crop-image',(req,res)=>{
  let data = req.body;
  let imageBuffer = data.image.replace(/^data:image\/png;base64,/, "");
  const currentDate = new Date();
  const timestamp = currentDate.getTime();
  let outFile = './public/uploads/'+timestamp+'.png';
   fs.writeFile(outFile, imageBuffer, 'base64', function(err) {
    if(err===null){
      res.send({url:'/uploads/'+timestamp+'.png'});
    }
   });
});

router.post('/updateImage',(req,res)=>{
  let data = req.body.picture;
  let endpoint = req.body.endpoint;
  async function update_image(picture,endpoint){
     const details = await product_model.galleryUpdate(picture,endpoint);
     if(details.status===200){
      res.send({status:'redirect'})
     }

  }
  update_image(JSON.stringify(data),endpoint);
});

module.exports = router;
