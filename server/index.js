const express = require("express");
const app = express();
const mongoose = require("mongoose");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const config = require("./config/key");

const { User } = require("./models/User");
const { auth } = require("./middleware/auth");

//  CONNECT TO DB

mongoose
  .connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Database connected!"))
  .catch((err) => console.log(err));

//  MIDDLEWARES

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

//  ROUTES
app.get("/", (req, res) => {
  res.send("Welcome");
});

app.get("/api/user/auth", auth, (req, res) => {
    res.status(200).json({
        _id: req.user._id,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role
    });
});

app.post("/api/user/register", (req, res) => {
  const user = new User(req.body);

  user.save((err, doc) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).json({
      success: true,
    });
  });
});

app.post("/api/user/login", (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user)
      return res.json({
        loginSuccess: false,
        message: "Auth failed, email not found",
      });

    user.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch)
        return res.json({ loginSuccess: false, message: "Wrong password" });

      user.generateToken((err, user) => {
        if (err) return res.status(400).send(err);
        res
        .cookie("w_auth", user.token)
        .status(200)
        .json({
          loginSuccess: true
        });
      });
    });
  });
});

app.get('/api/user/logout',auth, (req,res) => {
  User.findOneAndUpdate({_id: req.user.id}, {token: ""}, (err, doc) =>{
    if(err) return res.json({success: false, err});
    return res.status(200).send({
      success:true
    })
  })

})

//  START SERVER

const port = process.env.PORT || 5000;
app.listen(port, () =>{
  console.log(`Server running at ${port}`);
});
