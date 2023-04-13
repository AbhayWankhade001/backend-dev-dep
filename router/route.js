
import nodemailer from "nodemailer";
import jwt from 'jsonwebtoken';
import config from './config.js';
import { Router } from "express";





import bcrypt from "bcrypt";
import { User, Form, Employee, Admin, OTP, EmployeeSchema,BankDetails } from '../model/User.model.js';
const router = Router();

// config credientials here are store don't remove and chnage them 
const jwt_Secret = config.JWT_SECRET;
const secretKey = config.JWT_SECRET;

//>>>>>>>>>>>>>>>>>>>>>>>>>>POST API are here  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<//


const otpStore = {};

// Define route handler for admin registration
router.post('/admin/register', async (req, res) => {
  const { email, password } = req.body;

  // Generate OTP and save it in the temporary store along with email and hashed password
  const otp = cryptoRandomString({ length: 6, type: 'numeric' });
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  otpStore[email] = { otp, email, hashedPassword };

  // Send OTP to the admin's email address
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.EMAIL,
      pass: config.PASSWORD,
    },
  });
  const mailOptions = {
    from: 'surendrawankhade1973@gmail.com',
    to: email,
    subject: 'OTP for email verification',
    text: `Your OTP for admin registration is ${otp}.`,
  };
  await transporter.sendMail(mailOptions);

  res.send('OTP sent to your email address.');
});

// Define route handler for verifying OTP and creating admin account
router.post('/admin/register/verify', async (req, res) => {
  const { email, otp,password } = req.body;

  // Check if OTP matches the one in the temporary store
  if (!otpStore[email] || otpStore[email].otp !== otp) {
    return res.status(400).send('Invalid OTP.');
  }

  // Check if password field is present
  if (!password) {
    return res.status(400).send('Password field is required.');
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create a new admin user in the database
  const admin = new Admin({ email, password: hashedPassword });
  try {
    await admin.save();
  } catch (error) {
    if (error.code === 11000 && error.keyPattern.email === 1) {
      return res.status(400).send('Email is already registered.');
    }
    throw error; // re-throw the error if it's not a duplicate key error
  }

  // Delete the OTP from the temporary store
  delete otpStore[email];

  // Generate a JWT token and store it in cookies
  const token = jwt.sign({  email, adminId: admin._id  }, config.JWT_SECRET,{ algorithm: 'HS256' });
  res.cookie('token', token);
  res.send(token);
  console.log('Token:', token); // Debugging purposes only

  res.send('Admin account created successfully.');
});



router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  // Check if admin credentials are valid
  const admin = await Admin.findOne({ email });
  if (!admin) {
    return res.status(401).send('Invalid email or password.');
  }

  const isPasswordMatch = await bcrypt.compare(password, admin.password);
  if (!isPasswordMatch) {
    return res.status(401).send('Invalid email or password.');
  }

  // Generate a JWT token and store it in cookies
  const token = jwt.sign({ email, adminId: admin._id }, config.JWT_SECRET, { algorithm: 'HS256' });
 res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
  console.log('Token:', token); // Debugging purposes only
console.log(token.admin_id)





const decodedToken = jwt.verify(token, config.JWT_SECRET, { algorithm: 'HS256' });
const adminId = decodedToken.adminId;
console.log('Token:', token); // Debugging purposes only
console.log('Admin ID:', adminId);
  res.send(token);
});


