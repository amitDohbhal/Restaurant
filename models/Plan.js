import { Schema, models, model } from "mongoose";

const PlanSchema = new Schema({
    planName: { type: String, required: true },
    cities: [{
        city: { type: String },
        hotelName: { type: String },
        adultPlan: {
            ep: {
                wem: {
                    price: Number,
                    margin: Number
                },
                em: {
                    price: Number,
                    margin: Number
                }
            },
            cp: {
                wem: {
                    price: Number,
                    margin: Number
                },
                em: {
                    price: Number,
                    margin: Number
                }
            },
            map: {
                wem: {
                    price: Number,
                    margin: Number
                },
                em: {
                    price: Number,
                    margin: Number
                }
            },
            ap: {
                wem: {
                    price: Number,
                    margin: Number
                },
                em: {
                    price: Number,
                    margin: Number
                }
            },
        },
        childPlan: {
            ep: {
                wem: {
                    price: Number,
                    margin: Number
                },
            },
            cp: {
                wem: {
                    price: Number,
                    margin: Number
                },
            },
            map: {
                wem: {
                    price: Number,
                    margin: Number
                },
            },
            ap: {
                wem: {
                    price: Number,
                    margin: Number
                },
            },
        },
    }]
})

export default models.Plan || model("Plan", PlanSchema);