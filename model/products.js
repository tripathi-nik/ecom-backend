const mongoose = require('mongoose');
const config = require('config');
const devDebug = require('debug')('app:fix');
const errDebug=require('debug')('app:exception');

mongoose.connect(config.get('database'))
.then(()=>devDebug('connected successfully to database'))
.catch(err=>errDebug('could not connect to database'));

const productSchema = new mongoose.Schema({
    user_id:{
      type:String,
      required:true
    },
    title: {
        type:String,
        required:true,
        trim:true
    },
    slug:{
      type:String,
      required:true
    },
    cost_price: {
        type:Number,
        required:true,
        validate:{
            isAsync:true,
            validator:function(v,callback){
                setTimeout(()=>{
                  const result = (parseInt(v)>=parseInt(this.sale_price));
                  callback(result);
                },2000)

            },
            message:'Cost Price must be greater than equal to Sale price'
        }
    },
    sale_price: {
      type:Number,
      required:true,
      min:1
    },
    inventory:{
      type:Number,
      required:true,
      min:1
   },
   short_des:{
     type:String
   },
   product_specification:{
     type:String
   },
   picture:{
     type:String,
     default:'[]'
   },
   added_on:{ type:Date,default:Date.now }
});
const Products = mongoose.model('Products',productSchema);

async function productAdd(value){
    const product = new Products(value);
    console.log(product);
    try{
        const result = await product.save();
        return result;
    }catch(exp){
        for(field in exp.errors)
            return '"'+exp.errors[field].path+'"';
            console.log(exp.errors[field]);
    }

}
async function productList(value){
  const product = await Products
  .find({user_id : value})
  .sort({added_on:-1})
  .select({_id:1,title:1,slug:1,cost_price:1,sale_price:1,inventory:1,added_on:1});
  return product;
}

async function fetchProduct(user_id,slug){
  let product = await Products.find({user_id:user_id,slug:slug}).select('-_id -added_on -__v -user_id');
  if(product[0]){
     return product[0];
   }else{
     return {status:400,message:'not_found'};
   }
}

async function productUpdate(request,user_id,slug){
  let product = await Products.update({slug: slug,user_id:user_id},{
      $set:{
          title:request.title,
          cost_price:request.cost_price,
          sale_price:request.sale_price,
          inventory:request.inventory,
          short_des:request.short_des,
          product_specification:request.product_specification,
          picture:request.picture
      }
  });
  request.user_id = user_id;
  if(product.ok){
    return request;
  }else{
    return {status:404};
  }
}

async function productDateCounter(user_id,date,month,year){
  let months = month;
  let dates = date;
  if(parseInt(months)<10){
    months="0"+month;
  }
  if(parseInt(dates)<10){
    dates="0"+date;
  }
  let product = await Products
  .find({
    user_id:user_id,
    added_on:{ $gte: year+'-'+months+'-'+dates+"T00:00:00.000Z",$lte: year+'-'+months+'-'+dates+"T23:59:00.000Z" },

  })
  .select({id:1});
  if(product[0]){
     return product.length;
   }else{
     return 0;
   }
}

async function get_media(slug){
  let picture = await Products.find({slug:slug}).select('picture');
  return picture[0].picture;
}

async function galleryUpdate(picture,endpoint){
  let product = await Products.update({slug: endpoint},{
      $set:{
          picture:picture
      }
  });
  if(product.ok){
    return {status:200};
  }else{
    return {status:404};
  }
}

module.exports = {
  productAdd,
  productList,
  fetchProduct,
  productUpdate,
  productDateCounter,
  get_media,
  galleryUpdate
}
