import mongoose from 'mongoose';

// Unlike normal arrays, cart items need to know WHICH product variant was picked, and heavily snapshot the price
const cartItemSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  variantId: {
    type: String, // E.g., The specific ID for the "Size: Large, Color: Red" selection
  },
  quantity: { 
    type: Number, 
    required: true, 
    default: 1 
  },
  price: { 
    type: Number, 
    required: true // We snapshot the price here in case the admin changes the official sale price tomorrow!
  }, 
});

const cartSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // We set this to False so we can allow "Guest Carts" for logged-out visitors!
    },
    items: [cartItemSchema],
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
