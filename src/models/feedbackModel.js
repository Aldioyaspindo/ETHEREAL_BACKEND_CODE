import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema (
    {
        komentar: {
            type: String,
            required: [true, "komentar wajib diisi"],
            trim: true
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: "feedback",
    }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;