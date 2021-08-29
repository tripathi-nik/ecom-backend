const mongoose = require('mongoose');
const config = require('config');
const devDebug = require('debug')('app:fix');
const errDebug=require('debug')('app:exception');

mongoose.connect(config.get('database'))
.then(()=>devDebug('connected successfully to database'))
.catch(err=>errDebug('could not connect to database'));

const categorySchema = new mongoose.Schema({
    category:{
      type:String,
      required:true
    },
    slug:{
      type:String,
      required:true
    },
   short_des:{
     type:String
   },
   picture:{
     type:String,
   }
});
const Category = mongoose.model('Category',categorySchema);

async function categoryAdd(value){
    let slug = value.slug;
    let count = await Category
    .count({slug : slug});
    if(count>0){
      slug=slug+'-'+(parseInt(count)+1)
      let count2 = await Category
      .count({slug : slug});
      if(count2>0){
        slug=slug+'-'+(parseInt(count)+1);
      }
    }
    value.slug = slug;
    const category = new Category(value);
    try{
        const result = await category.save();
        console.log(result);
        return result;
    }catch(exp){
        for(field in exp.errors)
            return '"'+exp.errors[field].path+'"';
            console.log(exp.errors[field]);
    }

}
async function productList(value){
  const category = await Category
  .find({user_id : value})
  .sort({added_on:-1})
  .select({_id:1,title:1,slug:1,cost_price:1,sale_price:1,inventory:1,added_on:1});
  return product;
}

async function getSlug(value){
  let count = await Category
  .count({slug : value});
  let slug = value;
  let newslug = slug;
  let updatedslug = slug;
  if(count>0){
     newslug=slug+'-'+(parseInt(count)+1);
     let updatedslug = newslug;
     let count = await Category
     .count({slug : newslug});
     if(count>0){
       updatedslug=newslug+'-'+(parseInt(count)+1);
     }
  }
  return updatedslug;
}
// async function fetchProduct(user_id,slug){
//   let product = await Products.find({user_id:user_id,slug:slug}).select('-_id -added_on -__v -user_id');
//   if(product[0]){
//      return product[0];
//    }else{
//      return {status:400,message:'not_found'};
//    }
// }
//
// async function productUpdate(request,user_id,slug){
//   let product = await Products.update({slug: slug,user_id:user_id},{
//       $set:{
//           title:request.title,
//           cost_price:request.cost_price,
//           sale_price:request.sale_price,
//           inventory:request.inventory,
//           short_des:request.short_des,
//           product_specification:request.product_specification,
//           picture:request.picture
//       }
//   });
//   request.user_id = user_id;
//   if(product.ok){
//     return request;
//   }else{
//     return {status:404};
//   }
// }
//
// async function productDateCounter(user_id,date,month,year){
//   let months = month;
//   let dates = date;
//   if(parseInt(months)<10){
//     months="0"+month;
//   }
//   if(parseInt(dates)<10){
//     dates="0"+date;
//   }
//   let product = await Products
//   .find({
//     user_id:user_id,
//     added_on:{ $gte: year+'-'+months+'-'+dates+"T00:00:00.000Z",$lte: year+'-'+months+'-'+dates+"T23:59:00.000Z" },
//
//   })
//   .select({id:1});
//   if(product[0]){
//      return product.length;
//    }else{
//      return 0;
//    }
// }


module.exports = {
  getSlug,
  categoryAdd
}
