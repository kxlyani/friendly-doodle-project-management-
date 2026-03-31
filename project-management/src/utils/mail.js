import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "Project Camp",
            link: "https://projectcamp.app",
        },
    });

    // Generate HTML and plaintext versions
    const emailBody = mailGenerator.generate(options.mailgenContent);
    const emailText = mailGenerator.generatePlaintext(options.mailgenContent);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: '"Project Camp" <no-reply@projectcamp.app>',
            to: options.email,
            subject: options.subject,
            text: emailText,  // plaintext for clients that don't support HTML
            html: emailBody,  // HTML body (was swapped before)
        });

        console.log("Message sent: %s", info.messageId);
    } catch (err) {
        console.error("Error while sending mail:", err);
        // Re-throw so the caller knows the email failed
        throw new Error(`Failed to send email: ${err.message}`);
    }
};

const VerificationEmail = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to Project Camp! Please verify your email to get started.",
            action: {
                instructions: "Click the button below to verify your email address:",
                button: {
                    color: "#1f5f45",
                    text: "Verify your email",
                    link: verificationUrl,
                },
            },
            outro: "If you didn't create an account, you can safely ignore this email.",
        },
    };
};

const ForgotPasswordEmail = (username, forgotPasswordUrl) => {
    return {
        body: {
            name: username,
            intro: "You requested a password reset for your Project Camp account.",
            action: {
                instructions: "Click the button below to reset your password:",
                button: {
                    color: "#1f5f45",
                    text: "Reset password",
                    link: forgotPasswordUrl,
                },
            },
            outro: "If you didn't request this, you can safely ignore this email. Your password won't change.",
        },
    };
};

export { VerificationEmail, ForgotPasswordEmail, sendEmail };