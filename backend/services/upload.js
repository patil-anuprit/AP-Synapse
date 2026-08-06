import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDir = path.resolve("uploads");

// Make sure uploads/ exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMimeTypes = new Set([
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "image/webp"
]);

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {

        const safeName =
            file.originalname
                .replace(/[^a-zA-Z0-9._-]/g, "_");

        cb(
            null,
            `${Date.now()}-${safeName}`
        );

    }

});

const fileFilter = (req, file, cb) => {

    if (!allowedMimeTypes.has(file.mimetype)) {

        return cb(
            new Error(
                "Unsupported file type. Please upload PDF, DOCX, TXT, PNG, JPG, JPEG, or WEBP."
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