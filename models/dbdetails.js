const mongoose = require('mongoose');
const {DateTime} = require('luxon');

const userSchema =new mongoose.Schema({
    name:String,
    email:String,
    password:String,
    date:{type:Date,default:Date },
    profile:{
        imageurl:String,
        publicId:String,
    }
});

const User =mongoose.model("userdetails",userSchema);

const productSchema =new mongoose.Schema({
    product_brand:String,
    product_title:String,
    product_image:{ 
        imageurl:String,
        publicId:String,
    },
    product_price:Number,
    product_size:String,
    product_color:String,
    product_color_name:String,
    product_review:String,
    product_description:String,
    createdAt: { type: Date, default: () => DateTime.now().setZone('Asia/Kolkata').toJSDate() }
})

const Product = mongoose.model("products",productSchema)

const cartSchema=new mongoose.Schema({
    product_id:String,
    User_id:String,
    product_quantity:String,
    product_price:String,
    orderedDate:{type:Date,default :()=>DateTime.now().setZone('Asia/Kolkata').toJSDate()}
})

const Cart=mongoose.model("Cart",cartSchema)

module.exports={User,Product,Cart};