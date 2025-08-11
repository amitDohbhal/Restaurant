import { createUploadthing } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// Fake auth function
const auth = (req) => ({ id: "fakeId" });

// Define FileRouter for your app with both image and document upload routes
export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "128MB",
    },
  })
    .middleware(async ({ req }) => {
      const user = auth(req);
      if (!user) throw new UploadThingError("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Handle the file upload completion and return file URL
      return { uploadedBy: metadata.userId, fileUrl: file.ufsUrl };
    }),

  galleryUploader: f({
    image: {
      maxFileSize: "128MB",
      maxFileCount: 10,
    },
  })
    .middleware(async ({ req }) => {
      const user = auth(req);
      if (!user) throw new UploadThingError("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Handle the file upload completion and return file URL
      return { uploadedBy: metadata.userId, fileUrl: file.ufsUrl };
    }),

  chatAttachments: f({
    image: {
      maxFileSize: "128MB",
      maxFileCount: 10,
    },
    pdf: {
      maxFileSize: "128MB",
      maxFileCount: 10,
    },
    text: {
      maxFileSize: "128MB",
      maxFileCount: 10,
    },
  })
    .middleware(async ({ req }) => {
      const user = auth(req);
      if (!user) throw new UploadThingError("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Handle the file upload completion and return file URL
      return { uploadedBy: metadata.userId, fileUrl: file.ufsUrl };
    }),
};
