require("dotenv").config();
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const multer = require('multer');
const AWS = require('aws-sdk');
const app = express();
const moment = require("moment");
const moment1 =require('moment-timezone');
const path = require("path");
const port = process.env.PORT || 3001;

const buildpath = path.join(__dirname, "../client/build");
app.use(express.static(buildpath));


const TelegramBot = require("node-telegram-bot-api");
const bridgeBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const personalChatId = process.env.TELEGRAM_CHAT_ID;

app.use(cors());
app.use(bodyParser.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const Imap = require("imap");
const { simpleParser } = require("mailparser");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const imapConfig = {
  user: process.env.IMAP_USER,
  password: process.env.IMAP_PASSWORD,
  host: process.env.IMAP_HOST,
  port: parseInt(process.env.IMAP_PORT),
  tls: true,
  connTimeout: 30000, // Increase connection timeout
  authTimeout: 30000  
};

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const imap = new Imap(imapConfig);


imap.on('ready', () => {
  imap.openBox('INBOX', false, (err, box) => {
    if (err) {
      console.error(err);
      return;
    }
    imap.on('mail', (mail) => {
      console.log('New mail received', mail);
      // fetch last mail
      const f = imap.seq.fetch(box.messages.total + ':*', { bodies: [''] });
      f.on('message', (msg) => {
        msg.on('body', async (stream) => {
          const parsed = await simpleParser(stream);
          // log subject of mail and body
          console.log(parsed.subject);
          console.log(parsed.text);

          // Check if parsed.text is defined before using it
          if (parsed.text) {
            const assetIdMatch = parsed.text.match(/Asset_Id\s*([\s\S]*?)(?=\n|$)/i);
            let assetId = "";
            if (assetIdMatch && assetIdMatch[1]) {
              assetId = assetIdMatch[1].trim();
            } else {
              console.log("Asset Id not found in the text.");
            }

            if (
              parsed.text.toLowerCase().includes("approved") ||
              parsed.text.toLowerCase().includes("accepted") ||
              parsed.text.toLowerCase().includes("ok done")
            ) {
              console.log(parsed.text);
              connectDb();
              AssetDetails.findById(assetId).then(async (res) => {
                console.log(res);
                if (res.ProgressLevel === "level1") {
                  res.ProgressLevel = "level2";
                  res.status ="Approved"
                  const istDate = moment1().tz("Asia/Kolkata").format("MM/DD/YY HH:mm:ss");
                  res.ApproveDate = istDate;
           

                  res.payment = false;
                  await res.save();
                  User.find({ role: "role3" }).then((users) => {
                    users.forEach((user) => {
                      sendEmail(res, user.email);
                    });
                  });
                } 
              });
            } else if (
              parsed.text.toLowerCase().includes("rejected") ||
              parsed.text.toLowerCase().includes("Rejected")
            ) {
              console.log(parsed.text);
              connectDb();
              AssetDetails.findById(assetId).then(async (res) => {
                console.log(res);
                res.ProgressLevel = "level1"; // Mark as level1 for rejection
                res.status = "Rejected";

                res.RejectBy = parsed.from.value[0].address; 
                const istDate = moment1().tz("Asia/Kolkata").format("MM/DD/YY HH:mm:ss");
                 res.RejectDate = istDate;
                
                await res.save();
                User.find({ role: "role1" }).then((users) => {
                  users.forEach((user) => {
                    sendEmail(res, user.email);
                  });
                });
              });
            }
          }
        });

        msg.once('attributes', (attrs) => {
          const uid = attrs.uid;
          imap.seq.addFlags(uid, '\\Seen', (err) => {
            if (err) {
              console.error(err);
            }
          });
        });
      });
    });
  });
});

// Event handler A / R for incoming messages from Telegram
bridgeBot.onText(/(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const messageText = match[1];

  // console.log(msg?.reply_to_message.text);
  console.log('Message from Telegram:', messageText);

  // Extract the asset ID from the message text


  const assetIdMatch = msg?.reply_to_message?.text?.match(/AssetId:\s*([\w\d]+)/i);
  // const assetIdMatch = msg?.reply_to_message.text.match(/AssetId:\s*([\w\d]+)/i);

  console.log('Asset ID Match:', assetIdMatch);

  let assetId = "";
  if (assetIdMatch && assetIdMatch[1]) {
    assetId = assetIdMatch[1].trim();
  } else {
    console.log("Asset Id not found in the message text.");
    bridgeBot.sendMessage(chatId, 'Asset Id not found in the message text.');
    return;
  }

  try {
    await connectDb();

    const asset = await AssetDetails.findById(assetId);
    if (!asset) {
      console.log('Asset not found.');
      bridgeBot.sendMessage(chatId, 'Asset not found.');
      return;
    }

    // Check if message contains "Approved" or "ok done"
    if (messageText.toLowerCase().includes("approved") || messageText.toLowerCase().includes("ok done")) {
      console.log('Processing "Approved" or "ok done" message...');
      asset.status = 'Approved';

      // Change progress level if needed
      if (asset.ProgressLevel === "level1") {
        asset.ProgressLevel = "level2";
        await asset.save();
        User.find({ role: "role3" }).then((users) => {
          users.forEach((user) => {
            sendEmail(asset, user.email);
          });
        });
      } 
    } else if (messageText.toLowerCase().includes("rejected")) {
      console.log('Processing "rejected" message...');
      // Update the asset status
      asset.status = 'Rejected';

      // Do not change progress level if rejected
      await asset.save();
      User.find({ role: "role1" }).then((users) => {
        users.forEach((user) => {
          sendEmail(asset, user.email);
        });
      });
    } else {
      console.log('Message does not contain "Approved" or "rejected".');
      // You can handle other cases here if needed
    }

    console.log('Asset updated:', asset);
    bridgeBot.sendMessage(chatId, 'Asset status updated successfully.');
  } catch (error) {
    console.error('Error updating asset status:', error);
    bridgeBot.sendMessage(chatId, 'Error updating asset status.');
  } 
});

imap.connect();


// AWS SDK Configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// S3 Configuration
const s3 = new AWS.S3();

// Handle file upload directly to S3

app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Specify S3 upload parameters
  const folderName = 'filestorage';
  const date = new Date();

  const formattedDate = moment(date).format('MM-DD-YYYY');

  console.log(formattedDate);
  const params = {
    Bucket: 's3storagedetailss',
    Key: `${folderName}/${formattedDate}_${req.file.originalname}`,
    Body: req.file.buffer,
    ContentType: 'application/pdf',
    ContentDisposition: 'inline',
    ACL: 'private'
  };

  // Upload to S3
  s3.upload(params, (err, data) => {
    
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Failed to upload file to S3' });
    }
    res.json({ url: data.Location });
  });
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));


