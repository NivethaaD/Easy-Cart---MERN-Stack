const mongoose=require("mongoose");
const validator=require('validator');
const bycrypt= require("bcrypt")
const jwt=require("jsonwebtoken")
const crypto =require("crypto")

const userSchema= new mongoose.Schema({
    name:{
        type:String,
        required:[true,"please enter the name"]
    },
    email:{
        type:String,
        required:[true,"please enter the email"],
        unique:true,
        validate:[validator.isEmail,"Please enter the valid email address"]
    },
    password:{
        type:String,
        required:[true,"Please enter password"],
        maxlength:[6,"Password cannot exceed 6 characters"],
        select:false

    },
    avatar:{
        type:String,
        
    },
    role:{
        type:String,
        default:"user"
    },
    resetPasswordToken:String,
    resetPasswordTokenExpire:Date,
    createdAt:{
        type:Date,
        default:Date.now

    }
})
//hashing the password 
// bycrpt - node package
// mpm i bycrypt
userSchema.pre("save",async function (next){
    if(!this.isModified("password"))
    {
        next();
    }
    this.password = await bycrypt.hash(this.password,10)
})

//jwt to check the user logged in
//npm i jsonwebtoken
userSchema.methods.getJwtToken = function(){
   return jwt.sign({id: this.id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_TIME
    })
}
userSchema.methods.isValidPassword=  async function(enteredPassword){
   return bycrypt.compare(enteredPassword,this.password);
}

//for forgot password 
//crypto - npm i crypto
userSchema.methods.getResetToken= function(){
    //Generate Token
    const token= crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken=crypto.createHash('sha256').update(token).digest('hex');

    this.resetPasswordTokenExpire= Date.now()+30*60*1000;

    return token;
    
}


let model=mongoose.model("User",userSchema);

module.exports=model;