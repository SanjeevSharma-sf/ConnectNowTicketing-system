const nodemailer = require("nodemailer");

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "ryder.dietrich@ethereal.email",
    pass: "q9g5XpSTA3eEW7jvrN",
  },
});

//this email will just have a just to send email to client
const send = (info) => {
  return new Promise(async (resolve, reject) => {
    try {
      // send mail with defined transport object
      let result = await transporter.sendMail();

      console.log("Message sent: %s", result.messageId);
      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

      // Preview only available when sending through an Ethereal account
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(result));
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
      resolve(result);
    } catch (error) {
      console.log(error);
    }
  });
};

const emailProcessor = ({ email, pin, type }) => {
  let info = "";
  switch (type) {
    case "request-new-password":
      info = {
        from: '"CMR Company" <ryder.dietrich@ethereal.email>', // sender address
        to: email, // list of receivers
        subject: "Password Reset Pin", // Subject line
        text:
          "Here is your password rest pin" +
          pin +
          " This pin will expires in 1day", // plain text body
        html: `<b>Hello </b>
        Here is your pin 
        <b>${pin} </b>
        This pin will expires in 1day
        <p></p>`, // html body
      };

      send(info);
      break;

    case "update-password-success":
      info = {
        from: '"CMR Company" <ryder.dietrich@ethereal.email>', // sender address
        to: email, // list of receivers
        subject: "Password updated", // Subject line
        text: "Your new password has been update", // plain text body
        html: `<b>Hello </b>
         
        <p>Your new password has been update</p>`, // html body
      };

      send(info);
      break;

    default:
      break;
  }
};
module.exports = {
  emailProcessor,
};
