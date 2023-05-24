const multer = require("multer");

const storage = multer.diskStorage({
  destination: "public/uploads",
  filename: function (req, file, cb) {
    const currentDate = new Date().toISOString().slice(0, 10); // Get the current date
    const originalName = file.originalname;
    const fileName = `${currentDate}_${originalName}`; // Generate the unique filename
    cb(null, fileName);
  }
});

const upload = multer({ storage: storage });

module.exports=upload