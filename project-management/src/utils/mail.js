import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
    var mailGenerator = new Mailgen({
        theme: "default",
        product: {
            // Appears in header & footer of e-mails
            name: "Mailgen",
            link: "https://mailgen.js/",
            // Optional product logo
            logo: "https://mailgen.js/img/logo.png",
        },
    });

    // Generate an HTML email with the provided contents
    var emailBody = mailGenerator.generate(options.mailgenContent);

    // Generate the plaintext version of the e-mail (for clients that do not support HTML)
    var emailText = mailGenerator.generatePlaintext(options.mailgenContent);

    // transport
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: '"Example Team" <team@example.com>', // sender address
            to: options.email, // list of recipients
            subject: options.subject, // subject line
            text: emailBody, // plain text body
            html: emailText, // HTML body
        });

        console.log("Message sent: %s", info.messageId);
        // Preview URL is only available when using an Ethereal test account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (err) {
        console.error("Error while sending mail", err);
    }
};

const VerificationEmail = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to Mailgen! We're very excited to have you on board.",
            action: {
                instructions: "To get started with Mailgen, please click here:",
                button: {
                    color: "#66eda9",
                    text: "Confirm your account",
                    link: verificationUrl,
                },
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
        },
    };
};

const ForgotPasswordEmail = (username, forgotPasswordUrl) => {
    return {
        body: {
            name: username,
            intro: "Forgot passowrd? Reset it here",
            action: {
                instructions: "To reset your password, please click here:",
                button: {
                    color: "#ed666f",
                    text: "Reset Password",
                    link: forgotPasswordUrl,
                },
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
        },
    };
};

export { VerificationEmail, ForgotPasswordEmail, sendEmail};
