import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'Dhuun'
  },
  siteDescription: {
    type: String,
    default: 'A marketplace for producers and artists to buy and sell beats'
  },
  contactEmail: {
    type: String,
    default: 'admin@dhuun.com'
  },
  maxUploadSizeMB: {
    type: Number,
    default: 20
  },
  commissionRate: {
    type: Number,
    default: 10
  },
  featuredBeatsLimit: {
    type: Number,
    default: 8
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

export default mongoose.model('Settings', SettingsSchema);