// Connect to the MongoDB database
const connectDb = async () => {
  try {
    await mongoose.connect('mongodb+srv://rajeshdumpala1432:Tail%401234@cluster0.wyobtyc.mongodb.net/Assetdata', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Db connected');
  } catch (error) {
    console.log('Failed to connect!', error);
  }
};

// Call the connectDb function
connectDb();


// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  CreatedBy: { type: String },
  name: { type: String },
});

// Create User model
const user = mongoose.model('User', userSchema);

// Function to format date to MM-DD-YYYY
function formatDate(date) {
  const options = {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  };

  const formattedDate = new Intl.DateTimeFormat('en-IN', options).format(date);

  return formattedDate;
}

// Asset Schema
const assetDetailsSchema = new mongoose.Schema({
  assetType: { type: String, required: true },
  Quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  totalPriceWithGST: { type: Number, required: true },
  status: { type: String, default: 'Pending' },
  CreatedBy: { type: String, ref: user },
  UpdatedBy:{ type: String, ref:user},
  CreatedDate: { type: String, },
  UpdatedDate: { type: String, default: formatDate(new Date()) },

  ProgressLevel: { type: String, default: 'level1' },
  payment: { type: Boolean, default: 'false' },
  url: { type: String },
  hiddenField: { type: String, select: false },
  remarks: {type: Array, required:true},
  ApproveBy:{type: String, ref : user},
  RejectBy :{type: String, ref : user},
  ApproveDate: {type : String},
  RejectDate: {type: String}

});


