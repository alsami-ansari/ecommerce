import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
// Mini-schema for saving multiple shipping addresses
const addressSchema = mongoose.Schema({
  fullName: { type: String },
  phone: { type: String },
  street: { type: String },
  city: { type: String },
  state: { type: String },
  postalCode: { type: String },
  country: { type: String },
  isDefault: { type: Boolean, default: false }
});


const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
        // ==========================================
    // ENTERPRISE UPGRADES
    // ==========================================
    // 1. Role Based Access Control (RBAC)
    role: {
      type: String,
      enum: ['customer', 'admin', 'manager', 'support'],
      default: 'customer'
    },
    
    // 2. Address Book
    addresses: [addressSchema],
    
    // 3. Advanced Security & Account Locking
    refreshTokens: [String], // Array to keep track of logged-in devices
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },

    // 4. Password & Email Verification Flows
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // ==========================================

    isAdmin: { type: Boolean, required: true, default: false },
    // --> Add this new field:
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  {
    timestamps: true,
  }
);


// Method to compare entered password with the hashed password in the DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(String(enteredPassword), this.password);
};

// Before saving a new user to the DB, hash the password
userSchema.pre('save', async function () {      // <-- Removed 'next'
  if (!this.isModified('password')) {
    return;                                     // <-- Replaced next() with return; to exit safely
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(String(this.password), salt);
});


const User = mongoose.model('User', userSchema);

export default User;
