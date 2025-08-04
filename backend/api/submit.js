const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const mongoUri = process.env.MONGODB_URI;
let conn = null;

const connectToDB = async () => {
  if (!conn) {
    conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
};

const SubmissionSchema = new mongoose.Schema({
  name: String,
  dob: String,
  email: String,
  phone: String,
  address: String,
  education: String,
  skills: String,
  experience: Number,
  salary: String,
  position: String,
});

const Submission = mongoose.models.Submission || mongoose.model("Submission", SubmissionSchema);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // for GitHub Pages
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  try {
    await connectToDB();
    const data = req.body;
    await Submission.create(data);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: data.email,
      subject: "Application Received",
      text: `Hello ${data.name},\n\nThank you for submitting your bio-data. We'll review your application and contact you soon.\n\nBest,\nCompany Team`,
    });

    res.status(200).json({ message: "Form submitted and email sent!" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Submission failed", error });
  }
}
