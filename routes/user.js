const express = require("express");
'use strict';
var sessionstorage = require('sessionstorage');
const { check, validationResult } = require("express-validator/check");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const cors = require('cors');
const auth = require("../middleware/auth");

const User = require("../model/User");
const SaveStory = require("../model/SaveStory");

/**
 * @method - POST
 * @param - /signup
 * @description - User SignUp
 */
router.options('/', cors());
router.post(
  "/signup", cors(),
  [
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Please enter a valid password").isLength({
      min: 6
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({
        email
      });
      if (user) {
        return res.status(400).json({
          msg: "User Already Exists"
        });
      }

      user = new User({
        email,
        password
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        "randomString",
        {
          expiresIn: 10000
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({
            "mytoken":token,
            "success":true,
            "message":"User registered successfully"
          });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Error in Saving");
    }
  }
);

router.post(
  "/login", cors(),
  [
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Please enter a valid password").isLength({
      min: 6
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({
        email
      });
      if (!user)
        return res.status(400).json({
          message: "User Not Exist"
        });
        // sessionstorage.setItem("pratilipiblogemail", email);
        // console.log(sessionstorage.getItem("pratilipiblogemail"));


      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({
          message: "Incorrect Password !"
        });

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        "randomString",
        {
          expiresIn: 3600
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({
            token,
            "email": req.body.email,
            "success": true,
            "message": "Logged In Successfully"
          });
        }
      );
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: "Server Error"
      });
    }
  }
);

/**
 * @method - POST
 * @description - Get LoggedIn User
 * @param - /user/me
 */


router.post(
  "/save/stories",
  [
    check("title", "Please enter a title").isLength({
      min: 6
    }),
    check("content", "Please enter a content").isLength({
      min: 20
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const { title, content } = req.body;
    try {
      let stories = await SaveStory.findOne({
        title
      });
      if (stories) {
        return res.status(400).json({
          msg: "Story Successfully Inserted"
        });
      }

      stories = new SaveStory({
        title,
        content
      });

      await stories.save();

      const payload = {
        stories: {
          id: stories.id
        }
      };

      jwt.sign(
        payload,
        "randomString",
        {
          expiresIn: 10000
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({
            "storytoken":token
          });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Error in Saving");
    }
  }
);


router.get(
  "/all/stories",
  async (req, res) => {
    // if (!sessionstorage.getItem("pratilipiblogemail")) {
    //   res.send(500,'showAlertAndRedirect'); 
    // }
    res.send(await SaveStory.find({}));
  }
);

//Get specific story
router.get(
  "/story/:title",
  async (req, res) => {
    // if (!sessionstorage.getItem("pratilipiblogemail")) {
    //   res.send(500,'showAlertAndRedirect'); 
    // }
    res.send(await SaveStory.findOne({ "title": req.params.title }).exec());
    
  
  }
);

//Read count API
router.post(
  "/count",
  async (req, res) => {
    let readcount=0;
    let count={};
    let visitedUsers = {};
    let finalList = [];
    let arrayUsers=[];
    const { title } = req.body;
    global[title]=0;
    let email = req.body.email;
    console.log(email);
    if (visitedUsers[title] === undefined) {
      arrayUsers.push(email);
      finalList.push(arrayUsers[0]);
      visitedUsers[title]= finalList;
      global[title] =  global[title]+1;
      count[title]= global[title];

    }
    if(visitedUsers[title] !== undefined){
      if(!visitedUsers[title].includes(email)){
        arrayUsers.push(email);
        finalList.push(arrayUsers[0]);
        visitedUsers[title]= finalList;
        global[title] =  global[title]+1;
        count[title]= global[title];
      }
    }
    console.log(visitedUsers);
    console.log(count);


    res.send({"visitedUsers":visitedUsers, "count":count});
  }
);



module.exports = router;
