const express = require('express')
const router = express.Router()

const User = require('../models/User')
const UserVerification = require('../models/Userverification')
const nodemailer = require("nodemailer")
const {v4: uuidv4} = require("uuid")
require("dotenv").config()
const PasswordReset = require('../models/PasswordReset')
const UserOTPVerification = require('../models/UserOTPVerification')
const bcrypt = require('bcrypt')
const path = require("path")


const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
    }
})

transporter.verify((error, success) => {
    if (error) {
        console.log(error)
    } else {
        console.log("Ready for messages")
        console.log(success)
    }
})

router.post('/signup', (req, res) => {
    let {name, email, password, mobilenum} = req.body
    name = name.trim()
    email = email.trim()
    password = password.trim()
    mobilenum = mobilenum.trim()

    if (name == "" || email == "" || password == "" || mobilenum == "") {
        res.json({
            status: "FAILED",
            message: "Empty input fields!"
        })
    } else if (!/^[a-zA-Z .]+$/.test(name)) {
        res.json({
            status: "FAILED",
            message: "Invalid name entered"
        })
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        res.json({
            status: "FAILED",
            message: "Invalid email entered"
        })
    } else if (password.length < 8) {
        res.json({
            status: "FAILED",
            message: "Password is too short!"
        })
    } else if (!/^[0-9]{10,11}$/.test(mobilenum)) {
        res.json({
            status: "FAILED",
            message: "Invalid mobile number! Must be 11 digits"
        })
    } else {
        User
        .find({email})
        .then(result => {
            if (result.length) {
                
                res.json({
                    status: "FAILED",
                    message: "User with the provided email already exists"  
                })
            } else {
                
                const saltRounds = 10
                bcrypt
                .hash(password, saltRounds)
                .then(hashedPassword => {
                    const newUser = new User({
                        name,
                        email,
                        password: hashedPassword,
                        mobilenum,
                        verified: false,
                    })

                    newUser
                    .save()
                    .then(result => {
            
                        sendVerificationEmail(result, res)
                    })
                    .catch(err => {
                        console.log(err)
                        res.json({
                        status: "FAILED",
                        message: "An error occurred while saving user account!"
                    })
                    
                    })

                })
                .catch(err => {
                    console.log(err)
                    res.json({
                    status: "FAILED",
                    message: "An error occurred while hashing password!"
                })
                
                })

            }
        })
        .catch(err => {
            console.log(err)
            res.json({
                status: "FAILED",
                message: "An error occurred while checking for existing user!"
            })
        })
    }
})

const sendVerificationEmail = ({_id, email}, res) => {

    const currentUrl = "http://localhost:8888/"
    const uniqueString = uuidv4() + _id
    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Verify your Email",
        html: `<p>Verify your email address to complete the signup and login into your account.</p><p>This link 
        <b>expires in 1 hour</b>.</p><p>Press <a href=${currentUrl + "user/verify/" + _id + "/" + uniqueString}>here</a> to proceed.</p>`,
    }

    const saltRounds = 10
    bcrypt
    .hash(uniqueString, saltRounds)
    .then((hashedUniqueString) => {

        const newVerification = new UserVerification({
        userId: _id,
        uniqueString: hashedUniqueString,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
      })

      newVerification
      .save()
      .then(() => {
        transporter
        .sendMail(mailOptions)
        .then(() => {
            res.json({
                status: "PENDING",
                message: "Verification email sent.",
            })
        })
        .catch((error) => {
            console.log(error)
            res.json({
                status: "FAILED",
                message: "Verification email failed",
            })
        })
      })
      .catch((error) => {
        console.log(error)
        res.json({
            status: "FAILED",
            message: "Couldn't save verification email data!"
        })
      })

    })
    .catch(() => {
        res.json ({
            status: "FAILED",
            message: "An error occurred while hashing email data!",
        }) 
    })
}

