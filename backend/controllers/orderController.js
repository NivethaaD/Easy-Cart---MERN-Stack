const catchAsyncError=require('../middlewares/catchAsyncError')
const Order=require('../models/orderModel');
const ErrorHandler = require('../utils/errorHandler');
const Product=require('../models/productModel');

//Create new order -api/v1/order/new

exports.newOrder = catchAsyncError(async (req,res,next)=>{

    const{
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo
    } =req.body;

    const order= await Order.create({

        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt:Date.now(),
        user:req.user.id
    })

    res.status(200).json({
        success:true,
        order
    })

})

//Get Single order - api/v1/order/:id

exports.getSingleOrder= catchAsyncError(async(req,res,next)=>{

    //populate used to access the another model in database
    const order= await Order.findById(req.params.id).populate('user','name email');
    if(!order)
    {
        return next(new ErrorHandler(`Order not found with this id ${req.params.id}`,404));
    }
    res.status(200).json({
        success:true,
        order
    })
})

// Get Loggedin User Orders - /api/v1/myorders


exports.myOrders= catchAsyncError(async(req,res,next)=>{
    const orders=await Order.find({user:req.user.id});

    res.status(200).json({
        success:true,
        orders
    })
})

//Admin: Get All Orders

exports.orders= catchAsyncError(async(req,res,next)=>{
    const orders=await Order.find();
    let totalAmount=0;

    // to add all order price, which helps admin to know total price of all orders
    orders.forEach(order =>{
        totalAmount+=order.totalPrice
    })

    res.status(200).json({
        success:true,
        totalAmount,
        orders
    })
})

//Admin:Update Order - api/v1/order/:id

exports.updateOrder = catchAsyncError(async(req,res,next)=>{

    const order= await Order.findById(req.params.id);

    if(order.orderStatus=='Delivered'){
        return next(new ErrorHandler('Order has been already delivered',400))
    }
    // updating the product stock
    order.orderItems.forEach( async orderItem =>{
        await updateStock(orderItem.product,orderItem.quantity);

    })

    order.orderStatus = req.body.orderStatus;
    order.deliveredAt = Date.now();
    await order.save();

    res.status(200).json({
        success:true
    })

});

//updating the quantity in product database
async function updateStock (productId,quantity){
    const product=await Product.findById(productId);
    product.stock=product.stock-quantity;
    product.save({validateBeforeSave:false});

}

//Admin:Delete Order

exports.deleteOrder=catchAsyncError(async(req,res,next)=>{
    const order=await Order.findByIdAndDelete(req.params.id);
    
    if(!order)
    {
        return next(new ErrorHandler(`Order not found with this id ${req.params.id}`,404));
    }
   // await order.remove();
    res.status(200).json({
        success:true,
    })

})