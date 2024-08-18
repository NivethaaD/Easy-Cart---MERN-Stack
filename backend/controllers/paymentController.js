const catchAsyncError=require('../middlewares/catchAsyncError')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

exports.processPayment = catchAsyncError(async(req,res,next)=>{
    const paymentIntents = await stripe.paymentIntents.create({
        amount:req.body.amount,
        currency:"usd",
        description : "TEST PAYMENTS",
        metadata: {integration_check:"accept_payment"},
        shipping:req.body.shipping
    })
    res.status(200).json({
        success:true,
        client_secret:paymentIntents.client_secret
    })
})

exports.sendStripeApi = catchAsyncError(async(req,res,next)=>{
   
    res.status(200).json({
        stripeApiKey:process.env.STRIPE_API_KEY
    })
})