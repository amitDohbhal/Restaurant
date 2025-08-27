import { Schema, models, model } from 'mongoose';

const TableNoSchema = new Schema({
  tableNumber: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
}, { timestamps: true });

export default models.TableNo || model('TableNo', TableNoSchema);