import mongoose, { Schema, type InferSchemaType, models, model } from "mongoose";

const orderLineSchema = new Schema(
  {
    menuItem: { type: Schema.Types.ObjectId, ref: "MenuItem" },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    gst: { type: Number, required: true },
    qty: { type: Number, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    billNo: { type: Number, required: true },
    tableOrNo: { type: String, default: "" },
    customerName: { type: String, default: "Walk-in" },
    items: { type: [orderLineSchema], default: [] },
    subtotal: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    total: { type: Number, required: true },
    mode: { type: String, enum: ["Cash", "UPI", "Card"], default: "Cash" },
    status: { type: String, enum: ["Paid", "Pending", "Refunded"], default: "Paid" },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

export type OrderDoc = InferSchemaType<typeof orderSchema> & { _id: mongoose.Types.ObjectId };

export default models.Order || model("Order", orderSchema);
