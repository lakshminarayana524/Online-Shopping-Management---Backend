require('dotenv').config()
const express = require('express');
const bodyParser=require('body-parser');
const mongoose =require('mongoose');
const cors=require('cors');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const cookie=require('cookie-parser')
const multer=require('multer')
const path=require('path')
const nodemailer=require('nodemailer')
const fs= require('fs')
const {User,Product}=require("./models/dbdetails")
const cloud=require('./models/cloudinary')
const app=express();

app.use(express.json());
app.use(cors({
    origin: "https://my-online-shopping-app.vercel.app",
    methods: ["GET", "POST", "UPDATE", "DELETE"],
    credentials: true,
}));

app.use(cookie());

mongoose.connect(process.env.MONGO_URL)


app.get('/', (req, res) => {
    res.json({message:"hello world"})
  })

const verifyuser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ msg: "No token found" });
    } else {
        jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
            if (err) {
                console.log("Wrong Token");
                return res.json({ msg: "Wrong Token" });
            }

            req.userId = decoded.userId;
            next();
            console.log("Token Verified");
        });
    }
};


app.get('/verify', verifyuser, (req, res) => {
    console.log(req.userId);
    if (req.userId) {
        return res.json({ msg: "Successfully Verified", userId: req.userId });
    } else {
        return res.json({ msg: "No token found" });
    }
});



app.post('/login',(req,res)=>{
    const {email,password}=req.body;
    User.findOne({email:email})
    .then(user=>{
        if(user){
            bcrypt.compare(password,user.password,(err,result)=>{
                if(result){
                    const token =jwt.sign({userId:user._id},process.env.SECRET_KEY,{expiresIn:'1h'});
                    res.cookie("token",token,{httpOnly:true});
                    res.json({msg:"Login Successfull"})
                }else{
                    res.json({msg:"Wrong Password"})
                }
            })
        }else{
            res.json({msg:"User Not Found"})
            console.log("User Not Found")
        }
    })
})


app.post("/signup", (req, res) => {
    const { name, email, password } = req.body;
    const lowercaseEmail = email.toLowerCase(); // Convert email to lowercase
    User.findOne({email:lowercaseEmail})
        .then(exist=>{
            if(exist){
                return res.json({msg:"Email already exist"})
            }else{
                bcrypt.hash(password, 10)
                    .then(hash => {
                        User.create({ name, email: lowercaseEmail, password: hash })
                            .then((result) => {
                                res.json({ msg: "Created Successful" });
                                console.log("Successfully Created User");
                            })
                            .catch((err) => res.json(err));
                    })
                    .catch(err => console.log(err.msg));
        }
    })
    .catch(err=>{console.log(err);});
})

const storage=multer.diskStorage({
    destination :'./public/images',
    filename : function(req,file,cb){
        cb(null,file.fieldname + '-' + Date.now()+path.extname(file.originalname));
    }
})

const upload =multer({
    storage:storage,
})

app.post('/addProducts', upload.single('image'),async(req,res)=>{
    try{
        const {name,brand,price,desc,image,size,color,colorname}=req.body;
        console.log(name,brand,price,desc,size,color,colorname);
        const result=await cloud.uploader.upload(req.file.path,{
            folder:"osa/productsimages"
        });
        const publicid=result.public_id;

        fs.unlinkSync(req.file.path);
        console.log(publicid)

        const newProduct = new Product({
            product_brand: brand,
            product_title: name,
            product_image: {
                imageurl: result.url,
                publicId: publicid,
            },
            product_price: price,
            product_description: desc,
            product_size:size,
            product_color:color,
            product_color_name:colorname,

        });

        await newProduct.save();
        console.log("Product added Successfully"),
        res.json({
            msg:"Product add Successfully",
            product:newProduct
        });
    }catch(err){
        console.log(err)
        res.status(500).json({err:"Internal Server err"});
    }
} )


app.get('/getproducts',async(req,res)=>{
    try{
        const prod = await Product.find();
        res.json({msg:"Successfully Fetched",result:prod})
    }catch(err){
        res.json(err)
    }
})

app.get("/getprod/:id",async(req,res)=> {
    const id=req.params.id;
    try{
        const product=await Product.findById(id);

        if(!product){
            return res.status(404).json({msg:"No product found"})
        }

        return res.status(200).json({
            msg : "Data Fecthed  successfully!", 
            product
        })
    }catch(error){
        console.error("Error retrieving ",error)
        res.status(500).json({msg:"Internal Server Error"})
    }
})

app.delete("/delete-prod/:id",async(req,res)=>{
    const id=req.params.id;
    try{
        const product = await Product.findByIdAndDelete(id);
        if (!product) return res.status(404).send({ message: "Product not found." });
        res.json({ msg: "Product deleted successfully" });
    }catch(error){
        console.error("Error deleting product:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
})

PORT=process.env.PORT;


app.listen(PORT||3001,()=>{
    console.log("server is running")
})