function checkRequiredFields(obj, fields) {
  return fields.every(field => Object.prototype.hasOwnProperty.call(obj, field) && obj[field]);
}


 
  router.post('/createEmployees', async (req, res) => {
    try {
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        throw new Error('Authorization header is missing');
      }
      
      const { firstName, lastName, email, password } = req.body;
      if (!checkRequiredFields(req.body, ['firstName', 'lastName', 'email', 'password'])) {
        throw new Error('firstName, lastName, email, and password are required');
      }
  
      // Generate password hash using bcrypt
      const passwordHash = await bcrypt.hash(password, 10);
  
      const token = authorizationHeader.split(' ')[1];
      const tokenData = jwt.verify(token, config.JWT_SECRET, { algorithm: 'HS256' });
      const adminId = tokenData.adminId;
  
      console.log('Admin ID:', adminId);
      console.log('Started creating new employee');
      console.log('authorizationHeader:', authorizationHeader);
      console.log('token:', token);
      console.log('tokenData:', tokenData);
      console.log('adminId:', adminId);
  
      const admin = await Admin.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }
      console.log('Admin:', admin);
  
      const employee = new Employee({
        firstName,
        lastName,
        email,
        password: passwordHash,
        admin: adminId,
        status: 'active'
      });
  
      await employee.save();
      console.log('New employee created:', employee);
  
  
   // Send login details to employee email
   const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.EMAIL,
      pass: config.PASSWORD,
    }
  });
  
      // Send login details to employee's email using NodeMailer
      const mailOptions = {
        from: "surendrawankhade1973@gmail.com",
        to: email,
        subject: 'Congratulations! Your login details for Cling Multi Solution',
        html: `<p>Hello ${firstName},</p>
               <p>Congratulations on being added as an employee of Cling Multi Solution. Here are your login details:</p>
               <p>Email: ${email}</p>
               <p>Password: ${password}</p>
               <p>Please login to your account and reset your password for security reasons.</p>
               <p>Thank you for joining our team!</p>`
      };
    
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error:', error.message);
        } else {
          console.log('Email sent:', info.response);
        }
      });
  
      res.send({ message: 'Employee created successfully' });
      
    } catch (err) {
      console.log('Error:', err.message);
      res.status(400).send({ message: err.message });
    }
  });
  


  // router.post('/employeesLogin', async (req, res) => {
  //   try {
  //     const { email, password } = req.body;
  //     if (!checkRequiredFields(req.body, ['email', 'password'])) {
  //       throw new Error('Email and password are required');
  //     }
  
  //     const employee = await Employee.findOne({ email });
  //     if (!employee) {
  //       throw new Error('Invalid email or password');
  //     }
  
  //     const passwordMatch = await bcrypt.compare(password, employee.password);
  //     if (!passwordMatch) {
  //       throw new Error('Invalid email or password');
  //     }
  
  //     const token = jwt.sign(
  //       { employeeId: employee._id, adminId: employee.admin },
  //       config.JWT_SECRET,
  //       { expiresIn: '1h' } , { algorithm: 'HS256' }
  //     );
      
  
  
  //     res.send({ token });
  //   } catch (err) {
  //     console.log('Error:', err.message);
  //     res.status(400).send({ message: err.message });
  //   }
  // });
  

  router.post('/employeesLogin', async (req, res) => {
    try {
      const { email, password  } = req.body;
      if (!checkRequiredFields(req.body, ['email', 'password'])) {
        throw new Error('Email and password are required');
      }
  
      const employee = await Employee.findOne({ email });
      if (!employee) {
        throw new Error('Invalid email or password');
      }
  
      if (employee.status === 'inactive') {
        throw new Error('User not found');
      }
  
      const passwordMatch = await bcrypt.compare(password, employee.password);
      if (!passwordMatch) {
        throw new Error('Invalid email or password');
      }
  
      const token = jwt.sign(
        { employeeId: employee._id, adminId: employee.admin },
        config.JWT_SECRET,
        { expiresIn: '1M' } , { algorithm: 'HS256' }
      );
  
      res.send({ token });
    } catch (err) {
      console.log('Error:', err.message);
      res.status(400).send({ message: err.message });
    }
  });
  
//>>>>>>>>>>>>>>>>>>>>>>>>>>GET API are here  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<//








router.get('/employees', async (req, res) => {
  try {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      throw new Error('Authorization header is missing');
    }

    const token = authorizationHeader.split(' ')[1];
    const tokenData = jwt.verify(token, config.JWT_SECRET, { algorithm: 'HS256' });
    const adminId = tokenData.adminId;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    const employees = await Employee.find({ admin: adminId });
    const bankDetails = await BankDetails.find({ employeeId: { $in: employees.map(emp => emp._id) } });

    const combineData = employees.map(employee => ({
    employee,
      bankDetails: bankDetails.find(bankDetail => bankDetail.employeeId.equals(employee._id)) || null
    }));

    res.send(combineData);
  } catch (err) {
    console.log('Error:', err.message);
    res.status(400).send({ message: err.message });
  }
});

// router.get('/employees/:id', async (req, res) => {
//   try {
//     const user = await Employee.findById(req.params.id);
//     if (!user) {
//       throw new Error('User not found');
//     }
//     res.send(user);
//   } catch (err) {
//     console.log('Error:', err.message);
//     res.status(400).send({ message: err.message });
//   }
// });



router.get('/employees/:id', async (req, res) => {
  try {
    const user = await Employee.findById(req.params.id);
    if (!user) {
      throw new Error('User not found');
    }

    const bankDetails = await BankDetails.find({ employeeId: req.params.id });
    const combinedData = {
      user,
      bankDetails: bankDetails.length > 0 ? bankDetails[0] : null
    };

    res.send(combinedData);
  } catch (err) {
    console.log('Error:', err.message);
    res.status(400).send({ message: err.message });
  }
});


router.get('/users2', (req, res) => {
  res.status(201).json("its working finilla😍😍😍😍")
})







//>>>>>>>>>>>>>>>>>>>>>>>>>>DELETE API are here  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<//





router.delete('/employees/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }
    await Employee.deleteOne({ _id: employeeId });

    // Send email to admin about employee deletion using NodeMailer
 
 // Send login details to employee email
 const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.EMAIL,
    pass: config.PASSWORD,
  }
});
    const admin = await Admin.findById(employee.admin);
    if (!admin) {
      throw new Error('Admin not found');
    }
console.log(admin.email)
    const mailOptions = {
      from: "surendrawankhade1973@gmail.com",
      to: admin.email,
      subject: `Employee ${employee.firstName} ${employee.lastName} has been deleted from Cling Multi Solution`,
      html: `<p>Hello ${admin.firstName},</p>
             <p>The employee ${employee.firstName} ${employee.lastName} has been deleted from Cling Multi Solution by ${admin.firstName} ${admin.lastName}.</p>
             <p>Thank you!</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error:', error.message);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.send({ message: 'Employee deleted successfully' });

  } catch (err) {
    console.log('Error:', err.message);
    res.status(400).send({ message: err.message });
  }
});









export default router;
