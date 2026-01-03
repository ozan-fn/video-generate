import mongoose from "mongoose";

const cookieSchema = new mongoose.Schema({
    type: { type: String, enum: ["google", "grok"], required: true },
    cookies: String,
    updatedAt: { type: Date, default: Date.now },
});

const CookieModel = mongoose.model("Cookie", cookieSchema);

export default CookieModel;
