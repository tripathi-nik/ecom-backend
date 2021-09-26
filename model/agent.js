const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
const devDebug = require('debug')('app:fix');
const errDebug=require('debug')('app:exception');
const config = require('config');

mongoose.connect(config.get('database'))
.then(()=>devDebug('connected successfully to database'))
.catch(err=>errDebug('could not connect to database'));

const agentSchema = new mongoose.Schema({
    first_name: {
        type:String,
        required:true,
        minlength:3,
        trim:true
    },
    last_name: {
        type:String,
        required:true,
        minlength:3,
        trim:true
    },
    email_address: {
        type: String,
        match: [
          /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
          'Please add a valid email address.',
        ],
        required: [true, 'Please enter Email Address'],
        index: true,
        unique: true,
        lowercase: true,
        dropDups: true
    },
    input_password: {
        type:String,
        required:true,
        minlength:3,
        trim:true
    },
    age: {
        type:String,
    },
    sex: {
        type:String,
    },
    local_address: {
        type:String,
    },
    city: {
        type:String,
    },
    state: {
        type:String,
    },
    zip: {
        type:String,
    },
    profile_picture: {
        type:String,
    },
    security_token: {
        type:String,
    }
});
 agentSchema.plugin(uniqueValidator);
const Agents = mongoose.model('Agents',agentSchema);

async function agentAdd(value){
  let agent = await Agents.find({email_address:value.email_address})
  .select({_id:1});
  if(agent[0]){
    return {status_code:config.get('UNAUTH_REQUEST'),error:config.get('EXISTS_RECORD')};
  }
  else{
    const agent = new Agents(value);
    try{
        const result = await agent.save();
        return result;
    }catch(exp){
        for(field in exp.errors)
            return '"'+exp.errors[field].path+'"';
            console.log(exp.errors[field]);
    }
  }


}

async function checkLogin(value){
    let agent = await Agents.find({email_address:value.email_address})
    .select({_id:1});
    if(agent[0]){
      agent = await Agents.find({email_address:value.email_address,input_password:value.input_password})
      .select('-__v');
      if(agent[0]){
        return agent[0];
      }
      else{
        return {status_code:config.get('UNAUTH_REQUEST'),error:'input_password'};
      }
    }
    else{
      return {status_code:config.get('UNAUTH_REQUEST'),error:'email_address'};
    }

}
async function agentGet(value){
  let agent = await Agents.find({_id:value})
  .select({first_name:1,last_name:1,profile_picture:1,local_address:1,city:1,state:1,zip:1,age:1,sex:1});
  if(agent[0]){
    return agent[0];
  }else{
    return {status:400,message:'not_found'};
  }
}

async function imageUpdate(path,user_id){
  let agent = await Agents.update({_id: user_id},{
      $set:{
          profile_picture:path,
      }
  });
  if(agent.ok){
    return {status:200};
  }else{
    return {status:404};
  }
}

async function agentUpdate(user_id,request){
  let agent = await Agents.update({_id: user_id},{
      $set:{
          first_name:request.first_name,
          last_name:request.last_name,
          local_address:request.local_address,
          city:request.city,
          state:request.state,
          zip:request.zip,
          age:request.age,
          sex:request.sex
      }
  });
  if(agent.ok){
    return {status:200};
  }else{
    return {status:404};
  }
}
async function generateLink(agents,token){
   let agent = await Agents.update({email_address: agents.email_address},{
       $set:{
           security_token:token,
       }
  });
  if(agent.ok&&agent.nModified===1){
     return {status:200};
   }else{
     return {status:404};
   }
}

module.exports = {
  agentAdd,
  checkLogin,
  agentGet,
  imageUpdate,
  agentUpdate,
  generateLink
}
