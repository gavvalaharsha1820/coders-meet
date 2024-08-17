const express = require('express');
const mongoose = require('mongoose');
const devuser = require('./devusemodel');
const jwt = require('jsonwebtoken');
const app = express();
const middleware = require('./middleware');
const reviewmodel = require('./reviewmodel');
const cors = require('cors');

// Body parser middleware
app.use(express.json());
app.use(cors({origin:'*'}));

mongoose.connect('mongodb+srv://gavvalaharshavardhansai:@cluster0.s3vupod.mongodb.net/')
    .then(() => console.log('DB connected'))
    .catch(err => console.error('Error connecting to DB:', err));

app.get('/', function(req, res) {
    return res.send('Hello World');
});

const bcrypt = require('bcrypt');

// Registration route
app.post('/register', async (req, res) => {
    try {
        const { fullname, email, mobile, skills, password, confirmpassword } = req.body;
        const existingUser = await devuser.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }
        if (password !== confirmpassword) {
            return res.status(400).send('Passwords do not match');
        }

        // Hashing the password
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is the saltRounds

        const newUser = new devuser({
            fullname,
            email,
            mobile,
            skills,
            password: hashedPassword, // Storing hashed password
            confirmpassword: hashedPassword // Storing hashed password
        });
        await newUser.save();
        return res.status(200).send('User registered successfully');
    } catch (err) {
        console.error('Error registering:', err);
        return res.status(500).send('Server error');
    }
});


// Login route
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const exist = await devuser.findOne({ email });
        if (!exist) {
            return res.status(400).send('User does not exist');
        }

        // Comparing hashed password
        const passwordMatch = await bcrypt.compare(password, exist.password);
        if (!passwordMatch) {
            return res.status(400).send('Passwords do not match');
        }

        const payload = {
            user: {
                id: exist.id
            }
        };
        jwt.sign(payload, 'jwtPassword', { expiresIn: 360000000 }, (err, token) => {
            if (err) {
                console.error('JWT Error:', err);
                return res.status(500).send('Server error');
            }
            return res.status(200).send({ token });
        });
    } catch (err) {
        console.error('Error logging in:', err);
        return res.status(500).send('Server error');
    }
});

app.get('/dashboard', middleware, async (req, res) => {
    try {
        
        if (!req.user) {
            // Redirect the user to the login page
            return res.redirect('/login.html'); // Update the path if needed
        }

        const loggedInUserId = req.user.id;
        let allprofiles = await devuser.find({ _id: { $ne: loggedInUserId } }); // Exclude the logged-in user's profile
        return res.json(allprofiles);
    } catch (err) {
        console.error('Error getting profiles:', err);
        return res.status(500).send('Server error');
    }
});





app.get('/myprofiles', middleware, async (req, res) => {
    try {
        //console.log('User ID:', req.user.id); // Check the user ID attached to req.user
        const user = await devuser.findById(req.user.id);
        if (!user) {
            console.log('User not found in database');
            return res.status(404).send('User not found');
        }
       // console.log('User Profile:', user); // Check the retrieved user profile
        return res.json(user);
    } catch (err) {
        console.error('Error getting user profile:', err);
        return res.status(500).send('Server error');
    }
});
app.get('/profiles/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await devuser.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
app.delete('/deleteprofile', middleware, async (req, res) => {
    try {
        // Assuming you have a database connection and user model
        const userId = req.user.id; // Assuming you extract userId from JWT token
        const deletedUser = await devuser.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'Profile deleted successfully' });
    } catch (err) {
        console.error('Error deleting profile:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});




// Modify the '/addreview' route to include the name of the user when saving the review
app.post('/addreview', middleware, async (req, res) => {
    try {
        const { taskworker, rating } = req.body;
        const exist = await devuser.findById(req.user.id);
        const newReview = new reviewmodel({
            taskprovider: exist.fullname, // Include the name of the user who provided the review
            taskworker,
            rating
        });
        await newReview.save();
        return res.status(200).send('Review added successfully');
    } catch (err) {
        console.error('Error adding review:', err);
        return res.status(500).send('Server error');
    }
});


app.get('/myreviews',middleware, async (req, res) => {
    try {
        let allreviews=await reviewmodel.find();
        let myreviews = allreviews.filter(review => review.taskworker === req.user.id.toString());
        return res.status(200).json(myreviews);
    } catch (err) {
        console.error('Error getting users:', err);
        return res.status(500).send('Server error');
    }
})

// Update Profile route
app.put('/updateprofile', middleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullname, mobile, skills } = req.body;

        
        const updatedUser = await User.findByIdAndUpdate(userId, {
            fullname,
            mobile,
            skills
        }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (err) {
        console.error('Error updating profile:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});




app.listen(5000, () => console.log('Server running'));
