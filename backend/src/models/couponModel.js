import mongoose from 'mongoose';

const couponSchema = mongoose.Schema(
  {
    // The actual text they type in (e.g., "SAVE20")
    code: { type: String, required: true, unique: true, uppercase: true }, 
    
    // Is it a Flat deduction ($20 off) or a Percentage (20% off)?
    discountType: { type: String, enum: ['flat', 'percentage'], required: true },
    discountValue: { type: Number, required: true }, // The raw number (20)
    
    // ==========================================
    // ENTERPRISE CONSTRAINTS
    // ==========================================
    
    // 1. Math Boundaries
    minimumCartValue: { type: Number, default: 0 }, 
    maximumDiscount: { type: Number, default: null }, // Crucial for % discounts! (e.g. 50% off, but max $100 off)
    
    // 2. Scope Constraints (Is this only valid on "Shirts"?)
    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    
    // 3. Scarcity & Usage Limits ("Only the first 100 people get this!")
    usageLimit: { type: Number, default: null }, 
    usedCount: { type: Number, default: 0 }, // Mathematically tracks total global uses
    perUserLimit: { type: Number, default: 1 }, // Stops one guy from using it 50 times!
    
    // 4. Lifespan Limits
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
