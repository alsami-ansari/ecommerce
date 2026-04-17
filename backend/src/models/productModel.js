import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    // --> Add this new line:
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  },
  {
    timestamps: true,
  }
);


// Mini-Schema for handling Size, Color, and Override Pricing
const variantSchema = mongoose.Schema({
  size: { type: String, default: 'Standard' },
  color: { type: String, default: 'Standard' },
  sku: { type: String }, // Store Keeping Unit for THIS specific size/color
  price: { type: Number, required: true }, // The unique price for this specific variant
  stock: { type: Number, required: true, default: 0 },
  image: { type: String }
});




const productSchema = mongoose.Schema(
  {
    // Later we will link this to the Admin user who created the product
    // user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    
    name: { type: String, required: true },
    image: { type: String, required: true },
    brand: { type: String, required: true },
    slug: { type: String, unique: true }, // SEO URL-friendly name
    
    // 1. Link this to our brand new Category Collection! (No longer just a plain string)
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },

    // 2. The Variant Engine!
    variants: [variantSchema],

    // 3. Search Engine Optimization (SEO) & Marketing
    tags: [String],
    // Specifications map allows flexible details like {"Material": "Cotton", "Weight": "200g"}
    specifications: { type: Map, of: String }, 
    sku: { type: String }, // Master product SKU
    discountPrice: { type: Number }, // Crossed-out "Sale" price
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },

    // 4. Data Integrity (Soft Deletes)
    // We NEVER physically delete products so old orders don't break. We just flag them!
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },

    description: { type: String, required: true },
    reviews: [reviewSchema],
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true, default: 0 },
    countInStock: { type: Number, required: true, default: 0 },
  },
  {
    // This automatically creates 'createdAt' and 'updatedAt' fields
    timestamps: true,
  }
);


// Automatically generate a URL-safe SEO slug whenever the Product Name changes
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().split(' ').join('-');
  }
  next();
});



const Product = mongoose.model('Product', productSchema);

export default Product;
