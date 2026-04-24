import nodemailer from "nodemailer";

async function testMail() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "localoppss@gmail.com",
      pass: "mdhghrzrezsporjw",
    },
  });

  try {
    const info = await transporter.sendMail({
      from: '"Test" <localoppss@gmail.com>',
      to: "localoppss@gmail.com", // Send to itself
      subject: "Test email",
      text: "Testing 123",
    });
    console.log("Success!", info.messageId);
  } catch (error) {
    console.error("Error:", error);
  }
}

testMail();
