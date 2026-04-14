import Order from '../models/orderModel.js';
import Coupon from '../models/couponModel.js';
import crypto from 'crypto';
import Razorpay from 'razorpay';




// @desc    Create a new order from a shopping cart
// @route   POST /api/orders
// @access  Private (You must be logged in)
export const addOrderItems = async (req, res) => {
  try {
    const { 
      orderItems, shippingAddress, paymentMethod, 
      itemsPrice, taxPrice, shippingPrice, totalPrice,
      couponCode // <-- NEW: Catch the coupon code from the frontend request
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: 'No items in cart' });
    }

    let finalPrice = Number(totalPrice);
    let discountApplied = 0;

    // IMPORTANT LOGIC: If the user provided a coupon code at checkout, verify and apply it!
    if (couponCode) {
      const dbCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });

      // Verify the coupon is real, not expired, and meets the minimum order value
      if (dbCoupon && new Date(dbCoupon.expiryDate) > new Date() && finalPrice >= dbCoupon.minOrderValue) {
        if (dbCoupon.discountType === 'percentage') {
          discountApplied = (finalPrice * dbCoupon.discountValue) / 100;
        } else {
          discountApplied = dbCoupon.discountValue;
        }
        
        // Subtract the discount from the total price
        finalPrice = finalPrice - discountApplied;
      }
    }

    // Create a new order object mapped to the logged-in user
    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice: finalPrice,          // Check this out: We save the new discounted price!
      couponCode: couponCode || null,  // Save the code they used
      discountAmount: discountApplied  // Save exactly how much money they saved
    });

    // Save it to MongoDB
    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
    
  } catch (error) {
    res.status(500).json({ message: 'Server error trying to create order', error: error.message });
  }
};



// @desc    Get an order by its ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    // We use .populate() to also fetch the buying User's name and email!
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching order', error: error.message });
  }
};

// @desc    Get logged in user's past orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    // Find all orders where the user ID matches the currently logged-in user
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error getting your orders' });
  }
};

// @desc    Update order to paid once Payment Gateway confirms success
// @route   PUT /api/orders/:id/pay
// @access  Private
// @desc    Update order to paid (SECURE VERIFICATION)
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      // 1. Grab the exact data Razorpay sends back
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      // 2. We combine the order ID and payment ID
      const body = razorpay_order_id + "|" + razorpay_payment_id;

      // 3. We hash it ourselves using our SECRET KEY that nobody else knows
      // Note: We use 'test_secret' as a fallback until you get your real Razorpay account
      const secretKey = process.env.RAZORPAY_KEY_SECRET || 'test_secret'; 

      const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(body.toString())
        .digest('hex');

      // 4. CHECK IF THEY MATCH!
      if (expectedSignature === razorpay_signature) {
        
        // It's mathematically proven to be real. Mark as paid!
        order.isPaid = true;
        order.paidAt = Date.now();
        
        order.paymentResult = {
          id: razorpay_payment_id,
          status: 'COMPLETED',
          update_time: Date.now(),
          email_address: req.user.email, // Log who paid for it
        };

        const updatedOrder = await order.save();
        res.json(updatedOrder);

      } else {
        // Fraud detected!
        res.status(400).json({ message: 'Fake Payment Signature Detected! Fraud Alert.' });
      }

    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error updating payment status', error: error.message });
  }
};

// @desc    Initialize a Razorpay Payment Session
// @route   POST /api/orders/:id/razorpay
// @access  Private
export const createRazorpayOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // 1. Connect to Razorpay
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // 2. Build the order rules. Razorpay requires amounts in the smallest currency unit (like Paise or Cents)
    const options = {
      amount: Math.round(order.totalPrice * 100), // Multiply by 100 to convert to paise!
      currency: "INR", // Change to USD if dealing with dollars
      receipt: `receipt_${order._id}`,
    };

    // 3. Ask Razorpay to securely generate the ID
    const razorpayOrder = await instance.orders.create(options);
    
    // 4. Send that ID to the frontend!
    res.json(razorpayOrder);
    
  } catch (error) {
    res.status(500).json({ message: 'Error generating Razorpay Order', error: error.message });
  }
};


