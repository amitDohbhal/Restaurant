'use server'

import connectDB from "@/lib/connectDB";
import Enquiry from "@/models/Enquiry";
import Package from "@/models/Package";

export async function GetAllEnquiry() {
    await connectDB();

    const enquirys = await Enquiry.find({})
        .populate({
            path: "packageId",
            model: "Package",
        })
        .sort({ createdAt: -1 })
        .lean();

    enquirys.forEach(enquiry => {
        enquiry._id = enquiry._id.toString();
        if (enquiry.packageId) {
            enquiry.packageId._id = enquiry.packageId._id.toString();
        }
        enquiry.userId = enquiry.userId.toString();
    });


    return { enquirys };
}
