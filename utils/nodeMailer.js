const nodemailer = require('nodemailer');
const sendEmail= async(email,subject,text)=>{
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: true,
            auth: {
                user: "codehelperforum@gmail.com",
                pass: "jxyouhrcgvartcgk",
            },
        });

        await transporter.sendMail({
            from: "SmartGardent@gmail.com",
            to: email,
            subject: subject,
            text:'Mật khẩu mới của bạn là: '+text 
        });

        console.log("email sent sucessfully");
    } catch (error) {
        console.log(error, "email not sent");
    }
}
module.exports= sendEmail;
