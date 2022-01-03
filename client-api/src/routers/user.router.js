const express = require("express");
const router = express.Router();
const {
  insertUser,
  getUserByEmail,
  getUserById,
  updatePassword,
  storeUserRefreshJWT,
} = require("../model/user/User.model");
const {
  hashPassword,
  comparePassword,
} = require("../helpers/bcrypt.helper.js");
const {
  createAccessJWT,
  createRefreshJWT,
} = require("../helpers/jwt.helper.js");
const {
  userAuthorization,
} = require("../middlewares/authorization.middleware");
const {
  setPasswordRestPin,
  getPinByEmailPin,
  deletePin,
} = require("../model/restPin/RestPin.model");
const { emailProcessor } = require("../helpers/email.helper");
const {
  resetPassReqValidation,
  updatePassValidation,
} = require("../middlewares/formValidation.middleware");
const { deleteJWT } = require("../helpers/redis.helper");
router.all("/", (req, res, next) => {
  // res.json({ message: "return form user router" });

  next();
});

//Get user profile router
router.get("/", userAuthorization, async (req, res) => {
  const _id = req.userId;
  const userProf = await getUserById(_id);
  res.json({ user: userProf });
});

//create a new user Router
router.post("/", async (req, res) => {
  const { name, company, address, phone, email, password } = req.body;
  try {
    //hash password
    const hasedPass = await hashPassword(password);
    const newUserObj = {
      name,
      company,
      address,
      phone,
      email,
      password: hasedPass,
    };

    const result = await insertUser(newUserObj);
    console.log(result);
    res.json({ message: "New user created", result });
  } catch (error) {
    console.log(error);
    res.json({ status: "error", message: error.message });
  }

  //here we recieve the data by (req.body) and then we again send the data in json format by(res.json())
  //res.json(req.body);
});

//User sign in router
router.post("/login", async (req, res) => {
  console.log(req.body);

  const { email, password } = req.body;
  //get user with email from db
  //hash our password and compare with the db one

  if (!email || !password) {
    return res.json({ status: "error", message: "Invalid user or password" });
  }
  //get user with email from db
  const user = await getUserByEmail(email);
  console.log(user);
  const passFromDb = user && user._id ? user.password : null;
  if (!passFromDb)
    return res.json({ status: "error", message: "Invalid user or password" });

  const result = await comparePassword(password, passFromDb);

  if (!result) {
    return res.json({ status: "error", message: "Invalid user or password" });
  }
  const accessJWT = await createAccessJWT(user.email, `${user._id}`);
  const refreshJWT = await createRefreshJWT(user.email, `${user._id}`);

  res.json({
    status: "success",
    message: "Login Successfully!",
    accessJWT,
    refreshJWT,
  });
});

//password reset router
//A. Create and send password reset pin number
//1.recieve email
//2. check if user exist for the email
//3. create unique 6 digit pin
//4. save pin and email in database
//5. email the pin

//B. update password in DB
//1. recieve email,pin and new Password
//2. validate pin
//3. encrypt new password
//4. update password in database
//5. send email notification

//C. Server side form validation
//1. create middleware to validate form data

router.post("/reset-password", resetPassReqValidation, async (req, res) => {
  const { email } = req.body;

  const user = await getUserByEmail(email);

  if (user && user._id) {
    // 2. create unique 6 digit pin
    const setPin = await setPasswordRestPin(email);
    await emailProcessor({
      email,
      pin: setPin.pin,
      type: "request-new-password",
    });

    return res.json({
      status: "success",
      message:
        "If the email is exist in our database, the password reset pin will be sent shortly.",
    });
  }
  res.json({
    status: "error",
    message:
      "If the email is exist in our database, the password reset pin will be sent shortly.",
  });
});
//password update
router.patch("/reset-password", updatePassValidation, async (req, res) => {
  const { email, pin, newPassword } = req.body;

  const getPin = await getPinByEmailPin(email, pin);
  // 2. validate pin
  if (getPin._id) {
    const dbDate = getPin.addedAt;
    const expiresIn = 1;

    let expDate = dbDate.setDate(dbDate.getDate() + expiresIn);

    const today = new Date();

    if (today > expDate) {
      return res.json({ status: "error", message: "Invalid or expired pin." });
    }

    // encrypt new password
    const hashedPass = await hashPassword(newPassword);

    const user = await updatePassword(email, hashedPass);

    if (user._id) {
      // send email notification
      await emailProcessor({ email, type: "update-password-success" });

      ////delete pin from db
      deletePin(email, pin);

      return res.json({
        status: "success",
        message: "Your password has been updated",
      });
    }
  }
  res.json({
    status: "error",
    message: "Unable to update your password. plz try again later",
  });
});

//User logout and invalidate jwts
//1. get jwt and verify
//2. delete accessJWT from redis database
//3. delete refreshJWT from mongoDB
router.delete("/logout", userAuthorization, async (req, res) => {
  const { autherization } = req.headers;
  const _id = req.userId;
  // const userProf = await getUserById(_id);
  deleteJWT(autherization);
  const result = await storeUserRefreshJWT(_id, "");
  if (result._id) {
    return res.json({ status: "success", message: "Loged out successfully" });
  }
  res.json({
    status: "error",
    message: "unable to log you out, plz try again later",
  });
});

module.exports = router;
