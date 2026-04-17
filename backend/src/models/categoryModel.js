import mongoose from 'mongoose';

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    // The slug makes the URL pretty! "Mobile Phones" cleanly becomes "mobile-phones"
    slug: {
      type: String,
      unique: true,
    },
    // The Enterprise magic: This allows infinite nested sub-categories by pointing back to itself!
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category', 
      default: null, // If null, this is a top-level Master Category
    },
    image: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Mongoose Trap: Automatically generate a URL-safe slug whenever the Category Name is created/updated
categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().split(' ').join('-');
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
