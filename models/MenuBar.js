import { Schema, models, model } from "mongoose";
import Size from '@/models/Size';
import Color from '@/models/Color';
import Gallery from '@/models/Gallery';
import Video from '@/models/Video';
import Description from '@/models/Description';
import Info from '@/models/Info';
import CategoryTag from '@/models/CategoryTag';
import ProductReview from '@/models/ProductReview';
import Quantity from '@/models/Quantity';
import ProductCoupons from '@/models/ProductCoupons';
import ProductTax from '@/models/ProductTax';

const MenuBarSchema = new Schema(
    {
        active: { type: Boolean },
        order: { type: Number },
        title: { type: String },
        subMenu: [
            {
                title: { type: String },
                url: { type: String },
                active: { type: Boolean },
                order: { type: Number },
                banner: { url: { type: String }, key: { type: String } },
                profileImage: { url: { type: String }, key: { type: String } },
                products: { type: [Schema.Types.ObjectId], ref: "Product", default: [] },
            }
        ]
    },
    { timestamps: true }
);

export default models.MenuBar || model("MenuBar", MenuBarSchema);
