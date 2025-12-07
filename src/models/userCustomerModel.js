import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserCustomerSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required."],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [6, "Password must be at least 6 characters long."],
    },
    nomorhp:{
        type: String,
        required: [true, "Nomor HP is required."],
        unique: true,
        trim: true,
    },
    role: {
      type: String,
      default: "customer",
    },
  },
  {
    timestamps: true,
  }
);

// Hash password sebelum save
UserCustomerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
UserCustomerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const UserCustomer = mongoose.model("UserCustomer", UserCustomerSchema);

export default UserCustomer;