router.get("/verify/:userId/:uniqueString", (req, res) => {
    let { userId, uniqueString } = req.params

    UserVerification
    .find({ userId })
    .then((result) => {
        if (result.length > 0) {

            const {expiresAt} = result[0]
            const hashedUniqueString = result[0].uniqueString

            if (expiresAt < Date.now()) {

                UserVerification
                .deleteOne({userId})
                .then(result => {
                    User
                    .deleteOne({_id: userId})
                    .then(()=> {
                        let message = "Link has expired. Please sign up again."
                        res.redirect(`/user/emailverified?error=true&message=${message}`)
                    })
                    .catch(error => {
                        console.log(error)
                        let message = "Clearing user with expired unique string failed."
                        res.redirect(`/user/emailverified?error=true&message=${message}`)
                    })
                })
                .catch((error) => {
                    console.log(error)
                    let message = "An error occurred while clearing expired user verification record."
                    res.redirect(`/user/emailverified?error=true&message=${message}`)
                })
            } else {
                bcrypt
                .compare(uniqueString, hashedUniqueString)
                .then(result => {
                    if (result) {
                        User
                        .updateOne({_id: userId}, {verified: true})
                        .then(() => {
                            UserVerification
                            .deleteOne({userId})
                            .then(() => {
                                res.sendFile(path.join(__dirname, "./../views/emailverified.html"))
                            })
                            .catch(error => {
                                console.log(error)
                            let message = "An error occurred while finalizing successful verification."
                            res.redirect(`/user/emailverified?error=true&message=${message}`)
                            })

                        })
                        .catch(error => {
                            console.log(error)
                            let message = "An error occurred while updating user record to show verified. "
                            res.redirect(`/user/emailverified?error=true&message=${message}`)
                        })

                    } else {

                        let message = "Invalid verification details passed. Check your inbox."
                        res.redirect(`/user/emailverified?error=true&message=${message}`)
                    }
                })
                .catch(error => {
                    console.log(error)
                    let message = "An error occurred while comparing unique strings."
                    res.redirect(`/user/emailverified?error=true&message=${message}`)
                })
            }
        } else {

             let message = "Account record doesn't exist or has been verified already. Please sign up or login."
             res.redirect(`/user/emailverified?error=true&message=${message}`)
        }
    })
    .catch(error => {
        console.log(error)
        let message = "An error occurred while checking for existing user verification record."
        res.redirect(`/user/emailverified?error=true&message=${message}`)
    })
})

router.get("/emailverified", (req, res) => {
    res.sendFile(path.join(__dirname, "./../views/emailverified.html"))
})

router.post('/login', async (req, res) => {
    let {email, password} = req.body

    if (!email || !password) {
        return res.json({
            status: "FAILED",
            message: "Empty credentials"
        })
    }

    try {
        const user = await User.findOne({email})

        if (!user) {
            return res.json ({
                status: "FAILED", 
                message: "Invalid credentials"
            })
        }

        if (!user.verified) {
            return res.json({
                status: "FAILED",
                message: "Email hasn't been verified yet. Check your inbox."
            })
        }

        const passwordMatch = await bcrypt.compare(password, user.password)

        if (!passwordMatch) {
            return res.json({
                status: "FAILED",
                message: "Invalid password!"
            })
        }

       
        return res.json({
            status: "SUCCESS",
            message: "Login successful",
            data: {
                userId: user._id,
                email: user.email,
            },
        })

    } catch (error) {
        console.log(error)
        return res.json({
            status: "FAILED",
            message: "An error occurred while processing login"
        })
    }
})


router.post("/forgotPassword", async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.json({
                status: "FAILED",
                message: "Email is required",
            })
        }

        const user = await User.findOne({ email })

        if (!user) {
            return res.json({
                status: "FAILED",
                message: "No account with the supplied email exists!",
            })
        }

        if (!user.verified) {
            return res.json({
                status: "FAILED",
                message: "Email hasn't been verified yet. Check your inbox",
            })
        }

        
        const _id = user._id

        await UserOTPVerification.deleteMany({ userId: _id })

        const otp = `${Math.floor(1000 + Math.random() * 9000)}`

        const mailOptions = {
            from: process.env.AUTH_EMAIL,
            to: email,
            subject: "Your Password Reset OTP Code",
            html: `<p>Enter <b>${otp}</b> to reset your password.</p>
            <p>This code expires in <b>1 hour</b>.</p>`
        }

        const saltRounds = 10
        const hashedOTP = await bcrypt.hash(otp, saltRounds)

        const newOTP = new UserOTPVerification({
            userId: _id,
            otp: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000,
        })

        await newOTP.save()
        await transporter.sendMail(mailOptions)

        return res.json({
            status: "PENDING",
            message: "Password reset OTP sent successfully",
            data: { userId: _id, email },
        })
    } catch (error) {
        console.log(error)
        return res.json({
            status: "FAILED",
            message: "An error occurred while requesting password reset",
        })
    }
})


