export function uploadMedia(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });
    }

    res.status(201).json({
      success: true,
      message: "File uploaded successfully.",
      data: {
        url: `/uploads/${req.file.filename}`,
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);

    res.status(500).json({
      success: false,
      message: "File upload failed.",
    });
  }
}