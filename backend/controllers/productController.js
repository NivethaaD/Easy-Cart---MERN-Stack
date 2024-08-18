const Product=require("../models/productModel");
const ErrorHandler=require("../utils/errorHandler")
const catchAsyncError = require('../middlewares/catchAsyncError')
const APIFeatures=require('../utils/apiFeatures');
const { promises } = require("nodemailer/lib/xoauth2");

//Get Products - /api/v1/products
exports.getProducts = catchAsyncError (async (req,res,next)=>{
    
    const resPerPage=3;

    let buildQuery=()=>{
        return new APIFeatures(Product.find(),req.query).search().filter()
    }

    const filteredProductsCount= await buildQuery().query.countDocuments({})
    const totalProductsCount = await Product.countDocuments({})
    let productsCount=totalProductsCount;

    if(filteredProductsCount != totalProductsCount){
        productsCount=filteredProductsCount;
    }

    const products= await buildQuery().paginate(resPerPage).query;

    res.status(200).json({
        success:true,
        count:productsCount,
        resPerPage,
        products
    })
}
)
//Create Product - /api/v1/product/new
exports.newProduct=catchAsyncError(async (req,res,next)=>{

    let images=[]

    if(req.files.length > 0){
        req.files.forEach(file =>{
            let url=`${process.env.BACKEND_URL}/uploads/product/${file.originalname}`;
            images.push({image : url})
        })
    }

    req.body.images = images;

    req.body.user=req.user.id;
   const product = await Product.create(req.body);
   res.status(201).json({
        success:true,
        product
   })
})

//Get Single Product

exports.getSingleProduct = catchAsyncError(async(req,res,next)=>{
    const product=await Product.findById(req.params.id).populate('reviews.user','name email')

    if(!product)
    {
        return next(new ErrorHandler("Product Not found test",400))
        /*res.status(404).json({
            success:false,
            message:"Product not found"
        }) */
    }
    //await new Promise(resolve => setTimeout(resolve,3000))
    res.status(201).json({
        success:true,
        product
    })
})

//update product-/api/v1/product/:id

exports.updateProduct = async (req,res,next)=>{
    let product= await Product.findById(req.params.id)

    //uploading images

    let images=[]

    //if images not clear we keep existing images

    if(req.body.imagesCleared === 'false'){
        images = product.images;

    }

    if(req.files.length > 0){
        req.files.forEach(file =>{
            let url=`${process.env.BACKEND_URL}/uploads/product/${file.originalname}`;
            images.push({image : url})
        })
    }

    req.body.images = images;

    if(!product)
    {
        res.status(404).json({
            success:false,
            message:"Product not found"
        })
    }
   product= await Product.findByIdAndUpdate(req.params.id,req.body,{
        new:true,
        runValidators:true
   })
   res.status(200).json({
        success:true,
        product
   })
}

exports.deleteProduct = async (req,res,next)=>{
    const product=await Product.findById(req.params.id)

    if(!product)
    {
        res.status(404).json({
            success:false,
            message:"Product not found"
        })
    }
    await product.deleteOne();

    res.status(200).json({
        success:true,
        message:"Product Deleted"
    })
}


//Create review

exports.createReview= catchAsyncError(async(req,res,next)=>{
    const {productId,rating,comment}=req.body;

    const review={
        user:req.user.id,
        rating,
        comment
    }

    //finding that the user is already reviewed for the product or not

    const product= await Product.findById(productId);
    const isReviewd = product.reviews.find(review=>{
        return review.user.toString()== req.user.id.toString();
    })

    if(isReviewd){
        product.reviews.forEach(review =>{
            if(review.user.toString()== req.user.id.toString())
            {
                review.comment=comment
                review.rating=rating
            }
        })
    }
    else{
        product.reviews.push(review);
        product.numOfReviews=product.reviews.length;
    }
    //finding avg of product reviews
    product.ratings=product.reviews.reduce((acc,review)=>{
        return review.rating+acc;
    },0)/product.reviews.length;
    product.ratings=isNaN(product.ratings)?0:product.ratings;

    await product.save({validateBeforeSave:false});
    res.status(200).json({
        success:true
    })
})

//get reviews - api/v1/reviews?id={productId}

exports.getReviews=  catchAsyncError(async(req,res,next)=>{
    const product = await Product.findById(req.query.id).populate('reviews.user','name email');

    res.status(200).json({
        success:true,
        reviews:product.reviews

    })
})

//delete Review - api/v1/review

exports.deleteReview=catchAsyncError(async(req,res,next)=>{
    const product= await Product.findById(req.query.productId);

    const reviews=product.reviews.filter(review=>{
       return review._id.toString()!==req.query.id.toString();
    });

    const numOfReviews=reviews.length;

    let ratings=product.reviews.reduce((acc,review)=>{
        return review.rating + acc;
    },0)/reviews.length;
    ratings=isNaN(ratings)?0:ratings;

    await Product.findByIdAndUpdate(req.query.productId,{
        reviews,
        numOfReviews,
        ratings
    })
    res.status(200).json({
        success:true
    })
})

//get admin Products - api/vi/admin/products

exports.getAdminProducts = catchAsyncError(async (req,res,next)=>{
    const products= await Product.find();
    res.status(200).send({
        success : true,
        products
    })
}); 