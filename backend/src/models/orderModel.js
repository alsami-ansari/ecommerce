import mongoose from 'mongoose';

// Mini-Schema to track precisely *when* the logistics status changes
const statusHistorySchema = mongoose.Schema({
  status: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
  comment: { type: String } // e.g. "Delayed by severe weather storms"
}, { _id: false });

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderItems: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true }, // Upgraded from 'qty' to 'quantity' to perfectly match our Cart model
        image: { type: String, required: true },
        price: { type: Number, required: true },
        variantId: { type: String }, // Crucial: Which exact variant did they buy?
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    
    // Real-Time Finance Hooks
    itemsPrice: { type: Number, required: true, default: 0.0 },
    taxPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    
    // Enterprise Discount Tracking
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    discountAmount: { type: Number, default: 0.0 },
    
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    
    // ==========================================
    // ENTERPRISE LOGISTICS STATE MACHINE
    // ==========================================
    orderStatus: {
      type: String,
      required: true,
      enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out_for_Delivery', 'Delivered', 'Cancelled', 'Refunded'],
      default: 'Pending', // Starts pending until payment clears!
    },
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Modern Mongoose Trap: No 'next' required!
orderSchema.pre('save', function () {
  if (this.isModified('orderStatus')) {
    this.statusHistory.push({
      status: this.orderStatus,
      updatedAt: Date.now()
    });
  }
});


const Order = mongoose.model('Order', orderSchema);
export default Order;