// API endpoint to register a new user
app.post('/registerUser', async (req, res) => {
  try {
    const { email, CreatedBy, password, role } = req.body;
    if (!email || !CreatedBy || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Save the 'name' field when creating a new user
    const newUser = await User.create({ email, CreatedBy, password, role });

    res.status(200).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error('Failed to register user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Pre-save hook to format dates
assetDetailsSchema.pre('save', function (next) {

  

  // Format UpdatedDate
  this.UpdatedDate = formatDate(new Date());

  next();
});


// Create models from schemas
const User = mongoose.model('User', userSchema);
const AssetDetails = mongoose.model('AssetDetails', assetDetailsSchema);



// Connect to the database
connectDb();


/// apis
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid user' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    res.json({ message: 'Authentication successful', user, role: user.role, CreatedBy: user.CreatedBy });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});





// Form submission endpoint
app.post('/submitForm', async (req, res) => {
  try {
    const formData = req.body;
    const assetId = formData._id;

    if (assetId) {
      // If assetId is provided, update the existing asset
      const existingAsset = await AssetDetails.findById(assetId);

      if (!existingAsset) {
        return res.status(404).json({ error: 'Asset not found for modification' });
      }

      existingAsset.assetType = formData.assetType;
      existingAsset.Quantity = formData.Quantity;
      existingAsset.unitPrice = formData.unitPrice;
      existingAsset.totalPrice = formData.totalPrice;
      existingAsset.totalPriceWithGST = formData.totalPriceWithGST;

      // Add CreatedBy field when updating the asset
      existingAsset.CreatedBy = formData.CreatedBy;
     

      await existingAsset.save();

      res.status(200).json({ message: 'Asset updated successfully', asset: existingAsset });
    } else {
      // If assetId is not provided, create a new asset
      const asset = await AssetDetails.create({
        ...formData,
        // Use the CreatedBy field from the submitted form data
        // This assumes the form data includes the name of the user submitting the asset
        CreatedBy: formData.CreatedBy,

        
        CreatedDate:formData.CreatedDate,
        // url: urlToStore, // Assuming this is added later
      });

      const role2User = await User.find({ role: "role2" })

      role2User.forEach(async (user) => {
        await sendEmail(asset, user.email);
      })

      res.status(200).json({ message: 'Form submitted successfully', asset });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
  
app.post('/approveAsset/:id', async (req, res) => {
  try {
    const assetId = req.params.id;
    let asset = await AssetDetails.findById(assetId);
    const approvedBy = req.body.approvedBy;

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Check if status is provided in the request body
    const status = req.body.status;

    console.log(status)

    if (!status) {
      return res.status(400).json({ error: 'Status is required in the request body' });
    }

    asset.status = status;
    asset.ApproveBy = approvedBy;


    const istDate = moment1().tz("Asia/Kolkata").format("MM/DD/YY HH:mm:ss");
    asset.ApproveDate = istDate;
   console.log(asset.ApproveBy)

    asset = await asset.save();



    if (status === 'Approved') {
      const role4User = await User.find({ role: "role3" })

      role4User.forEach(async (user) => {
        await sendEmail(asset, user.email);
      })
    } else {
      const role3User = await User.find({ role: "role2" })
      console.log(role3User)

      role3User.forEach(async (user) => {
        await sendEmail(asset, user.email);
      })
    }

    res.status(200).json({ message: 'Asset approved successfully', asset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Endpoint to fetch user data by email
app.get('/getUser/:email', async (req, res) => {
  try {
    const userEmail = req.params.email;
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Exclude password before sending the user data to the frontend
    const { name, email, role } = user.toObject();
    res.status(200).json({ name, email, role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});






app.post('/modifyAsset/:id', async (req, res) => {
  try {
    const assetId = req.params.id;
    const updatedData = req.body;
    const asset = await AssetDetails.findById(assetId);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Update the asset data
    asset.assetType = updatedData.assetType;
    asset.Quantity = updatedData.Quantity;
    asset.unitPrice = updatedData.unitPrice;
    asset.totalPrice = updatedData.totalPrice;
    asset.totalPriceWithGST = updatedData.totalPriceWithGST;

    // Update UpdatedBy with the user's name from the request body
    asset.UpdatedBy = updatedData.UpdatedBy;

    // Update remarks
    asset.remarks.push(updatedData.remarks);

    // Save the updated asset
    await asset.save();

    res.status(200).json({ message: 'Asset updated successfully', asset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});






// progresslevel
app.post('/updateProgressLevel/:id', async (req, res) => {
  try {
    const assetId = req.params.id;
    const { progressLevel } = req.body;

    const asset = await AssetDetails.findById(assetId);


    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    asset.ProgressLevel = progressLevel;

    await asset.save();

    res.status(200).json({ message: 'ProgressLevel updated successfully', asset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Reject asset endpoint
app.post('/rejectAsset/:id', async (req, res) => {
  try {
    const assetId = req.params.id;
    const data = req.body;
    const rejectedBy = req.body.rejectedBy;
    const remarks = req.body.remarks; 

    const asset = await AssetDetails.findById(assetId);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Add the new remark to the remarks array
    let prev_remarks = asset.remarks
    total_remarks = prev_remarks.concat(data.remarks)
    asset.remarks = total_remarks;
    // if(remark.remarks){
    //   asset.remarks.push(remark.remarks);
    //   console.log(asset.remarks)
    // }

    // Update the status and remarks

    asset.RejectBy = rejectedBy;
    const istDate = moment1().tz("Asia/Kolkata").format("MM/DD/YY HH:mm:ss");
    asset.RejectDate = istDate;

    // asset.RejectDate = new Date().toISOString();
    asset.status = 'Rejected';
    
    await asset.save();

    res.status(200).json({ message: 'Asset rejected successfully', asset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Form submission endpoint
app.post('/submitForm', async (req, res) => {
  try {

    const formData = req.body;
    const assetId = formData._id; // Assume _id is sent from the frontend when modifying

    if (assetId) {
      // If assetId is provided, update the existing asset
      const existingAsset = await AssetDetails.findById(assetId);

      if (!existingAsset) {
        return res.status(404).json({ error: 'Asset not found for modification' });
      }

      existingAsset.assetType = formData.assetType;
      existingAsset.Quantity = formData.Quantity;
      existingAsset.unitPrice = formData.unitPrice;
      existingAsset.totalPrice = formData.totalPrice;
      existingAsset.totalPriceWithGST = formData.totalPriceWithGST;

      // Add CreatedBy field when updating the asset
      existingAsset.CreatedBy = formData.CreatedBy;

      await existingAsset.save();

      res.status(200).json({ message: 'Asset updated successfully', asset: existingAsset });
    } else {
      // If assetId is not provided, create a new asset
      // Fetch user details based on the submitted email
      const user = await User.findOne({ email: 'shaikdadavali092@gmail.com' });



      if (!user) {
        return res.status(404).json({ error: 'User not found for the submitted email' });
      }

      const asset = await AssetDetails.create({
        ...formData,
        // Add CreatedBy field with the user's name when creating a new asset
        CreatedBy: user.CreatedBy,
        CreatedDate:user.CreatedDate,
        //  url:urlToStore,
      });

      await sendEmail(asset, 'vemanasrikanth73829@gmail.com');
      res.status(200).json({ message: 'Form submitted successfully', asset });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all assets endpoint
app.get('/getData', async (req, res) => {
  try {
    const assets = await AssetDetails.find();
    res.status(200).json({ message: 'Assets fetched successfully', assets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to send email
const sendEmail = async (formData, toEmail) => {
  try {
    // Nodemailer configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "thinkailabs111@gmail.com",
        pass: "zwvu hhtq cavs zkmr"
      },
    });


    // Email content
    const emailContent = `
       <h2>Form Data</h2>
       <table border="1">
       <tr>
           <td>Asset_Id</td>
           <td>${formData._id}</td>
         </tr>
         <tr>
           <td>Select_Asset</td>
           <td>${formData.assetType}</td>
         </tr>
         <td>Quantity</td>
           <td>${formData.Quantity}</td>
         </tr>
         <tr>
           <td>Unit Price</td>
           <td>${formData.unitPrice}</td>
         </tr>
         <tr>
           <td>Total price</td>
           <td>${formData.totalPrice}</td>
         </tr>
         <tr>
         <td>Total price with GST</td>
         <td>${formData.totalPriceWithGST}</td>
       </tr>
       </table>
       <p>Click <a href="http://35.154.145.139:3001">here</a> to view the details in the application.</p>
        
     `;

    // Mail options
    const mailOptions = {
      from: 'your@.com',
      to: toEmail,
      subject: 'Form Submission',
      html: emailContent,
      attachments: [
        {
          filename: 'laptop.pdf',
          path: formData.url,
          encoding: 'base64',
        },
      ],
    };


// Send email
await transporter.sendMail(mailOptions);
console.log('Email sent successfully');



// Send Form Data as a message to Telegram
const telegramFormData = `
Form Data:
Asset_Id: ${formData._id}
Select_Asset: ${formData.assetType}
Quantity: ${formData.Quantity}
Unit Price: ${formData.unitPrice}
Total price: ${formData.totalPrice}
Total price with GST: ${formData.totalPriceWithGST}
`;
// Call sendTelegramMessage without the documentPath
await sendTelegramMessage(telegramFormData);

// Call sendTelegramMessage with the PDF attachment path
await sendTelegramMessage('PDF Attachment', formData.url);
} catch (error) {
console.error('Failed to send email:', error);
throw error;
}
};

// Function to send message to Telegram
const sendTelegramMessage = async (message, documentPath) => {
try {
// If documentPath is provided, send the document
if (documentPath) {
  // Send the document
  await bridgeBot.sendDocument(personalChatId, documentPath, { caption: message });
  console.log('Document sent to Telegram successfully');
} else {
  // If documentPath is not provided, send the message as plain text
  await bridgeBot.sendMessage(personalChatId, message, { parse_mode: 'Markdown' });
  console.log('Message sent to Telegram successfully');
}
} catch (error) {
console.error('Failed to send message to Telegram:', error);
}
};

// Serve PDF file
app.get('/getPdf/:id', async (req, res) => {
  try {
    const assetId = req.params.id;
    const asset = await AssetDetails.findById(assetId);
    if (!asset || !asset.url) {
      return res.status(404).json({ error: 'PDF not found for this asset' });
    }

    const url = asset.url;
    console.log(url)
    // Redirect to the PDF URL
    res.status(200).json({ url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Update Payment Status endpoint
app.post('/updatePayment/:id', async (req, res) => {
  try {
    const assetId = req.params.id;
    const { payment } = req.body;

    const asset = await AssetDetails.findById(assetId);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    asset.payment = payment;
    asset.ProgressLevel = "level3";


    await asset.save();

    res.status(200).json({ message: 'Payment status updated successfully', asset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});
// Start the server
app.listen(port, () => {
  console.log(`API Server is running on port ${port}`);
});