router.post("/forgotPassword/verify", async (req, res) => {
    try {
        let { userId, otp, newPassword } = req.body

        if (!userId || !otp || !newPassword) {
            throw Error("User, OTP, and new password are required")
        }

        if (newPassword.length < 8) {
            throw Error("Password is too short! Must be at least 8 characters")
        }

        const UserOTPVerificationRecords = await UserOTPVerification.find({
            userId,
        })

        if (UserOTPVerificationRecords.length <= 0) {
            throw new Error(
                "OTP record doesn't exist or has expired. Please request again."
            )
        } else {
            const { expiresAt } = UserOTPVerificationRecords[0]
            const hashedOTP = UserOTPVerificationRecords[0].otp

            if (expiresAt < Date.now()) {
                await UserOTPVerification.deleteMany({ userId })
                throw new Error("Code has expired. Please request again.")
            } else {
                const validOTP = await bcrypt.compare(otp, hashedOTP)

                if (!validOTP) {
                    throw new Error("Invalid code passed. Check your inbox.")
                } else {
                   
                    const saltRounds = 10
                    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

                    await User.updateOne({ _id: userId }, { password: hashedPassword })
                    await UserOTPVerification.deleteMany({ userId })

                    return res.json({
                        status: "SUCCESS",
                        message: "Password reset successfully. You can now log in with your new password.",
                    })
                }
            }
        }
    } catch (error) {
        return res.json({
            status: "FAILED",
            message: error.message,
        })
    }
})


router.post("/requestPasswordReset", (req, res) => {
    const {email, redirectUrl} = req.body

    User
    .find({email})
    .then((data) => {
        if (data.length) {

            if (!data[0].verified) {
                res.json({
                    status: "FAILED",
                    message: "Email hasn't been verified yet. Check your inbox",

                })
            } else {
                sendResetEmail(data[0], redirectUrl, res)
            }

        } else {
            res.json({
                status: "FAILED",
                message: "No account with the supplied email exists!",
            })
        }
    })
    .catch(error => {
        console.log(error)
        res.json({
            status: "FAILED",
            message: "An error occurred while checking for existing user",
        })
    })
   

})

const sendResetEmail = ({_id, email}, redirectUrl, res) => {
    const resetString = uuidv4() + _id

    PasswordReset
    .deleteMany({ userId: _id })
    .then(result => {

        const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Password Reset",
        html: `<p>We heard that you lost the password.</p><p>Don't worry use the link below to reset it.</p>
        <p>This link <b>expires in 1 hour</b>.</p><p>Press <a href=${redirectUrl + "/" + _id + "/" + resetString}>here</a> to proceed.</p>`,
    }

    const saltRounds = 10
    bcrypt
    .hash(resetString, saltRounds)
    .then(hashedResetString => {
        const newPasswordReset = new PasswordReset ({
            userId: _id,
            resetString: hashedResetString,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000

        })

        newPasswordReset
        .save()
        .then(() => {
            transporter
            .sendMail(mailOptions)
            .then(() => {
                res.json({
                    status: "PENDING",
                    message: "Password reset email sent",
                })
            })
            .catch(error => {
                console.log(error)
                res.json({
                    status: "FAILED",
                    message: "Password reset email failed",
                })
            })
        })
        .catch(error => {
            console.log(error)
            res.json({
                status: "FAILED",
                message: "Couldn't save password reset data!",
            })
        })
    })
    .catch(error => {
        console.log(error)
        res.json({
            status: "FAILED",
            message: "An error occurred while hashing the password reset data!",
        })
    })
    })
    .catch(error => {
        console.log(error)
        res.json({
            status: "FAILED",
            message: "Clearing existing password reset records failed",
        })
    })
}
module.exports = router


