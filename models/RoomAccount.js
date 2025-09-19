//asd
import mongoose from 'mongoose';

const roomAccountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  roomNumber: {
    type: String,
    required: true,
    trim: true
  },
  roomType: {
    type: String,
    required: true,
    trim: true
  },
  roomId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomInfo',
    required: true
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['checked-in', 'checked-out', 'reserved'],
    default: 'checked-in'
  },
  unpaidOrders: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RunningOrder',
      required: true
    },
    orderNumber: {
      type: String,
      required: true
    },
    items: [{
      productId: {
        type: String,
        required: true
      },
      name: String,
      price: Number,
      quantity: Number,
      cgstPercent: {
        type: Number,
        default: 0
      },
      sgstPercent: {
        type: Number,
        default: 0
      },
      cgstAmount: {
        type: Number,
        default: 0
      },
      sgstAmount: {
        type: Number,
        default: 0
      },
      itemTotal: Number,
      total: Number
    }],
    subtotal: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0  // Make it optional with a default value
    },
    paymentMethod: String,
    paymentStatus: {
      type: String,
      default: 'pending'
    },
    paidAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  paidOrders: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RunningOrder',
      required: true
    },
    orderNumber: {
      type: String,
      required: true
    },
    items: [{
      productId: {
        type: String,
        required: true
      },
      name: String,
      price: Number,
      quantity: Number,
      cgstPercent: {
        type: Number,
        default: 0
      },
      sgstPercent: {
        type: Number,
        default: 0
      },
      cgstAmount: {
        type: Number,
        default: 0
      },
      sgstAmount: {
        type: Number,
        default: 0
      },
      itemTotal: Number,
      total: Number
    }],
    subtotal: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    paymentMethod: String,
    paymentStatus: {
      type: String,
      default: 'paid'
    },
    transactionId: {
      type: String,
      default: null
    },
    paidAt: {
      type: Date,
      default: Date.now
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  unpaidRoomInvoices: [{
    // Invoice identification
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomInvoice',
      required: true
    },
    invoiceNo: {
      type: String,
      required: true
    },
    invoiceDate: {
      type: Date,
      required: true
    },
    paymentStatus: {
      type: String,
      default: 'unpaid',
      enum: ['unpaid', 'paid']
    },
    paymentMode: {
      type: String,
      enum: ['cash', 'online', 'room', null],
      default: null
    },
    paidAt: {
      type: Date
    },
    
    // Room and guest details
    roomNumber: String,
    roomType: String,
    guestName: String,
    
    // Food items
    foodItems: [{
      name: String,
      qtyType: String,
      quantity: Number,
      price: Number,
      amount: Number,
      cgstPercent: Number,
      cgstAmount: Number,
      sgstPercent: Number,
      sgstAmount: Number,
      taxTotal: Number,
      totalAmount: Number
    }],
    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  paidRoomInvoices: [{
    // Invoice identification
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomInvoice',
      required: true
    },
    invoiceNo: {
      type: String,
      required: true
    },
    invoiceDate: {
      type: Date,
      required: true
    },
    paymentStatus: {
      type: String,
      default: 'paid',
      enum: ['paid']
    },
    paymentMode: {
      type: String,
      enum: ['cash', 'online', 'room'],
      required: true
    },
    transactionId: {
      type: String,
      default: null
    },
    paidAt: {
      type: Date,
      default: Date.now
    },
    
    // Room and guest details
    roomNumber: String,
    roomType: String,
    guestName: String,
    
    // Payment details
    totalAmount: Number,
    dueAmount: {
      type: Number,
      default: 0
    },
    
    // Food items
    foodItems: [{
      name: String,
      qtyType: String,
      quantity: Number,
      price: Number,
      amount: Number,
      cgstPercent: Number,
      cgstAmount: Number,
      sgstPercent: Number,
      sgstAmount: Number,
      taxTotal: Number,
      totalAmount: Number
    }],
    
    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add index for frequently queried fields
roomAccountSchema.index({ roomNumber: 1, status: 1 });
roomAccountSchema.index({ email: 1 });

// Check if the model has already been defined
const RoomAccount = mongoose.models.RoomAccount || mongoose.model('RoomAccount', roomAccountSchema);

export default RoomAccount;