import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, required: true, default: false },
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
userSchema.pre('save', async function (next) {
  // If password is not modified, move on to the next step
  if (!this.isModified('password')) {
    next();
  }

  // Hash the password with a "salt" of 10 rounds
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(String(this.password), salt);
});

const User = mongoose.model('User', userSchema);

export default User;
