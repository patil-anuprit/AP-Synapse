import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const uploadDirectory = path.resolve("uploads");

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const allowedMimeTypes = new Set([
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/png",
    "image/jpeg",
    "image/webp"
]);

const allowedExtensions = new Set([
    ".pdf",
    ".txt",
    ".docx",
    ".csv",
    ".xls",
    ".xlsx",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp"
]);

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {

        const extension =
            path.extname(file.originalname).toLowerCase();

        const safeName =
            `${Date.now()}-${crypto.randomUUID()}${extension}`;

        cb(null, safeName);
    }

});

const fileFilter = (req, file, cb) => {

    const extension =
        path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.has(extension)) {

        return cb(
            new Error(
                "Unsupported file type. Allowed: PDF, TXT, DOCX, CSV, XLS, XLSX, PNG, JPG, JPEG and WEBP."
            )
        );

    }

    if (!allowedMimeTypes.has(file.mimetype)) {

        return cb(
            new Error(
                "The uploaded file type is not allowed."
            )
        );

    }

    cb(null, true);

};

const upload = multer({

    storage,

    fileFilter,

    limits: {
        fileSize: 25 * 1024 * 1024
    }

});

export default upload;